import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EnrollmentStatus, ProgressStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';

// GET /api/student/courses - Get enrolled courses
export const getEnrolledCourses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: EnrollmentStatus.ACTIVE,
    },
    include: {
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
            include: {
              lessons: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  // Calculate progress for each course
  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLessons = enrollment.course.sections.reduce(
        (sum, section) => sum + section.lessons.length,
        0
      );

      const completedLessons = await prisma.progress.count({
        where: {
          userId,
          enrollmentId: enrollment.id,
          status: ProgressStatus.COMPLETED,
        },
      });

      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Find last accessed lesson
      const lastProgress = await prisma.progress.findFirst({
        where: {
          userId,
          enrollmentId: enrollment.id,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          lesson: {
            include: {
              section: true,
            },
          },
        },
      });

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        level: enrollment.course.level,
        language: enrollment.course.language,
        progress,
        totalLessons,
        completedLessons,
        enrolledAt: enrollment.enrolledAt,
        lastAccessedLesson: lastProgress?.lesson
          ? {
              id: lastProgress.lesson.id,
              title: lastProgress.lesson.title,
              sectionTitle: lastProgress.lesson.section.title,
            }
          : null,
        instructor: {
          id: enrollment.course.instructor.id,
          name: `${enrollment.course.instructor.user.firstName || ''} ${enrollment.course.instructor.user.lastName || ''}`.trim(),
          avatarUrl: enrollment.course.instructor.user.avatarUrl,
        },
      };
    })
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Enrolled courses retrieved successfully',
    data: coursesWithProgress,
  });
});

// GET /api/student/courses/:id - Get course details with progress
export const getCourseWithProgress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  // Get course with full structure
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      },
      sections: {
        where: {
          status: 'PUBLISHED',
        },
        include: {
          lessons: {
            where: {
              status: 'PUBLISHED',
            },
            include: {
              quiz: true,
              files: true,
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  // Get progress for all lessons
  const allLessonIds = course.sections.flatMap((section) =>
    section.lessons.map((lesson) => lesson.id)
  );

  const progresses = await prisma.progress.findMany({
    where: {
      userId,
      enrollmentId: enrollment.id,
      lessonId: { in: allLessonIds },
    },
  });

  const progressMap = new Map(progresses.map((p) => [p.lessonId, p]));

  // Transform data with progress info
  const sectionsWithProgress = course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    position: section.position,
    lessons: section.lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        type: lesson.type,
        duration: lesson.duration,
        position: lesson.position,
        videoUrl: lesson.videoUrl,
        hasQuiz: !!lesson.quiz,
        fileCount: lesson.files.length,
        isCompleted: progress?.status === ProgressStatus.COMPLETED,
        completedAt: progress?.completedAt,
      };
    }),
  }));

  const totalLessons = allLessonIds.length;
  const completedLessons = progresses.filter((p) => p.status === ProgressStatus.COMPLETED).length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Course retrieved successfully',
    data: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      level: course.level,
      language: course.language,
      estimatedDuration: course.estimatedDuration,
      progress,
      totalLessons,
      completedLessons,
      enrolledAt: enrollment.enrolledAt,
      instructor: {
        id: course.instructor.id,
        name: `${course.instructor.user.firstName || ''} ${course.instructor.user.lastName || ''}`.trim(),
        avatarUrl: course.instructor.user.avatarUrl,
        headline: course.instructor.headline,
        bio: course.instructor.bio,
      },
      sections: sectionsWithProgress,
    },
  });
});

// GET /api/student/courses/:courseId/lessons/:lessonId - Get lesson details
export const getLesson = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lessonId } = req.params;
  const userId = req.user!.id;

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      quiz: true,
      files: true,
    },
  });

  if (!lesson || lesson.section.course.id !== courseId) {
    throw new AppError('Lesson not found', StatusCodes.NOT_FOUND);
  }

  // Get or create progress record
  let progress = await prisma.progress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
  });

  if (!progress) {
    progress = await prisma.progress.create({
      data: {
        userId,
        lessonId,
        enrollmentId: enrollment.id,
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  } else if (progress.status === ProgressStatus.NOT_STARTED) {
    progress = await prisma.progress.update({
      where: { id: progress.id },
      data: {
        status: ProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lesson retrieved successfully',
    data: {
      id: lesson.id,
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      type: lesson.type,
      position: lesson.position,
      section: {
        id: lesson.section.id,
        title: lesson.section.title,
      },
      course: {
        id: lesson.section.course.id,
        title: lesson.section.course.title,
      },
      quiz: lesson.quiz,
      files: lesson.files.map((file) => ({
        id: file.id,
        filename: file.originalFilename,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
      })),
      progress: {
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
      },
    },
  });
});

// POST /api/student/progress - Mark lesson as complete
export const markLessonComplete = asyncHandler(async (req: Request, res: Response) => {
  const { lessonId, courseId } = req.body;
  const userId = req.user!.id;

  if (!lessonId || !courseId) {
    throw new AppError('lessonId and courseId are required', StatusCodes.BAD_REQUEST);
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  // Verify lesson belongs to course
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      section: {
        courseId,
      },
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found in this course', StatusCodes.NOT_FOUND);
  }

  // Update or create progress
  const progress = await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      status: ProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
    create: {
      userId,
      lessonId,
      enrollmentId: enrollment.id,
      status: ProgressStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  // Update enrollment progress
  const totalLessons = await prisma.lesson.count({
    where: {
      section: {
        courseId,
      },
      status: 'PUBLISHED',
    },
  });

  const completedLessons = await prisma.progress.count({
    where: {
      userId,
      enrollmentId: enrollment.id,
      status: ProgressStatus.COMPLETED,
    },
  });

  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress: progressPercentage,
      completedAt: progressPercentage === 100 ? new Date() : null,
      status: progressPercentage === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lesson marked as complete',
    data: {
      progress,
      courseProgress: progressPercentage,
    },
  });
});

// GET /api/student/profile - Get student profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  });
});

// PUT /api/student/profile - Update student profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { firstName, lastName, avatarUrl } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      avatarUrl: avatarUrl || undefined,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

// GET /api/student/stats - Get learning statistics
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const [enrollmentsCount, completedCoursesCount, totalLessonsCompleted, activeEnrollments] =
    await Promise.all([
      prisma.enrollment.count({
        where: { userId },
      }),
      prisma.enrollment.count({
        where: {
          userId,
          status: EnrollmentStatus.COMPLETED,
        },
      }),
      prisma.progress.count({
        where: {
          userId,
          status: ProgressStatus.COMPLETED,
        },
      }),
      prisma.enrollment.findMany({
        where: {
          userId,
          status: EnrollmentStatus.ACTIVE,
        },
        include: {
          course: true,
        },
      }),
    ]);

  const totalProgress = activeEnrollments.reduce((sum, e) => sum + e.progress, 0);
  const averageProgress =
    activeEnrollments.length > 0 ? Math.round(totalProgress / activeEnrollments.length) : 0;

  const completionRate =
    enrollmentsCount > 0 ? Math.round((completedCoursesCount / enrollmentsCount) * 100) : 0;

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: {
      totalCourses: enrollmentsCount,
      completedCourses: completedCoursesCount,
      activeCourses: activeEnrollments.length,
      totalLessonsCompleted,
      completionRate,
      averageProgress,
    },
  });
});

// POST /api/student/quizzes/:id/submit - Submit quiz
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { id: quizId } = req.params;
  const { answers } = req.body;
  const userId = req.user!.id;

  if (!answers || typeof answers !== 'object') {
    throw new AppError('Answers are required', StatusCodes.BAD_REQUEST);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        include: {
          section: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    throw new AppError('Quiz not found', StatusCodes.NOT_FOUND);
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: quiz.lesson.section.course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', StatusCodes.FORBIDDEN);
  }

  const questions = quiz.questions as any[];
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  const results = questions.map((question) => {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      correctAnswers++;
      earnedPoints += question.points || 0;
    }

    totalPoints += question.points || 0;

    return {
      questionId: question.id,
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      points: isCorrect ? question.points || 0 : 0,
    };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= quiz.passingScore;

  // If passed, mark lesson as complete
  if (passed) {
    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: quiz.lessonId,
        },
      },
      update: {
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId: quiz.lessonId,
        enrollmentId: enrollment.id,
        status: ProgressStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      quizId,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      results,
    },
  });
});
