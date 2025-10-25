import { Schema, CourseData, BlogPostData, InstructorData } from '@/types/seo';

interface ItemListOptions {
  items: Array<CourseData | BlogPostData | InstructorData>;
  type: 'Course' | 'BlogPosting' | 'Person';
}

export function generateItemListSchema({ items, type }: ItemListOptions): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': type,
        url:
          type === 'Course'
            ? `/courses/${(item as CourseData).slug}`
            : type === 'BlogPosting'
              ? `/blog/${(item as BlogPostData).slug}`
              : `/instructors/${(item as InstructorData).slug}`,
        name:
          type === 'Person'
            ? (item as InstructorData).name
            : (item as CourseData | BlogPostData).title,
      },
    })),
    numberOfItems: items.length,
  };
}
