# 🎯 Quick Reference - Vercel Deployment

## One-Command Deployment

```bash
# 1. Commit and push
git add . && git commit -m "Deploy to Vercel" && git push

# 2. Go to vercel.com/new and import your repo
# 3. Click Deploy (use default settings)
```

## Key Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel configuration & routing |
| `api/*.ts` | Serverless API endpoints |
| `packages/frontend/dist` | Build output (auto-generated) |
| `.vercelignore` | Files to exclude from deployment |

## Build Configuration

```json
Build Command:    npm run build
Output Directory: packages/frontend/dist
Install Command:  npm install
```

## API Endpoints

| Local Dev | Production |
|-----------|------------|
| `http://localhost:8000/api/...` | `https://your-app.vercel.app/api/...` |

## Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables

```
VITE_API_BASE_URL=/api
```

## Testing Before Deploy

```bash
# Test build locally
npm run build

# Verify build succeeded
ls packages/frontend/dist

# Test with local server
npx serve packages/frontend/dist
```

## Common Commands

```bash
# Deploy with CLI
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Remove deployment
vercel remove [deployment-url]
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Route not found | Check `/api` folder has your endpoints |
| Build fails | Run `npm run build` locally first |
| 404 on refresh | Already fixed in `vercel.json` |
| Env vars not working | Add `VITE_` prefix for client-side vars |

## Support

- 📖 [Full Guide](./DEPLOYMENT_GUIDE.md)
- 🔧 [Vercel Docs](https://vercel.com/docs)
