import { Prisma } from '@prisma/client';
import { CourseFilterParams, EnrollmentFilterParams } from './validation';

export function buildCourseWhereClause(filters: CourseFilterParams): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.level) {
    where.level = filters.level;
  }

  if (filters.instructorId) {
    where.instructorId = filters.instructorId;
  }

  if (filters.category) {
    where.categories = {
      some: {
        category: {
          slug: filters.category,
        },
      },
    };
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildEnrollmentWhereClause(
  filters: EnrollmentFilterParams
): Prisma.EnrollmentWhereInput {
  const where: Prisma.EnrollmentWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.courseId) {
    where.courseId = filters.courseId;
  }

  if (filters.search) {
    where.OR = [
      {
        user: {
          OR: [
            { email: { contains: filters.search, mode: 'insensitive' } },
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
      {
        course: {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { slug: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return where;
}
