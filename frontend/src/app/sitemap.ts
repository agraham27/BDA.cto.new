import { MetadataRoute } from 'next';
import { fetchPublicCourses, fetchPublicBlogPosts, fetchPublicInstructors } from '@/lib/api/public';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hocvienbigdipper.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/instructors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [coursesResponse, blogResponse, instructorsResponse] = await Promise.allSettled([
      fetchPublicCourses({ limit: 100 }),
      fetchPublicBlogPosts({ limit: 100 }),
      fetchPublicInstructors({ limit: 100 }),
    ]);

    const dynamicPages: MetadataRoute.Sitemap = [];

    if (coursesResponse.status === 'fulfilled') {
      const courses = coursesResponse.value.data;
      dynamicPages.push(
        ...courses.map((course) => ({
          url: `${SITE_URL}/courses/${course.slug}`,
          lastModified: course.publishedAt ? new Date(course.publishedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      );
    }

    if (blogResponse.status === 'fulfilled') {
      const posts = blogResponse.value.data;
      dynamicPages.push(
        ...posts.map((post) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
      );
    }

    if (instructorsResponse.status === 'fulfilled') {
      const instructors = instructorsResponse.value.data;
      dynamicPages.push(
        ...instructors.map((instructor) => ({
          url: `${SITE_URL}/instructors/${instructor.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      );
    }

    return [...staticPages, ...dynamicPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
