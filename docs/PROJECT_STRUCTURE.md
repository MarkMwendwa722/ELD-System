# 📂 Project Structure Guide

## Directory Overview

```
spotter-eld-system/
├── 📁 api/                         # Production Serverless Functions
├── 📁 packages/                    # Monorepo packages
│   ├── 📁 frontend/               # React application
│   ├── 📁 local-dev-backend/      # Express.js (dev only)
│   └── 📁 django-backend/         # Django API (dev only)
├── 📁 docs/                        # Documentation
├── 📁 .github/                     # GitHub workflows
├── 📁 .vscode/                     # VS Code settings
├── 📄 vercel.json                 # Vercel config
├── 📄 package.json                # Root package
└── 📄 README.md                   # Main documentation
```

## Detailed Structure

### `/api` - Production API (Vercel Serverless)

```
api/
├── health.ts              # GET /api/health - Health check
├── status.ts              # GET /api/status - API status
├── geocode.ts             # GET /api/geocode - Forward geocoding
├── reverse-geocode.ts     # GET /api/reverse-geocode - Reverse geocoding
├── package.json           # API dependencies
└── tsconfig.json          # TypeScript config
```

**Purpose:** Serverless functions deployed to Vercel for production.

### `/packages/frontend` - React Application

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ELDGridDisplay.tsx
│   │   ├── EnhancedMap.tsx
│   │   ├── Map.tsx
│   │   └── SpotterLogo.tsx
│   ├── pages/             # Page-level components
│   │   ├── ELDDashboard.tsx
│   │   ├── RouteDisplayPage.tsx
│   │   └── TripPlanningPage.tsx
│   ├── services/          # API & utility services
│   │   ├── api.ts         # API client
│   │   └── geocoding.ts   # Geocoding utilities
│   ├── styles/            # CSS and styling
│   │   ├── animations.css
│   │   └── spotter-animations.css
│   ├── css/               # Additional CSS
│   ├── App.tsx            # Root component
│   ├── App.css            # Global styles
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts      # Vite TypeScript definitions
├── dist/                  # Build output (generated)
├── index.html             # HTML template
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind CSS config
└── postcss.config.js      # PostCSS config
```

**Purpose:** React + Vite frontend application.

### `/packages/local-dev-backend` - Express.js Backend

```
local-dev-backend/
├── src/
│   └── index.ts           # Express server
├── dist/                  # Build output
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

**Purpose:** Local development backend (not deployed).

### `/packages/django-backend` - Django API

```
django-backend/
├── config/                # Django project settings
│   ├── __init__.py
│   ├── settings.py        # Django settings
│   ├── urls.py            # Root URL config
│   └── wsgi.py            # WSGI config
├── routes/                # API app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── urls.py            # API routes
│   └── migrations/        # Database migrations
├── manage.py              # Django CLI
├── db.sqlite3             # SQLite database
├── requirements.txt       # Python dependencies
└── test_eld_api.py        # API tests
```

**Purpose:** Django REST API for local development.

### `/docs` - Documentation

```
docs/
├── README.md                      # Documentation index
├── QUICK_DEPLOY.md               # Quick deployment guide
├── DEPLOYMENT_GUIDE.md           # Full deployment guide
├── DEPLOYMENT_SUMMARY.md         # Architecture summary
├── DEPLOYMENT_CHECKLIST.txt      # Deployment checklist
├── VERCEL_DEPLOYMENT.md          # Vercel details
├── ELD-GRID-FORMAT.md            # ELD data format
└── ELD-SPOTTER-README.md         # ELD system docs
```

**Purpose:** All project documentation.

## File Purposes

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root package config, workspaces, scripts |
| `vercel.json` | Vercel deployment configuration |
| `.vercelignore` | Files to exclude from Vercel deployment |
| `.gitignore` | Files to exclude from Git |
| `.eslintrc.json` | ESLint configuration |
| `.prettierrc` | Prettier code formatting |

### VS Code Settings

| File | Purpose |
|------|---------|
| `.vscode/tasks.json` | VS Code task definitions |

## Build Outputs (Generated)

These directories are auto-generated and excluded from Git:

- `packages/frontend/dist/` - Frontend build output
- `packages/local-dev-backend/dist/` - Backend build output
- `api/dist/` - API build output (TypeScript compilation)
- `node_modules/` - Dependencies (all levels)

## Environment Files

- `.env` - Local environment variables (not committed)
- `packages/frontend/.env.production` - Production frontend env vars

## Key Principles

1. **Monorepo Structure** - All packages in `/packages`
2. **Separation of Concerns** - Frontend, backend, API are separate
3. **Dev vs Production** - Local backends for dev, serverless for prod
4. **Documentation First** - All docs in `/docs` directory
5. **Clean Root** - Minimal files in root directory

## Naming Conventions

- **Folders:** `kebab-case` (e.g., `local-dev-backend`)
- **Components:** `PascalCase.tsx` (e.g., `ELDDashboard.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `api.ts`)
- **Styles:** `kebab-case.css` (e.g., `spotter-animations.css`)

## Import Paths

```typescript
// Components
import { Map } from '@/components/Map'

// Services
import { createELDLog } from '@/services/api'

// Pages
import ELDDashboard from '@/pages/ELDDashboard'
```

## Best Practices

1. **Components** - Keep in `/src/components`, one component per file
2. **Pages** - Route-level components in `/src/pages`
3. **Services** - API calls and utilities in `/src/services`
4. **Styles** - Component styles in same directory or `/src/styles`
5. **Types** - Define interfaces in component files or separate `.types.ts`

---

For more information, see the [Main README](../README.md).
