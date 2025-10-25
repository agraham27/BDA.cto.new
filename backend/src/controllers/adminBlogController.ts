import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ContentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { buildPaginatedResult, getPaginationSkip } from '@/utils/pagination';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  publishBlogPostSchema,
  blogPostFilterSchema,
  blogPostSortSchema,
  paginationSchema,
} from '@/utils/validation';
import { buildBlogPostWhereClause } from '@/utils/filters';
import { getWordCount, getReadingTime } from '@/utils/markdown';

export const getBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const sortParams = blogPostSortSchema.parse(req.query);
  const filterParams = blogPostFilterSchema.parse(req.query);

  const where = buildBlogPostWhereClause(filterParams);
  const skip = getPaginationSkip(paginationParams);

  const [blogPosts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: paginationParams.limit,
      orderBy: sortParams.sortBy
        ? { [sortParams.sortBy]: sortParams.sortOrder }
        : { createdAt: sortParams.sortOrder },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
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
            originalFilename: true,
            mimeType: true,
            url: true,
            visibility: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  const result = buildPaginatedResult(blogPosts, total, paginationParams);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Blog posts retrieved successfully',
    ...result,
  });
});

export const getBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const blogPost = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
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
      files: {
        select: {
          id: true,
          originalFilename: true,
          mimeType: true,
          size: true,
          category: true,
          url: true,
          visibility: true,
          createdAt: true,
        },
      },
      featuredImage: {
        select: {
          id: true,
          originalFilename: true,
          mimeType: true,
          url: true,
          visibility: true,
        },
      },
    },
  });

  if (!blogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Blog post retrieved successfully',
    data: blogPost,
  });
});

export const createBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const payload = createBlogPostSchema.parse(req.body);
  const { categoryIds, tagIds, featuredImageId, scheduledFor, ...blogPostData } = payload;

  const existingSlug = await prisma.blogPost.findUnique({
    where: { slug: payload.slug },
  });

  if (existingSlug) {
    throw new AppError('Blog post with this slug already exists', StatusCodes.CONFLICT);
  }

  if (payload.instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: payload.instructorId },
    });

    if (!instructor) {
      throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
    }
  }

  if (categoryIds && categoryIds.length > 0) {
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      throw new AppError('One or more categories not found', StatusCodes.NOT_FOUND);
    }
  }

  if (tagIds && tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (tags.length !== tagIds.length) {
      throw new AppError('One or more tags not found', StatusCodes.NOT_FOUND);
    }
  }

  if (featuredImageId) {
    const featuredImage = await prisma.file.findUnique({
      where: { id: featuredImageId },
    });

    if (!featuredImage) {
      throw new AppError('Featured image not found', StatusCodes.NOT_FOUND);
    }
  }

  const wordCount = payload.wordCount ?? getWordCount(payload.content);
  const readingTime = payload.readingTime ?? getReadingTime(wordCount);

  const blogPost = await prisma.blogPost.create({
    data: {
      ...blogPostData,
      wordCount,
      readingTime,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      authorId: req.user!.id,
      featuredImageId,
      categories: categoryIds
        ? {
            create: categoryIds.map((categoryId) => ({
              category: {
                connect: { id: categoryId },
              },
            })),
          }
        : undefined,
      tags: tagIds
        ? {
            create: tagIds.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          }
        : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
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
          originalFilename: true,
          mimeType: true,
          url: true,
          visibility: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.blog.create',
    entity: 'blogPost',
    userId: req.user?.id,
    metadata: { blogPostId: blogPost.id, title: blogPost.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Blog post created successfully',
    data: blogPost,
  });
});

export const updateBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateBlogPostSchema.parse(req.body);
  const { categoryIds, tagIds, featuredImageId, scheduledFor, ...blogPostData } = payload;

  const existingBlogPost = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existingBlogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  if (payload.slug && payload.slug !== existingBlogPost.slug) {
    const slugExists = await prisma.blogPost.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExists) {
      throw new AppError('Blog post with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  if (payload.instructorId !== undefined) {
    if (payload.instructorId === null) {
      blogPostData.instructorId = null;
    } else {
      const instructor = await prisma.instructor.findUnique({
        where: { id: payload.instructorId },
      });

      if (!instructor) {
        throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
      }
    }
  }

  if (categoryIds !== undefined) {
    if (categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        throw new AppError('One or more categories not found', StatusCodes.NOT_FOUND);
      }
    }

    await prisma.blogPostCategory.deleteMany({
      where: { blogPostId: id },
    });
  }

  if (tagIds !== undefined) {
    if (tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        throw new AppError('One or more tags not found', StatusCodes.NOT_FOUND);
      }
    }

    await prisma.blogPostTag.deleteMany({
      where: { blogPostId: id },
    });
  }

  if (featuredImageId !== undefined && featuredImageId !== null) {
    const featuredImage = await prisma.file.findUnique({
      where: { id: featuredImageId },
    });

    if (!featuredImage) {
      throw new AppError('Featured image not found', StatusCodes.NOT_FOUND);
    }
  }

  const updatedWordCount = blogPostData.content
    ? getWordCount(blogPostData.content)
    : payload.wordCount ?? existingBlogPost.wordCount;
  const updatedReadingTime = blogPostData.content
    ? getReadingTime(updatedWordCount ?? 0)
    : payload.readingTime ?? existingBlogPost.readingTime;

  const updateData: Record<string, unknown> = {
    ...blogPostData,
    wordCount: updatedWordCount ?? existingBlogPost.wordCount,
    readingTime: updatedReadingTime ?? existingBlogPost.readingTime,
    categories:
      categoryIds !== undefined
        ? {
            create: categoryIds.map((categoryId) => ({
              category: {
                connect: { id: categoryId },
              },
            })),
          }
        : undefined,
    tags:
      tagIds !== undefined
        ? {
            create: tagIds.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          }
        : undefined,
  };

  if (featuredImageId !== undefined) {
    updateData.featuredImageId = featuredImageId;
  }

  if (scheduledFor !== undefined) {
    updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  }

  const blogPost = await prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
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
          originalFilename: true,
          mimeType: true,
          url: true,
          visibility: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.blog.update',
    entity: 'blogPost',
    userId: req.user?.id,
    metadata: { blogPostId: id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Blog post updated successfully',
    data: blogPost,
  });
});

export const deleteBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const blogPost = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!blogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  await prisma.blogPost.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.blog.delete',
    entity: 'blogPost',
    userId: req.user?.id,
    metadata: { blogPostId: id, title: blogPost.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Blog post deleted successfully',
  });
});

export const publishBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { publish } = publishBlogPostSchema.parse(req.body);

  const blogPost = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!blogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  if (publish) {
    if (!blogPost.title || !blogPost.content) {
      throw new AppError(
        'Blog post must have a title and content before publishing',
        StatusCodes.BAD_REQUEST
      );
    }
  }

  const newStatus = publish ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;
  const publishedAt = publish ? new Date() : null;

  const updatedBlogPost = await prisma.blogPost.update({
    where: { id },
    data: {
      status: newStatus,
      publishedAt,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
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
          originalFilename: true,
          mimeType: true,
          url: true,
          visibility: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: publish ? 'admin.blog.publish' : 'admin.blog.unpublish',
    entity: 'blogPost',
    userId: req.user?.id,
    metadata: { blogPostId: id, status: newStatus },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: publish ? 'Blog post published successfully' : 'Blog post unpublished successfully',
    data: updatedBlogPost,
  });
});
