'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <span key={item.label} className="text-gray-500">
              {item.label}
            </span>
          );
        }

        return (
          <div key={item.label} className="flex items-center gap-2">
            <Link
              href={`/${locale}${item.href}`}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              {item.label}
            </Link>
            <span className="text-gray-300">/</span>
          </div>
        );
      })}
    </nav>
  );
}
