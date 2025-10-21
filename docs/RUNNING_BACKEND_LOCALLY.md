# 🚀 Running the Backend Locally - Complete Guide

## ✅ Your Backend IS Working!

**Good news:** I just tested your Django backend and it **successfully started**! 🎉

The server runs on: `http://127.0.0.1:8000/`

---

## 🎯 Quick Start (Choose One Method)

### Method 1: Using the Startup Script (Easiest)

```powershell
# From project root
.\start-backend.ps1
```

This script automatically:
- ✅ Changes to django-backend directory
- ✅ Checks Python installation
- ✅ Installs dependencies if needed
- ✅ Runs migrations
- ✅ Collects static files
- ✅ Starts the server

### Method 2: Manual Commands

```powershell
# Navigate to django-backend
cd packages\django-backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Run migrations (first time only)
python manage.py migrate

# Start the server
python manage.py runserver
```

---

## 📝 What You Should See

When the server starts successfully, you'll see:

```
Performing system checks...

System check identified no issues (0 silenced).
October 21, 2025 - 16:30:59
Django version 5.2.7, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

⚠️ **Warning about `staticfiles/` is NORMAL** - Django creates this during first run.

---

## 🧪 Test Your Backend

Once the server is running, open these URLs in your browser:

### 1. Health Check
```
http://127.0.0.1:8000/health
```

**Expected response:**
```json
{
  "status": "OK",
  "service": "Spotter Django API",
  "version": "1.0.0"
}
```

### 2. API Root
```
http://127.0.0.1:8000/
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

### 3. ELD Logs List
```
http://127.0.0.1:8000/api/eld-logs/list/
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

---

## 🔧 All Available Commands

### Start Server
```powershell
python manage.py runserver

# Or specify port
python manage.py runserver 8080
```

### Run Migrations
```powershell
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Create Admin User
```powershell
python manage.py createsuperuser
```

Then visit: `http://127.0.0.1:8000/admin/`

### Collect Static Files
```powershell
python manage.py collectstatic
```

### Django Shell
```powershell
python manage.py shell
```

---

## 🌐 Running Frontend + Backend Together

### Option 1: Two Terminals (Recommended for Development)

**Terminal 1 (Backend):**
```powershell
cd packages\django-backend
python manage.py runserver
```

**Terminal 2 (Frontend):**
```powershell
cd packages\Client
npm run dev
```

Now you have:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`

### Option 2: Using npm Script

From project root:
```powershell
npm run dev:all
```

This runs both backend and frontend simultaneously using `concurrently`.

---

## 🐛 Troubleshooting

### Issue: "Python not found"

**Solution:**
1. Install Python from: https://www.python.org/downloads/
2. Check installation: `python --version`
3. Make sure it's Python 3.8+

### Issue: "Module not found"

**Solution:**
```powershell
pip install -r requirements.txt
```

If still failing, install individually:
```powershell
pip install django djangorestframework django-cors-headers
pip install whitenoise gunicorn polyline requests python-dotenv
```

### Issue: "Port 8000 already in use"

**Solution 1 - Find and kill process:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

**Solution 2 - Use different port:**
```powershell
python manage.py runserver 8080
```

### Issue: "Database locked"

**Solution:**
```powershell
# Delete database and recreate
del db.sqlite3
python manage.py migrate
```

### Issue: "No module named 'config'"

**Solution:**
Make sure you're in the correct directory:
```powershell
cd packages\django-backend
python manage.py runserver
```

### Issue: "Static files warning"

**This is normal!** The warning about `staticfiles/` directory is harmless during development.

To fix it anyway:
```powershell
python manage.py collectstatic --no-input
```

---

## 📊 Server Logs

When running, you'll see logs like:

```
[21/Oct/2025 16:30:59] "GET /health HTTP/1.1" 200 0
[21/Oct/2025 16:31:05] "GET /api/eld-logs/list/ HTTP/1.1" 200 0
```

- `200` = Success ✅
- `404` = Not Found ⚠️
- `500` = Server Error ❌

---

## 🔐 Environment Variables (Optional)

Create `.env` file in `packages/django-backend/`:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
```

**For local development, this is optional** - Django uses safe defaults.

---

## ✅ Verification Checklist

Your backend is working correctly if:

- [ ] Server starts without errors
- [ ] Health endpoint returns `{"status": "OK"}`
- [ ] API root returns endpoint list
- [ ] ELD logs endpoint returns empty logs list
- [ ] No red errors in console
- [ ] Can access admin at `/admin/`

---

## 🚀 Next Steps

1. **Start Backend:**
   ```powershell
   cd packages\django-backend
   python manage.py runserver
   ```

2. **Start Frontend (in new terminal):**
   ```powershell
   cd packages\Client
   npm run dev
   ```

3. **Test Integration:**
   - Open frontend: `http://localhost:5173`
   - Fill in ELD form
   - Click "Create ELD Log"
   - Check Dashboard for saved log

4. **Deploy to Production:**
   - Follow [Quick Start Guide](./QUICK_START.md)
   - Deploy backend to Render
   - Deploy frontend to Vercel

---

## 💡 Pro Tips

1. **Keep server running** while developing - Django auto-reloads on code changes

2. **Check logs** if frontend can't connect:
   ```
   [21/Oct/2025 16:30:59] "GET /api/eld-logs/list/ HTTP/1.1" 200 0
   ```

3. **Use Django Admin** for quick data inspection:
   ```powershell
   python manage.py createsuperuser
   ```
   Then visit: `http://127.0.0.1:8000/admin/`

4. **Test API with curl** (PowerShell):
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
   ```

5. **Database browser** to see ELD logs:
   - Download: https://sqlitebrowser.org/
   - Open: `packages/django-backend/db.sqlite3`

---

## 📞 Still Having Issues?

If the backend won't start:

1. ✅ Check Python version: `python --version` (needs 3.8+)
2. ✅ Install dependencies: `pip install -r requirements.txt`
3. ✅ Run from correct directory: `packages\django-backend`
4. ✅ Check for port conflicts: `netstat -ano | findstr :8000`
5. ✅ Look for error messages in console

**Common Error Messages:**

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'django'` | Run `pip install -r requirements.txt` |
| `Error: That port is already in use` | Kill the process or use different port |
| `ImproperlyConfigured: The SECRET_KEY` | It's auto-generated, ignore warning |
| `No such file or directory: 'manage.py'` | Wrong directory, cd to django-backend |

---

**Your Django backend is ready to go! 🎉**

Just run: `python manage.py runserver` and start developing!
