import { Schema, HowToStep } from '@/types/seo';

interface HowToData {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}

export function generateHowToSchema(data: HowToData): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.name,
    description: data.description,
    step: data.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
    ...(data.totalTime && { totalTime: data.totalTime }),
  };
}
