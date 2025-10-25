import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentFilterSchema,
  paginationSchema,
  enrollmentSortSchema,
} from '@/utils/validation';
import { buildPaginatedResult, getPaginationSkip } from '@/utils/pagination';
import { buildEnrollmentWhereClause } from '@/utils/filters';

export const getEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const sortParams = enrollmentSortSchema.parse(req.query);
  const filterParams = enrollmentFilterSchema.parse(req.query);

  const where = buildEnrollmentWhereClause(filterParams);
  const skip = getPaginationSkip(paginationParams);

  const [enrollments, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: paginationParams.limit,
      orderBy: sortParams.sortBy
        ? { [sortParams.sortBy]: sortParams.sortOrder }
        : { enrolledAt: sortParams.sortOrder },
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
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            status: true,
          },
        },
        _count: {
          select: {
            progresses: true,
          },
        },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  const result = buildPaginatedResult(enrollments, total, paginationParams);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrollments retrieved successfully',
    ...result,
  });
});

export const getEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
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
        },
      },
      course: {
        include: {
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
          sections: {
            select: {
              id: true,
              title: true,
              _count: {
                select: {
                  lessons: true,
                },
              },
            },
          },
        },
      },
      progresses: {
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Enrollment not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrollment retrieved successfully',
    data: enrollment,
  });
});

export const createEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const payload = createEnrollmentSchema.parse(req.body);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  // Check if course exists and is published
  const course = await prisma.course.findUnique({
    where: { id: payload.courseId },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  if (course.status !== 'PUBLISHED') {
    throw new AppError('Cannot enroll in unpublished course', StatusCodes.BAD_REQUEST);
  }

  // Check if enrollment already exists
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: payload.userId,
        courseId: payload.courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new AppError('User is already enrolled in this course', StatusCodes.CONFLICT);
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: payload.userId,
      courseId: payload.courseId,
      status: payload.status || EnrollmentStatus.ACTIVE,
    },
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
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.enrollment.create',
    entity: 'enrollment',
    userId: req.user?.id,
    metadata: {
      enrollmentId: enrollment.id,
      studentId: payload.userId,
      courseId: payload.courseId,
    },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Enrollment created successfully',
    data: enrollment,
  });
});

export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = updateEnrollmentSchema.parse(req.body);

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { id },
  });

  if (!existingEnrollment) {
    throw new AppError('Enrollment not found', StatusCodes.NOT_FOUND);
  }

  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: {
      status: payload.status,
      completedAt: payload.status === EnrollmentStatus.COMPLETED ? new Date() : null,
    },
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
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
        },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.enrollment.update',
    entity: 'enrollment',
    userId: req.user?.id,
    metadata: {
      enrollmentId: id,
      changes: payload,
    },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrollment updated successfully',
    data: enrollment,
  });
});

export const deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      progresses: true,
    },
  });

  if (!enrollment) {
    throw new AppError('Enrollment not found', StatusCodes.NOT_FOUND);
  }

  await prisma.enrollment.delete({
    where: { id },
  });

  await auditLogger.log({
    action: 'admin.enrollment.delete',
    entity: 'enrollment',
    userId: req.user?.id,
    metadata: {
      enrollmentId: id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
    },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrollment deleted successfully',
  });
});

export const getEnrollmentStats = asyncHandler(async (req: Request, res: Response) => {
  const [totalEnrollments, activeEnrollments, completedEnrollments, cancelledEnrollments] =
    await Promise.all([
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: { status: EnrollmentStatus.ACTIVE },
      }),
      prisma.enrollment.count({
        where: { status: EnrollmentStatus.COMPLETED },
      }),
      prisma.enrollment.count({
        where: { status: EnrollmentStatus.CANCELLED },
      }),
    ]);

  const enrollmentsByMonth = await prisma.$queryRaw<
    Array<{ month: string; count: bigint }>
  >`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', "enrolledAt"), 'YYYY-MM') as month,
      COUNT(*)::bigint as count
    FROM "Enrollment"
    WHERE "enrolledAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "enrolledAt")
    ORDER BY month DESC
  `;

  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrollment statistics retrieved successfully',
    data: {
      total: totalEnrollments,
      active: activeEnrollments,
      completed: completedEnrollments,
      cancelled: cancelledEnrollments,
      completionRate,
      byMonth: enrollmentsByMonth.map((row) => ({
        month: row.month,
        count: Number(row.count),
      })),
    },
  });
});
