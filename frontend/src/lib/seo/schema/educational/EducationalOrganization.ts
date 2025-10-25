import { Schema, OrganizationData } from '@/types/seo';
import { ORGANIZATION_INFO } from '@/lib/seo/utils/fallbackContent';
import { filterEmpty } from '@/lib/seo/utils/validators';

export function generateEducationalOrganizationSchema(
  data?: Partial<OrganizationData>
): Schema {
  const org = { ...ORGANIZATION_INFO, ...data };

  const socialLinks = filterEmpty([
    org.socialLinks?.facebook,
    org.socialLinks?.linkedin,
    org.socialLinks?.twitter,
    org.socialLinks?.instagram,
    org.socialLinks?.youtube,
  ]);

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: org.name,
    alternateName: ORGANIZATION_INFO.alternateName,
    url: org.url,
    logo: org.logo,
    description: org.description,
    ...(org.foundingDate && { foundingDate: org.foundingDate }),
    ...(org.email && { email: org.email }),
    ...(org.phone && { telephone: org.phone }),
    ...(org.address && {
      address: {
        '@type': 'PostalAddress',
        ...(org.address.streetAddress && { streetAddress: org.address.streetAddress }),
        ...(org.address.addressLocality && { addressLocality: org.address.addressLocality }),
        ...(org.address.addressRegion && { addressRegion: org.address.addressRegion }),
        ...(org.address.postalCode && { postalCode: org.address.postalCode }),
        addressCountry: org.address.addressCountry,
      },
    }),
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Vietnamese', 'English'],
    },
  };
}
