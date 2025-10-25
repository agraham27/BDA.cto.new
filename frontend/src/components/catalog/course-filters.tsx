'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CourseFiltersProps {
  categories: Array<{ slug: string; name: string }>;
  instructors: Array<{ id: string; name: string }>;
  currentFilters: {
    search?: string;
    level?: string;
    category?: string;
    instructorId?: string;
  };
}

export function CourseFilters({ categories, instructors, currentFilters }: CourseFiltersProps) {
  const t = useTranslations('courses');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(currentFilters.search ?? '');

  useEffect(() => {
    setSearchValue(currentFilters.search ?? '');
  }, [currentFilters.search]);

  const levelOptions = useMemo(
    () => [
      { value: '', label: t('level_all') },
      { value: 'BEGINNER', label: t('level_beginner') },
      { value: 'INTERMEDIATE', label: t('level_intermediate') },
      { value: 'ADVANCED', label: t('level_advanced') },
      { value: 'ALL_LEVELS', label: t('level_all_levels') },
    ],
    [t]
  );

  const handleQueryChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete('page');

    const queryString = params.toString();
    const target = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(target, { scroll: false });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleQueryChange('search', searchValue.trim());
  };

  const handleReset = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="search">
            {t('search_label')}
          </label>
          <div className="flex gap-3">
            <Input
              id="search"
              placeholder={t('search_placeholder')}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Button type="submit" className="shrink-0">
              {t('search_action')}
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="level">
            {t('level_label')}
          </label>
          <select
            id="level"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={currentFilters.level ?? ''}
            onChange={(event) => handleQueryChange('level', event.target.value)}
          >
            {levelOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category">
            {t('category_label')}
          </label>
          <select
            id="category"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={currentFilters.category ?? ''}
            onChange={(event) => handleQueryChange('category', event.target.value)}
          >
            <option value="">{t('category_all')}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="instructor">
            {t('instructor_label')}
          </label>
          <select
            id="instructor"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={currentFilters.instructorId ?? ''}
            onChange={(event) => handleQueryChange('instructorId', event.target.value)}
          >
            <option value="">{t('instructor_all')}</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 text-sm text-gray-500">
        <div>
          {t.rich('active_filters', {
            count: Object.values(currentFilters).filter(Boolean).length,
            strong: (chunks) => <strong className="text-gray-700">{chunks}</strong>,
          })}
        </div>
        <Button type="button" variant="ghost" onClick={handleReset}>
          {t('clear_filters')}
        </Button>
      </div>
    </form>
  );
}
