import axios from 'axios';
import type {
  CourseSummary,
  CourseDetail,
  Instructor,
  BlogPost,
  Category,
  PaginatedResponse,
  SingleResponse,
} from '@/types/public';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const publicClient = axios.create({
  baseURL: `${API_BASE_URL}/api/public`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export interface FetchCoursesParams {
  page?: number;
  limit?: number;
  level?: string;
  instructorId?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchPublicCourses(
  params: FetchCoursesParams = {}
): Promise<PaginatedResponse<CourseSummary>> {
  const { data } = await publicClient.get('/courses', { params });
  return data;
}

export async function fetchPublicCourse(slug: string): Promise<SingleResponse<CourseDetail>> {
  const { data } = await publicClient.get(`/courses/${slug}`);
  return data;
}

export interface FetchInstructorsParams {
  page?: number;
  limit?: number;
}

export async function fetchPublicInstructors(
  params: FetchInstructorsParams = {}
): Promise<PaginatedResponse<Instructor>> {
  const { data } = await publicClient.get('/instructors', { params });
  return data;
}

export async function fetchPublicInstructor(id: string): Promise<SingleResponse<Instructor>> {
  const { data } = await publicClient.get(`/instructors/${id}`);
  return data;
}

export interface FetchBlogPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  featured?: boolean;
}

export async function fetchPublicBlogPosts(
  params: FetchBlogPostsParams = {}
): Promise<PaginatedResponse<BlogPost>> {
  const { data } = await publicClient.get('/blog', { params });
  return data;
}

export async function fetchPublicBlogPost(slug: string): Promise<SingleResponse<BlogPost>> {
  const { data } = await publicClient.get(`/blog/${slug}`);
  return data;
}

export async function fetchPublicCategories(): Promise<SingleResponse<Category[]>> {
  const { data } = await publicClient.get('/categories');
  return data;
}
