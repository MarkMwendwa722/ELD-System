# Complete Project Deployment Guide

Deploy your entire ELD System: Django Backend on Render + Frontend on Vercel

---

## 🎯 Deployment Overview

### What We're Deploying:
1. **Django Backend** → Render.com (API server)
2. **React Frontend** → Vercel (Already deployed at https://eld-system-frontend.vercel.app)

### Final Architecture:
```
User Browser
     ↓
Frontend (Vercel: https://eld-system-frontend.vercel.app)
     ↓
Django Backend (Render: https://your-django-api.onrender.com)
     ↓
SQLite Database (on Render)
```

---

## Part 1: Deploy Django Backend to Render

### Step 1: Sign Up / Log In to Render

1. Go to https://render.com
2. Sign up for free account (or log in)
3. Click **"New +"** in top right

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Authorize GitHub if needed
4. Find and select your repository: **`MarkMwendwa722/ELD-System`**
5. Click **"Connect"**

### Step 3: Configure Django Service

Fill in these EXACT settings:

| Setting | Value |
|---------|-------|
| **Name** | `spotter-django-api` (or your choice) |
| **Region** | Choose closest to you (e.g., Oregon, Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `packages/django-backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate` |
| **Start Command** | `gunicorn config.wsgi:application` |
| **Plan** | `Free` |

### Step 4: Add Environment Variables

Click **"Advanced"** button, then add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `SECRET_KEY` | Click "Generate" | Django secret key |
| `DEBUG` | `False` | Never True in production |
| `PYTHON_VERSION` | `3.11.0` | Python version |
| `ALLOWED_HOSTS` | `your-service-name.onrender.com,localhost` | Replace with your actual URL after seeing it |
| `FRONTEND_URL` | `https://eld-system-frontend.vercel.app` | Your Vercel frontend URL |

**Note:** You'll update `ALLOWED_HOSTS` after you see your Render URL in the next step.

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will start building your Django app
3. Wait 3-5 minutes for the first deployment
4. Watch the logs for any errors

### Step 6: Get Your Django URL

Once deployment succeeds, you'll see your URL at the top:
```
https://spotter-django-api.onrender.com
```

**Copy this URL!** You'll need it for the next steps.

### Step 7: Update ALLOWED_HOSTS

1. Go to your service → **Environment** tab
2. Find `ALLOWED_HOSTS`
3. Update it to: `spotter-django-api.onrender.com,localhost`
   (Replace `spotter-django-api` with your actual service name)
4. Click **"Save Changes"**
5. Service will automatically redeploy

### Step 8: Test Django Backend

Visit these URLs to verify it works:

1. **Health Check:** `https://your-django-api.onrender.com/api/health`
   - Should return JSON with API status
   
2. **ELD Logs API:** `https://your-django-api.onrender.com/api/eld-logs/list/`
   - Should return empty logs list: `{"logs": [], "count": 0}`

3. **Admin Panel:** `https://your-django-api.onrender.com/admin/`
   - Should show Django admin login

If all these work, your backend is deployed! 🎉

---

## Part 2: Connect Frontend to Django Backend

Now we need to tell your Vercel frontend to use the deployed Django backend.

### Step 1: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project: **eld-system-frontend**
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-django-api.onrender.com/api`
     (Replace with your actual Render URL + `/api`)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **"Save"**

### Step 2: Redeploy Frontend

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes for redeployment

### Step 3: Test Complete System

1. Visit your frontend: https://eld-system-frontend.vercel.app
2. Try the following:
   - ✅ Page loads correctly
   - ✅ Go to `/dashboard` page
   - ✅ Try creating an ELD log entry
   - ✅ Check if data is saved (should see it in the table)

If everything works, you're done! 🚀

---

## Part 3: Verification Checklist

### Backend Verification (Render)

- [ ] Service status shows "Live" (green)
- [ ] `/api/health` endpoint returns 200 OK
- [ ] `/api/eld-logs/list/` returns empty list
- [ ] No errors in Render logs
- [ ] Environment variables are set correctly

### Frontend Verification (Vercel)

- [ ] Site loads at https://eld-system-frontend.vercel.app
- [ ] No CORS errors in browser console (F12)
- [ ] API calls succeed (check Network tab)
- [ ] Can create and view ELD logs
- [ ] `/dashboard` route works

### Integration Verification

- [ ] Frontend can fetch data from backend
- [ ] Creating ELD log saves to Django backend
- [ ] No 404 or 500 errors
- [ ] CORS is working (no CORS errors)

---

## Important Notes

### Free Tier Limitations

**Render Free Tier:**
- ⏸️ **Spins down after 15 minutes** of inactivity
- 🐌 **First request takes 30-60 seconds** to wake up
- 💾 **SQLite database persists** between requests (but resets on redeploy)
- 📊 **750 hours/month** of uptime

**Solutions:**
1. **Upgrade to paid plan** ($7/month) for always-on service
2. **Use a cron job** to ping your API every 10 minutes (keeps it awake)
3. **Show a loading message** to users on first request

### Database Persistence

**Current Setup (SQLite):**
- ✅ Data persists between requests
- ❌ Data is lost when you redeploy
- ❌ Not suitable for production with real users

**For Production:**
Upgrade to PostgreSQL on Render:
1. Go to Render dashboard → **New** → **PostgreSQL**
2. Create free PostgreSQL database
3. Update Django `DATABASE_URL` environment variable
4. Run migrations again

### CORS Configuration

Your Django backend is already configured to accept requests from:
- `http://localhost:3000` (local development)
- Your Vercel frontend URL (production)

If you change your Vercel URL, update the `FRONTEND_URL` environment variable on Render.

---

## Troubleshooting

### "Route Not Found" Error

**Problem:** Render can't find your Django code.

**Solution:**
1. Check **Root Directory** is set to `packages/django-backend`
2. Verify build logs show successful build
3. Make sure Start Command is `gunicorn config.wsgi:application`

### CORS Errors in Browser

**Problem:** Frontend can't access backend due to CORS.

**Solution:**
1. Add your Vercel URL to `FRONTEND_URL` on Render
2. Update `ALLOWED_HOSTS` to include your Render domain
3. Redeploy both services

### 500 Internal Server Error

**Problem:** Django application error.

**Solution:**
1. Check Render logs for Python errors
2. Make sure all environment variables are set
3. Verify `SECRET_KEY` is set
4. Check `ALLOWED_HOSTS` includes your Render domain

### Database Errors

**Problem:** SQLite file permission issues.

**Solution:**
- SQLite should work on Render's free tier
- For persistent data, upgrade to PostgreSQL

### Build Fails

**Problem:** Render can't build your Django app.

**Solution:**
1. Check `requirements.txt` exists in `packages/django-backend/`
2. Make sure all dependencies are listed
3. Check Build Command is correct
4. Look at build logs for specific error

---

## Next Steps

### After Successful Deployment:

1. **Create Django Superuser** (for admin panel):
   - Can't do this directly on Render free tier
   - Alternative: Add users via Django admin locally, then push DB

2. **Set Up Monitoring:**
   - Enable Render notifications for deploy failures
   - Use UptimeRobot to monitor your API (free)

3. **Add Custom Domain** (optional):
   - Vercel: Settings → Domains → Add domain
   - Render: Settings → Custom Domain

4. **Upgrade to Paid Plans** (when ready for production):
   - Render: $7/month for always-on service + PostgreSQL
   - Vercel: Stay on free (Hobby) tier unless you need teams

---

## Quick Reference

### Your Deployment URLs

**Frontend (Vercel):**
```
https://eld-system-frontend.vercel.app
```

**Backend (Render):**
```
https://spotter-django-api.onrender.com
```
(Replace with your actual URLs)

### Key API Endpoints

| Endpoint | URL |
|----------|-----|
| Health Check | `/api/health` |
| List ELD Logs | `/api/eld-logs/list/` |
| Create ELD Log | `/api/eld-logs/` |
| Admin Panel | `/admin/` |

### Environment Variables Needed

**Render (Django):**
- `SECRET_KEY` ← Generate random
- `DEBUG` ← False
- `ALLOWED_HOSTS` ← Your Render domain
- `FRONTEND_URL` ← Your Vercel URL
- `PYTHON_VERSION` ← 3.11.0

**Vercel (Frontend):**
- `VITE_API_BASE_URL` ← Your Render URL + /api

---

## Need Help?

Check these guides:
- **Render Troubleshooting:** `docs/RENDER_TROUBLESHOOTING.md`
- **Local Development:** `docs/LOCAL_DEVELOPMENT.md`
- **Environment Config:** `docs/FRONTEND_ENV_CONFIG.md`

Or share the specific error and I'll help you fix it!

---

**🎉 Congratulations!** Your complete ELD System is now deployed and accessible worldwide!
