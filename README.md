# Hoc Vien Big Dipper Monorepo

A full-stack monorepo that powers the Hoc Vien Big Dipper platform. The repository houses a Next.js 14 App Router frontend, an Express.js API backend, and all shared tooling required for local development and deployment.

## 📦 Tech Stack

| Layer      | Technology                                                                        |
| ---------- | --------------------------------------------------------------------------------- |
| Frontend   | [Next.js 14](https://nextjs.org/) · [React 18](https://react.dev/) · Tailwind CSS |
| Backend    | [Express.js](https://expressjs.com/) · TypeScript · Zod                           |
| Tooling    | ESLint · Prettier · Husky · lint-staged · commitlint                              |
| Deployment | PM2 · Nginx · PostgreSQL (see `docs/` for detailed guides)                        |

---

## 🗂️ Repository Structure

```
.
├── backend/                 # Express.js API (TypeScript)
│   ├── src/
│   │   ├── config/          # Environment and runtime configuration
│   │   ├── middleware/      # Global middleware (error handling, CORS, etc.)
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Shared utilities (logger, helpers)
│   │   ├── app.ts           # Express app bootstrap
│   │   └── server.ts        # HTTP server entrypoint
│   ├── .env.example         # Backend environment template
│   └── package.json
│
├── frontend/                # Next.js 14 App Router application
│   ├── src/
│   │   ├── app/             # App Router routes and API handlers
│   │   ├── components/      # Shared UI components
│   │   ├── lib/             # Utilities (fetch helpers, class helpers)
│   │   ├── styles/          # Tailwind CSS and global styles
│   │   └── types/           # Shared TypeScript types
│   ├── public/              # Static assets
│   ├── .env.local.example   # Frontend environment template
│   └── package.json
│
├── deploy/                  # PM2, Nginx, and deployment scripts
├── docs/                    # Full deployment & infrastructure docs
├── scripts/                 # Build and deploy helpers
│
├── package.json             # Root workspace configuration
├── tsconfig.base.json       # Shared TypeScript compiler options
├── .eslintrc.cjs            # Shared ESLint configuration
├── .prettierrc              # Prettier rules
├── commitlint.config.js     # Conventional commit rules
└── .vscode/settings.json    # Recommended VS Code settings
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- (Optional) PostgreSQL for database-backed features

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Frontend (Next.js)

```bash
cd frontend
cp .env.local.example .env.local
# Update values as needed
```

#### Backend (Express)

```bash
cd backend
cp .env.example .env
# Update values as needed
```

### 3. Run the Apps

```bash
# Start both servers concurrently (frontend on :3000, backend on :5000)
npm run dev

# Run individually
npm run dev:frontend
npm run dev:backend
```

### 4. Build for Production

```bash
npm run build          # Builds both apps
npm run build:frontend # Next.js standalone output in frontend/.next
npm run build:backend  # Compiled JavaScript in backend/dist
```

### 5. Start Production Servers

```bash
npm start
# or
npm run start:frontend
npm run start:backend
```

---

## 🔧 Tooling & Automation

### Linting & Formatting

```bash
npm run lint        # Lint frontend + backend
npm run lint:fix    # Auto-fix lint issues
npm run format      # Format with Prettier
npm run typecheck   # TypeScript type checking
```

### Testing (placeholders for now)

```bash
npm test
npm run test:frontend
npm run test:backend
```

### Cleaning

```bash
npm run clean           # Remove node_modules & build artifacts
npm run clean:frontend
npm run clean:backend
```

### Git Hooks

- **Husky** installs automatically via `npm install`
- **Pre-commit**: runs `lint-staged` (ESLint + Prettier on staged files)
- **Commit-msg**: enforces [Conventional Commits](https://www.conventionalcommits.org/)

`package.json` includes the required scripts and lint-staged configuration.

---

## 🧭 Path Aliases

Shared TypeScript configuration (`tsconfig.base.json`) with per-package aliases:

### Frontend

```
@/*             → ./src/*
@/components/*  → ./src/components/*
@/lib/*         → ./src/lib/*
@/styles/*      → ./src/styles/*
@/types/*       → ./src/types/*
```

### Backend

```
@/*            → ./src/*
@/config/*     → ./src/config/*
@/routes/*     → ./src/routes/*
@/middleware/* → ./src/middleware/*
@/types/*      → ./src/types/*
@/utils/*      → ./src/utils/*
@/lib/*        → ./src/lib/*
```

Import paths stay consistent across the codebase, and IDE support is provided through the shared `tsconfig.base.json` and `.vscode` settings.

---

## 🎨 UI & Theme Foundation

The frontend ships with Tailwind CSS configured for the App Router. `frontend/src/styles/globals.css` defines global tokens (colors, typography), and `tailwind.config.js` extends Tailwind with brand colors (`primary`, `secondary`).

Use the `Button` component in `frontend/src/components/ui/button.tsx` as an example of reusable, typed UI building blocks.

---

## 🔐 Environment Handling

- Backend loads environment variables through `zod` validation (`backend/src/config/env.ts`).
- Frontend exposes public environment variables (prefixed with `NEXT_PUBLIC_`).
- Sample env files are provided under each workspace.

---

## 🗄️ Database & Prisma

The backend now uses [Prisma](https://www.prisma.io/) to manage a PostgreSQL schema. Relevant files live under `backend/prisma/` (schema, migrations, and seeding utilities) and database access is centralized in `backend/src/lib/prisma.ts`.

### 1. Configure PostgreSQL

1. Copy `backend/.env.example` to `backend/.env` and update `DATABASE_URL` with your connection string.
2. Ensure the target database exists (for example, create it with `createdb hocvienbigdipper`).

### 2. Apply Migrations

```bash
# Apply migrations locally and regenerate the Prisma Client
npm run prisma:migrate:dev --workspace=backend

# Format the schema or generate the client independently (optional)
npm run prisma:format --workspace=backend
npm run prisma:generate --workspace=backend

# Deploy migrations in CI/production environments
npm run prisma:migrate:deploy --workspace=backend
```

The initial schema migration is checked in at `backend/prisma/migrations/20241024000000_initial/`.

### 3. Seed Data (Placeholder)

Seed data lives in `backend/prisma/seed.ts`. Run it with:

```bash
npm run prisma:seed --workspace=backend
```

Update the placeholder script with real data as the application evolves.

---

## 📚 Additional Documentation

Comprehensive deployment and infrastructure documentation is available in `docs/`:

- [Deployment Playbook](docs/deployment-playbook.md)
- [Express Build Guide](docs/express-build.md)
- [Next.js Configuration](docs/nextjs-config.md)
- [PostgreSQL Setup](docs/postgresql.md)
- [Security Hardening](docs/security-hardening.md)

Deployment scripts and PM2/Nginx configs remain in `deploy/` and `scripts/`.

---

## 🤝 Contributing

1. Create a feature branch from `main`.
2. Make your changes (ensure linting & formatting pass).
3. Follow Conventional Commits when committing.
4. Submit a pull request for review.

---

## 📄 License

Specify your project license here.

---

Happy building! 🚀
