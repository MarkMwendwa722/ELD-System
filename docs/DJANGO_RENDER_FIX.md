# Django on Render - Route Not Found Fix

## Quick Checklist

If you're seeing "route not found" on Render for your Django backend:

### ✅ 1. Verify Render Service Settings

Go to your Render service → **Settings** and verify:

| Setting | Correct Value | Why |
|---------|---------------|-----|
| **Root Directory** | `packages/django-backend` | Points to Django code, NOT Express |
| **Environment** | `Python 3` | NOT Node |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate` | Installs Django |
| **Start Command** | `gunicorn config.wsgi:application` | Starts Django server |

**If ANY of these are wrong, fix them and redeploy!**

### ✅ 2. Check Your Render URL

Your Django service URL should look like:
```
https://your-service-name.onrender.com
```

**Test these endpoints:**

1. **Root:** `https://your-service-name.onrender.com/`
   - Should return JSON with API info
   
2. **Health:** `https://your-service-name.onrender.com/health`
   - Should return `{"status": "OK"}`
   
3. **API List:** `https://your-service-name.onrender.com/api/eld-logs/list/`
   - Should return `{"logs": [], "count": 0}`

If you get 404 on all of these, go to step 3.

### ✅ 3. Check Build Logs

1. Go to your Render service
2. Click on the latest deployment
3. Read the **Build Logs**
4. Look for errors

**Common errors:**

#### Error: "No module named 'django'"
**Fix:** Make sure `requirements.txt` is in `packages/django-backend/`

#### Error: "Could not find requirements.txt"
**Fix:** Root Directory is set wrong. Should be `packages/django-backend`

#### Error: "gunicorn: command not found"
**Fix:** Add `gunicorn` to `requirements.txt`

### ✅ 4. Check Runtime Logs

1. Go to service → **Logs** tab
2. Look for recent logs after deployment

**What you should see:**
```
Starting gunicorn...
Listening at: http://0.0.0.0:10000
```

**If you see errors:**
- Copy the exact error message
- Check the solutions below

### ✅ 5. Common Django Errors on Render

#### "DisallowedHost" Error
```
Invalid HTTP_HOST header: 'your-app.onrender.com'
```

**Fix:**
1. Go to Render → **Environment** tab
2. Update `ALLOWED_HOSTS` to include your Render domain:
   ```
   your-service-name.onrender.com,localhost
   ```
3. Save and redeploy

#### "SECRET_KEY" Error
```
The SECRET_KEY setting must not be empty
```

**Fix:**
1. Go to Render → **Environment** tab
2. Add `SECRET_KEY` variable
3. Click "Generate" to create a random key
4. Save and redeploy

#### "CSRF verification failed"
**Fix:** This is actually normal for API-only backends. If you need to fix it:
1. Update `settings.py` to exempt API endpoints from CSRF
2. Or use Django REST Framework token authentication

### ✅ 6. Environment Variables Checklist

Go to Render → **Environment** tab. You should have:

| Variable | Value | Required? |
|----------|-------|-----------|
| `SECRET_KEY` | (generated) | ✅ YES |
| `DEBUG` | `False` | ✅ YES |
| `ALLOWED_HOSTS` | `your-app.onrender.com,localhost` | ✅ YES |
| `FRONTEND_URL` | `https://eld-system-frontend.vercel.app` | ⚠️ For CORS |
| `PYTHON_VERSION` | `3.11.0` | ⚠️ Recommended |

### ✅ 7. Test Locally First

Before debugging on Render, test locally to ensure Django works:

```bash
cd packages/django-backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input

# Start with gunicorn (what Render uses)
gunicorn config.wsgi:application
```

Visit http://localhost:8000 - should show JSON response.

If it works locally but not on Render, the issue is environment-related.

---

## Step-by-Step Fix for "Route Not Found"

### Scenario 1: Wrong Root Directory

**Problem:** Render is looking for Django code but finding Express code.

**Solution:**
1. Render Dashboard → Your Service → **Settings**
2. Find **Root Directory**
3. Change to: `packages/django-backend`
4. Click **Save Changes**
5. Service will automatically redeploy
6. Wait 3-5 minutes
7. Test: `https://your-app.onrender.com/health`

### Scenario 2: Build Failed

**Problem:** Django didn't build successfully.

**Solution:**
1. Go to your service page
2. Click on the latest deployment (the one that failed)
3. Read the build logs carefully
4. Find the error (usually in red)
5. Common fixes:
   - Missing `requirements.txt`: Make sure it's in `packages/django-backend/`
   - Module not found: Add to `requirements.txt`
   - Python version: Set `PYTHON_VERSION=3.11.0` in environment variables

### Scenario 3: Service Won't Start

**Problem:** Build succeeds but service won't start.

**Solution:**
1. Check **Logs** tab for runtime errors
2. Common causes:
   - Missing `SECRET_KEY`: Add in Environment tab
   - Wrong `ALLOWED_HOSTS`: Update to include Render domain
   - Database error: Check migrations ran in build command

### Scenario 4: 404 on All Routes

**Problem:** Django is running but can't find any routes.

**Solution:**
This usually means Django isn't configured correctly. Check:

1. `config/urls.py` includes all route files
2. `config/wsgi.py` is correct
3. Start Command is: `gunicorn config.wsgi:application` (not just `gunicorn`)

---

## Quick Test Commands

### Test from Terminal:

```bash
# Test health endpoint
curl https://your-app.onrender.com/health

# Test API endpoint
curl https://your-app.onrender.com/api/eld-logs/list/

# Test with verbose output (shows headers)
curl -v https://your-app.onrender.com/health
```

### Test from Browser:

1. Open: `https://your-app.onrender.com/health`
2. Should see JSON response
3. Open browser DevTools (F12) → Network tab
4. Refresh page
5. Check status code (should be 200, not 404 or 500)

---

## Still Having Issues?

### Information to Provide:

1. **Render URL:** What's your exact Render service URL?
2. **Error Message:** Copy/paste the exact error from logs
3. **Settings Screenshot:** Show Root Directory and Build/Start commands
4. **Test Result:** What happens when you visit `/health`?

### Where to Check:

- **Build Logs:** Shows if Django installed correctly
- **Runtime Logs:** Shows if Django is starting
- **Environment Variables:** Shows if config is correct
- **Settings:** Shows if paths are correct

---

## Correct Configuration Summary

**For Django on Render:**

```yaml
Service Type: Web Service
Name: spotter-django-api (or your choice)
Environment: Python 3
Region: (any)
Branch: main
Root Directory: packages/django-backend  ← MUST BE EXACT
Build Command: pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
Start Command: gunicorn config.wsgi:application
```

**Environment Variables:**
```
SECRET_KEY=(generated)
DEBUG=False
ALLOWED_HOSTS=your-app.onrender.com,localhost
FRONTEND_URL=https://eld-system-frontend.vercel.app
PYTHON_VERSION=3.11.0
```

**Test URLs:**
- Root: `https://your-app.onrender.com/`
- Health: `https://your-app.onrender.com/health`
- API: `https://your-app.onrender.com/api/eld-logs/list/`

---

## Need More Help?

Share:
1. Your Render service URL
2. The exact error message
3. Build or runtime logs (copy/paste)

And I'll help you fix it immediately!
