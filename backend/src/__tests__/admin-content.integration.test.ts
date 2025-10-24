import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import app from '@/app';
import { generateAccessToken } from '@/utils/token';
import { prisma, __testUtils } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const { reset } = __testUtils as { reset: () => void };

describe('Admin Content Management API', () => {
  let adminToken: string;
  const courseId = 'course-id-123';
  const sectionId = 'section-id-123';
  const lessonId = 'lesson-id-123';

  beforeEach(async () => {
    reset();

    (prisma as any).course = {
      findUnique: vi.fn().mockResolvedValue(null),
    };

    (prisma as any).section = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    (prisma as any).lesson = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    (prisma as any).quiz = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  });

  describe('POST /api/admin/courses/:courseId/sections', () => {
    it('should create a section', async () => {
      const sectionData = {
        title: 'Introduction',
        description: 'Getting started with the course',
        position: 0,
        status: 'DRAFT',
      };

      const course = {
        id: courseId,
        title: 'Test Course',
      };

      const mockSection = {
        id: sectionId,
        courseId,
        ...sectionData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: [],
      };

      (prisma.course.findUnique as any) = async () => course;
      (prisma.section.findUnique as any) = async () => null;
      (prisma.section.create as any) = async () => mockSection;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sectionData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(sectionData.title);
      expect(response.body.data.position).toBe(sectionData.position);
    });

    it('should reject duplicate position', async () => {
      const sectionData = {
        title: 'Section',
        position: 0,
      };

      const course = { id: courseId };
      const existingSection = { id: 'existing-section', position: 0 };

      (prisma.course.findUnique as any) = async () => course;
      (prisma.section.findUnique as any) = async () => existingSection;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sectionData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('position');
    });

    it('should return 404 for non-existent course', async () => {
      (prisma.course.findUnique as any) = async () => null;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Section', position: 0 })
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/courses/:courseId/sections/:sectionId', () => {
    it('should update a section', async () => {
      const updateData = {
        title: 'Updated Section Title',
        description: 'Updated description',
      };

      const section = {
        id: sectionId,
        courseId,
        title: 'Original Title',
        description: 'Original description',
        position: 0,
        status: 'DRAFT',
      };

      const updatedSection = {
        ...section,
        ...updateData,
        updatedAt: new Date(),
        lessons: [],
      };

      (prisma.section.findUnique as any) = async () => section;
      (prisma.section.update as any) = async () => updatedSection;

      const response = await request(app)
        .patch(`/api/admin/courses/${courseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('DELETE /api/admin/courses/:courseId/sections/:sectionId', () => {
    it('should delete a section without lessons', async () => {
      const section = {
        id: sectionId,
        courseId,
        lessons: [],
      };

      (prisma.section.findUnique as any) = async () => section;
      (prisma.section.delete as any) = async () => section;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
    });

    it('should not delete section with lessons', async () => {
      const section = {
        id: sectionId,
        courseId,
        lessons: [{ id: 'lesson-1' }],
      };

      (prisma.section.findUnique as any) = async () => section;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('lessons');
    });
  });

  describe('POST /api/admin/courses/:courseId/sections/:sectionId/lessons', () => {
    it('should create a lesson', async () => {
      const lessonData = {
        title: 'First Lesson',
        slug: 'first-lesson',
        summary: 'Introduction to the topic',
        content: 'Lesson content here',
        type: 'ARTICLE',
        position: 0,
        status: 'DRAFT',
      };

      const section = {
        id: sectionId,
        courseId,
      };

      const mockLesson = {
        id: lessonId,
        sectionId,
        ...lessonData,
        videoUrl: null,
        resourceUrl: null,
        duration: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        quiz: null,
      };

      (prisma.section.findUnique as any) = async () => section;
      (prisma.lesson.findUnique as any) = async () => null;
      (prisma.lesson.create as any) = async () => mockLesson;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(lessonData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(lessonData.title);
      expect(response.body.data.slug).toBe(lessonData.slug);
    });

    it('should validate lesson type', async () => {
      const lessonData = {
        title: 'Test Lesson',
        type: 'INVALID_TYPE',
        position: 0,
      };

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(lessonData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate slug', async () => {
      const lessonData = {
        title: 'Test Lesson',
        slug: 'existing-lesson',
        position: 0,
      };

      const section = { id: sectionId, courseId };
      const existingLesson = { id: 'lesson-1', slug: 'existing-lesson' };

      (prisma.section.findUnique as any) = async () => section;
      (prisma.lesson.findUnique as any) = async ({ where }: { where: { slug?: string } }) => {
        if (where.slug === 'existing-lesson') {
          return existingLesson;
        }
        return null;
      };

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(lessonData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('slug');
    });
  });

  describe('POST /api/admin/courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz', () => {
    it('should create a quiz for a lesson', async () => {
      const quizData = {
        title: 'Quiz 1',
        description: 'Test your knowledge',
        passingScore: 70,
        timeLimit: 600,
        questions: [
          {
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            explanation: 'Basic arithmetic',
          },
        ],
      };

      const lesson = {
        id: lessonId,
        sectionId,
        quiz: null,
        section: { id: sectionId, courseId },
      };

      const mockQuiz = {
        id: 'quiz-id-123',
        lessonId,
        ...quizData,
        questions: quizData.questions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.lesson.findUnique as any) = async () => lesson;
      (prisma.quiz.create as any) = async () => mockQuiz;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(quizData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(quizData.title);
      expect(response.body.data.questions).toHaveLength(1);
    });

    it('should validate quiz questions', async () => {
      const invalidQuizData = {
        title: 'Quiz 1',
        questions: [],
      };

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidQuizData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
    });

    it('should update existing quiz', async () => {
      const quizData = {
        title: 'Updated Quiz',
        questions: [
          {
            question: 'Updated question?',
            options: ['A', 'B'],
            correctAnswer: 0,
          },
        ],
      };

      const lesson = {
        id: lessonId,
        sectionId,
        quiz: { id: 'existing-quiz-id', lessonId },
        section: { id: sectionId, courseId },
      };

      const updatedQuiz = {
        id: 'existing-quiz-id',
        lessonId,
        ...quizData,
        description: null,
        passingScore: 70,
        timeLimit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.lesson.findUnique as any) = async () => lesson;
      (prisma.quiz.update as any) = async () => updatedQuiz;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(quizData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
    });
  });

  describe('DELETE /api/admin/courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz', () => {
    it('should delete a quiz', async () => {
      const lesson = {
        id: lessonId,
        sectionId,
        quiz: { id: 'quiz-id-123', lessonId },
        section: { id: sectionId, courseId },
      };

      (prisma.lesson.findUnique as any) = async () => lesson;
      (prisma.quiz.delete as any) = async () => lesson.quiz;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent quiz', async () => {
      const lesson = {
        id: lessonId,
        sectionId,
        quiz: null,
        section: { id: sectionId, courseId },
      };

      (prisma.lesson.findUnique as any) = async () => lesson;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body.success).toBe(false);
    });
  });
});
