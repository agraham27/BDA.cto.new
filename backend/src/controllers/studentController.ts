import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EnrollmentStatus, ProgressStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { setCacheHeader } from '@/middleware/cache';

const recalculateEnrollmentProgress = async (
  userId: string,
  enrollmentId: string,
  courseId: string
) => {
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
      enrollmentId,
      status: ProgressStatus.COMPLETED,
    },
  });

  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: progressPercentage,
      completedAt: progressPercentage === 100 ? new Date() : null,
      status: progressPercentage === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
    },
  });

  return progressPercentage;
};

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

  setCacheHeader(res, { private: true, maxAge: 300, mustRevalidate: true });

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

  const quizSubmissions = await prisma.quizSubmission.findMany({
    where: {
      userId,
      lessonId: { in: allLessonIds },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  const progressMap = new Map(progresses.map((p) => [p.lessonId, p]));
  const latestQuizSubmissionMap = new Map<string, (typeof quizSubmissions)[number]>();

  for (const submission of quizSubmissions) {
    if (!latestQuizSubmissionMap.has(submission.lessonId)) {
      latestQuizSubmissionMap.set(submission.lessonId, submission);
    }
  }

  // Transform data with progress info
  const sectionsWithProgress = course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    position: section.position,
    lessons: section.lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      const quizSubmission = latestQuizSubmissionMap.get(lesson.id);
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
        quizSubmission: quizSubmission
          ? {
              score: quizSubmission.score,
              passed: quizSubmission.passed,
              completedAt: quizSubmission.completedAt,
            }
          : null,
      };
    }),
  }));

  const totalLessons = allLessonIds.length;
  const completedLessons = progresses.filter((p) => p.status === ProgressStatus.COMPLETED).length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  setCacheHeader(res, { private: true, maxAge: 300, mustRevalidate: true });

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

  const latestQuizSubmission = lesson.quiz
    ? await prisma.quizSubmission.findFirst({
        where: {
          userId,
          quizId: lesson.quiz.id,
        },
        orderBy: {
          completedAt: 'desc',
        },
      })
    : null;

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

  setCacheHeader(res, { private: true, maxAge: 120, mustRevalidate: true });

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
      latestQuizSubmission: latestQuizSubmission
        ? {
            id: latestQuizSubmission.id,
            score: latestQuizSubmission.score,
            passed: latestQuizSubmission.passed,
            completedAt: latestQuizSubmission.completedAt,
          }
        : null,
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

  const progressPercentage = await recalculateEnrollmentProgress(userId, enrollment.id, courseId);

  setCacheHeader(res, { noStore: true });

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

  setCacheHeader(res, { private: true, maxAge: 300, mustRevalidate: true });

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

  setCacheHeader(res, { noStore: true });

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

  setCacheHeader(res, { private: true, maxAge: 300, mustRevalidate: true });

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
  const { answers, timeSpent } = req.body;
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
      earnedPoints += question.points || 1;
    }

    totalPoints += question.points || 1;

    return {
      questionId: question.id,
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      points: isCorrect ? question.points || 1 : 0,
      explanation: question.explanation,
    };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= quiz.passingScore;

  const quizSubmission = await prisma.quizSubmission.create({
    data: {
      userId,
      quizId,
      lessonId: quiz.lessonId,
      enrollmentId: enrollment.id,
      answers: answers as Prisma.JsonObject,
      results: results as Prisma.JsonArray,
      score,
      passed,
      timeSpent: timeSpent || null,
      completedAt: new Date(),
    },
  });

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

    await recalculateEnrollmentProgress(userId, enrollment.id, quiz.lesson.section.course.id);
  }

  setCacheHeader(res, { noStore: true });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      submissionId: quizSubmission.id,
      quizId,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      results,
    },
  });
});
