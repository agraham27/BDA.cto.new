import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorizeRoles } from '@/middleware/auth';
import {
  getCourseDetail,
  getLessonDetail,
  getMyCourses,
  updateLessonProgress,
} from '@/controllers/studentCourseController';

const router = Router();

router.use(authenticate, authorizeRoles(UserRole.STUDENT));

router.get('/courses', getMyCourses);
router.get('/courses/:courseId', getCourseDetail);
router.get('/courses/:courseId/lessons/:lessonId', getLessonDetail);
router.post('/courses/:courseId/lessons/:lessonId/progress', updateLessonProgress);

export default router;
