import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import app from '@/app';
import { generateAccessToken } from '@/utils/token';
import { prisma, __testUtils } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const { reset, db } = __testUtils as {
  reset: () => void;
  db: {
    users: Map<string, unknown>;
  };
};

describe('Admin Course Management API', () => {
  let adminToken: string;
  let adminUserId: string;
  let instructorUserId: string;
  let instructorId: string;

  beforeEach(async () => {
    reset();

    (prisma as any).course = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    };

    (prisma as any).instructor = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    };

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    adminUserId = adminUser.id;
    adminToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    const instructorUser = await prisma.user.create({
      data: {
        email: 'instructor@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Instructor',
        lastName: 'User',
        role: 'INSTRUCTOR',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    instructorUserId = instructorUser.id;
  });

  describe('GET /api/admin/courses', () => {
    it('should return empty list when no courses exist', async () => {
      const response = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination).toMatchObject({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should require authentication', async () => {
      await request(app).get('/api/admin/courses').expect(StatusCodes.UNAUTHORIZED);
    });

    it('should require admin role', async () => {
      const studentUser = await prisma.user.create({
        data: {
          email: 'student@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          role: 'STUDENT',
        },
      });
      const studentToken = generateAccessToken({
        id: studentUser.id,
        email: studentUser.email,
        role: studentUser.role,
      });

      await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(StatusCodes.FORBIDDEN);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/courses?page=2&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 5,
      });
    });
  });

  describe('POST /api/admin/courses', () => {
    beforeEach(async () => {
      const instructor = {
        id: 'instructor-id-123',
        userId: instructorUserId,
        headline: 'Senior Developer',
        bio: 'Experienced instructor',
        expertise: ['JavaScript', 'Node.js'],
        website: null,
        socialLinks: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.instructor.findUnique as any) = async ({ where }: { where: { id: string } }) => {
        if (where.id === instructor.id) {
          return instructor;
        }
        return null;
      };

      instructorId = instructor.id;
    });

    it('should create a new course', async () => {
      const courseData = {
        title: 'Introduction to Node.js',
        slug: 'intro-to-nodejs',
        description: 'Learn Node.js from scratch',
        instructorId,
        status: 'DRAFT',
        level: 'BEGINNER',
        estimatedDuration: 120,
      };

      const mockCourse = {
        id: 'course-id-123',
        ...courseData,
        language: 'en',
        thumbnailUrl: null,
        trailerUrl: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        instructor: {
          id: instructorId,
          userId: instructorUserId,
          headline: 'Senior Developer',
          bio: 'Experienced instructor',
          expertise: ['JavaScript', 'Node.js'],
          website: null,
          socialLinks: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: instructorUserId,
            email: 'instructor@example.com',
            firstName: 'Instructor',
            lastName: 'User',
            avatarUrl: null,
          },
        },
      };

      (prisma.course.findUnique as any) = async () => null;
      (prisma.course.create as any) = async () => mockCourse;

      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(courseData.title);
      expect(response.body.data.slug).toBe(courseData.slug);
    });

    it('should reject invalid course data', async () => {
      const invalidData = {
        title: '',
        slug: 'invalid slug with spaces',
        instructorId: 'not-a-cuid',
      };

      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should reject duplicate slug', async () => {
      const courseData = {
        title: 'Test Course',
        slug: 'test-course',
        instructorId,
      };

      (prisma.course.findUnique as any) = async ({ where }: { where: { slug?: string } }) => {
        if (where.slug === 'test-course') {
          return { id: 'existing-course', slug: 'test-course' };
        }
        return null;
      };

      const response = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
        .expect(StatusCodes.CONFLICT);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('slug');
    });
  });

  describe('PATCH /api/admin/courses/:id', () => {
    it('should update a course', async () => {
      const courseId = 'course-id-123';
      const updateData = {
        title: 'Updated Course Title',
        estimatedDuration: 180,
      };

      const existingCourse = {
        id: courseId,
        title: 'Original Title',
        slug: 'original-slug',
        description: null,
        instructorId: instructorId,
        status: 'DRAFT',
        level: 'BEGINNER',
        language: 'en',
        thumbnailUrl: null,
        trailerUrl: null,
        publishedAt: null,
        estimatedDuration: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCourse = {
        ...existingCourse,
        ...updateData,
        instructor: {
          id: instructorId,
          userId: instructorUserId,
          headline: 'Senior Developer',
          bio: 'Experienced instructor',
          expertise: ['JavaScript'],
          website: null,
          socialLinks: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: instructorUserId,
            email: 'instructor@example.com',
            firstName: 'Instructor',
            lastName: 'User',
            avatarUrl: null,
          },
        },
      };

      (prisma.course.findUnique as any) = async () => existingCourse;
      (prisma.course.update as any) = async () => updatedCourse;

      const response = await request(app)
        .patch(`/api/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
    });

    it('should return 404 for non-existent course', async () => {
      (prisma.course.findUnique as any) = async () => null;

      await request(app)
        .patch('/api/admin/courses/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' })
        .expect(StatusCodes.NOT_FOUND);
    });
  });

  describe('DELETE /api/admin/courses/:id', () => {
    it('should delete a course without enrollments', async () => {
      const courseId = 'course-id-123';

      const course = {
        id: courseId,
        title: 'Test Course',
        slug: 'test-course',
        enrollments: [],
      };

      (prisma.course.findUnique as any) = async () => course;
      (prisma.course.delete as any) = async () => course;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
    });

    it('should not delete course with enrollments', async () => {
      const courseId = 'course-id-123';

      const course = {
        id: courseId,
        title: 'Test Course',
        slug: 'test-course',
        enrollments: [{ id: 'enrollment-1' }],
      };

      (prisma.course.findUnique as any) = async () => course;

      const response = await request(app)
        .delete(`/api/admin/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('enrollments');
    });
  });

  describe('POST /api/admin/courses/:id/publish', () => {
    it('should publish a valid course', async () => {
      const courseId = 'course-id-123';

      const course = {
        id: courseId,
        title: 'Test Course',
        description: 'Test Description',
        slug: 'test-course',
        status: 'DRAFT',
        sections: [
          {
            id: 'section-1',
            lessons: [{ id: 'lesson-1' }],
          },
        ],
      };

      const publishedCourse = {
        ...course,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        instructor: {
          id: instructorId,
          userId: instructorUserId,
          headline: 'Senior Developer',
          bio: 'Experienced',
          expertise: ['JavaScript'],
          website: null,
          socialLinks: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: instructorUserId,
            email: 'instructor@example.com',
            firstName: 'Instructor',
            lastName: 'User',
            avatarUrl: null,
          },
        },
      };

      (prisma.course.findUnique as any) = async () => course;
      (prisma.course.update as any) = async () => publishedCourse;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: true })
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('published');
    });

    it('should reject publishing course without sections', async () => {
      const courseId = 'course-id-123';

      const course = {
        id: courseId,
        title: 'Test Course',
        description: 'Test Description',
        slug: 'test-course',
        status: 'DRAFT',
        sections: [],
      };

      (prisma.course.findUnique as any) = async () => course;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: true })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('section');
    });
  });

  describe('POST /api/admin/courses/:id/instructor', () => {
    it('should assign an instructor to a course', async () => {
      const courseId = 'course-id-123';

      const course = {
        id: courseId,
        title: 'Test Course',
        slug: 'test-course',
        instructorId: 'old-instructor-id',
      };

      const instructor = {
        id: instructorId,
        userId: instructorUserId,
      };

      const updatedCourse = {
        ...course,
        instructorId: instructorId,
        instructor: {
          ...instructor,
          headline: 'Senior Developer',
          bio: 'Experienced',
          expertise: ['JavaScript'],
          website: null,
          socialLinks: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: instructorUserId,
            email: 'instructor@example.com',
            firstName: 'Instructor',
            lastName: 'User',
            avatarUrl: null,
          },
        },
      };

      (prisma.course.findUnique as any) = async () => course;
      (prisma.instructor.findUnique as any) = async () => instructor;
      (prisma.course.update as any) = async () => updatedCourse;

      const response = await request(app)
        .post(`/api/admin/courses/${courseId}/instructor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ instructorId })
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('assigned');
    });
  });
});
