# SEO & Schema.org System

Comprehensive SEO system with full Schema.org implementation for Big Dipper Academy.

## Features

- ✅ Universal meta tags (title, description, keywords, author, robots, canonical)
- ✅ Open Graph tags (Facebook/LinkedIn)
- ✅ Twitter Card tags
- ✅ Mobile optimization meta tags
- ✅ Complete Schema.org implementations (16+ types)
- ✅ Automatic page type detection
- ✅ Fallback content system
- ✅ Dynamic sitemap generation
- ✅ Type-safe with TypeScript

## Quick Start

### 1. Basic Page Metadata

```typescript
import { generateSEO } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    type: 'website',
    title: 'Page Title',
    description: 'Page description',
    url: '/page-path',
    locale: 'vi',
  });
}
```

### 2. Schema.org JSON-LD

```typescript
import { buildSchemas } from '@/lib/seo';
import { SchemaMarkup } from '@/components/SEO/SchemaMarkup';

export default function Page() {
  const schemas = buildSchemas({
    pageData: {
      type: 'course',
      path: '/courses/example',
      locale: 'vi',
      course: courseData,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Courses', url: '/courses' },
      ],
    },
  });

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {/* Your page content */}
    </>
  );
}
```

### 3. Course Page Example

```typescript
import { fetchPublicCourse } from '@/lib/api/public';
import { generateSEO, buildSchemas } from '@/lib/seo';
import { mapCourseToSEO } from '@/lib/seo/utils/dataMappers';
import { SchemaMarkup } from '@/components/SEO/SchemaMarkup';

export async function generateMetadata({ params: { slug } }) {
  const { data: course } = await fetchPublicCourse(slug);

  return generateSEO({
    type: 'course',
    title: course.title,
    description: course.description,
    image: course.thumbnailUrl,
    url: `/courses/${slug}`,
  });
}

export default async function CoursePage({ params: { slug } }) {
  const { data: course } = await fetchPublicCourse(slug);
  const courseData = mapCourseToSEO(course);

  const schemas = buildSchemas({
    pageData: {
      type: 'course',
      path: `/courses/${slug}`,
      course: courseData,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Courses', url: '/courses' },
        { name: course.title, url: `/courses/${slug}` },
      ],
    },
  });

  return (
    <>
      <SchemaMarkup schemas={schemas} />
      {/* Page content */}
    </>
  );
}
```

## Schema Types Supported

### Educational
- **Course** - Individual course pages with instructor, ratings, reviews
- **LearningResource** - Individual lessons
- **Quiz** - Course quizzes and assessments
- **EducationalOrganization** - Site-wide organization info

### Content
- **Article** - Blog posts with author, publish date, categories
- **BlogPosting** - Alternative for blog posts
- **VideoObject** - Video lessons with duration, thumbnails

### People & Organization
- **Person** - Instructor profiles with expertise, bio, social links

### Navigation
- **BreadcrumbList** - Breadcrumb navigation
- **ItemList** - Course catalogs, blog listings

### Structural
- **WebSite** - Homepage with search action
- **FAQPage** - FAQ sections
- **HowTo** - Tutorial/guide pages

### Reviews
- **Review** - Individual reviews
- **AggregateRating** - Overall ratings

## API Reference

### generateSEO(config)

Generates Next.js Metadata object.

```typescript
interface SEOConfig {
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
  locale?: string;
}
```

### buildSchemas(options)

Generates Schema.org JSON-LD scripts.

```typescript
interface SchemaOptions {
  pageData: {
    type: PageType;
    path: string;
    locale?: string;
    course?: CourseData;
    lesson?: LessonData;
    post?: BlogPostData;
    instructor?: InstructorData;
    breadcrumbs?: BreadcrumbItem[];
    faqs?: FAQItem[];
    howto?: HowToData;
  };
}
```

## Data Mappers

Convert API data to SEO data format:

```typescript
import { mapCourseToSEO, mapInstructorToSEO, mapBlogPostToSEO } from '@/lib/seo/utils/dataMappers';

const courseData = mapCourseToSEO(apiCourse);
const instructorData = mapInstructorToSEO(apiInstructor);
const blogData = mapBlogPostToSEO(apiBlogPost);
```

## Fallback Content

Default content from Big Dipper Academy philosophy:
- Focus on investment education (stocks, forex, gold, bitcoin)
- Emphasis on risk management and capital preservation
- Professional financial training

Located in: `lib/seo/utils/fallbackContent.ts`

## Sitemap

Dynamic sitemap automatically includes:
- Static pages (home, courses, blog, instructors, about)
- Dynamic routes (courses, blog posts, instructor profiles)

Located in: `app/sitemap.ts`

## Robots.txt

Located in: `public/robots.txt`

Disallows: `/admin`, `/api`, `/student/dashboard`

## Testing

Validate your SEO implementation:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Lighthouse SEO Audit](https://developers.google.com/web/tools/lighthouse)

## Environment Variables

Required:
- `NEXT_PUBLIC_SITE_URL` - Your site URL (e.g., https://hocvienbigdipper.com)

Optional:
- Facebook App ID in `fallbackContent.ts`

## Best Practices

1. Always provide specific metadata when available
2. Use meaningful breadcrumbs on all pages
3. Include high-quality images (1200x630px for OG)
4. Keep descriptions under 160 characters
5. Use proper canonical URLs
6. Test all schema implementations
7. Update fallback content as needed
8. Monitor search console for errors

## File Structure

```
lib/seo/
├── meta/                      # Meta tag generators
│   ├── generateMeta.ts
│   ├── openGraph.ts
│   ├── twitter.ts
│   └── defaults.ts
├── schema/                    # Schema.org generators
│   ├── educational/
│   ├── content/
│   ├── people/
│   ├── navigation/
│   ├── structural/
│   ├── reviews/
│   └── index.ts
├── utils/                     # Utilities
│   ├── fallbackContent.ts
│   ├── validators.ts
│   ├── detectPageType.ts
│   └── dataMappers.ts
├── index.ts                   # Main exports
└── README.md                  # This file
```
