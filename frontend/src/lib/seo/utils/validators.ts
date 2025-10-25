import { Schema } from '@/types/seo';

export function isValidUrl(url?: string | null): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function stripHTML(text?: string | null): string | undefined {
  if (!text) return undefined;
  return text.replace(/<[^>]*>?/gm, '').trim();
}

export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function filterEmpty<T>(value: (T | null | undefined)[]): T[] {
  return value.filter((item): item is T => item !== null && item !== undefined);
}

export function toISODate(date?: string | Date | null): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return date.toISOString();
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

export function toISO8601Duration(minutes?: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  const parts: string[] = ['PT'];
  if (hours > 0) parts.push(`${hours}H`);
  if (mins > 0) parts.push(`${mins}M`);
  return parts.join('');
}

export function mergeSchemas(...schemas: Array<Schema | Schema[] | undefined>): Schema[] {
  return schemas.flat().filter((schema): schema is Schema => Boolean(schema));
}

export function deduplicateSchemas(schemas: Schema[]): Schema[] {
  const seen = new Set<string>();
  return schemas.filter((schema) => {
    const key = JSON.stringify(schema);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
