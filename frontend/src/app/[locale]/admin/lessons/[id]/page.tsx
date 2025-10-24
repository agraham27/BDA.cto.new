'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Button, Card, CardContent, FileUpload, Input, SimpleSelect, Textarea } from '@/components/ui';
import { Lesson, Section } from '@/types/course';

const mockSections: Section[] = [
  {
    id: 'section-1',
    title: 'Getting Started',
    description: 'Introduction to the course',
    order: 1,
    courseId: 'course-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'section-2',
    title: 'Advanced Concepts',
    description: 'Deep dive into advanced topics',
    order: 2,
    courseId: 'course-1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

export default function LessonFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const lessonId = params.id as string;
  const isNew = lessonId === 'new';

  const [formData, setFormData] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    duration: 600,
    order: 1,
    sectionId: '',
  });
  const [resourceName, setResourceName] = useState<string | null>(null);

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

    if (!formData.sectionId) {
      newErrors.sectionId = 'Section is required';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.content || formData.content.trim().length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    }

    if (formData.duration === undefined || formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
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
      setAlert({ show: true, message: `Lesson ${isNew ? 'created' : 'updated'} successfully`, variant: 'success' });
      setTimeout(() => router.push(`/${locale}/admin/lessons`), 1500);
    } catch (error) {
      setAlert({ show: true, message: 'Failed to save lesson', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResourceUpload = async (file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setResourceName(file.name);
    setAlert({ show: true, message: 'Resource uploaded successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'Create Lesson' : 'Edit Lesson'}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isNew ? 'Add a new lesson to a section' : 'Update lesson content'}
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
                placeholder="Lesson title"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="sectionId" className="mb-2 block text-sm font-medium text-gray-700">
                  Section <span className="text-red-500">*</span>
                </label>
                <SimpleSelect
                  id="sectionId"
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  options={[
                    { value: '', label: 'Select section' },
                    ...mockSections.map((section) => ({ value: section.id, label: section.title })),
                  ]}
                  error={errors.sectionId}
                />
              </div>

              <div>
                <label htmlFor="order" className="mb-2 block text-sm font-medium text-gray-700">
                  Order <span className="text-red-500">*</span>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="duration" className="mb-2 block text-sm font-medium text-gray-700">
                  Duration (seconds) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  error={errors.duration}
                  min="60"
                  step="30"
                />
              </div>

              <div>
                <label htmlFor="videoUrl" className="mb-2 block text-sm font-medium text-gray-700">
                  Video URL
                </label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                Summary <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={errors.description}
                rows={3}
                placeholder="Brief overview of the lesson"
              />
            </div>

            <div>
              <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
                Lesson Content <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                error={errors.content}
                rows={6}
                placeholder="Detailed lesson notes, key points, and instructions"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Resources</label>
              <FileUpload onUpload={handleResourceUpload} label="Upload Resource" />
              {resourceName && <p className="mt-2 text-sm text-gray-600">Latest upload: {resourceName}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : isNew ? 'Create Lesson' : 'Update Lesson'}
          </Button>
        </div>
      </form>
    </div>
  );
}
