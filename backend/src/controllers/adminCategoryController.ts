import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { createCategorySchema, updateCategorySchema } from '@/utils/validation';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const payload = createCategorySchema.parse(req.body);

  const existingSlug = await prisma.category.findUnique({
    where: { slug: payload.slug },
  });

  if (existingSlug) {
    throw new AppError('Category with this slug already exists', StatusCodes.CONFLICT);
  }

  const existingName = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existingName) {
    throw new AppError('Category with this name already exists', StatusCodes.CONFLICT);
  }

  if (payload.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: payload.parentId },
    });

    if (!parent) {
      throw new AppError('Parent category not found', StatusCodes.NOT_FOUND);
    }
  }

  const category = await prisma.category.create({
    data: payload,
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.category.create',
    entity: 'category',
    userId: req.user?.id,
    metadata: { categoryId: category.id, name: category.name },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateCategorySchema.parse(req.body);

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new AppError('Category not found', StatusCodes.NOT_FOUND);
  }

  if (payload.slug && payload.slug !== existingCategory.slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExists) {
      throw new AppError('Category with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  if (payload.name && payload.name !== existingCategory.name) {
    const nameExists = await prisma.category.findUnique({
      where: { name: payload.name },
    });

    if (nameExists) {
      throw new AppError('Category with this name already exists', StatusCodes.CONFLICT);
    }
  }

  if (payload.parentId !== undefined) {
    if (payload.parentId === null) {
      // OK to remove parent
    } else if (payload.parentId === id) {
      throw new AppError('Category cannot be its own parent', StatusCodes.BAD_REQUEST);
    } else {
      const parent = await prisma.category.findUnique({
        where: { id: payload.parentId },
      });

      if (!parent) {
        throw new AppError('Parent category not found', StatusCodes.NOT_FOUND);
      }

      const descendants = await getDescendantIds(id);
      if (descendants.includes(payload.parentId)) {
        throw new AppError('Cannot set a descendant as parent', StatusCodes.BAD_REQUEST);
      }
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: payload,
    include: {
      parent: true,
      children: true,
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.category.update',
    entity: 'category',
    userId: req.user?.id,
    metadata: { categoryId: id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', StatusCodes.NOT_FOUND);
  }

  if (category.children.length > 0) {
    throw new AppError(
      'Cannot delete category with child categories. Delete or reassign children first.',
      StatusCodes.BAD_REQUEST
    );
  }

  const totalItems = category._count.courseCategories + category._count.blogPostCategories;
  if (totalItems > 0) {
    throw new AppError(
      `Cannot delete category in use by ${totalItems} items. Remove category assignments first.`,
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.category.delete',
    entity: 'category',
    userId: req.user?.id,
    metadata: { categoryId: id, name: category.name },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

async function getDescendantIds(categoryId: string): Promise<string[]> {
  const descendants: string[] = [];

  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  for (const child of children) {
    descendants.push(child.id);
    const childDescendants = await getDescendantIds(child.id);
    descendants.push(...childDescendants);
  }

  return descendants;
}
