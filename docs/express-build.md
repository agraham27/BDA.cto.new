# Express Backend Build and Deployment Guidelines

This document outlines how to structure, build, and deploy the Express.js backend for the Hoc Vien Big Dipper platform.

## 1. Project Structure

```
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   └── config/
├── prisma/
│   └── schema.prisma (if using Prisma)
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## 2. TypeScript Configuration

`tsconfig.json` example:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## 3. Build Tooling

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint 'src/**/*.ts'",
    "test": "jest",
    "migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed"
  }
}
```

### Build Process

1. Run type-checking and compile TypeScript to JavaScript using `tsc`.
2. Output compiled files to `dist/` directory.
3. Bundle optional configuration files or views as needed.

### Alternative Bundling (esbuild)

Use `esbuild` for faster builds and single-file bundling:

```bash
npx esbuild src/server.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --outfile=dist/server.js \
  --minify \
  --sourcemap
```

Adjust the build script in `package.json`:

```json
"build": "esbuild src/server.ts --bundle --platform=node --target=node18 --outfile=dist/server.js --minify --sourcemap"
```

## 4. Environment Variables

Backend `.env` must include:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://hocvienbigdipper_user:password@localhost:5432/hocvienbigdipper
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
FRONTEND_URL=https://hocvienbigdipper.com
```

Use `dotenv` to load environment variables:

```typescript
import dotenv from 'dotenv';
dotenv.config();
```

## 5. Production Deployment (PM2)

Ensure `dist/server.js` is the entry point. PM2 configuration (`ecosystem.config.js`):

```javascript
{
  name: 'hocvienbigdipper-backend',
  script: 'dist/server.js',
  cwd: '/var/www/hocvienbigdipper/backend',
  instances: 2,
  exec_mode: 'cluster',
  env: {
    NODE_ENV: 'production',
    PORT: 5000
  },
  error_file: '/var/log/hocvienbigdipper/backend-error.log',
  out_file: '/var/log/hocvienbigdipper/backend-out.log',
  merge_logs: true
}
```

## 6. Database Migrations

Example using Prisma:

```bash
# Apply migrations in production
yarn prisma migrate deploy

# Generate Prisma client
yarn prisma generate

# Seed the database (optional)
yarn prisma db seed
```

If using Knex:

```bash
npx knex migrate:latest --env production
npx knex seed:run --env production
```

## 7. Testing & Linting

- Use Jest or Mocha for backend tests.
- Enforce ESLint + Prettier for code quality.
- Run tests before building in CI pipelines.

## 8. Health Checks & Observability

Implement a health check endpoint:

```typescript
import express from 'express';
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

Expose metrics (optional) using `prom-client`.

## 9. Error Handling & Logging

- Use centralized logging (`winston`, `pino`).
- Standardize error responses with middleware.
- Integrate with alerting systems (Sentry) using DSN from `.env`.

## 10. Deployment Checklist

- [ ] Update dependencies (`npm ci --production`).
- [ ] Run migrations (`npm run migrate:deploy`).
- [ ] Run build (`npm run build`).
- [ ] Copy compiled files to `/var/www/hocvienbigdipper/backend/dist`.
- [ ] Restart PM2 (`pm2 reload hocvienbigdipper-backend`).
- [ ] Verify logs and health endpoint.

## 11. Troubleshooting

- **Compilation Errors**: Ensure TypeScript paths are correct.
- **Runtime Errors**: Check environment variables and log files.
- **Database Connection**: Verify `DATABASE_URL` and Postgres service status.
- **Port Conflicts**: Ensure no other service is using port 5000.

## 12. CI/CD Integration

Example GitHub Actions snippet:

```yaml
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm test

- name: Build backend
  run: npm run build

- name: Deploy (SSH)
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    source: 'dist/**'
    target: '/var/www/hocvienbigdipper/backend'

- name: Restart PM2
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /var/www/hocvienbigdipper
      pm2 reload ecosystem.config.js --only hocvienbigdipper-backend
```

Follow these guidelines to maintain a secure, reliable, and scalable Express backend deployment.
