import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchPublicBlogPost } from '@/lib/api/public';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPostPageProps {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params: { locale, slug } }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { data: post } = await fetchPublicBlogPost(slug);
    const description = post.excerpt || post.content.substring(0, 160);

    return {
      title: post.title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    };
  } catch (error) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPostPage({ params: { locale, slug } }: BlogPostPageProps) {
  const t = await getTranslations({ locale, namespace: 'blog' });
  
  let post;
  try {
    const response = await fetchPublicBlogPost(slug);
    post = response.data;
  } catch (error) {
    notFound();
  }

  const author = post.instructor
    ? `${post.instructor.user.firstName || ''} ${post.instructor.user.lastName || ''}`.trim()
    : `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Anonymous';

  const avatarUrl = post.instructor?.user.avatarUrl || post.author.avatarUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8">
          {post.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat.categoryId}
                  className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                >
                  {cat.category.name}
                </span>
              ))}
            </div>
          )}
          <h1 className="mb-6 text-4xl font-semibold text-gray-900 md:text-5xl">
            {post.title}
          </h1>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={author}
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                {author.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{author}</p>
              <p className="text-sm text-gray-500">{formatDate(post.publishedAt)}</p>
            </div>
          </div>
        </div>

        <Card variant="elevated">
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        {post.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-gray-700">{t('tags')}</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {post.instructor && (
          <div className="mt-12">
            <Card variant="elevated">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('about_author')}</h3>
                <Link
                  href={`/${locale}/instructors/${post.instructor.id}`}
                  className="group flex items-center gap-4"
                >
                  {post.instructor.user.avatarUrl ? (
                    <img
                      src={post.instructor.user.avatarUrl}
                      alt={author}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                      {author.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 group-hover:text-primary-600">{author}</p>
                    {post.instructor.headline && (
                      <p className="text-sm text-gray-600">{post.instructor.headline}</p>
                    )}
                    {post.instructor.bio && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.instructor.bio}</p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </article>
    </div>
  );
}
