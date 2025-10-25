import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import { buildPaginatedResult, getPaginationSkip } from '@/utils/pagination';
import { paginationSchema, updateInstructorAvatarSchema } from '@/utils/validation';

const createInstructorSchema = z
  .object({
    userId: z.string().cuid(),
    headline: z.string().max(255).optional(),
    bio: z.string().optional(),
    expertise: z.array(z.string()).default([]),
    website: z.string().url().optional(),
    socialLinks: z.record(z.string()).optional(),
  })
  .strict();

const updateInstructorSchema = z
  .object({
    headline: z.string().max(255).optional(),
    bio: z.string().optional(),
    expertise: z.array(z.string()).optional(),
    website: z.string().url().optional(),
    socialLinks: z.record(z.string()).optional(),
  })
  .strict();

export const getInstructors = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const skip = getPaginationSkip(paginationParams);

  const [instructors, total] = await Promise.all([
    prisma.instructor.findMany({
      skip,
      take: paginationParams.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            courses: true,
            blogPosts: true,
          },
        },
      },
    }),
    prisma.instructor.count(),
  ]);

  const result = buildPaginatedResult(instructors, total, paginationParams);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructors retrieved successfully',
    ...result,
  });
});

export const getInstructor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
        },
      },
      courses: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          level: true,
          thumbnailUrl: true,
          createdAt: true,
          _count: {
            select: {
              enrollments: true,
              sections: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      blogPosts: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          featured: true,
          publishedAt: true,
          tags: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          courses: true,
          blogPosts: true,
        },
      },
    },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor retrieved successfully',
    data: instructor,
  });
});

export const createInstructor = asyncHandler(async (req: Request, res: Response) => {
  const payload = createInstructorSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (user.role !== 'INSTRUCTOR') {
    throw new AppError('User must have INSTRUCTOR role', StatusCodes.BAD_REQUEST);
  }

  const existingInstructor = await prisma.instructor.findUnique({
    where: { userId: payload.userId },
  });

  if (existingInstructor) {
    throw new AppError('Instructor profile already exists for this user', StatusCodes.CONFLICT);
  }

  const instructor = await prisma.instructor.create({
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.instructor.create',
    entity: 'instructor',
    userId: req.user?.id,
    metadata: { instructorId: instructor.id, instructorUserId: instructor.userId },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Instructor created successfully',
    data: instructor,
  });
});

export const updateInstructor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateInstructorSchema.parse(req.body);

  const existingInstructor = await prisma.instructor.findUnique({
    where: { id },
  });

  if (!existingInstructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  const instructor = await prisma.instructor.update({
    where: { id },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.instructor.update',
    entity: 'instructor',
    userId: req.user?.id,
    metadata: { instructorId: id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor updated successfully',
    data: instructor,
  });
});

export const deleteInstructor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      courses: true,
    },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  if (instructor.courses.length > 0) {
    throw new AppError(
      'Cannot delete instructor with assigned courses. Reassign courses first.',
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.instructor.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.instructor.delete',
    entity: 'instructor',
    userId: req.user?.id,
    metadata: { instructorId: id },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor deleted successfully',
  });
});

export const updateInstructorAvatar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { avatarUrl } = updateInstructorAvatarSchema.parse(req.body);

  const instructor = await prisma.instructor.findUnique({
    where: { id },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  await prisma.user.update({
    where: { id: instructor.userId },
    data: { avatarUrl },
  });

  const updatedInstructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          courses: true,
          blogPosts: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.instructor.update-avatar',
    entity: 'instructor',
    userId: req.user?.id,
    metadata: { instructorId: id, avatarUrl },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor avatar updated successfully',
    data: updatedInstructor,
  });
});

export const assignInstructorToBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { blogPostId } = z.object({ blogPostId: z.string().cuid() }).strict().parse(req.body);

  const instructor = await prisma.instructor.findUnique({
    where: { id },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  const blogPost = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
  });

  if (!blogPost) {
    throw new AppError('Blog post not found', StatusCodes.NOT_FOUND);
  }

  const updatedBlogPost = await prisma.blogPost.update({
    where: { id: blogPostId },
    data: { instructorId: id },
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
    action: 'admin.instructor.assign-blog-post',
    entity: 'instructor',
    userId: req.user?.id,
    metadata: { instructorId: id, blogPostId },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor assigned to blog post successfully',
    data: updatedBlogPost,
  });
});
