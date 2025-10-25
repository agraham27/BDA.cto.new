import { Schema, InstructorData } from '@/types/seo';
import { ensureArray, filterEmpty } from '@/lib/seo/utils/validators';

export function generatePersonSchema(instructor: InstructorData): Schema {
  const [givenName, ...family] = instructor.name.split(' ');

  const socialLinks = filterEmpty([
    instructor.socialLinks?.linkedin,
    instructor.socialLinks?.twitter,
    instructor.socialLinks?.facebook,
  ]);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: instructor.name,
    givenName,
    ...(family.length > 0 && { familyName: family.join(' ') }),
    ...(instructor.photo && { image: instructor.photo }),
    ...(instructor.slug && { url: `/instructors/${instructor.slug}` }),
    ...(instructor.jobTitle && { jobTitle: instructor.jobTitle }),
    worksFor: {
      '@type': 'EducationalOrganization',
      name: 'Big Dipper Academy',
    },
    ...(instructor.bio && { description: instructor.bio }),
    ...(instructor.expertise && { knowsAbout: ensureArray(instructor.expertise) }),
    ...(instructor.education && { alumniOf: instructor.education }),
    ...(instructor.awards && instructor.awards.length > 0 && { award: instructor.awards }),
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
  };
}
