import { Schema, PageData } from '@/types/seo';
import { detectPageType } from '@/lib/seo/utils/detectPageType';
import { mergeSchemas, deduplicateSchemas } from '@/lib/seo/utils/validators';

import { generateEducationalOrganizationSchema } from './educational/EducationalOrganization';
import { generateCourseSchema } from './educational/Course';
import { generateLearningResourceSchema } from './educational/LearningResource';
import { generateQuizSchema } from './educational/Quiz';
import { generateArticleSchema } from './content/Article';
import { generateBlogPostingSchema } from './content/BlogPosting';
import { generateVideoObjectSchema } from './content/VideoObject';
import { generatePersonSchema } from './people/Person';
import { generateBreadcrumbSchema } from './navigation/BreadcrumbList';
import { generateItemListSchema } from './navigation/ItemList';
import { generateWebSiteSchema } from './structural/WebSite';
import { generateFAQPageSchema } from './structural/FAQPage';
import { generateHowToSchema } from './structural/HowTo';
import { generateReviewSchema } from './reviews/Review';
import { generateAggregateRatingSchema } from './reviews/AggregateRating';

export {
  generateEducationalOrganizationSchema,
  generateCourseSchema,
  generateLearningResourceSchema,
  generateQuizSchema,
  generateArticleSchema,
  generateBlogPostingSchema,
  generateVideoObjectSchema,
  generatePersonSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateWebSiteSchema,
  generateFAQPageSchema,
  generateHowToSchema,
  generateReviewSchema,
  generateAggregateRatingSchema,
};

export function generateSchemas(pageData: PageData): Schema[] {
  const schemas: Schema[] = [];

  schemas.push(generateEducationalOrganizationSchema());

  const breadcrumbItems = pageData.breadcrumbs;
  if (breadcrumbItems && breadcrumbItems.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbItems));
  }

  const pageType = pageData.type || detectPageType(pageData.path);

  if (pageType === 'course' && pageData.course) {
    schemas.push(generateCourseSchema(pageData.course));
    if (pageData.course.instructor) {
      schemas.push(generatePersonSchema(pageData.course.instructor));
    }
    if (pageData.course.reviews && pageData.course.reviews.length > 0) {
      schemas.push(
        generateAggregateRatingSchema({
          itemName: pageData.course.title,
          itemType: 'Course',
          reviews: pageData.course.reviews,
          rating: pageData.course.rating,
          ratingCount: pageData.course.ratingCount,
        })
      );
    }
  }

  if (pageData.courses && pageData.courses.length > 0) {
    schemas.push(generateItemListSchema({ items: pageData.courses, type: 'Course' }));
  }

  if (pageType === 'lesson' && pageData.lesson) {
    schemas.push(generateLearningResourceSchema(pageData.lesson));
    if (pageData.lesson.instructor) {
      schemas.push(generatePersonSchema(pageData.lesson.instructor));
    }
    if (pageData.lesson.videoUrl) {
      schemas.push(generateVideoObjectSchema(pageData.lesson));
    }
  }

  if (pageType === 'blog' && pageData.post) {
    schemas.push(generateArticleSchema(pageData.post));
    schemas.push(generateBlogPostingSchema(pageData.post));
    if (pageData.post.author) {
      schemas.push(generatePersonSchema(pageData.post.author));
    }
  }

  if (pageData.posts && pageData.posts.length > 0) {
    schemas.push(generateItemListSchema({ items: pageData.posts, type: 'BlogPosting' }));
  }

  if (pageType === 'instructor' && pageData.instructor) {
    schemas.push(generatePersonSchema(pageData.instructor));
    if (pageData.instructor.name) {
      schemas.push(
        generateAggregateRatingSchema({
          itemName: pageData.instructor.name,
          itemType: 'Person',
          reviews: pageData.course?.reviews,
        })
      );
    }
  }

  if (pageData.instructors && pageData.instructors.length > 0) {
    schemas.push(generateItemListSchema({ items: pageData.instructors, type: 'Person' }));
  }

  if (pageType === 'home') {
    schemas.push(generateWebSiteSchema());
  }

  if (pageData.faqs && pageData.faqs.length > 0) {
    schemas.push(generateFAQPageSchema(pageData.faqs));
  }

  if (pageData.howto) {
    schemas.push(
      generateHowToSchema({
        name: pageData.howto.name,
        description: pageData.howto.description,
        steps: pageData.howto.steps,
        totalTime: pageData.howto.totalTime,
      })
    );
  }

  return deduplicateSchemas(schemas);
}
