import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CourseStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import {
  createCourseSchema,
  updateCourseSchema,
  courseFilterSchema,
  paginationSchema,
  sortSchema,
  publishCourseSchema,
  assignInstructorSchema,
} from '@/utils/validation';
import { buildPaginatedResult, getPaginationSkip } from '@/utils/pagination';
import { buildCourseWhereClause } from '@/utils/filters';

export const getCourses = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const sortParams = sortSchema.parse(req.query);
  const filterParams = courseFilterSchema.parse(req.query);

  const where = buildCourseWhereClause(filterParams);
  const skip = getPaginationSkip(paginationParams);

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: paginationParams.limit,
      orderBy: sortParams.sortBy
        ? { [sortParams.sortBy]: sortParams.sortOrder }
        : { createdAt: sortParams.sortOrder },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        sections: {
          select: {
            id: true,
            title: true,
            position: true,
            status: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  const result = buildPaginatedResult(courses, total, paginationParams);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Courses retrieved successfully',
    ...result,
  });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
      sections: {
        include: {
          lessons: {
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
      categories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          sections: true,
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Course retrieved successfully',
    data: course,
  });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const payload = createCourseSchema.parse(req.body);

  // Verify instructor exists
  const instructor = await prisma.instructor.findUnique({
    where: { id: payload.instructorId },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  // Check if slug is unique
  const existingCourse = await prisma.course.findUnique({
    where: { slug: payload.slug },
  });

  if (existingCourse) {
    throw new AppError('Course with this slug already exists', StatusCodes.CONFLICT);
  }

  const course = await prisma.course.create({
    data: payload,
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.course.create',
    entity: 'course',
    userId: req.user?.id,
    metadata: { courseId: course.id, title: course.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Course created successfully',
    data: course,
  });
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateCourseSchema.parse(req.body);

  const existingCourse = await prisma.course.findUnique({
    where: { id },
  });

  if (!existingCourse) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  // If instructorId is being updated, verify new instructor exists
  if (payload.instructorId) {
    const instructor = await prisma.instructor.findUnique({
      where: { id: payload.instructorId },
    });

    if (!instructor) {
      throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
    }
  }

  // If slug is being updated, check if it's unique
  if (payload.slug && payload.slug !== existingCourse.slug) {
    const slugExists = await prisma.course.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExists) {
      throw new AppError('Course with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  const course = await prisma.course.update({
    where: { id },
    data: payload,
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.course.update',
    entity: 'course',
    userId: req.user?.id,
    metadata: { courseId: course.id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Course updated successfully',
    data: course,
  });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      enrollments: true,
    },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  if (course.enrollments.length > 0) {
    throw new AppError(
      'Cannot delete course with active enrollments. Archive it instead.',
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.course.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.course.delete',
    entity: 'course',
    userId: req.user?.id,
    metadata: { courseId: id, title: course.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Course deleted successfully',
  });
});

export const publishCourse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { publish } = publishCourseSchema.parse(req.body);

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          lessons: true,
        },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  // Validation for publishing
  if (publish) {
    if (!course.title || !course.description) {
      throw new AppError(
        'Course must have a title and description before publishing',
        StatusCodes.BAD_REQUEST
      );
    }

    if (course.sections.length === 0) {
      throw new AppError('Course must have at least one section before publishing', StatusCodes.BAD_REQUEST);
    }

    const hasLessons = course.sections.some((section) => section.lessons.length > 0);
    if (!hasLessons) {
      throw new AppError('Course must have at least one lesson before publishing', StatusCodes.BAD_REQUEST);
    }
  }

  const newStatus = publish ? CourseStatus.PUBLISHED : CourseStatus.DRAFT;
  const publishedAt = publish ? new Date() : null;

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: {
      status: newStatus,
      publishedAt,
    },
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  await auditLogger.log({
    action: publish ? 'admin.course.publish' : 'admin.course.unpublish',
    entity: 'course',
    userId: req.user?.id,
    metadata: { courseId: id, status: newStatus },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: publish ? 'Course published successfully' : 'Course unpublished successfully',
    data: updatedCourse,
  });
});

export const assignInstructor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { instructorId } = assignInstructorSchema.parse(req.body);

  const course = await prisma.course.findUnique({
    where: { id },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
  });

  if (!instructor) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: { instructorId },
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.course.assign-instructor',
    entity: 'course',
    userId: req.user?.id,
    metadata: { courseId: id, instructorId },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor assigned successfully',
    data: updatedCourse,
  });
});
