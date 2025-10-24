'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Button, Card, CardContent, Input, SimpleSelect, Textarea } from '@/components/ui';
import { Course, Section } from '@/types/course';

const mockCourses: Course[] = [
  {
    id: 'c-1',
    title: 'Introduction to React',
    description: 'Learn the basics of React',
    price: 299000,
    level: 'beginner',
    status: 'published',
    instructorId: '1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'c-2',
    title: 'Advanced TypeScript',
    description: 'Master TypeScript patterns',
    price: 499000,
    level: 'advanced',
    status: 'published',
    instructorId: '2',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
];

export default function SectionFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const sectionId = params.id as string;
  const isNew = sectionId === 'new';

  const [formData, setFormData] = useState<Partial<Section>>({
    title: '',
    description: '',
    order: 1,
    courseId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Course is required';
    }

    if (formData.order === undefined || formData.order < 1) {
      newErrors.order = 'Order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAlert({ show: true, message: `Section ${isNew ? 'created' : 'updated'} successfully`, variant: 'success' });
      setTimeout(() => router.push(`/${locale}/admin/sections`), 1500);
    } catch (error) {
      setAlert({ show: true, message: 'Failed to save section', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'Create Section' : 'Edit Section'}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isNew ? 'Organize lessons by creating sections' : 'Update section information'}
        </p>
      </div>

      {alert.show && (
        <div className="mb-4">
          <Alert variant={alert.variant}>{alert.message}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                placeholder="Section title"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                placeholder="Describe the focus of this section"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="courseId" className="mb-2 block text-sm font-medium text-gray-700">
                  Course <span className="text-red-500">*</span>
                </label>
                <SimpleSelect
                  id="courseId"
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  options={[
                    { value: '', label: 'Select course' },
                    ...mockCourses.map((course) => ({ value: course.id, label: course.title })),
                  ]}
                  error={errors.courseId}
                />
              </div>

              <div>
                <label htmlFor="order" className="mb-2 block text-sm font-medium text-gray-700">
                  Display Order <span className="text-red-500">*</span>
                </label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  error={errors.order}
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : isNew ? 'Create Section' : 'Update Section'}
          </Button>
        </div>
      </form>
    </div>
  );
}
