# 🎯 Quick Start: Deploy Your Full-Stack ELD System

**Time to deploy: 15-20 minutes**

## What You're Deploying

- **Frontend:** React app on Vercel → `https://eld-system-frontend.vercel.app`
- **Backend:** Django API on Render → `https://your-service-name.onrender.com`
- **Connection:** Frontend calls backend via HTTPS

---

## Step-by-Step Deployment

### 📦 STEP 1: Deploy Django Backend to Render (10 min)

1. **Go to Render.com**
   - Visit: https://dashboard.render.com
   - Click: **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Connect your GitHub account
   - Select repository: `ELD-System`
   - Click: **"Connect"**

3. **Configure Service**
   
   Fill in these fields:

   | Field | Value |
   |-------|-------|
   | Name | `spotter-django-api` |
   | Root Directory | `packages/django-backend` |
   | Environment | `Python 3` |
   | Region | Oregon (or closest to you) |
   | Branch | `main` |
   | Build Command | `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate` |
   | Start Command | `gunicorn config.wsgi:application` |
   | Instance Type | `Free` |

4. **Add Environment Variables**
   
   Click **"Advanced"**, then add these variables:

   | Key | Value |
   |-----|-------|
   | `SECRET_KEY` | Click "Generate" button |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `localhost` (we'll update this later) |
   | `FRONTEND_URL` | `https://eld-system-frontend.vercel.app` |
   | `PYTHON_VERSION` | `3.11.0` |

5. **Deploy!**
   - Click: **"Create Web Service"**
   - Wait 3-5 minutes for deployment
   - ✅ When done, you'll see: "Live" status

6. **Get Your Backend URL**
   - At the top of the page, you'll see your URL
   - Example: `https://spotter-django-api.onrender.com`
   - **COPY THIS URL** - you'll need it for next steps!

7. **Test Your Backend**
   
   Open these URLs in your browser:
   
   - Health check: `https://your-service-name.onrender.com/health`
     - Should show: `{"status": "OK"}`
   
   - API root: `https://your-service-name.onrender.com/`
     - Should show: API information JSON
   
   ✅ If both work, your backend is deployed!

---

### 🎨 STEP 2: Configure Frontend on Vercel (5 min)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Go to your project: `eld-system-frontend`

2. **Add Environment Variable**
   - Click: **Settings** → **Environment Variables**
   - Add new variable:
   
   | Name | Value |
   |------|-------|
   | `VITE_API_BASE_URL` | `https://your-service-name.onrender.com/api` |
   
   ⚠️ **Important:** 
   - Replace `your-service-name` with YOUR actual Render URL
   - Include `/api` at the end
   - No trailing slash

   Example:
   ```
   VITE_API_BASE_URL=https://spotter-django-api.onrender.com/api
   ```

3. **Redeploy Frontend**
   - Go to: **Deployments** tab
   - Click ⋯ (three dots) on latest deployment
   - Click: **"Redeploy"**
   - Wait 1-2 minutes

---

### 🔗 STEP 3: Update CORS Settings (2 min)

Now we need to allow your Vercel frontend to call your Render backend.

1. **Go Back to Render**
   - Go to your service: `spotter-django-api`
   - Click: **Environment** tab

2. **Update ALLOWED_HOSTS**
   - Find the `ALLOWED_HOSTS` variable
   - Update value to include your Render AND Vercel URLs:
   
   ```
   spotter-django-api.onrender.com,eld-system-frontend.vercel.app,localhost
   ```
   
   ⚠️ Format: `render-url,vercel-url,localhost`
   - No spaces
   - No `https://`
   - Comma-separated

3. **Save**
   - Click: **"Save Changes"**
   - Service will automatically redeploy (takes ~3 min)

---

### ✅ STEP 4: Test Everything (5 min)

1. **Visit Your Frontend**
   ```
   https://eld-system-frontend.vercel.app
   ```

2. **Test Trip Planning**
   - Go to Trip Planning page (/)
   - Enter pickup: "New York, NY"
   - Enter dropoff: "Boston, MA"
   - Click: "Plan Trip"
   - ✅ Should show route on map

3. **Test ELD Log Creation**
   - Fill in all fields on Trip Planning page
   - Select activity status
   - Enter start/end times
   - Click: "Create ELD Log"
   - ✅ Should show success message

4. **Test Dashboard**
   - Click: "ELD Dashboard" link
   - Select today's date
   - ✅ Should show your created log

5. **Check for Errors**
   - Press F12 to open browser console
   - Look for any red errors
   - ✅ Should be no CORS errors

---

## 🎉 Success!

If all tests passed, your system is fully deployed and working!

**Your URLs:**
- Frontend: `https://eld-system-frontend.vercel.app`
- Backend: `https://your-service-name.onrender.com`

---

## 🚨 Troubleshooting

### Problem: "Failed to fetch" or CORS Error

**Check:**
1. VITE_API_BASE_URL is set correctly on Vercel
2. ALLOWED_HOSTS includes your Vercel domain on Render
3. FRONTEND_URL matches your Vercel domain exactly

**Fix:**
- Verify environment variables match exactly
- Redeploy both services after changes

### Problem: Backend Returns 404

**Check:**
1. Root Directory is `packages/django-backend`
2. Health endpoint works: `/health`

**Fix:**
- Update Root Directory in Render Settings
- Save and redeploy

### Problem: Backend Times Out

**This is normal for free tier!**
- Render spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Subsequent requests are fast

**Solution:**
- Wait for service to wake up
- Or upgrade to paid tier for 24/7 availability

### Problem: Data Doesn't Persist

**Check:**
1. Database migrations ran in build command
2. Check Render logs for migration errors

**Fix:**
- Verify build command includes `python manage.py migrate`
- Redeploy

---

## 📚 Next Steps

Now that your system is deployed:

1. **Share your app** - Anyone can use your Vercel URL
2. **Monitor usage** - Check Render and Vercel dashboards
3. **Add features** - Make changes, git push, auto-redeploys!
4. **Review docs:**
   - [Complete Integration Guide](./COMPLETE_INTEGRATION_GUIDE.md)
   - [Architecture Overview](./ARCHITECTURE.md)
   - [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

---

## 🔄 Making Updates

### Update Backend Code

```bash
# Make changes to files in packages/django-backend
git add .
git commit -m "Update backend"
git push
```

Render automatically redeploys (3-5 min).

### Update Frontend Code

```bash
# Make changes to files in packages/Client
git add .
git commit -m "Update frontend"
git push
```

Vercel automatically redeploys (1-2 min).

---

## 💡 Pro Tips

1. **First Request Slow?** 
   - Free tier spins down after 15 min
   - Upgrade to paid tier for 24/7 uptime

2. **Testing Locally?**
   ```bash
   # Terminal 1: Django
   cd packages/django-backend
   python manage.py runserver
   
   # Terminal 2: React
   cd packages/Client
   npm run dev
   ```

3. **Check Logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → View Logs
   - Browser: F12 → Console

4. **Environment Variables:**
   - Always set before deploying
   - Changes require redeploy
   - Check spelling carefully!

---

## 📞 Need Help?

**Check these first:**
1. Browser console (F12) for frontend errors
2. Render logs for backend errors
3. Verify all URLs match exactly
4. Test API endpoints directly in browser

**Common fixes:**
- Update environment variables
- Verify Root Directory setting
- Check CORS configuration
- Wait for service wake-up (free tier)

---

## 🎯 Deployment Checklist

Before you start, make sure:

- [ ] Code is committed and pushed to GitHub
- [ ] You have Render.com account
- [ ] You have Vercel account
- [ ] Repository is connected to both platforms

During deployment:

- [ ] Django deployed to Render successfully
- [ ] Backend health check returns 200 OK
- [ ] Environment variables set on Vercel
- [ ] Frontend redeployed after adding variables
- [ ] ALLOWED_HOSTS updated with Vercel domain
- [ ] Backend redeployed after CORS update

After deployment:

- [ ] Frontend loads without errors
- [ ] Can plan routes successfully
- [ ] Can create ELD logs
- [ ] Can view logs on dashboard
- [ ] No CORS errors in browser console

---

**You're all set! Happy deploying! 🚀**

If you get stuck, refer to the detailed guides in the `docs/` folder.
