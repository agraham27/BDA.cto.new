import { Schema, CourseData } from '@/types/seo';
import { ORGANIZATION_INFO } from '@/lib/seo/utils/fallbackContent';
import { ensureArray, filterEmpty, toISO8601Duration } from '@/lib/seo/utils/validators';

export function generateCourseSchema(course: CourseData): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_INFO.name,
      url: ORGANIZATION_INFO.url,
    },
    ...(course.instructor && {
      instructor: {
        '@type': 'Person',
        name: course.instructor.name,
        ...(course.instructor.jobTitle && { jobTitle: course.instructor.jobTitle }),
        ...(course.instructor.photo && { image: course.instructor.photo }),
      },
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: toISO8601Duration(course.duration) || 'PT10H',
    },
    educationalLevel: course.level || 'Intermediate',
    about: ensureArray(course.topics).join(', ') || 'Investment, Stock Market, Forex, Gold',
    teaches: 'Financial investment strategies',
    inLanguage: 'vi',
    availableLanguage: ['Vietnamese'],
    timeRequired: toISO8601Duration(course.duration) || 'PT20H',
    numberOfCredits: 0,
    coursePrerequisites: course.prerequisites || 'None',
    educationalCredentialAwarded: 'Certificate of Completion',
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      priceCurrency: course.currency || 'VND',
      price: course.price ? course.price.toString() : 'Contact for pricing',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (course.rating || 4.8).toString(),
      ratingCount: (course.ratingCount || 150).toString(),
      bestRating: '5',
      worstRating: '1',
    },
    review: course.reviews?.map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.author },
      datePublished: review.date,
      reviewRating: { '@type': 'Rating', ratingValue: review.rating.toString() },
      reviewBody: review.comment,
    })),
  };
}
