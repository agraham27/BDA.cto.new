import { Prisma } from '@prisma/client';
import { CourseFilterParams } from './validation';

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
