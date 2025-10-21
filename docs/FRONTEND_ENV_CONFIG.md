# Frontend Environment Configuration

## Development (.env.local)

Create a `.env.local` file in `packages/frontend/` with:

```env
# Use local backends for development
VITE_API_BASE_URL=http://localhost:8000/api
VITE_EXPRESS_API_URL=http://localhost:3001
```

## Production (Vercel Environment Variables)

In your Vercel project settings, add these environment variables:

### For Django Backend
```
VITE_API_BASE_URL=https://spotter-django-api.onrender.com/api
```

### For Express Backend (if needed)
```
VITE_EXPRESS_API_URL=https://spotter-express-api.onrender.com
```

## Steps to Configure

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `VITE_API_BASE_URL` with your Render Django URL
3. Add `VITE_EXPRESS_API_URL` with your Render Express URL (if using)
4. Redeploy your Vercel app

## Testing Backend URLs

### Django Backend
- Health check: `https://spotter-django-api.onrender.com/api/health`
- ELD logs: `https://spotter-django-api.onrender.com/api/eld-logs/list/`

### Express Backend  
- Health check: `https://spotter-express-api.onrender.com/health`
- Status: `https://spotter-express-api.onrender.com/api/status`

Replace the URLs above with your actual Render URLs once deployed.
