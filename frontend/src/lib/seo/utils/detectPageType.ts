import { PageType } from '@/types/seo';

export function detectPageType(path: string): PageType {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'home') {
    return 'home';
  }

  if (segments.includes('courses')) {
    if (segments.length > 2 && segments.includes('lessons')) {
      return 'lesson';
    }
    if (segments.length >= 2) {
      return 'course';
    }
    return 'website';
  }

  if (segments.includes('blog')) {
    if (segments.length >= 2) {
      return 'blog';
    }
    return 'website';
  }

  if (segments.includes('instructors')) {
    if (segments.length >= 2) {
      return 'instructor';
    }
    return 'website';
  }

  if (segments.includes('about')) {
    return 'about';
  }

  if (segments.includes('faq')) {
    return 'faq';
  }

  return 'website';
}

export function buildCanonicalUrl(path: string, baseUrl?: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://hocvienbigdipper.com';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function buildImageUrl(imagePath?: string | null, baseUrl?: string): string | undefined {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const base = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://hocvienbigdipper.com';
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${base}${cleanPath}`;
}
