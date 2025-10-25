import { Metadata } from 'next';

import { generateMeta } from './meta/generateMeta';
import { generateSchemas } from './schema';
import { SEOConfig, PageData, Schema } from '@/types/seo';

interface GenerateSEOOptions extends Partial<SEOConfig> {}

interface SchemaOptions {
  pageData: PageData;
}

export function generateSEO(config: GenerateSEOOptions = {}): Metadata {
  return generateMeta(config);
}

export function buildSchemas({ pageData }: SchemaOptions): Schema[] {
  return generateSchemas(pageData);
}

export { generateMeta, generateSchemas };

export * from './meta/openGraph';
export * from './meta/twitter';
export * from './meta/defaults';

export * from './schema/educational/EducationalOrganization';
export * from './schema/educational/Course';
export * from './schema/educational/LearningResource';
export * from './schema/educational/Quiz';
export * from './schema/content/Article';
export * from './schema/content/BlogPosting';
export * from './schema/content/VideoObject';
export * from './schema/people/Person';
export * from './schema/navigation/BreadcrumbList';
export * from './schema/navigation/ItemList';
export * from './schema/structural/WebSite';
export * from './schema/structural/FAQPage';
export * from './schema/structural/HowTo';
export * from './schema/reviews/Review';
export * from './schema/reviews/AggregateRating';

export * from './utils/fallbackContent';
export * from './utils/validators';
export * from './utils/detectPageType';
export * from './utils/dataMappers';

export { SEOConfig, PageData, PageType, Schema } from '@/types/seo';
