import { Schema, ReviewData } from '@/types/seo';

export function generateReviewSchema(review: ReviewData, courseName: string): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Course',
      name: courseName,
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.comment,
    datePublished: review.date,
  };
}
