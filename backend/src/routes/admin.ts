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
  updateInstructorAvatar,
  assignInstructorToBlogPost,
} from '@/controllers/adminInstructorController';
import {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
} from '@/controllers/adminEnrollmentController';
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPost,
} from '@/controllers/adminBlogController';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/controllers/adminCategoryController';
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  mergeTags,
} from '@/controllers/adminTagController';
import {
  getSeoSettings,
  updateSeoSettings,
  validateSchema,
  calculatePostSeoScore,
  previewSeo,
} from '@/controllers/adminSeoController';

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

// Enrollments
router.get('/enrollments', getEnrollments);
router.get('/enrollments/stats', getEnrollmentStats);
router.get('/enrollments/:id', getEnrollment);
router.post('/enrollments', createEnrollment);
router.patch('/enrollments/:id', updateEnrollment);
router.delete('/enrollments/:id', deleteEnrollment);

// Instructors
router.get('/instructors', getInstructors);
router.get('/instructors/:id', getInstructor);
router.post('/instructors', createInstructor);
router.patch('/instructors/:id', updateInstructor);
router.patch('/instructors/:id/avatar', updateInstructorAvatar);
router.post('/instructors/:id/blog-posts', assignInstructorToBlogPost);
router.delete('/instructors/:id', deleteInstructor);

// Blog posts
router.get('/blog-posts', getBlogPosts);
router.get('/blog-posts/:id', getBlogPost);
router.post('/blog-posts', createBlogPost);
router.patch('/blog-posts/:id', updateBlogPost);
router.delete('/blog-posts/:id', deleteBlogPost);
router.post('/blog-posts/:id/publish', publishBlogPost);
router.get('/blog-posts/:id/seo-score', calculatePostSeoScore);

// Blog categories
router.get('/blog/categories', getCategories);
router.get('/blog/categories/:id', getCategory);
router.post('/blog/categories', createCategory);
router.put('/blog/categories/:id', updateCategory);
router.delete('/blog/categories/:id', deleteCategory);

// Blog tags
router.get('/blog/tags', getTags);
router.get('/blog/tags/:id', getTag);
router.post('/blog/tags', createTag);
router.put('/blog/tags/:id', updateTag);
router.delete('/blog/tags/:id', deleteTag);
router.post('/blog/tags/merge', mergeTags);

// SEO Settings & Tools
router.get('/seo/settings', getSeoSettings);
router.put('/seo/settings', updateSeoSettings);
router.post('/seo/validate-schema', validateSchema);
router.get('/seo/preview/:type/:id', previewSeo);

export default router;
