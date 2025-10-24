import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ContentStatus, EnrollmentStatus, ProgressStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';

const updateProgressSchema = z.object({
  status: z.enum([ProgressStatus.IN_PROGRESS, ProgressStatus.COMPLETED]),
});

type LessonProgressRecord = {
  status: ProgressStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
};

type StudentLesson = {
  id: string;
  title: string;
  position: number;
  duration: number | null;
  type: string;
  progress?: LessonProgressRecord;
};

type StudentSection = {
  id: string;
  title: string;
  position: number;
  lessons: StudentLesson[];
};

function resolveLessonProgress(
  lesson: { progresses: LessonProgressRecord[] }
): LessonProgressRecord | undefined {
  return lesson.progresses.length > 0 ? lesson.progresses[0] : undefined;
}

function computeNextLesson(sections: StudentSection[]): StudentLesson | undefined {
  for (const section of sections) {
    for (const lesson of section.lessons) {
      if (!lesson.progress || lesson.progress.status !== ProgressStatus.COMPLETED) {
        return lesson;
      }
    }
  }
  return sections.flatMap((section) => section.lessons)[0];
}

function computeLastActivity(
  progresses: { updatedAt: Date; completedAt: Date | null }[]
): Date | null {
  if (progresses.length === 0) {
    return null;
  }
  return progresses
    .map((progress) => progress.completedAt ?? progress.updatedAt)
    .reduce((latest, current) => (current > latest ? current : latest));
}

export const getMyCourses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: req.user.id,
      status: { not: EnrollmentStatus.CANCELLED },
    },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
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
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { status: ContentStatus.PUBLISHED },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  position: true,
                  type: true,
                  progresses: {
                    where: { userId: req.user.id },
                    select: {
                      status: true,
                      startedAt: true,
                      completedAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      progresses: {
        select: {
          updatedAt: true,
          completedAt: true,
        },
      },
    },
  });

  const courses = enrollments.map((enrollment) => {
    const sections: StudentSection[] = enrollment.course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      position: section.position,
      lessons: section.lessons.map((lesson) => {
        const progress = resolveLessonProgress(lesson);
        return {
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          position: lesson.position,
          type: lesson.type,
          progress,
        };
      }),
    }));

    const flattenedLessons = sections.flatMap((section) => section.lessons);
    const totalLessons = flattenedLessons.length;
    const completedLessons = flattenedLessons.filter(
      (lesson) => lesson.progress?.status === ProgressStatus.COMPLETED
    ).length;
    const progressPercent = totalLessons
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
    const nextLesson = computeNextLesson(sections);
    const nextLessonSection = nextLesson
      ? sections.find((section) => section.lessons.some((lesson) => lesson.id === nextLesson.id))
      : undefined;
    const lastActivityAt = computeLastActivity(enrollment.progresses);

    return {
      courseId: enrollment.course.id,
      enrollmentId: enrollment.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      level: enrollment.course.level,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      progressPercent,
      completedLessons,
      totalLessons,
      nextLesson: nextLesson
        ? {
            id: nextLesson.id,
            title: nextLesson.title,
            sectionId: nextLessonSection?.id ?? null,
            sectionTitle: nextLessonSection?.title ?? null,
          }
        : null,
      lastActivityAt: lastActivityAt?.toISOString() ?? null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      instructor: enrollment.course.instructor
        ? {
            id: enrollment.course.instructor.id,
            name: `${enrollment.course.instructor.user.firstName ?? ''} ${
              enrollment.course.instructor.user.lastName ?? ''
            }`.trim() || enrollment.course.instructor.user.email,
            avatarUrl: enrollment.course.instructor.user.avatarUrl,
          }
        : null,
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Courses retrieved successfully',
    data: {
      courses,
    },
  });
});

export const getCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const { courseId } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: req.user.id,
        courseId,
      },
    },
    include: {
      course: {
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
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { position: 'asc' },
            include: {
              lessons: {
                where: { status: ContentStatus.PUBLISHED },
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  position: true,
                  type: true,
                  status: true,
                  progresses: {
                    where: { userId: req.user.id },
                    select: {
                      status: true,
                      startedAt: true,
                      completedAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      progresses: {
        select: {
          updatedAt: true,
          completedAt: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  const sections: StudentSection[] = enrollment.course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    position: section.position,
    lessons: section.lessons.map((lesson) => {
      const progress = resolveLessonProgress(lesson);
      return {
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration,
        position: lesson.position,
        type: lesson.type,
        progress,
      };
    }),
  }));

  const flattenedLessons = sections.flatMap((section) => section.lessons);
  const totalLessons = flattenedLessons.length;
  const completedLessons = flattenedLessons.filter(
    (lesson) => lesson.progress?.status === ProgressStatus.COMPLETED
  ).length;
  const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const nextLesson = computeNextLesson(sections);
  const lastActivityAt = computeLastActivity(enrollment.progresses);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Course retrieved successfully',
    data: {
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        level: enrollment.course.level,
        estimatedDuration: enrollment.course.estimatedDuration,
        sections,
        instructor: enrollment.course.instructor
          ? {
              id: enrollment.course.instructor.id,
              name: `${enrollment.course.instructor.user.firstName ?? ''} ${
                enrollment.course.instructor.user.lastName ?? ''
              }`.trim() || enrollment.course.instructor.user.email,
              avatarUrl: enrollment.course.instructor.user.avatarUrl,
            }
          : null,
      },
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercent,
        completedLessons,
        totalLessons,
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
      },
      nextLesson: nextLesson
        ? {
            id: nextLesson.id,
            title: nextLesson.title,
          }
        : null,
    },
  });
});

export const getLessonDetail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const { courseId, lessonId } = req.params;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: req.user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      section: {
        courseId,
        status: ContentStatus.PUBLISHED,
      },
      status: ContentStatus.PUBLISHED,
    },
    include: {
      section: {
        select: {
          id: true,
          title: true,
          position: true,
        },
      },
      files: {
        select: {
          id: true,
          filename: true,
          originalFilename: true,
          url: true,
          mimeType: true,
          size: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      quiz: true,
      progresses: {
        where: { userId: req.user.id },
        select: {
          status: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', StatusCodes.NOT_FOUND);
  }

  const progress = resolveLessonProgress(lesson);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lesson retrieved successfully',
    data: {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        resourceUrl: lesson.resourceUrl,
        duration: lesson.duration,
        type: lesson.type,
        files: lesson.files,
        quiz: lesson.quiz,
        section: lesson.section,
      },
      progress: progress
        ? {
            status: progress.status,
            startedAt: progress.startedAt?.toISOString() ?? null,
            completedAt: progress.completedAt?.toISOString() ?? null,
            updatedAt: progress.updatedAt.toISOString(),
          }
        : null,
    },
  });
});

export const updateLessonProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  const { courseId, lessonId } = req.params;
  const payload = updateProgressSchema.parse(req.body);

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: req.user.id,
        courseId,
      },
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      section: {
        courseId,
        status: ContentStatus.PUBLISHED,
      },
      status: ContentStatus.PUBLISHED,
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', StatusCodes.NOT_FOUND);
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingProgress = await tx.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: req.user!.id,
          lessonId,
        },
      },
    });

    const now = new Date();
    const shouldSetStartedAt = payload.status === ProgressStatus.IN_PROGRESS || payload.status === ProgressStatus.COMPLETED;
    const progress = existingProgress
      ? await tx.progress.update({
          where: { id: existingProgress.id },
          data: {
            status: payload.status,
            enrollmentId: enrollment.id,
            startedAt: existingProgress.startedAt ?? (shouldSetStartedAt ? now : null),
            completedAt: payload.status === ProgressStatus.COMPLETED ? now : null,
          },
        })
      : await tx.progress.create({
          data: {
            userId: req.user!.id,
            lessonId,
            enrollmentId: enrollment.id,
            status: payload.status,
            startedAt: shouldSetStartedAt ? now : null,
            completedAt: payload.status === ProgressStatus.COMPLETED ? now : null,
          },
        });

    const [totalLessons, completedLessons] = await Promise.all([
      tx.lesson.count({
        where: {
          status: ContentStatus.PUBLISHED,
          section: {
            courseId,
            status: ContentStatus.PUBLISHED,
          },
        },
      }),
      tx.progress.count({
        where: {
          userId: req.user!.id,
          status: ProgressStatus.COMPLETED,
          lesson: {
            status: ContentStatus.PUBLISHED,
            section: {
              courseId,
              status: ContentStatus.PUBLISHED,
            },
          },
        },
      }),
    ]);

    const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const enrollmentStatus = progressPercent === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE;

    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercent,
        status: enrollmentStatus,
        completedAt: enrollmentStatus === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
    });

    return {
      progress,
      summary: {
        progressPercent,
        completedLessons,
        totalLessons,
        enrollmentStatus,
        lastActivityAt: (progress.completedAt ?? progress.updatedAt).toISOString(),
        enrollmentId: updatedEnrollment.id,
      },
    };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Progress updated successfully',
    data: {
      progress: {
        status: result.progress.status,
        startedAt: result.progress.startedAt?.toISOString() ?? null,
        completedAt: result.progress.completedAt?.toISOString() ?? null,
        updatedAt: result.progress.updatedAt.toISOString(),
      },
      enrollment: {
        id: result.summary.enrollmentId,
        status: result.summary.enrollmentStatus,
        progressPercent: result.summary.progressPercent,
        completedLessons: result.summary.completedLessons,
        totalLessons: result.summary.totalLessons,
        lastActivityAt: result.summary.lastActivityAt,
      },
    },
  });
});
