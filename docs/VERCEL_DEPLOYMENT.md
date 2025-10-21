# Vercel Deployment Guide for Spotter Project

This project is now configured for deployment on Vercel with a monorepo structure.

## Architecture Overview

- **Frontend**: React + Vite app in `packages/Client/`
- **Backend**: Serverless API functions in `api/` directory
- **Legacy Backend**: Express.js (for local dev) in `packages/backend/`
- **Django Backend**: Separate Django app in `packages/backend-django/` (not deployed to Vercel)

## Files Created/Modified

1. **`vercel.json`** - Vercel configuration
   - Defines build command and output directory
   - Routes requests to appropriate handlers
   - Configures API serverless functions

2. **`api/` directory** - Serverless API functions
   - `health.ts` - Health check endpoint
   - `status.ts` - Status endpoint
   - Add more endpoints as needed

3. **`.vercelignore`** - Excludes unnecessary files from deployment

4. **`packages/Client/.env.production`** - Production environment variables

5. **Updated `package.json`** - Fixed workspace references

## Local Development

```bash
# Install dependencies
npm install

# Start frontend (with Vite proxy to Django backend)
npm run start:frontend

# Start Django backend (separate terminal)
cd packages/backend-django
python manage.py runserver

# Or start Node backend for testing
npm run start:backend
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `packages/Client/dist`
   - **Install Command**: `npm install`

### 3. Environment Variables (Optional)

If you need environment variables in production:
1. Go to Project Settings > Environment Variables
2. Add variables like:
   - `VITE_API_BASE_URL=/api` (already in .env.production)
   - Any API keys or secrets

## API Endpoints

Once deployed, your API will be available at:
- `https://your-domain.vercel.app/api/health` - Health check
- `https://your-domain.vercel.app/api/status` - Status check

## Adding New API Endpoints

Create new serverless functions in the `api/` directory:

```typescript
// api/your-endpoint.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Your response' });
}
```

## Troubleshooting

### Route Not Found Errors
- Make sure API endpoints are in the `api/` directory
- Check `vercel.json` routes configuration
- Verify frontend is making requests to `/api/*` paths

### Build Failures
- Check that `packages/Client/` has all dependencies
- Verify `npm run build` works locally
- Check Vercel build logs for specific errors

### 404 on Frontend Routes
- The `vercel.json` is configured to serve `index.html` for all non-API routes
- This enables client-side routing with React Router

## Notes

- Django backend (`packages/backend-django/`) is not deployed to Vercel
- For Django, consider deploying separately to Railway, Render, or Heroku
- Or migrate Django API endpoints to serverless functions in `api/` directory
- The Express backend in `packages/backend/` is for local development only

## Monitoring

After deployment:
- Check Vercel Analytics for traffic insights
- Monitor function execution in Vercel dashboard
- Set up error tracking (Sentry, LogRocket, etc.)

## Next Steps

1. Test deployment with: `vercel`
2. Test production build locally: `npm run build && npx serve packages/Client/dist`
3. Add more API endpoints as needed in `api/` directory
4. Configure custom domain in Vercel dashboard
5. Set up CI/CD with GitHub integration
