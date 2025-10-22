# Complete Deployment Checklist

## Issue: Frontend not connecting to Backend

### Root Cause
The deployed frontend was using `/api` (relative path) instead of the absolute Render backend URL.

### ✅ Solutions Applied

1. **Updated `.env.production`**
   - Changed from: `VITE_API_BASE_URL=/api`
   - Changed to: `VITE_API_BASE_URL=https://eld-system.onrender.com/api`

2. **Backend CORS & ALLOWED_HOSTS** (Already configured)
   - ✅ `ALLOWED_HOSTS=eld-system.onrender.com`
   - ✅ `CORS_ALLOW_ALL_ORIGINS=True` in settings.py

---

## 🚀 Action Required: Set Vercel Environment Variable

**This is the critical step to fix the issue!**

### Go to Vercel Dashboard:
1. Visit: https://vercel.com/dashboard
2. Select your project (ELD-System or whatever it's named)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://eld-system.onrender.com/api`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click the three dots on the latest deployment
9. Select **Redeploy** (this applies the env variable)

---

## 🔍 How to Verify It's Working

### 1. Check Backend is Live
Visit: https://eld-system.onrender.com/health

Should return:
```json
{
  "status": "OK",
  "service": "Spotter Django API",
  "version": "1.0.0"
}
```

### 2. Check Frontend Connection
1. Open your deployed Vercel site
2. Press F12 to open DevTools
3. Go to Console tab
4. Run:
```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```
Should output: `https://eld-system.onrender.com/api`

### 3. Test API Call
In your deployed site:
1. Try to submit an activity log
2. Check Network tab (F12 → Network)
3. Look for POST request to `https://eld-system.onrender.com/api/eld-logs/`
4. Should see status 201 (Created)

---

## 📋 Complete Deployment Configuration

### Frontend (Vercel)
**Environment Variables to Set:**
```
VITE_API_BASE_URL=https://eld-system.onrender.com/api
```

### Backend (Render)
**Environment Variables to Set:**
```
SECRET_KEY=<generate-secure-key>
DEBUG=False
ALLOWED_HOSTS=eld-system.onrender.com
FRONTEND_URL=<your-vercel-url>
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_NAME=spotter_db
```

---

## 🛠️ Troubleshooting

### Problem: 404 errors on API calls
**Check:**
- [ ] Environment variable is set in Vercel
- [ ] Redeployed after setting env var
- [ ] URL ends with `/api` (not just domain)

**Fix:** Redeploy from Vercel dashboard

### Problem: CORS errors
**Check:**
- [ ] Backend has `CORS_ALLOW_ALL_ORIGINS=True`
- [ ] Backend is running on Render

**Fix:** Check Render logs for errors

### Problem: Backend returns 400 Bad Request
**Check:**
- [ ] ALLOWED_HOSTS includes `eld-system.onrender.com`
- [ ] No `https://` prefix in ALLOWED_HOSTS
- [ ] No extra spaces in ALLOWED_HOSTS

**Fix:** Update Render environment variables

### Problem: Backend sleeping (free tier)
**Symptom:** First request takes 30-60 seconds
**Solution:** This is normal for Render free tier. Backend wakes up on first request.

---

## 📝 Testing Checklist

After deployment, test these features:

- [ ] Frontend loads without errors
- [ ] Can view dashboard
- [ ] Can add departure/destination locations
- [ ] Location autocomplete works
- [ ] Can add activities
- [ ] Can submit daily log
- [ ] Toast notifications appear
- [ ] Data saves to MongoDB
- [ ] Can view saved logs on dashboard
- [ ] Map displays correctly

---

## 🔄 Future Deployments

### Frontend Changes:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys on push
```

### Backend Changes:
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys on push
```

### Both Changed:
Push to main branch - both will deploy automatically.

---

## 💡 Important Notes

1. **Free tier limitations:**
   - Render: Backend sleeps after 15 min of inactivity
   - Vercel: 100GB bandwidth/month limit

2. **Environment variables:**
   - Changes require redeployment
   - Set in platform dashboards, not in code
   - Never commit production secrets to Git

3. **MongoDB Atlas:**
   - Ensure IP whitelist includes `0.0.0.0/0` (all IPs)
   - Or add Render's IP addresses

4. **HTTPS Only:**
   - Both Render and Vercel use HTTPS
   - No mixed content warnings

---

## ✅ Summary

**What was broken:**
- Frontend was looking for backend at `/api` (relative path)
- This resulted in 404 errors

**What was fixed:**
- Updated `.env.production` to use full Render URL
- Need to set `VITE_API_BASE_URL` in Vercel dashboard

**Next step:**
- **Set the Vercel environment variable** (see Action Required above)
- **Redeploy** from Vercel
- **Test** your deployed site

Once the Vercel environment variable is set and redeployed, everything should work! 🎉
