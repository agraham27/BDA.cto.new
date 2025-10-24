import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorizeRoles } from '@/middleware/auth';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  assignInstructor,
} from '@/controllers/adminCourseController';
import {
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  upsertQuiz,
  updateQuiz,
  deleteQuiz,
} from '@/controllers/adminContentController';
import {
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} from '@/controllers/adminInstructorController';

const router = Router();

router.use(authenticate, authorizeRoles(UserRole.ADMIN));

// Courses
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.post('/courses', createCourse);
router.patch('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/courses/:id/publish', publishCourse);
router.post('/courses/:id/instructor', assignInstructor);

// Sections
router.post('/courses/:courseId/sections', createSection);
router.patch('/courses/:courseId/sections/:sectionId', updateSection);
router.delete('/courses/:courseId/sections/:sectionId', deleteSection);

// Lessons
router.post('/courses/:courseId/sections/:sectionId/lessons', createLesson);
router.patch('/courses/:courseId/sections/:sectionId/lessons/:lessonId', updateLesson);
router.delete('/courses/:courseId/sections/:sectionId/lessons/:lessonId', deleteLesson);

// Quizzes
router.post('/courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz', upsertQuiz);
router.patch('/courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz', updateQuiz);
router.delete('/courses/:courseId/sections/:sectionId/lessons/:lessonId/quiz', deleteQuiz);

// Instructors
router.get('/instructors', getInstructors);
router.get('/instructors/:id', getInstructor);
router.post('/instructors', createInstructor);
router.patch('/instructors/:id', updateInstructor);
router.delete('/instructors/:id', deleteInstructor);

export default router;
