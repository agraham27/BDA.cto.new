import { z } from 'zod';
import { CourseStatus, ContentStatus, LessonType, CourseLevel, EnrollmentStatus } from '@prisma/client';

// Pagination and filtering schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const courseSortFields = ['createdAt', 'updatedAt', 'title', 'publishedAt'] as const;

export const sortSchema = z.object({
  sortBy: z.enum(courseSortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const enrollmentSortFields = ['enrolledAt', 'completedAt', 'progress'] as const;

export const enrollmentSortSchema = z.object({
  sortBy: z.enum(enrollmentSortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Course validation schemas
export const createCourseSchema = z
  .object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    instructorId: z.string().cuid(),
    status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
    level: z.nativeEnum(CourseLevel).default(CourseLevel.ALL_LEVELS),
    language: z.string().default('en'),
    thumbnailUrl: z.string().url().optional(),
    trailerUrl: z.string().url().optional(),
    estimatedDuration: z.number().int().positive().optional(),
  })
  .strict();

export const updateCourseSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    instructorId: z.string().cuid().optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    level: z.nativeEnum(CourseLevel).optional(),
    language: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    trailerUrl: z.string().url().optional(),
    estimatedDuration: z.number().int().positive().optional(),
  })
  .strict();

export const courseFilterSchema = z.object({
  status: z.nativeEnum(CourseStatus).optional(),
  level: z.nativeEnum(CourseLevel).optional(),
  instructorId: z.string().cuid().optional(),
  category: z.string().min(1).optional(),
  search: z.string().optional(),
});

export const publishCourseSchema = z
  .object({
    publish: z.boolean(),
  })
  .strict();

// Section validation schemas
export const createSectionSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    position: z.number().int().nonnegative(),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  })
  .strict();

export const updateSectionSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    position: z.number().int().nonnegative().optional(),
    status: z.nativeEnum(ContentStatus).optional(),
  })
  .strict();

// Lesson validation schemas
export const createLessonSchema = z
  .object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().url().optional(),
    resourceUrl: z.string().url().optional(),
    duration: z.number().int().positive().optional(),
    type: z.nativeEnum(LessonType).default(LessonType.ARTICLE),
    position: z.number().int().nonnegative(),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  })
  .strict();

export const updateLessonSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    summary: z.string().optional(),
    content: z.string().optional(),
    videoUrl: z.string().url().optional(),
    resourceUrl: z.string().url().optional(),
    duration: z.number().int().positive().optional(),
    type: z.nativeEnum(LessonType).optional(),
    position: z.number().int().nonnegative().optional(),
    status: z.nativeEnum(ContentStatus).optional(),
  })
  .strict();

// Quiz validation schemas
export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().int().nonnegative(),
  explanation: z.string().optional(),
});

export const createQuizSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    passingScore: z.number().int().min(0).max(100).default(70),
    timeLimit: z.number().int().positive().optional(),
    questions: z.array(quizQuestionSchema).min(1),
  })
  .strict();

export const updateQuizSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    passingScore: z.number().int().min(0).max(100).optional(),
    timeLimit: z.number().int().positive().optional(),
    questions: z.array(quizQuestionSchema).min(1).optional(),
  })
  .strict();

// Instructor assignment schema
export const assignInstructorSchema = z
  .object({
    instructorId: z.string().cuid(),
  })
  .strict();

// Enrollment validation schemas
export const createEnrollmentSchema = z
  .object({
    userId: z.string().cuid(),
    courseId: z.string().cuid(),
    status: z.nativeEnum(EnrollmentStatus).optional(),
  })
  .strict();

export const updateEnrollmentSchema = z
  .object({
    status: z.nativeEnum(EnrollmentStatus),
  })
  .strict();

export const enrollmentFilterSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus).optional(),
  userId: z.string().cuid().optional(),
  courseId: z.string().cuid().optional(),
  search: z.string().optional(),
});

// Blog post validation schemas
export const createBlogPostSchema = z
  .object({
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    seoTitle: z.string().max(255).optional(),
    seoDescription: z.string().max(500).optional(),
    seoKeywords: z.array(z.string()).default([]),
    canonicalUrl: z.string().url().optional(),
    instructorId: z.string().cuid().optional(),
    categoryIds: z.array(z.string().cuid()).optional(),
    featuredImageId: z.string().cuid().optional(),
  })
  .strict();

export const updateBlogPostSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().min(1).optional(),
    status: z.nativeEnum(ContentStatus).optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    seoTitle: z.string().max(255).optional().nullable(),
    seoDescription: z.string().max(500).optional().nullable(),
    seoKeywords: z.array(z.string()).optional(),
    canonicalUrl: z.string().url().optional().nullable(),
    instructorId: z.string().cuid().optional().nullable(),
    categoryIds: z.array(z.string().cuid()).optional(),
    featuredImageId: z.string().cuid().optional().nullable(),
  })
  .strict();

export const publishBlogPostSchema = z
  .object({
    publish: z.boolean(),
  })
  .strict();

export const blogPostFilterSchema = z.object({
  status: z.nativeEnum(ContentStatus).optional(),
  featured: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          return true;
        }
        if (value.toLowerCase() === 'false') {
          return false;
        }
        return undefined;
      }

      if (typeof value === 'boolean') {
        return value;
      }

      return undefined;
    }, z.boolean().optional()),
  authorId: z.string().cuid().optional(),
  instructorId: z.string().cuid().optional(),
  category: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  search: z.string().optional(),
});

export const blogPostSortFields = ['createdAt', 'updatedAt', 'title', 'publishedAt'] as const;

export const blogPostSortSchema = z.object({
  sortBy: z.enum(blogPostSortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Instructor avatar upload schema
export const updateInstructorAvatarSchema = z
  .object({
    avatarUrl: z.string().url(),
  })
  .strict();

// Types
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type EnrollmentSortParams = z.infer<typeof enrollmentSortSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseFilterParams = z.infer<typeof courseFilterSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type EnrollmentFilterParams = z.infer<typeof enrollmentFilterSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type BlogPostFilterParams = z.infer<typeof blogPostFilterSchema>;
export type BlogPostSortParams = z.infer<typeof blogPostSortSchema>;
