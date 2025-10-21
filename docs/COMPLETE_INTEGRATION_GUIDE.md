# Complete Integration Guide - Frontend to Backend

This guide shows you exactly how to connect your Vercel frontend to your Render Django backend.

## 🎯 Overview

**Architecture:**
```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  Vercel         │ ───────▶│  Render.com     │
│  (Frontend)     │  HTTPS  │  (Django API)   │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
```

**What happens:**
1. User visits your Vercel app: `https://eld-system-frontend.vercel.app`
2. Frontend makes API requests to: `https://your-django-api.onrender.com/api/`
3. Django backend processes requests and returns data
4. Frontend displays the data

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ Django backend code in `packages/django-backend`
- ✅ Frontend code in `packages/Client`
- ✅ Git repository with both (already done)
- ✅ Render.com account (free tier works)
- ✅ Vercel account (free tier works)

---

## 🚀 Step 1: Deploy Django Backend to Render

### 1.1 Create New Web Service on Render

1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `ELD-System`

### 1.2 Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `spotter-django-api` (or your choice) |
| **Root Directory** | `packages/django-backend` ⚠️ **CRITICAL** |
| **Environment** | `Python 3` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate` |
| **Start Command** | `gunicorn config.wsgi:application` |
| **Instance Type** | `Free` |

### 1.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**, add these:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | Click "Generate" | Auto-generates secure key |
| `DEBUG` | `False` | Production setting |
| `ALLOWED_HOSTS` | `your-service-name.onrender.com,localhost` | Replace with actual URL |
| `FRONTEND_URL` | `https://eld-system-frontend.vercel.app` | Your Vercel URL |
| `PYTHON_VERSION` | `3.11.0` | Python version |

⚠️ **Important:** Replace `your-service-name` with your actual Render service name!

### 1.4 Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Render will show you the URL: `https://your-service-name.onrender.com`

### 1.5 Test Django Backend

Once deployed, test these endpoints in your browser:

#### Test 1: Health Check
```
https://your-service-name.onrender.com/health
```

**Expected response:**
```json
{
  "status": "OK",
  "service": "Spotter Django API",
  "version": "1.0.0"
}
```

#### Test 2: API Root
```
https://your-service-name.onrender.com/
```

**Expected response:**
```json
{
  "message": "Spotter ELD API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api/",
    "eld_logs": "/api/eld-logs/",
    "route_planning": "/api/route",
    "admin": "/admin/"
  }
}
```

#### Test 3: ELD Logs List
```
https://your-service-name.onrender.com/api/eld-logs/list/
```

**Expected response:**
```json
{
  "logs": [],
  "count": 0,
  "offset": 0,
  "limit": 100,
  "status": "success"
}
```

✅ **If all three tests pass, your Django backend is working!**

---

## 🎨 Step 2: Configure Frontend on Vercel

### 2.1 Update ALLOWED_HOSTS on Render

Before deploying frontend, update your Render environment variable:

1. Go to Render → Your Service → **Environment**
2. Update `ALLOWED_HOSTS` to include your Vercel domain:
   ```
   your-service-name.onrender.com,eld-system-frontend.vercel.app,localhost
   ```
3. Save and redeploy

### 2.2 Add Environment Variable to Vercel

1. Go to https://vercel.com/
2. Select your project: `eld-system-frontend`
3. Go to **Settings** → **Environment Variables**
4. Add this variable:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://your-service-name.onrender.com/api` |

**⚠️ Important Notes:**
- Replace `your-service-name` with your actual Render service name
- Include `/api` at the end
- No trailing slash after `/api`

Example:
```
VITE_API_BASE_URL=https://spotter-django-api.onrender.com/api
```

### 2.3 Redeploy Frontend

After adding the environment variable:

1. Go to **Deployments** tab
2. Click ⋯ (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

---

## 🧪 Step 3: Test Complete Integration

### 3.1 Visit Your Frontend

Open your Vercel URL in a browser:
```
https://eld-system-frontend.vercel.app
```

### 3.2 Test Trip Planning Page

1. Click **"Trip Planning"** or go to `/`
2. Enter pickup and dropoff locations
3. Click **"Plan Trip"**
4. You should see the route displayed on the map

**What's happening:**
- Frontend calls: `https://your-django-api.onrender.com/api/route`
- Django fetches route from Google Maps
- Returns route data to frontend
- Frontend displays on map

### 3.3 Create an ELD Log

1. On the Trip Planning page, fill in all fields:
   - Activity status
   - Pickup/dropoff locations
   - Start/end times
2. Click **"Create ELD Log"**
3. You should see: "ELD log created successfully"

**What's happening:**
- Frontend calls: `https://your-django-api.onrender.com/api/eld-logs/`
- Django saves log to database
- Returns success response
- Frontend shows confirmation

### 3.4 View ELD Dashboard

1. Click **"ELD Dashboard"** or go to `/dashboard`
2. Select today's date
3. You should see your created log

**What's happening:**
- Frontend calls: `https://your-django-api.onrender.com/api/eld-logs/list/`
- Django fetches logs from database
- Returns logs array
- Frontend displays logs with stats

---

## 🔍 Troubleshooting

### Issue 1: "Failed to fetch" Error

**Symptoms:**
- Frontend shows "Failed to fetch" or network error
- Browser console shows CORS error

**Solution:**
1. Check Render logs for CORS errors
2. Verify `FRONTEND_URL` in Render environment variables matches your Vercel URL **exactly**
3. Make sure it includes `https://` and has no trailing slash
4. Redeploy Django backend after changing

### Issue 2: "Not Found" (404) Error

**Symptoms:**
- API returns 404 for all requests
- Health check endpoint doesn't work

**Solution:**
1. Check Render **Root Directory** is set to `packages/django-backend`
2. If wrong, update in Settings → Root Directory
3. Save and redeploy

### Issue 3: "Server Error" (500)

**Symptoms:**
- API returns 500 internal server error
- Some endpoints work, others don't

**Solution:**
1. Go to Render → Logs
2. Look for Python errors (usually in red)
3. Common causes:
   - Missing dependencies: Add to `requirements.txt`
   - Database errors: Check migrations ran in build command
   - Environment variables: Verify all are set correctly

### Issue 4: Backend Takes Forever to Respond

**Symptoms:**
- First request after inactivity is very slow (30+ seconds)
- Subsequent requests are fast

**Explanation:**
- Render free tier spins down after 15 minutes of inactivity
- First request wakes up the service

**Solutions:**
- This is normal for free tier
- Upgrade to paid tier for 24/7 availability
- Or: Set up a cron job to ping your API every 14 minutes

### Issue 5: API Works in Browser but Not in Frontend

**Symptoms:**
- Can open API URLs directly in browser
- Frontend shows network errors

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for CORS errors
4. If you see CORS error:
   - Check `FRONTEND_URL` environment variable on Render
   - Make sure Django `CORS_ALLOWED_ORIGINS` includes your Vercel URL
   - Redeploy Django backend

---

## 📊 How to Monitor Your Deployment

### Check Django Backend Health

**Quick Test Command:**
```bash
curl https://your-django-api.onrender.com/health
```

**Expected:**
```json
{"status": "OK", "service": "Spotter Django API", "version": "1.0.0"}
```

### View Render Logs

1. Go to Render → Your Service
2. Click **"Logs"** tab
3. You'll see real-time logs of:
   - Incoming requests
   - Errors
   - Database queries

### View Vercel Logs

1. Go to Vercel → Your Project
2. Click **"Deployments"** → Latest deployment
3. Click **"View Function Logs"**
4. You'll see:
   - Build logs
   - Runtime logs
   - Errors

---

## 🎯 Quick Reference

### API Endpoints

All endpoints are relative to: `https://your-django-api.onrender.com`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/api/eld-logs/` | POST | Create ELD log |
| `/api/eld-logs/list/` | GET | Get ELD logs |
| `/api/eld-logs/<id>/` | PUT | Update ELD log |
| `/api/route` | GET | Get route between points |
| `/api/geocode` | GET | Address → coordinates |
| `/api/reverse-geocode` | GET | Coordinates → address |
| `/api/location-suggestions` | GET | Location autocomplete |

### Environment Variables Summary

**Render (Django):**
```
SECRET_KEY=(generated)
DEBUG=False
ALLOWED_HOSTS=your-service.onrender.com,your-vercel-app.vercel.app,localhost
FRONTEND_URL=https://your-vercel-app.vercel.app
PYTHON_VERSION=3.11.0
```

**Vercel (Frontend):**
```
VITE_API_BASE_URL=https://your-service.onrender.com/api
```

### URLs Checklist

- [ ] Django backend: `https://your-service-name.onrender.com`
- [ ] Django health: `https://your-service-name.onrender.com/health`
- [ ] Django API root: `https://your-service-name.onrender.com/api/`
- [ ] Frontend: `https://eld-system-frontend.vercel.app`

---

## 🎉 Success Checklist

Your integration is working if:

- ✅ Django health endpoint returns `{"status": "OK"}`
- ✅ Frontend loads without errors
- ✅ Can create ELD logs from Trip Planning page
- ✅ Can view logs on ELD Dashboard
- ✅ Route planning displays on map
- ✅ Location search/autocomplete works
- ✅ No CORS errors in browser console

---

## 🆘 Still Having Issues?

If you've followed all steps and still have problems:

1. **Check browser console** (F12 → Console tab)
   - Look for red error messages
   - Note the exact error text

2. **Check Render logs**
   - Go to your service → Logs
   - Look for Python errors

3. **Verify environment variables**
   - Render: All 5 variables set correctly
   - Vercel: `VITE_API_BASE_URL` set correctly

4. **Test API directly**
   - Open `https://your-service.onrender.com/health` in browser
   - Should return JSON with status OK

5. **Check CORS**
   - Make sure `FRONTEND_URL` matches your Vercel URL exactly
   - Include `https://`, no trailing slash

---

## 📚 Additional Resources

- [Render Django Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
- [Render Troubleshooting](./RENDER_TROUBLESHOOTING.md)
- [Django Render Fix Guide](./DJANGO_RENDER_FIX.md)
- [Frontend Environment Config](./FRONTEND_ENV_CONFIG.md)

---

## 🔄 Making Changes

### Update Django Backend Code

```bash
# Make your changes to files in packages/django-backend
git add .
git commit -m "Update Django backend"
git push
```

Render will automatically rebuild and redeploy (takes 3-5 minutes).

### Update Frontend Code

```bash
# Make your changes to files in packages/Client
git add .
git commit -m "Update frontend"
git push
```

Vercel will automatically rebuild and redeploy (takes 1-2 minutes).

---

## 💡 Tips

1. **Free Tier Limitations:**
   - Render: Spins down after 15 min inactivity
   - First request after spin-down takes 30-60 seconds
   - Consider paid tier for 24/7 availability

2. **Development vs Production:**
   - Local: Frontend uses `http://localhost:8000/api`
   - Production: Frontend uses `VITE_API_BASE_URL` from Vercel

3. **Testing Locally:**
   ```bash
   # Terminal 1: Start Django
   cd packages/django-backend
   python manage.py runserver

   # Terminal 2: Start Frontend
   cd packages/Client
   npm run dev
   ```

4. **Database:**
   - Render uses SQLite by default
   - Data persists between deploys
   - For production, consider PostgreSQL

---

**You're all set! 🚀**

Your frontend on Vercel is now connected to your Django backend on Render.
