# Troubleshooting Guide - ELD System

## Data Not Submitting to Database

If your activity logs are not being saved to the database, follow these steps:

### 1. Check Backend Server is Running

The Django backend must be running on port 8000:

```powershell
cd packages\django-backend
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### 2. Test Backend Connection

Click the "Test Backend" button on the Trip Planning page, or manually test:

```powershell
# In PowerShell
Invoke-WebRequest -Uri http://localhost:8000/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "Spotter Django API",
  "version": "1.0.0"
}
```

### 3. Check MongoDB Connection

Verify the `.env` file exists in `packages/django-backend/.env` with:
```
MONGODB_URI=mongodb+srv://your-connection-string
MONGODB_NAME=spotter_db
```

### 4. Check Browser Console

Open Browser DevTools (F12) → Console tab:
- Look for error messages starting with "Error creating ELD log:"
- Check Network tab for failed requests to `http://localhost:8000/api/eld-logs/`

### 5. Common Issues

#### Issue: "No response from server"
**Solution**: Backend is not running. Start it with `python manage.py runserver`

#### Issue: "CORS error"
**Solution**: Check that `CORS_ALLOW_ALL_ORIGINS = True` in `config/settings.py`

#### Issue: "MongoDB connection failed"
**Solution**: 
- Verify MongoDB Atlas cluster is running
- Check MONGODB_URI in `.env` file
- Test connection: `python manage.py shell` then `from config.mongodb import get_database; db = get_database(); print(db.name)`

#### Issue: "Port 8000 is in use"
**Solution**: 
```powershell
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### 6. Check Activity Submission

With enhanced logging, you should see in the browser console:
```
Submitting activity 1/3: {activityStatus: "driving", ...}
Activity 1 submitted successfully: {log_id: "...", message: "ELD log created successfully"}
```

### 7. Verify Data in MongoDB

To confirm data was saved:

1. Visit MongoDB Atlas dashboard
2. Navigate to your cluster → Browse Collections
3. Check `spotter_db` → `eld_logs` collection
4. Look for recent entries with your activity data

### 8. Backend Logs

Check the Django console for incoming requests:
```
POST /api/eld-logs/ HTTP/1.1" 201
```

Status codes:
- **201**: Success - data saved
- **400**: Bad request - check data format
- **500**: Server error - check backend logs

### Still Having Issues?

1. Restart both servers:
   ```powershell
   # Kill all processes
   # Terminal 1 - Backend
   cd packages\django-backend
   python manage.py runserver
   
   # Terminal 2 - Frontend
   cd packages\frontend
   npm run dev
   ```

2. Clear browser cache and reload

3. Check the enhanced error messages in toast notifications - they now show specific error details

4. Review the console logs - detailed logging has been added for debugging
