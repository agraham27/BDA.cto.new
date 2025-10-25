import { Schema } from '@/types/seo';

interface SchemaMarkupProps {
  schemas: Schema[];
}

export function SchemaMarkup({ schemas }: SchemaMarkupProps) {
  if (!schemas || schemas.length === 0) return null;

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
