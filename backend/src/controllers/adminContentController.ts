import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/middleware/errorHandler';
import { auditLogger } from '@/utils/auditLogger';
import { getRequestContext } from '@/utils/request';
import {
  createSectionSchema,
  updateSectionSchema,
  createLessonSchema,
  updateLessonSchema,
  createQuizSchema,
  updateQuizSchema,
} from '@/utils/validation';

// Sections
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const payload = createSectionSchema.parse(req.body);

  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    throw new AppError('Course not found', StatusCodes.NOT_FOUND);
  }

  const existingSection = await prisma.section.findUnique({
    where: { courseId_position: { courseId, position: payload.position } },
  });

  if (existingSection) {
    throw new AppError('Another section already exists at this position', StatusCodes.CONFLICT);
  }

  const section = await prisma.section.create({
    data: {
      ...payload,
      courseId,
    },
    include: {
      lessons: {
        orderBy: { position: 'asc' },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.section.create',
    entity: 'section',
    userId: req.user?.id,
    metadata: { courseId, sectionId: section.id, title: section.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Section created successfully',
    data: section,
  });
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId } = req.params;
  const payload = updateSectionSchema.parse(req.body);

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.courseId !== courseId) {
    throw new AppError('Section not found for this course', StatusCodes.NOT_FOUND);
  }

  if (payload.position && payload.position !== section.position) {
    const existingSection = await prisma.section.findUnique({
      where: { courseId_position: { courseId, position: payload.position } },
    });

    if (existingSection) {
      throw new AppError('Another section already exists at this position', StatusCodes.CONFLICT);
    }
  }

  const updatedSection = await prisma.section.update({
    where: { id: sectionId },
    data: payload,
    include: {
      lessons: {
        orderBy: { position: 'asc' },
      },
    },
  });

  await auditLogger.log({
    action: 'admin.section.update',
    entity: 'section',
    userId: req.user?.id,
    metadata: { courseId, sectionId, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Section updated successfully',
    data: updatedSection,
  });
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId } = req.params;

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { lessons: true },
  });

  if (!section || section.courseId !== courseId) {
    throw new AppError('Section not found for this course', StatusCodes.NOT_FOUND);
  }

  if (section.lessons.length > 0) {
    throw new AppError('Cannot delete section with lessons. Remove lessons first.', StatusCodes.BAD_REQUEST);
  }

  await prisma.section.delete({ where: { id: sectionId } });

  await auditLogger.log({
    action: 'admin.section.delete',
    entity: 'section',
    userId: req.user?.id,
    metadata: { courseId, sectionId },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Section deleted successfully',
  });
});

// Lessons
export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId } = req.params;
  const payload = createLessonSchema.parse(req.body);

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.courseId !== courseId) {
    throw new AppError('Section not found for this course', StatusCodes.NOT_FOUND);
  }

  const existingLesson = await prisma.lesson.findUnique({
    where: { sectionId_position: { sectionId, position: payload.position } },
  });

  if (existingLesson) {
    throw new AppError('Another lesson already exists at this position', StatusCodes.CONFLICT);
  }

  if (payload.slug) {
    const slugExists = await prisma.lesson.findUnique({
      where: { slug: payload.slug },
    });

    if (slugExists) {
      throw new AppError('Lesson with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  const lesson = await prisma.lesson.create({
    data: {
      ...payload,
      sectionId,
    },
    include: {
      quiz: true,
    },
  });

  await auditLogger.log({
    action: 'admin.lesson.create',
    entity: 'lesson',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId: lesson.id, title: lesson.title },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Lesson created successfully',
    data: lesson,
  });
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId, lessonId } = req.params;
  const payload = updateLessonSchema.parse(req.body);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', StatusCodes.NOT_FOUND);
  }

  const section = await prisma.section.findUnique({ where: { id: sectionId } });

  if (!section || section.courseId !== courseId || lesson.sectionId !== sectionId) {
    throw new AppError('Lesson not found for this course section', StatusCodes.NOT_FOUND);
  }

  if (payload.position && payload.position !== lesson.position) {
    const positionExists = await prisma.lesson.findUnique({
      where: { sectionId_position: { sectionId, position: payload.position } },
    });

    if (positionExists) {
      throw new AppError('Another lesson already exists at this position', StatusCodes.CONFLICT);
    }
  }

  if (payload.slug && payload.slug !== lesson.slug) {
    const slugExists = await prisma.lesson.findUnique({ where: { slug: payload.slug } });
    if (slugExists) {
      throw new AppError('Lesson with this slug already exists', StatusCodes.CONFLICT);
    }
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: payload,
    include: {
      quiz: true,
    },
  });

  await auditLogger.log({
    action: 'admin.lesson.update',
    entity: 'lesson',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lesson updated successfully',
    data: updatedLesson,
  });
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId, lessonId } = req.params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quiz: true,
    },
  });

  if (!lesson) {
    throw new AppError('Lesson not found', StatusCodes.NOT_FOUND);
  }

  const section = await prisma.section.findUnique({ where: { id: sectionId } });

  if (!section || section.courseId !== courseId || lesson.sectionId !== sectionId) {
    throw new AppError('Lesson not found for this course section', StatusCodes.NOT_FOUND);
  }

  if (lesson.quiz) {
    throw new AppError('Cannot delete lesson with an associated quiz. Remove the quiz first.', StatusCodes.BAD_REQUEST);
  }

  await prisma.lesson.delete({ where: { id: lessonId } });

  await auditLogger.log({
    action: 'admin.lesson.delete',
    entity: 'lesson',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Lesson deleted successfully',
  });
});

// Quiz
export const upsertQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId, lessonId } = req.params;
  const payload = createQuizSchema.parse(req.body);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: true, section: true },
  });

  if (!lesson || lesson.sectionId !== sectionId || lesson.section.courseId !== courseId) {
    throw new AppError('Lesson not found for this course section', StatusCodes.NOT_FOUND);
  }

  const quiz = lesson.quiz
    ? await prisma.quiz.update({
        where: { lessonId },
        data: payload,
      })
    : await prisma.quiz.create({
        data: {
          ...payload,
          lessonId,
        },
      });

  await auditLogger.log({
    action: lesson.quiz ? 'admin.quiz.update' : 'admin.quiz.create',
    entity: 'quiz',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId, quizId: quiz.id },
    ...getRequestContext(req),
  });

  res.status(lesson.quiz ? StatusCodes.OK : StatusCodes.CREATED).json({
    success: true,
    message: lesson.quiz ? 'Quiz updated successfully' : 'Quiz created successfully',
    data: quiz,
  });
});

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId, lessonId } = req.params;
  const payload = updateQuizSchema.parse(req.body);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: true, section: true },
  });

  if (!lesson || !lesson.quiz || lesson.sectionId !== sectionId || lesson.section.courseId !== courseId) {
    throw new AppError('Quiz not found for this lesson', StatusCodes.NOT_FOUND);
  }

  const quiz = await prisma.quiz.update({
    where: { lessonId },
    data: payload,
  });

  await auditLogger.log({
    action: 'admin.quiz.update',
    entity: 'quiz',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId, quizId: quiz.id, changes: payload },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Quiz updated successfully',
    data: quiz,
  });
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, sectionId, lessonId } = req.params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: true, section: true },
  });

  if (!lesson || !lesson.quiz || lesson.sectionId !== sectionId || lesson.section.courseId !== courseId) {
    throw new AppError('Quiz not found for this lesson', StatusCodes.NOT_FOUND);
  }

  await prisma.quiz.delete({
    where: { lessonId },
  });

  await auditLogger.log({
    action: 'admin.quiz.delete',
    entity: 'quiz',
    userId: req.user?.id,
    metadata: { courseId, sectionId, lessonId, quizId: lesson.quiz.id },
    ...getRequestContext(req),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Quiz deleted successfully',
  });
});
