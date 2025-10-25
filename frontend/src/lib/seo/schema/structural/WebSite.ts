import { Schema } from '@/types/seo';
import { FALLBACK_CONTENT, ORGANIZATION_INFO } from '@/lib/seo/utils/fallbackContent';

export function generateWebSiteSchema(): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: FALLBACK_CONTENT.siteName,
    url: ORGANIZATION_INFO.url,
    description: FALLBACK_CONTENT.description,
    publisher: {
      '@type': 'EducationalOrganization',
      name: ORGANIZATION_INFO.name,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${ORGANIZATION_INFO.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'vi',
  };
}
