import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { updateSEOSettingsSchema } from '@/utils/validation';
import { calculateSEOScore } from '@/utils/markdown';

function getBaseSeoSettings() {
  return {
    siteTitle: 'Big Dipper Academy',
    siteDescription: 'Professional trading and investment education',
    defaultKeywords: [] as string[],
    defaultOgImage: null as string | null,
    twitterHandle: null as string | null,
    facebookAppId: null as string | null,
    organizationSchema: null as Record<string, unknown> | null,
    fallbackContent: null as string | null,
    robotsTxt: null as string | null,
  };
}

export const getSeoSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!settings) {
    const defaultSettings = getBaseSeoSettings();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'SEO settings retrieved successfully (defaults)',
      data: defaultSettings,
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'SEO settings retrieved successfully',
    data: settings,
  });
});

export const updateSeoSettings = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateSEOSettingsSchema.parse(req.body);

  const existingSettings = await prisma.seoSettings.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  });

  let settings;

  if (existingSettings) {
    settings = await prisma.seoSettings.update({
      where: { id: existingSettings.id },
      data: payload,
    });
  } else {
    settings = await prisma.seoSettings.create({
      data: payload,
    });
  }

  await auditLogger.log({
    action: 'admin.seo.update',
    entity: 'seoSettings',
    userId: req.user?.id,
    metadata: { settingsId: settings.id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'SEO settings updated successfully',
    data: settings,
  });
});

export const validateSchema = asyncHandler(async (req: Request, res: Response) => {
  const { schema } = req.body;

  if (!schema || typeof schema !== 'object') {
    throw new AppError('Invalid schema format', StatusCodes.BAD_REQUEST);
  }

  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Schema must include @context');
  }

  if (!schema['@type']) {
    errors.push('Schema must include @type');
  }

  if (schema['@type'] && !['Article', 'BlogPosting'].includes(schema['@type'] as string)) {
    errors.push('Schema @type must be either "Article" or "BlogPosting"');
  }

  if (!schema['headline']) {
    errors.push('Schema must include headline');
  }

  if (!schema['description']) {
    errors.push('Schema must include description');
  }

  if (!schema['image']) {
    errors.push('Schema must include image');
  }

  const author = schema['author'];
  if (!author || typeof author !== 'object') {
    errors.push('Schema must include author object');
  } else {
    if (!author['name']) {
      errors.push('Author must include name');
    }
  }

  const publisher = schema['publisher'];
  if (!publisher || typeof publisher !== 'object') {
    errors.push('Schema must include publisher object');
  } else {
    if (!publisher['name']) {
      errors.push('Publisher must include name');
    }
  }

  const valid = errors.length === 0;

  res.status(StatusCodes.OK).json({
    success: true,
    message: valid ? 'Schema is valid' : 'Schema validation failed',
    data: {
      valid,
      errors,
    },
  });
});

export const calculatePostSeoScore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const blogPost = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!blogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  const seoScore = calculateSEOScore({
    markdown: blogPost.content,
    title: blogPost.title,
    seoTitle: blogPost.seoTitle,
    metaDescription: blogPost.metaDescription,
    keywords: blogPost.keywords,
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'SEO score calculated successfully',
    data: seoScore,
  });
});

export const previewSeo = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;

  const settings =
    (await prisma.seoSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    })) || getBaseSeoSettings();

  if (type === 'blog-post') {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        featuredImage: {
          select: {
            id: true,
            url: true,
            originalFilename: true,
          },
        },
      },
    });

    if (!blogPost) {
      throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
    }

    const primaryCategory = blogPost.categories[0]?.category;

    const seoTitle = blogPost.seoTitle || `${blogPost.title}${settings.siteTitle ? ` | ${settings.siteTitle}` : ''}`;
    const metaDescription =
      blogPost.metaDescription || blogPost.excerpt || settings.siteDescription || blogPost.title;
    const ogTitle = blogPost.ogTitle || seoTitle;
    const ogDescription = blogPost.ogDescription || metaDescription;
    const ogImage = blogPost.ogImage || blogPost.featuredImage?.url || settings.defaultOgImage;
    const twitterTitle = blogPost.twitterTitle || seoTitle;
    const twitterDescription = blogPost.twitterDescription || metaDescription;
    const twitterImage = blogPost.twitterImage || ogImage;

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'SEO preview generated successfully',
      data: {
        meta: {
          title: seoTitle,
          description: metaDescription,
          keywords: blogPost.keywords?.length ? blogPost.keywords : settings.defaultKeywords,
          canonicalUrl: blogPost.canonicalUrl,
        },
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          image: ogImage,
          type: 'article',
          url: blogPost.canonicalUrl,
        },
        twitter: {
          card: ogImage ? 'summary_large_image' : 'summary',
          title: twitterTitle,
          description: twitterDescription,
          image: twitterImage,
          handle: settings.twitterHandle,
        },
        searchPreview: {
          title: seoTitle,
          url: `${process.env.FRONTEND_URL || 'https://hocvienbigdipper.com'}/blog/${blogPost.slug}`,
          description: metaDescription,
        },
        facebookPreview: {
          title: ogTitle,
          description: ogDescription,
          image: ogImage,
          siteName: settings.siteTitle,
        },
        schema: blogPost.schemaJson,
        article: {
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          category: primaryCategory?.name,
          tags: blogPost.tags.map((t) => t.tag.name),
          publishedAt: blogPost.publishedAt,
          scheduledFor: blogPost.scheduledFor,
          author: blogPost.author,
        },
      },
    });

    return;
  }

  throw new AppError(`Unsupported preview type: ${type}`, StatusCodes.BAD_REQUEST);
});
