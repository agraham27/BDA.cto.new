import { Schema, ReviewData } from '@/types/seo';

interface AggregateRatingOptions {
  itemName: string;
  itemType: 'Course' | 'Person' | 'Article';
  reviews?: ReviewData[];
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;
}

export function generateAggregateRatingSchema({
  itemName,
  itemType,
  reviews,
  rating,
  ratingCount,
  reviewCount,
}: AggregateRatingOptions): Schema {
  const avgRating = rating || (reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 4.8);

  const count = ratingCount || reviews?.length || 0;
  const revCount = reviewCount || reviews?.length || 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': itemType,
      name: itemName,
    },
    ratingValue: avgRating.toFixed(1),
    ratingCount: count.toString(),
    reviewCount: revCount.toString(),
    bestRating: '5',
    worstRating: '1',
  };
}
