'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardContent, Input, SimpleSelect, Textarea, Alert, FileUpload } from '@/components/ui';
import { Course } from '@/types/course';

export default function CourseFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const courseId = params.id as string;
  const isNew = courseId === 'new';

  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: 0,
    level: 'beginner',
    status: 'draft',
    instructorId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ show: boolean; message: string; variant: 'success' | 'error' }>({
    show: false,
    message: '',
    variant: 'success',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (!formData.instructorId) {
      newErrors.instructorId = 'Instructor is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setAlert({
        show: true,
        message: `Course ${isNew ? 'created' : 'updated'} successfully`,
        variant: 'success',
      });

      setTimeout(() => {
        router.push(`/${locale}/admin/courses`);
      }, 1500);
    } catch (error) {
      setAlert({
        show: true,
        message: 'Failed to save course',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fakeUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, thumbnail: fakeUrl }));
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isNew ? 'Create Course' : 'Edit Course'}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isNew ? 'Add a new course to the system' : 'Update course information'}
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
                placeholder="Enter course title"
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
                placeholder="Enter course description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="price" className="mb-2 block text-sm font-medium text-gray-700">
                  Price (VND) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  error={errors.price}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="instructorId" className="mb-2 block text-sm font-medium text-gray-700">
                  Instructor <span className="text-red-500">*</span>
                </label>
                <SimpleSelect
                  id="instructorId"
                  value={formData.instructorId}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  options={[
                    { value: '', label: 'Select instructor' },
                    { value: '1', label: 'John Doe' },
                    { value: '2', label: 'Jane Smith' },
                    { value: '3', label: 'Bob Johnson' },
                  ]}
                  error={errors.instructorId}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="level" className="mb-2 block text-sm font-medium text-gray-700">
                  Level
                </label>
                <SimpleSelect
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                  options={[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                  ]}
                />
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <SimpleSelect
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Thumbnail</label>
              <FileUpload
                onUpload={handleThumbnailUpload}
                accept="image/*"
                maxSize={5 * 1024 * 1024}
                label="Choose Thumbnail"
              />
              {formData.thumbnail && (
                <div className="mt-3">
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail preview"
                    className="h-40 w-auto rounded-lg border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : isNew ? 'Create Course' : 'Update Course'}
          </Button>
        </div>
      </form>
    </div>
  );
}
