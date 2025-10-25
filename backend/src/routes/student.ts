import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorizeRoles } from '@/middleware/auth';
import {
  getEnrolledCourses,
  getCourseWithProgress,
  getLesson,
  markLessonComplete,
  getProfile,
  updateProfile,
  getStats,
  submitQuiz,
} from '@/controllers/studentController';

const router = Router();

router.use(authenticate, authorizeRoles(UserRole.STUDENT));

router.get('/courses', getEnrolledCourses);
router.get('/courses/:id', getCourseWithProgress);
router.get('/courses/:courseId/lessons/:lessonId', getLesson);
router.post('/progress', markLessonComplete);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getStats);
router.post('/quizzes/:id/submit', submitQuiz);

export default router;
