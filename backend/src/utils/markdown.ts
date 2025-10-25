export interface MarkdownImage {
  url: string;
  alt: string;
}

export interface MarkdownLink {
  text: string;
  url: string;
}

export interface MarkdownHeading {
  level: number;
  text: string;
}

export function getWordCount(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[#*`>\[\]()_~]/g, '')
    .replace(/[-]{3,}/g, '')
    .trim();

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export function getReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

export function extractImages(markdown: string): MarkdownImage[] {
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  const images: MarkdownImage[] = [];
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2] || '',
    });
  }

  return images;
}

export function extractLinks(markdown: string): MarkdownLink[] {
  const regex = /(?<!!)\[(.*?)\]\((.*?)\)/g;
  const links: MarkdownLink[] = [];
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    links.push({
      text: match[1] || '',
      url: match[2] || '',
    });
  }

  return links;
}

export function extractHeadings(markdown: string): MarkdownHeading[] {
  const regex = /^(#{1,6})\s+(.+)$/gm;
  const headings: MarkdownHeading[] = [];
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }

  return headings;
}

export function hasKeywordInContent(markdown: string, keyword: string): boolean {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .toLowerCase();

  return text.includes(keyword.toLowerCase());
}

export function calculateKeywordDensity(markdown: string, keyword: string): number {
  const wordCount = getWordCount(markdown);
  if (wordCount === 0) {
    return 0;
  }

  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .toLowerCase();

  const keywordLower = keyword.toLowerCase();
  const matches = text.match(new RegExp(`\\b${keywordLower}\\b`, 'gi'));

  if (!matches) {
    return 0;
  }

  return (matches.length / wordCount) * 100;
}

export function hasValidHeadingStructure(markdown: string): boolean {
  const headings = extractHeadings(markdown);

  if (headings.length === 0) {
    return true;
  }

  let prevLevel = 1;

  for (const heading of headings) {
    if (heading.level > prevLevel + 1) {
      return false;
    }
    prevLevel = heading.level;
  }

  return true;
}

export function hasImages(markdown: string): boolean {
  return extractImages(markdown).length > 0;
}

export function hasInternalLinks(markdown: string, baseUrl: string): boolean {
  const links = extractLinks(markdown);
  return links.some((link) => link.url.includes(baseUrl) || link.url.startsWith('/'));
}

export function hasExternalLinks(markdown: string, baseUrl: string): boolean {
  const links = extractLinks(markdown);
  return links.some(
    (link) => !link.url.includes(baseUrl) && !link.url.startsWith('/') && !link.url.startsWith('#')
  );
}

export function checkImageAltText(markdown: string): { totalImages: number; imagesWithAlt: number } {
  const images = extractImages(markdown);
  const imagesWithAlt = images.filter((img) => img.alt && img.alt.trim().length > 0);

  return {
    totalImages: images.length,
    imagesWithAlt: imagesWithAlt.length,
  };
}

export interface SEOScore {
  score: number;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

export function calculateSEOScore(params: {
  markdown: string;
  title: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];
  baseUrl?: string;
}): SEOScore {
  const { markdown, title, seoTitle, metaDescription, keywords = [], baseUrl = '' } = params;

  const checks = [];
  let passedChecks = 0;

  const wordCount = getWordCount(markdown);
  const actualSeoTitle = seoTitle || title;

  const seoTitleCheck = actualSeoTitle.length <= 60 && actualSeoTitle.length >= 30;
  checks.push({
    name: 'SEO Title Length',
    passed: seoTitleCheck,
    message: seoTitleCheck
      ? 'SEO title length is optimal (30-60 chars)'
      : `SEO title should be between 30-60 characters (current: ${actualSeoTitle.length})`,
  });
  if (seoTitleCheck) {
    passedChecks++;
  }

  const metaDescCheck = !!(metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160);
  checks.push({
    name: 'Meta Description',
    passed: metaDescCheck,
    message: metaDescCheck
      ? 'Meta description length is optimal'
      : metaDescription
        ? `Meta description should be 120-160 characters (current: ${metaDescription.length})`
        : 'Meta description is missing',
  });
  if (metaDescCheck) {
    passedChecks++;
  }

  const keywordInTitle = keywords.length > 0 && keywords.some((kw) => actualSeoTitle.toLowerCase().includes(kw.toLowerCase()));
  checks.push({
    name: 'Focus Keyword in Title',
    passed: keywordInTitle,
    message: keywordInTitle ? 'Focus keyword appears in title' : 'Focus keyword should appear in title',
  });
  if (keywordInTitle) {
    passedChecks++;
  }

  const keywordInContent = keywords.length > 0 && keywords.some((kw) => hasKeywordInContent(markdown, kw));
  checks.push({
    name: 'Focus Keyword in Content',
    passed: keywordInContent,
    message: keywordInContent ? 'Focus keyword appears in content' : 'Focus keyword should appear in content',
  });
  if (keywordInContent) {
    passedChecks++;
  }

  const links = extractLinks(markdown);
  const hasLinks = links.length > 0;
  checks.push({
    name: 'Internal/External Links',
    passed: hasLinks,
    message: hasLinks ? `Content contains ${links.length} links` : 'Content should include internal or external links',
  });
  if (hasLinks) {
    passedChecks++;
  }

  const imageCheck = checkImageAltText(markdown);
  const allImagesHaveAlt = imageCheck.totalImages === 0 || imageCheck.totalImages === imageCheck.imagesWithAlt;
  checks.push({
    name: 'Images Have Alt Text',
    passed: allImagesHaveAlt,
    message: allImagesHaveAlt
      ? imageCheck.totalImages === 0
        ? 'No images in content'
        : 'All images have alt text'
      : `${imageCheck.imagesWithAlt}/${imageCheck.totalImages} images have alt text`,
  });
  if (allImagesHaveAlt) {
    passedChecks++;
  }

  const headingStructureValid = hasValidHeadingStructure(markdown);
  checks.push({
    name: 'Heading Structure',
    passed: headingStructureValid,
    message: headingStructureValid ? 'Heading structure is correct' : 'Heading levels should not skip (e.g., H2 to H4)',
  });
  if (headingStructureValid) {
    passedChecks++;
  }

  const contentLengthCheck = wordCount >= 300;
  checks.push({
    name: 'Content Length',
    passed: contentLengthCheck,
    message: contentLengthCheck ? `Content has ${wordCount} words` : `Content should be at least 300 words (current: ${wordCount})`,
  });
  if (contentLengthCheck) {
    passedChecks++;
  }

  const score = Math.round((passedChecks / checks.length) * 100);

  return {
    score,
    checks,
  };
}
