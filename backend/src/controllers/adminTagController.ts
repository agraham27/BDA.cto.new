import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { createTagSchema, updateTagSchema, mergeTagsSchema } from '@/utils/validation';

export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          blogPosts: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Tags retrieved successfully',
    data: tags,
  });
});

export const getTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          blogPosts: true,
        },
      },
    },
  });

  if (!tag) {
    throw new AppError('Tag not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Tag retrieved successfully',
    data: tag,
  });
});

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const payload = createTagSchema.parse(req.body);

  const existingSlug = await prisma.tag.findUnique({
    where: { slug: payload.slug },
  });

  if (existingSlug) {
    throw new AppError('Tag with this slug already exists', StatusCodes.CONFLICT);
  }

  const existingName = await prisma.tag.findUnique({
    where: { name: payload.name },
  });

  if (existingName) {
    throw new AppError('Tag with this name already exists', StatusCodes.CONFLICT);
  }

  const tag = await prisma.tag.create({
    data: payload,
    include: {
      _count: {
        select: {
          blogPosts: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.tag.create',
    entity: 'tag',
    userId: req.user?.id,
    metadata: { tagId: tag.id, name: tag.name },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Tag created successfully',
    data: tag,
  });
});

export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateTagSchema.parse(req.body);

  const existingTag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!existingTag) {
    throw new AppError('Tag not found', StatusCodes.NOT_FOUND);
  }

  if (payload.slug && payload.slug !== existingTag.slug) {
    const slugExists = await prisma.tag.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExists) {
      throw new AppError('Tag with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  if (payload.name && payload.name !== existingTag.name) {
    const nameExists = await prisma.tag.findUnique({
      where: { name: payload.name },
    });

    if (nameExists) {
      throw new AppError('Tag with this name already exists', StatusCodes.CONFLICT);
    }
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: payload,
    include: {
      _count: {
        select: {
          blogPosts: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.tag.update',
    entity: 'tag',
    userId: req.user?.id,
    metadata: { tagId: id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Tag updated successfully',
    data: tag,
  });
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          blogPosts: true,
        },
      },
    },
  });

  if (!tag) {
    throw new AppError('Tag not found', StatusCodes.NOT_FOUND);
  }

  if (tag._count.blogPosts > 0) {
    throw new AppError(
      `Cannot delete tag in use by ${tag._count.blogPosts} blog posts. Remove tag assignments first.`,
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.tag.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.tag.delete',
    entity: 'tag',
    userId: req.user?.id,
    metadata: { tagId: id, name: tag.name },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Tag deleted successfully',
  });
});

export const mergeTags = asyncHandler(async (req: Request, res: Response) => {
  const payload = mergeTagsSchema.parse(req.body);
  const { sourceTagIds, targetTagId } = payload;

  if (sourceTagIds.includes(targetTagId)) {
    throw new AppError('Cannot merge a tag into itself', StatusCodes.BAD_REQUEST);
  }

  const [sourceTags, targetTag] = await Promise.all([
    prisma.tag.findMany({
      where: { id: { in: sourceTagIds } },
    }),
    prisma.tag.findUnique({
      where: { id: targetTagId },
    }),
  ]);

  if (sourceTags.length !== sourceTagIds.length) {
    throw new AppError('One or more source tags not found', StatusCodes.NOT_FOUND);
  }

  if (!targetTag) {
    throw new AppError('Target tag not found', StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    for (const sourceTagId of sourceTagIds) {
      const blogPostTags = await tx.blogPostTag.findMany({
        where: { tagId: sourceTagId },
        select: { blogPostId: true },
      });

      for (const { blogPostId } of blogPostTags) {
        const existing = await tx.blogPostTag.findUnique({
          where: {
            blogPostId_tagId: {
              blogPostId,
              tagId: targetTagId,
            },
          },
        });

        if (!existing) {
          await tx.blogPostTag.create({
            data: {
              blogPostId,
              tagId: targetTagId,
            },
          });
        }
      }

      await tx.blogPostTag.deleteMany({
        where: { tagId: sourceTagId },
      });

      await tx.tag.delete({
        where: { id: sourceTagId },
      });
    }
  });

  await auditLogger.log({
    action: 'admin.tag.merge',
    entity: 'tag',
    userId: req.user?.id,
    metadata: { sourceTagIds, targetTagId, targetName: targetTag.name },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: `Successfully merged ${sourceTagIds.length} tags into "${targetTag.name}"`,
    data: targetTag,
  });
});
