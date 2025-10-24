# Next.js Configuration for Standalone Output

To enable Next.js standalone output mode for production deployment, configure your `next.config.js` as follows:

## next.config.js Example

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for self-contained production builds
  output: 'standalone',

  // Disable telemetry in production
  telemetry: {
    enabled: false,
  },

  // Compression (handled by Nginx, disable in Next.js)
  compress: false,

  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,

  // Environment variables (exposed to browser)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hocvienbigdipper.com',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://hocvienbigdipper.com',
  },

  // Image optimization
  images: {
    domains: ['api.hocvienbigdipper.com', 'hocvienbigdipper.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers (also configured in Nginx)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

## Package.json Scripts

```json
{
  "name": "hocvienbigdipper-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Standalone Build Output Structure

After running `npm run build`, the standalone output will be in `.next/standalone`:

```
.next/
├── standalone/
│   ├── .next/
│   │   └── (internal build files)
│   ├── node_modules/
│   ├── public/
│   ├── package.json
│   └── server.js  (entry point)
├── static/  (must be copied to standalone/.next/static)
└── ...
```

## Running the Standalone Build

```bash
cd .next/standalone
NODE_ENV=production node server.js
```

Or use PM2 as configured in the ecosystem.config.js.

## Environment Variables

Create `.env.production` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=https://api.hocvienbigdipper.com
NEXT_PUBLIC_SITE_URL=https://hocvienbigdipper.com
NEXT_TELEMETRY_DISABLED=1
```

## Health Check Endpoint

Add a simple health check API route at `pages/api/health.ts` or `app/api/health/route.ts`:

```typescript
// pages/api/health.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

```typescript
// app/api/health/route.ts (App Router)
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## Additional Considerations

- **Static Assets**: Static files in `public/` are automatically copied to the standalone output.
- **Environment Variables**: Use `NEXT_PUBLIC_*` prefix for client-side variables.
- **API Routes**: If using Next.js API routes extensively, consider moving them to the Express backend for better separation.
- **Caching**: Configure proper caching strategies in both Next.js and Nginx.
- **Monitoring**: Add performance monitoring (Vercel Analytics, Google Analytics, etc.).
