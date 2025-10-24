import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">About This Project</h1>

          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-700">
              This is a full-stack monorepo built with modern web technologies, designed for
              scalability and developer experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Next.js 14 with App Router for server-side rendering and routing</li>
              <li>Express.js backend with TypeScript for type-safe APIs</li>
              <li>Tailwind CSS for utility-first styling</li>
              <li>Shared tooling with ESLint, Prettier, and Husky</li>
              <li>Path aliases for cleaner imports</li>
              <li>Conventional commits with commitlint</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Project Structure</h2>
            <p className="text-gray-700">
              The project uses npm workspaces for managing the frontend and backend as separate
              packages while sharing common development tools and configurations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
