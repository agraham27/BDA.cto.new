export interface UserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    courseCategories?: number;
    blogPostCategories?: number;
  };
}

export interface CourseCategory {
  courseId: string;
  categoryId: string;
  category: Category;
}

export interface BlogPostCategory {
  blogPostId: string;
  categoryId: string;
  category: Category;
}

export interface LessonSummary {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  duration: number | null;
  type: 'ARTICLE' | 'VIDEO' | 'QUIZ';
  position: number;
}

export interface SectionSummary {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons?: LessonSummary[];
}

export interface InstructorSummary {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  expertise: string[];
  website: string | null;
  socialLinks?: Record<string, string> | null;
  user: UserSummary;
  _count?: {
    courses?: number;
    blogPosts?: number;
  };
}

export interface Instructor extends InstructorSummary {
  courses?: CourseSummary[];
  blogPosts?: BlogPostSummary[];
}

export interface CourseSummary {
  id: string;
  instructorId: string;
  title: string;
  slug: string;
  description: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  language?: string;
  thumbnailUrl: string | null;
  trailerUrl?: string | null;
  publishedAt: string | null;
  estimatedDuration: number | null;
  categories?: CourseCategory[];
  instructor?: InstructorSummary;
  _count?: {
    sections?: number;
    enrollments?: number;
  };
}

export interface CourseDetail extends CourseSummary {
  instructor: InstructorSummary;
  sections: SectionSummary[];
  categories: CourseCategory[];
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  tags: string[];
}

export interface BlogPost extends BlogPostSummary {
  content?: string;
  featured: boolean;
  author: UserSummary;
  instructor: InstructorSummary | null;
  categories: BlogPostCategory[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
