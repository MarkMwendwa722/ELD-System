# 🔧 Vercel Configuration Fix

## Issue
Error: "The specified Root Directory 'packages/backend' does not exist"

## ✅ Solution

This error occurs because Vercel has old settings cached. Here's how to fix it:

### Option 1: Update via Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings**
3. Go to **General** section
4. Find **Root Directory** setting
5. Make sure it's set to: `./` (root of repository)
6. **DO NOT** set it to `packages/backend` or any other subdirectory
7. Click **Save**

### Option 2: Update Build Settings

In the same Settings page:

#### Build & Development Settings:
```
Framework Preset:     Other
Root Directory:       ./          (leave blank or set to root)
Build Command:        npm run build
Output Directory:     packages/frontend/dist
Install Command:      npm install
```

### Option 3: Redeploy from Scratch

If the error persists:

1. Delete the project from Vercel
2. Re-import from GitHub
3. Use these settings:
   - **Root Directory:** `./` (or leave blank)
   - **Build Command:** `npm run build`
   - **Output Directory:** `packages/frontend/dist`
   - **Install Command:** `npm install`

### Option 4: Use Vercel CLI

```bash
# Remove existing deployment configuration
vercel remove [your-project-name]

# Redeploy with correct settings
vercel --prod
```

## Why This Happens

During refactoring, we renamed:
- `packages/backend` → `packages/local-dev-backend`

If Vercel had the old path cached, it will show this error.

## ✅ Correct Configuration

The project should be deployed from the **root directory** (`./`), not from a subdirectory.

### Current Structure:
```
./ (ROOT - Deploy from here)
├── api/                    # Serverless functions
├── packages/
│   ├── frontend/          # Frontend build source
│   ├── local-dev-backend/ # NOT deployed (local dev only)
│   └── django-backend/    # NOT deployed (local dev only)
├── vercel.json            # Configuration
└── package.json           # Build scripts
```

### What Gets Deployed:
✅ `api/` - Serverless functions  
✅ `packages/frontend/dist/` - Built frontend  
❌ `packages/local-dev-backend/` - Excluded  
❌ `packages/django-backend/` - Excluded  

## Verification

After fixing settings, verify:

```bash
# Check vercel.json is correct
cat vercel.json

# Test build locally
npm run build

# Deploy
vercel --prod
```

## Need Help?

If the issue persists:
1. Check Vercel deployment logs
2. Ensure you're deploying from the correct branch (`main`)
3. Verify `.vercelignore` is excluding dev backends
4. Contact Vercel support if needed

---

**Quick Fix:** Just set Root Directory to `./` in Vercel Dashboard → Settings → General
