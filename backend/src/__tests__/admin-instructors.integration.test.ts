import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import app from '@/app';
import { prisma, __testUtils } from '@/lib/prisma';
import { generateAccessToken } from '@/utils/token';

const { reset } = __testUtils as { reset: () => void };

describe('Admin Instructor Management API', () => {
  let adminToken: string;
  let instructorUserId: string;

  beforeEach(async () => {
    reset();

    (prisma as any).instructor = {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
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
      },
    });

    const instructorUser = await prisma.user.create({
      data: {
        email: 'instructor@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
        firstName: 'Instructor',
        lastName: 'User',
        role: 'INSTRUCTOR',
      },
    });

    instructorUserId = instructorUser.id;
    adminToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  });

  describe('GET /api/admin/instructors', () => {
    it('should paginate instructor list', async () => {
      (prisma.instructor = {
        findMany: async () => [],
        count: async () => 0,
      } as any);

      const response = await request(app)
        .get('/api/admin/instructors?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });
  });

  describe('POST /api/admin/instructors', () => {
    it('should create instructor profile for existing instructor user', async () => {
      const instructorData = {
        userId: instructorUserId,
        headline: 'Senior Developer',
        bio: 'Expert in Node.js',
        expertise: ['Node.js', 'Express'],
      };

      (prisma.instructor = {
        findMany: async () => [],
        count: async () => 0,
        findUnique: async () => null,
        create: async ({ data }: { data: typeof instructorData }) => ({
          id: 'instructor-id-123',
          ...data,
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
            role: 'INSTRUCTOR',
            isActive: true,
          },
        }),
      } as any);

      const response = await request(app)
        .post('/api/admin/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(instructorData)
        .expect(StatusCodes.CREATED);

      expect(response.body.success).toBe(true);
      expect(response.body.data.headline).toBe(instructorData.headline);
    });

    it('should reject creating instructor for non-instructor user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'student@example.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          role: 'STUDENT',
        },
      });

      const response = await request(app)
        .post('/api/admin/instructors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: user.id })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('INSTRUCTOR role');
    });
  });

  describe('PATCH /api/admin/instructors/:id', () => {
    it('should update instructor profile', async () => {
      const instructorId = 'instructor-id-123';
      const updateData = {
        headline: 'Updated Headline',
        expertise: ['Node.js', 'TypeScript'],
      };

      (prisma.instructor = {
        findMany: async () => [],
        count: async () => 0,
        findUnique: async ({ where }: { where: { id: string } }) =>
          where.id === instructorId
            ? {
                id: instructorId,
                userId: instructorUserId,
                headline: 'Old Headline',
                bio: 'Bio',
                expertise: ['Node.js'],
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
                  role: 'INSTRUCTOR',
                  isActive: true,
                },
              }
            : null,
        update: async () => ({
          id: instructorId,
          userId: instructorUserId,
          headline: updateData.headline,
          bio: 'Bio',
          expertise: updateData.expertise,
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
            role: 'INSTRUCTOR',
            isActive: true,
          },
        }),
      } as any);

      const response = await request(app)
        .patch(`/api/admin/instructors/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.data.headline).toBe(updateData.headline);
    });
  });

  describe('DELETE /api/admin/instructors/:id', () => {
    it('should delete instructor without courses', async () => {
      const instructorId = 'instructor-id-123';

      (prisma.instructor = {
        findMany: async () => [],
        count: async () => 0,
        findUnique: async ({ where }: { where: { id: string } }) =>
          where.id === instructorId
            ? {
                id: instructorId,
                userId: instructorUserId,
                courses: [],
              }
            : null,
        delete: async () => ({
          id: instructorId,
        }),
      } as any);

      const response = await request(app)
        .delete(`/api/admin/instructors/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.OK);

      expect(response.body.success).toBe(true);
    });

    it('should prevent deleting instructor with courses', async () => {
      const instructorId = 'instructor-id-123';

      (prisma.instructor = {
        findMany: async () => [],
        count: async () => 0,
        findUnique: async () => ({
          id: instructorId,
          userId: instructorUserId,
          courses: [{ id: 'course-1' }],
        }),
      } as any);

      const response = await request(app)
        .delete(`/api/admin/instructors/${instructorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assigned courses');
    });
  });
});
