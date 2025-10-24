import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            Welcome to Hoc Vien Big Dipper
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A modern full-stack application built with Next.js 14 and Express
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Next.js 14</h3>
            <p className="text-gray-600 text-sm">
              App Router with Server Components and React Server Actions
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Tailwind CSS</h3>
            <p className="text-gray-600 text-sm">
              Utility-first CSS framework for rapid UI development
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">TypeScript</h3>
            <p className="text-gray-600 text-sm">
              Type-safe development with full TypeScript support
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center pt-8">
          <Link
            href="/about"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Learn About the Stack
          </Link>
          <Link
            href="/api/health"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Check API Health
          </Link>
          <a
            href="https://github.com/vercel/next.js"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Documentation
          </a>
        </div>
      </div>
    </main>
  );
}
