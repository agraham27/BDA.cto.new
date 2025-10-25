import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CourseStatus, ContentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { buildPaginatedResult, getPaginationSkip } from '@/utils/pagination';
import { paginationSchema, courseFilterSchema, sortSchema } from '@/utils/validation';
import { buildCourseWhereClause } from '@/utils/filters';

export const getPublicCourses = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const sortParams = sortSchema.parse(req.query);
  const filterParams = courseFilterSchema.parse(req.query);

  const where = {
    ...buildCourseWhereClause(filterParams),
    status: CourseStatus.PUBLISHED,
  };

  const skip = getPaginationSkip(paginationParams);

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: paginationParams.limit,
      orderBy: sortParams.sortBy
        ? { [sortParams.sortBy]: sortParams.sortOrder }
        : { publishedAt: 'desc' },
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

export const getPublicCourse = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
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
        where: {
          status: ContentStatus.PUBLISHED,
        },
        include: {
          lessons: {
            where: {
              status: ContentStatus.PUBLISHED,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              duration: true,
              type: true,
              position: true,
            },
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

export const getPublicInstructors = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const skip = getPaginationSkip(paginationParams);

  const [instructors, total] = await Promise.all([
    prisma.instructor.findMany({
      skip,
      take: paginationParams.limit,
      orderBy: { createdAt: 'desc' },
      where: {
        user: {
          isActive: true,
        },
        courses: {
          some: {
            status: CourseStatus.PUBLISHED,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
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
    prisma.instructor.count({
      where: {
        user: {
          isActive: true,
        },
        courses: {
          some: {
            status: CourseStatus.PUBLISHED,
          },
        },
      },
    }),
  ]);

  const result = buildPaginatedResult(instructors, total, paginationParams);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructors retrieved successfully',
    ...result,
  });
});

export const getPublicInstructor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const instructor = await prisma.instructor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      courses: {
        where: {
          status: CourseStatus.PUBLISHED,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          level: true,
          thumbnailUrl: true,
          publishedAt: true,
          estimatedDuration: true,
          _count: {
            select: {
              enrollments: true,
              sections: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
      },
      blogPosts: {
        where: {
          status: ContentStatus.PUBLISHED,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          courses: true,
          blogPosts: true,
        },
      },
    },
  });

  if (!instructor || !instructor.user.isActive) {
    throw new AppError('Instructor not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Instructor retrieved successfully',
    data: instructor,
  });
});

export const getPublicBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const paginationParams = paginationSchema.parse(req.query);
  const skip = getPaginationSkip(paginationParams);

  const { category, tag, featured } = req.query;

  const where: any = {
    status: ContentStatus.PUBLISHED,
  };

  if (category) {
    where.categories = {
      some: {
        category: {
          slug: category as string,
        },
      },
    };
  }

  if (tag) {
    where.tags = {
      has: tag as string,
    };
  }

  if (featured === 'true') {
    where.featured = true;
  }

  const [blogPosts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: paginationParams.limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
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

export const getPublicBlogPost = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const blogPost = await prisma.blogPost.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: {
      author: {
        select: {
          id: true,
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

export const getPublicCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          courseCategories: true,
          blogPostCategories: true,
        },
      },
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
  });
});
