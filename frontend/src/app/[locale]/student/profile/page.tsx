'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { fetchStudentProfile, updateStudentProfile, fetchStudentStats } from '@/lib/api/student';
import { Card, CardHeader, CardContent, Input, Button, Alert } from '@/components/ui';

export default function ProfilePage() {
  const t = useTranslations('student');
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: '',
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: fetchStudentProfile,
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  }, [profile, isEditing]);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['student', 'stats'],
    queryFn: fetchStudentStats,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      setIsEditing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
    setIsEditing(false);
  };

  if (loadingProfile || loadingStats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl bg-gray-200 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="page-title mb-2">{t('profile')}</h1>
        <p className="page-subtitle">Manage your account settings and preferences</p>
      </div>

      {updateProfileMutation.isSuccess && (
        <Alert variant="success" title="Success" className="mb-6">
          Profile updated successfully!
        </Alert>
      )}

      {updateProfileMutation.isError && (
        <Alert variant="error" title="Error" className="mb-6">
          Failed to update profile. Please try again.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={t('edit_profile')}
              action={
                !isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )
              }
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  {formData.avatarUrl || profile?.avatarUrl ? (
                    <img
                      src={formData.avatarUrl || profile?.avatarUrl}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-medium text-gray-600">
                      {(profile?.firstName || profile?.email)?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex-1">
                      <Input
                        label={t('avatar')}
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        placeholder="Avatar URL"
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t('first_name')}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                  <Input
                    label={t('last_name')}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <Input
                  label={t('email_address')}
                  type="email"
                  value={profile?.email || ''}
                  disabled
                />

                {isEditing && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : t('save_changes')}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      {t('cancel')}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('learning_stats')} />
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('total_courses')}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('completed_courses')}</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedCourses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('active_courses')}</p>
                    <p className="text-3xl font-bold text-primary-600">{stats.activeCourses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('lessons_completed')}</p>
                    <p className="text-3xl font-bold text-secondary-600">
                      {stats.totalLessonsCompleted}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">{t('completion_rate')}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('average_progress')}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-primary-500"
                          style={{ width: `${stats.averageProgress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.averageProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No statistics available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
