'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  Input,
  Pagination,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { Lesson } from '@/types/course';

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Introduction to Components',
    description: 'Learn about React components',
    content: 'Components are the building blocks...',
    duration: 900,
    order: 1,
    sectionId: '1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'State Management',
    description: 'Understanding state in React',
    content: 'State allows components to be dynamic...',
    duration: 1200,
    order: 2,
    sectionId: '1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

export default function LessonsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [lessons] = useState<Lesson[]>(mockLessons);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const paginatedLessons = filteredLessons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: DataTableColumn<Lesson>[] = [
    {
      key: 'title',
      header: 'Lesson',
      cell: (lesson) => (
        <div>
          <p className="font-semibold text-gray-900">{lesson.title}</p>
          <p className="text-xs text-gray-500">{lesson.description}</p>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (lesson) => <span className="text-sm text-gray-600">#{lesson.order}</span>,
    },
    {
      key: 'duration',
      header: 'Duration',
      cell: (lesson) => (
        <span className="text-sm text-gray-600">
          {lesson.duration ? `${Math.floor(lesson.duration / 60)} min` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (lesson) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/lessons/${lesson.id}`}>Edit</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lessons</h1>
          <p className="mt-1 text-sm text-gray-600">Manage lesson content and materials</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/lessons/new`}>Add Lesson</Link>
        </Button>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <CardContent>
          <Input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Lessons (${filteredLessons.length})`} />
        <CardContent>
          <DataTable data={paginatedLessons} columns={columns} emptyMessage="No lessons found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
