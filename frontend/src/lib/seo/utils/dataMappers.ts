import type { CourseDetail, InstructorSummary, BlogPost } from '@/types/public';
import { CourseData, InstructorData, BlogPostData } from '@/types/seo';

export function mapCourseToSEO(course: CourseDetail): CourseData {
  return {
    title: course.title,
    description: course.description || '',
    slug: course.slug,
    thumbnail: course.thumbnailUrl || undefined,
    instructor: course.instructor ? mapInstructorToSEO(course.instructor) : undefined,
    duration: course.estimatedDuration || undefined,
    level: course.level === 'BEGINNER' ? 'Beginner' : course.level === 'ADVANCED' ? 'Advanced' : 'Intermediate',
    updatedAt: course.publishedAt || undefined,
    topics: course.categories?.map((c) => c.category.name) || [],
  };
}

export function mapInstructorToSEO(instructor: InstructorSummary): InstructorData {
  const fullName = `${instructor.user.firstName || ''} ${instructor.user.lastName || ''}`.trim();

  return {
    name: fullName || 'Instructor',
    slug: instructor.id,
    bio: instructor.bio || undefined,
    photo: instructor.user.avatarUrl || undefined,
    jobTitle: instructor.headline || undefined,
    expertise: instructor.expertise || [],
    socialLinks:
      instructor.socialLinks && typeof instructor.socialLinks === 'object'
        ? {
            linkedin: instructor.socialLinks.linkedin,
            twitter: instructor.socialLinks.twitter,
            facebook: instructor.socialLinks.facebook,
          }
        : undefined,
  };
}

export function mapBlogPostToSEO(post: BlogPost): BlogPostData {
  return {
    title: post.title,
    description: post.excerpt || '',
    slug: post.slug,
    content: post.content || '',
    author: post.instructor ? mapInstructorToSEO(post.instructor) : undefined,
    publishedAt: post.publishedAt || new Date().toISOString(),
    category: post.categories?.[0]?.category?.name || undefined,
    tags: post.tags || [],
  };
}
