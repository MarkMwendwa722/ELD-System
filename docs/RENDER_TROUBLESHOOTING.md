# Render.com Deployment Troubleshooting

## Common Error: "Route Not Found" or 404

### Possible Causes & Solutions

#### 1. Root Directory Not Set Correctly

**Problem:** Render can't find your code because the Root Directory is wrong.

**Solution:**
- For Express Backend: Set Root Directory to `packages/local-dev-backend`
- For Django Backend: Set Root Directory to `packages/django-backend`

**How to Fix:**
1. Go to your Render service → **Settings**
2. Find **Root Directory** field
3. Enter the correct path
4. Click **Save Changes**
5. Manually trigger a redeploy

---

#### 2. Build Command Failed

**Problem:** The build step is failing, so there's nothing to deploy.

**Solution - Express:**
```bash
# Build Command should be:
npm install && npm run build

# Start Command should be:
node dist/index.js
```

**Solution - Django:**
```bash
# Build Command should be:
pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate

# Start Command should be:
gunicorn config.wsgi:application
```

**How to Check:**
1. Go to your service → **Logs** tab
2. Look for errors in the build logs
3. Fix the error and redeploy

---

#### 3. Missing Dependencies

**Problem:** `package.json` or `requirements.txt` is missing or incomplete.

**Solution - Express:**
Check that `packages/local-dev-backend/package.json` exists and has:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1"
  }
}
```

**Solution - Django:**
Check that `packages/django-backend/requirements.txt` exists and has:
```
Django>=4.2
djangorestframework
django-cors-headers
gunicorn
```

---

#### 4. Port Configuration Issue

**Problem:** Your app is listening on the wrong port.

**Solution - Express:**
Make sure `packages/local-dev-backend/src/index.ts` has:
```typescript
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Solution - Django:**
Gunicorn automatically uses Render's PORT environment variable.

---

#### 5. Start Command Incorrect

**Problem:** Render doesn't know how to start your app.

**Fix in Render Dashboard:**
1. Go to service → **Settings**
2. Find **Start Command**
3. Set to:
   - Express: `node dist/index.js`
   - Django: `gunicorn config.wsgi:application`
4. Save and redeploy

---

#### 6. Health Check Failing

**Problem:** Render thinks your app isn't running because health checks fail.

**Solution:**
1. Go to service → **Settings** → **Health Check Path**
2. Set to:
   - Express: `/health`
   - Django: `/api/health` or leave empty
3. Save changes

**Verify Health Endpoint Works:**
- Express: Add this to your `index.ts`:
  ```typescript
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });
  ```
- Django: Add a simple view or leave empty

---

## Step-by-Step Debugging

### 1. Check Build Logs

1. Go to your Render service
2. Click on the latest deployment
3. Read the **Build Logs**
4. Look for red error messages

Common build errors:
- `Module not found` → Missing dependency
- `Command not found` → Wrong build command
- `Permission denied` → File permissions issue

### 2. Check Runtime Logs

1. Go to service → **Logs** tab
2. Look for the most recent logs
3. Check for errors after "Starting service"

Common runtime errors:
- `Cannot find module` → Build didn't complete
- `Port already in use` → Port configuration issue
- `ENOENT` → File not found, wrong path

### 3. Test Locally First

Before deploying, test the exact commands Render will use:

**Express:**
```bash
cd packages/local-dev-backend
npm install
npm run build
node dist/index.js
```

**Django:**
```bash
cd packages/django-backend
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
gunicorn config.wsgi:application
```

If it works locally but not on Render, the issue is likely environment-related.

---

## Quick Fixes Checklist

- [ ] Root Directory is set correctly
- [ ] Build Command is correct
- [ ] Start Command is correct  
- [ ] All dependencies are in package.json/requirements.txt
- [ ] PORT environment variable is used in code
- [ ] Health check endpoint exists (if configured)
- [ ] Environment variables are set in Render dashboard
- [ ] Build logs show successful completion
- [ ] Runtime logs don't show errors

---

## Still Having Issues?

### Get Help
1. **Copy the exact error** from Render logs
2. **Check which step fails**: Build or Runtime?
3. **Share the error** with the relevant context

### Common Questions

**Q: My build succeeds but I get 404**
A: Check your Start Command and make sure the server is actually starting. Look at runtime logs.

**Q: Build fails with "Module not found"**
A: Add the missing module to package.json dependencies and push the change.

**Q: Service shows "Deploying" forever**
A: Check if your health check is configured correctly or disable it temporarily.

**Q: It works locally but not on Render**
A: Check environment variables and make sure your code uses `process.env.PORT`.

---

## Manual Configuration (Without render.yaml)

You don't need `render.yaml` files. Just configure everything in the Render dashboard:

### Express Backend Configuration

**Settings:**
- Environment: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/index.js`
- Root Directory: `packages/local-dev-backend`

**Environment Variables:**
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-frontend-url.vercel.app`

### Django Backend Configuration

**Settings:**
- Environment: `Python 3`
- Build Command: `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
- Start Command: `gunicorn config.wsgi:application`
- Root Directory: `packages/django-backend`

**Environment Variables:**
- `SECRET_KEY=<generate-random-key>`
- `DEBUG=False`
- `ALLOWED_HOSTS=your-render-url.onrender.com`
- `FRONTEND_URL=https://your-frontend-url.vercel.app`

---

Need more help? Share the specific error message and I'll help you fix it!
