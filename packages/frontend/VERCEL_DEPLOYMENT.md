# Frontend Deployment - Vercel Environment Setup

## Issue: Frontend not connecting to deployed backend

**Problem:** The deployed frontend on Vercel is trying to connect to `/api` (relative path) instead of the deployed backend on Render.

**Solution:** Set the correct backend URL in Vercel environment variables.

## Steps to Fix

### 1. Set Environment Variable in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **ELD-System** project
3. Click **Settings** → **Environment Variables**
4. Add the following:

```
Name: VITE_API_BASE_URL
Value: https://eld-system.onrender.com/api
Environment: Production, Preview, Development
```

5. Click **Save**
6. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click the three dots on latest deployment
   - Select **Redeploy**

### 2. Alternative: Set in vercel.json (Not Recommended)

You can also set it in `vercel.json`, but dashboard is better for security:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "https://eld-system.onrender.com/api"
  },
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Verification

After redeployment, test your production site:

1. Open your Vercel URL
2. Open browser DevTools (F12) → Console
3. Try to add an activity
4. Check Network tab for requests going to `https://eld-system.onrender.com/api/eld-logs/`

## Current Configuration

### ✅ Fixed Files:

**`.env.production`** (for local production builds):
```bash
VITE_API_BASE_URL=https://eld-system.onrender.com/api
```

**`.env`** (for local development):
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### API Configuration Logic:

The frontend uses this logic in `src/services/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || '/api')
  : 'http://localhost:8000/api';
```

- **Development**: Uses `http://localhost:8000/api`
- **Production**: Uses `VITE_API_BASE_URL` from environment variable
- **Fallback**: Uses `/api` if env var not set

## Testing Backend Connection

Run this in browser console on your deployed site:

```javascript
fetch('https://eld-system.onrender.com/health')
  .then(r => r.json())
  .then(data => console.log('Backend Status:', data))
  .catch(err => console.error('Backend Error:', err));
```

Expected response:
```json
{
  "status": "OK",
  "service": "Spotter Django API",
  "version": "1.0.0"
}
```

## CORS Configuration

Make sure your Django backend allows requests from your Vercel domain.

In Render dashboard, set:
```
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_HOSTS=eld-system.onrender.com
```

Or since you have `CORS_ALLOW_ALL_ORIGINS=True`, CORS should work from any domain.

## Common Issues

### Issue 1: Still using /api
**Symptom:** Network requests go to `https://your-app.vercel.app/api/eld-logs/` (404)
**Solution:** Environment variable not set in Vercel. Follow Step 1 above.

### Issue 2: CORS Error
**Symptom:** "blocked by CORS policy"
**Solution:** 
- Ensure `CORS_ALLOW_ALL_ORIGINS=True` in Django settings
- Or add your Vercel URL to FRONTEND_URL in Render

### Issue 3: Connection Refused
**Symptom:** "Failed to fetch" or "ERR_CONNECTION_REFUSED"
**Solution:** 
- Check if Render backend is running
- Visit https://eld-system.onrender.com/health
- If it's sleeping (free tier), wait 30-60 seconds for it to wake up

## Quick Deploy Checklist

Before deploying changes:

1. ✅ Update `.env.production` with correct backend URL
2. ✅ Set `VITE_API_BASE_URL` in Vercel dashboard
3. ✅ Ensure backend is running on Render
4. ✅ Set `ALLOWED_HOSTS` in Render dashboard
5. ✅ Commit and push changes
6. ✅ Redeploy in Vercel if needed
7. ✅ Test the deployed site

## After Making Changes

```bash
# Commit changes
git add .
git commit -m "Fix: Update production API URL to Render backend"
git push origin main

# Vercel will auto-deploy on push
# Or manually redeploy from Vercel dashboard
```
