import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { fetchPublicBlogPosts } from '@/lib/api/public';
import { Card, CardContent } from '@/components/ui/card';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'blog' });

  return {
    title: t('page_title'),
    description: t('page_description') || 'Explore insights, stories, and educational content from our instructors and community.',
  };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  
  let blogPostsData;

  try {
    blogPostsData = await fetchPublicBlogPosts({ limit: 12 });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    blogPostsData = { data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  }

  const blogPosts = blogPostsData.data;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-5xl font-semibold text-gray-900">{t('page_title')}</h1>
        <p className="max-w-3xl text-lg text-gray-600">
          {t('page_subtitle')}
        </p>
      </div>

      {blogPosts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 text-4xl flex items-center justify-center">
              ✍️
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t('no_posts')}</h3>
            <p className="text-gray-600">{t('no_posts_description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8">
          {blogPosts.map((post, index) => {
            const author = post.instructor
              ? `${post.instructor.user.firstName || ''} ${post.instructor.user.lastName || ''}`.trim()
              : `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Anonymous';
            const excerpt = post.excerpt || post.content.substring(0, 200) + '...';

            if (index === 0 && post.featured) {
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  className="group"
                >
                  <Card variant="elevated" className="overflow-hidden transition-shadow hover:shadow-xl">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 md:aspect-auto">
                        <div className="flex h-full items-center justify-center text-8xl">
                          ✨
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="mb-3">
                          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                            {t('featured')}
                          </span>
                        </div>
                        <h2 className="mb-3 text-3xl font-semibold text-gray-900 group-hover:text-primary-600">
                          {post.title}
                        </h2>
                        <p className="mb-4 text-gray-600">{excerpt}</p>
                        <div className="flex items-center gap-3">
                          {(post.instructor?.user.avatarUrl || post.author.avatarUrl) && (
                            <img
                              src={post.instructor?.user.avatarUrl || post.author.avatarUrl || ''}
                              alt={author}
                              className="h-10 w-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{author}</p>
                            <p className="text-xs text-gray-500">{formatDate(post.publishedAt)}</p>
                          </div>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            }

            return (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group"
              >
                <Card variant="elevated" className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-4">
                      <div className="md:col-span-3">
                        <h3 className="mb-2 text-2xl font-semibold text-gray-900 group-hover:text-primary-600">
                          {post.title}
                        </h3>
                        <p className="mb-4 line-clamp-2 text-gray-600">{excerpt}</p>
                        <div className="flex items-center gap-3">
                          {(post.instructor?.user.avatarUrl || post.author.avatarUrl) ? (
                            <img
                              src={post.instructor?.user.avatarUrl || post.author.avatarUrl || ''}
                              alt={author}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                              {author.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{author}</p>
                            <p className="text-xs text-gray-500">{formatDate(post.publishedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        {post.categories.length > 0 && (
                          <div className="mb-3">
                            <span className="text-xs font-medium text-gray-500">
                              {post.categories[0].category.name}
                            </span>
                          </div>
                        )}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
