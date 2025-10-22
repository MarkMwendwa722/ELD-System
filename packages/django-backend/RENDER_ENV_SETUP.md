# Render Environment Variables Setup

## Required Environment Variables for Render Deployment

Set these in your Render dashboard under **Environment** tab:

### 1. Django Configuration

```
SECRET_KEY=your-production-secret-key-here-generate-a-long-random-string
DEBUG=False
ALLOWED_HOSTS=eld-system.onrender.com
```

**Important Notes:**
- Remove `https://` prefix from ALLOWED_HOSTS
- Remove spaces between comma-separated values
- Set DEBUG=False in production
- Generate a new SECRET_KEY (don't use the dev one)

### 2. Frontend URL (CORS)

```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

Replace with your actual Vercel frontend URL.

### 3. MongoDB Configuration

```
MONGODB_URI=mongodb+srv://maxmark722_db_user:9EgTT4LYBjeypCHi@spotter.pwjcp7x.mongodb.net/?retryWrites=true&w=majority&appName=spotter
MONGODB_NAME=spotter_db
```

Use your actual MongoDB Atlas connection string.

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your **ELD-System** web service
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add each variable listed above
6. Click **Save Changes**
7. Render will automatically redeploy with new settings

## Common Errors and Solutions

### Error: DisallowedHost
```
django.core.exceptions.DisallowedHost: Invalid HTTP_HOST header
```

**Solution:** 
- Ensure ALLOWED_HOSTS contains just the domain name without `https://`
- No spaces in the comma-separated list
- Example: `eld-system.onrender.com` NOT `https://eld-system.onrender.com`

### Error: CORS
```
Access to fetch at 'https://eld-system.onrender.com' from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution:**
- Set FRONTEND_URL to your Vercel domain
- Ensure CORS_ALLOW_ALL_ORIGINS=True is in settings.py (already configured)

## Verifying the Fix

After setting environment variables in Render:

1. Wait for automatic redeployment
2. Check logs: `https://dashboard.render.com/web/YOUR_SERVICE_ID/logs`
3. Look for successful startup message:
   ```
   Starting development server at http://0.0.0.0:8000/
   ```
4. Test the health endpoint: `https://eld-system.onrender.com/health`
5. Should return:
   ```json
   {
     "status": "OK",
     "service": "Spotter Django API",
     "version": "1.0.0"
   }
   ```

## Generate a Secure SECRET_KEY

Run this in Python to generate a secure SECRET_KEY:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or use this online: https://djecrety.ir/

## Current Settings Summary

✅ **Fixed Issues:**
- Removed `https://` from ALLOWED_HOSTS
- Removed extra spaces
- Added `.strip()` to handle whitespace in settings.py

⚠️ **To Do:**
- Set environment variables in Render dashboard
- Generate and use production SECRET_KEY
- Set DEBUG=False for production
- Update FRONTEND_URL to your Vercel domain
