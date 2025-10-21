# Local Development Guide

This guide explains how to run the entire ELD System locally with both frontend and backend.

## Prerequisites

- Node.js 18+ installed
- Python 3.11+ installed (for Django backend)
- npm or yarn package manager

---

## Quick Start - Run Everything Together

### Option 1: Run Frontend + Express Backend (Recommended)

```bash
npm run dev:all
```

This command runs:
- **Frontend** at http://localhost:3000
- **Express Backend** at http://localhost:3001

### Option 2: Run Frontend + Django Backend

**Terminal 1** - Start Django:
```bash
npm run dev:django
```

**Terminal 2** - Start Frontend:
```bash
npm run dev
```

This runs:
- **Frontend** at http://localhost:3000  
- **Django Backend** at http://localhost:8000

---

## Individual Commands

### Frontend Only
```bash
npm run dev
```
Opens at: http://localhost:3000

### Express Backend Only
```bash
npm run dev:backend
```
Runs at: http://localhost:3001

### Django Backend Only
```bash
npm run dev:django
```
Runs at: http://localhost:8000

---

## First Time Setup

### 1. Install Dependencies

**Root level (installs all workspaces):**
```bash
npm install
```

**Or install individually:**
```bash
# Frontend
cd packages/frontend
npm install

# Express Backend
cd packages/local-dev-backend
npm install

# Django Backend (Python)
cd packages/django-backend
pip install -r requirements.txt
```

### 2. Django Database Setup (First time only)

```bash
cd packages/django-backend
python manage.py migrate
python manage.py createsuperuser  # Optional: create admin user
```

### 3. Environment Variables (Optional)

Create `.env` files if you need custom configuration:

**`packages/frontend/.env.local`:**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_EXPRESS_API_URL=http://localhost:3001
```

**`packages/local-dev-backend/.env`:**
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**`packages/django-backend/.env`:**
```env
DEBUG=True
SECRET_KEY=your-dev-secret-key
FRONTEND_URL=http://localhost:3000
```

---

## Testing the Setup

### Test Express Backend
Open: http://localhost:3001/health

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-21T12:00:00.000Z",
  "service": "Spotter TypeScript API"
}
```

### Test Django Backend  
Open: http://localhost:8000/api/eld-logs/list/

Expected response:
```json
{
  "logs": [],
  "count": 0
}
```

### Test Frontend
Open: http://localhost:3000

You should see the ELD Spotter application.

---

## Understanding the Architecture

### Development Architecture
```
┌─────────────────────────────────────────┐
│         Browser (localhost:3000)        │
│            React Frontend               │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────┐
│ Express API   │    │  Django API  │
│ localhost:3001│    │localhost:8000│
└───────────────┘    └──────────────┘
```

### Production Architecture (Vercel + Render)
```
┌─────────────────────────────────────────┐
│      Browser (vercel.app)               │
│         React Frontend                  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌───────────────────┐  ┌──────────────────┐
│ Express API       │  │  Django API      │
│ render.com        │  │  render.com      │
└───────────────────┘  └──────────────────┘
```

**Note:** Vercel only hosts the frontend. Backends must be deployed separately (see `docs/RENDER_DEPLOYMENT.md`).

---

## Common Issues & Solutions

### Port Already in Use

If you see "Port 3000 is already in use":

**Windows:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Django Migrations Error

```bash
cd packages/django-backend
python manage.py makemigrations
python manage.py migrate
```

### Module Not Found

```bash
# Reinstall all dependencies
npm install
cd packages/django-backend
pip install -r requirements.txt
```

### CORS Errors

Make sure:
1. Frontend URL is in backend CORS settings
2. Backend URL is correct in frontend API config
3. Both services are running

---

## Building for Production

### Build Frontend
```bash
npm run build
```
Output: `packages/frontend/dist/`

### Build Express Backend
```bash
npm run build:backend
```
Output: `packages/local-dev-backend/dist/`

### Preview Production Build
```bash
npm run preview
```

---

## Deployment

### Frontend (Vercel)
- Already configured in `vercel.json`
- Automatic deployment on push to `main` branch
- Live at: https://eld-system-frontend.vercel.app

### Backends (Render.com)
See detailed guide: `docs/RENDER_DEPLOYMENT.md`

---

## Project Structure

```
packages/
├── frontend/              # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── styles/       # CSS files
│   └── package.json
│
├── local-dev-backend/    # Express.js API (Node/TypeScript)
│   ├── src/
│   │   └── index.ts     # Main server file
│   └── package.json
│
└── django-backend/       # Django REST API (Python)
    ├── config/          # Django settings
    ├── routes/          # API routes and models
    ├── manage.py
    └── requirements.txt
```

---

## Tips for Development

1. **Use `npm run dev:all`** for the fastest development experience (frontend + Express)
2. **Hot reload** is enabled - changes auto-refresh
3. **Check logs** in the terminal if something doesn't work
4. **Use browser DevTools** (F12) to debug API calls in Network tab

---

Need help? Check the other documentation files:
- `docs/RENDER_DEPLOYMENT.md` - Deploy backends to Render.com
- `docs/FRONTEND_ENV_CONFIG.md` - Environment variables guide
- `README.md` - Project overview
