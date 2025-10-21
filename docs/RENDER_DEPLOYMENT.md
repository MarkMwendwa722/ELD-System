# Backend Deployment Guide - Render.com

This guide will help you deploy both the Express and Django backends to Render.com.

## Prerequisites

- GitHub account (your code is already on GitHub)
- Render.com account (free - sign up at https://render.com)

---

## Part 1: Deploy Express Backend

### Step 1: Create New Web Service on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `MarkMwendwa722/ELD-System`
4. Click **"Connect"**

### Step 2: Configure Express Service

Fill in the following settings:

- **Name:** `spotter-express-api` (or your preferred name)
- **Region:** Choose closest to you (e.g., Oregon)
- **Branch:** `main`
- **Root Directory:** `packages/local-dev-backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/index.js`
- **Plan:** `Free`

**IMPORTANT:** Make sure "Auto-Deploy" is set to **Yes**

### Step 3: Add Environment Variables

Click **"Advanced"** and add these environment variables:

- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://eld-system-frontend.vercel.app` (your Vercel URL)

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Once deployed, you'll see a URL like: `https://spotter-express-api.onrender.com`
4. Test it: Visit `https://spotter-express-api.onrender.com/health`

---

## Part 2: Deploy Django Backend

### Step 1: Create New Web Service on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your repository: `MarkMwendwa722/ELD-System`
4. Click **"Connect"**

### Step 2: Configure Django Service

Fill in the following settings:

- **Name:** `spotter-django-api` (or your preferred name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `packages/django-backend`
- **Runtime:** `Python 3`
- **Build Command:** 
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
  ```
- **Start Command:** `gunicorn config.wsgi:application`
- **Plan:** `Free`

### Step 3: Add Environment Variables

Click **"Advanced"** and add these environment variables:

- `SECRET_KEY` = (Click "Generate" to create a secure key)
- `DEBUG` = `False`
- `ALLOWED_HOSTS` = `spotter-django-api.onrender.com,localhost` (replace with your actual Render URL)
- `FRONTEND_URL` = `https://eld-system-frontend.vercel.app` (your Vercel URL)
- `PYTHON_VERSION` = `3.11.0`

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Once deployed, you'll see a URL like: `https://spotter-django-api.onrender.com`

---

## Part 3: Update Frontend to Use Deployed Backends

After both backends are deployed, you'll need to update your frontend configuration.

### Your Backend URLs

- **Express API:** `https://spotter-express-api.onrender.com` (replace with your actual URL)
- **Django API:** `https://spotter-django-api.onrender.com` (replace with your actual URL)

### Update Frontend API Configuration

I'll help you update the frontend code in the next step to use these URLs.

---

## Important Notes

### Free Tier Limitations

- **Spin Down:** Render free tier services spin down after 15 minutes of inactivity
- **Spin Up:** First request after spin-down takes 30-60 seconds
- **Solution:** Consider upgrading to paid tier ($7/month per service) or use a cron job to ping your services every 10 minutes

### Database Persistence

- SQLite database will be reset on each deployment (Render's ephemeral filesystem)
- For production, upgrade to PostgreSQL (free tier available on Render)

### Monitoring

- Check logs: Go to your service → **"Logs"** tab
- Health checks: Both backends have `/health` endpoints

---

## Troubleshooting

### Build Fails

- Check the build logs in Render dashboard
- Ensure Root Directory is correctly set
- Verify all dependencies are in requirements.txt/package.json

### Service Won't Start

- Check the logs for error messages
- Verify environment variables are set correctly
- Ensure start command is correct

### CORS Errors

- Update ALLOWED_HOSTS in Django settings
- Update FRONTEND_URL environment variable
- Check CORS_ALLOWED_ORIGINS includes your Vercel URL

---

## Next Steps

Once both backends are deployed:

1. Note down both API URLs
2. Update frontend API configuration (next guide)
3. Test all endpoints
4. Update your Vercel deployment

Need help? Check the logs or let me know the error message!
