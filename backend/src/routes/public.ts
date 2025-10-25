import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourse,
  getPublicInstructors,
  getPublicInstructor,
  getPublicBlogPosts,
  getPublicBlogPost,
  getPublicCategories,
} from '@/controllers/publicController';

const router = Router();

// Public course routes
router.get('/courses', getPublicCourses);
router.get('/courses/:slug', getPublicCourse);

// Public instructor routes
router.get('/instructors', getPublicInstructors);
router.get('/instructors/:id', getPublicInstructor);

// Public blog routes
router.get('/blog', getPublicBlogPosts);
router.get('/blog/:slug', getPublicBlogPost);

// Public category routes
router.get('/categories', getPublicCategories);

export default router;
