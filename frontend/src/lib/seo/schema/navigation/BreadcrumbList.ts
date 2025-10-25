import { Schema, BreadcrumbItem } from '@/types/seo';
import { buildCanonicalUrl } from '@/lib/seo/utils/detectPageType';

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.url),
    })),
  };
}

export function buildBreadcrumbs(segments: string[]): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', url: '/' }];

  const pathMap: Record<string, string> = {
    courses: 'Courses',
    blog: 'Blog',
    instructors: 'Instructors',
    about: 'About',
    lessons: 'Lessons',
  };

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    if (pathMap[segment]) {
      breadcrumbs.push({ name: pathMap[segment], url: currentPath });
    }
  }

  return breadcrumbs;
}
