import { Metadata } from 'next';

export type PageType =
  | 'website'
  | 'course'
  | 'lesson'
  | 'blog'
  | 'instructor'
  | 'about'
  | 'home'
  | 'faq'
  | 'howto';

export interface SEOImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface SEOConfig {
  type?: PageType;
  title: string;
  description: string;
  keywords?: string[];
  image?: string | SEOImage;
  url?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  schemas?: Schema[];
  locale?: string;
}

export interface Schema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export interface CourseData {
  title: string;
  description: string;
  slug: string;
  thumbnail?: string;
  instructor?: InstructorData;
  duration?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  price?: number;
  currency?: string;
  updatedAt?: string;
  reviews?: ReviewData[];
  rating?: number;
  ratingCount?: number;
  topics?: string[];
  prerequisites?: string;
}

export interface LessonData {
  title: string;
  description: string;
  slug: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  courseName?: string;
  courseSlug?: string;
  instructor?: InstructorData;
  uploadDate?: string;
  viewCount?: number;
}

export interface InstructorData {
  name: string;
  slug: string;
  bio?: string;
  photo?: string;
  jobTitle?: string;
  expertise?: string[];
  education?: string;
  awards?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface BlogPostData {
  title: string;
  description: string;
  slug: string;
  content: string;
  featuredImage?: string;
  author?: InstructorData;
  publishedAt: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
  readingTime?: number;
  commentCount?: number;
  shareCount?: number;
}

export interface ReviewData {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface OrganizationData {
  name: string;
  legalName?: string;
  description: string;
  url: string;
  logo: string;
  email?: string;
  phone?: string;
  foundingDate?: string;
  founders?: string[];
  employeeCount?: number;
  slogan?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface PageData {
  type: PageType;
  path: string;
  locale?: string;
  course?: CourseData;
  courses?: CourseData[];
  lesson?: LessonData;
  post?: BlogPostData;
  posts?: BlogPostData[];
  instructor?: InstructorData;
  instructors?: InstructorData[];
  faqs?: FAQItem[];
  howto?: {
    name: string;
    description: string;
    steps: HowToStep[];
    totalTime?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
}
