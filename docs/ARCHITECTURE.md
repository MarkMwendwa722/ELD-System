# Architecture & Data Flow

## System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                         USER'S BROWSER                        │
│                  https://eld-system-frontend.vercel.app       │
│                                                               │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             │ HTTPS Requests
                             │ (JSON data)
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                    VERCEL (Frontend Host)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  React + Vite App                                   │     │
│  │  - Trip Planning Page                               │     │
│  │  - ELD Dashboard                                    │     │
│  │  - Map Components                                   │     │
│  │  - API Service (api.ts)                             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             │ API Calls
                             │ GET /api/eld-logs/list/
                             │ POST /api/eld-logs/
                             │ GET /api/route
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│              RENDER.COM (Django Backend Host)                 │
│            https://spotter-django-api.onrender.com            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Django REST API                                    │     │
│  │                                                     │     │
│  │  Endpoints:                                         │     │
│  │  - / (root info)                                    │     │
│  │  - /health (status check)                           │     │
│  │  - /api/eld-logs/ (create log)                      │     │
│  │  - /api/eld-logs/list/ (get logs)                   │     │
│  │  - /api/route (route planning)                      │     │
│  │  - /api/geocode (address → coords)                  │     │
│  │  - /api/reverse-geocode (coords → address)          │     │
│  │  - /api/location-suggestions (autocomplete)         │     │
│  │                                                     │     │
│  └──────────────────────┬──────────────────────────────┘     │
│                         │                                     │
│                         ▼                                     │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  SQLite Database                                    │     │
│  │  - ELD Logs                                         │     │
│  │  - Driver Profiles                                  │     │
│  │  - User Accounts                                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             │ External API Calls
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                   GOOGLE MAPS API                             │
│                                                               │
│  - Directions API (route planning)                            │
│  - Geocoding API (address ↔ coordinates)                      │
│  - Places API (location autocomplete)                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Request Flow Examples

### Example 1: Creating an ELD Log

```
1. User fills form on Trip Planning page
   ├─ Selects activity status: "Driving"
   ├─ Enters pickup: "New York, NY"
   ├─ Enters dropoff: "Boston, MA"
   └─ Clicks "Create ELD Log"

2. Frontend (api.ts)
   ├─ Validates form data
   ├─ Formats timestamps to ISO format
   ├─ Makes POST request:
   │  └─ URL: https://spotter-django-api.onrender.com/api/eld-logs/
   └─ Includes JSON body with all log data

3. Django Backend (views.py)
   ├─ Receives request at create_eld_log view
   ├─ Validates required fields
   ├─ Creates/gets driver user account
   ├─ Parses coordinates and timestamps
   ├─ Saves ELDLog to database
   └─ Returns JSON response: {"log_id": 1, "message": "Success"}

4. Frontend
   ├─ Receives response
   ├─ Shows success message
   └─ Optionally redirects to Dashboard
```

### Example 2: Viewing ELD Dashboard

```
1. User navigates to /dashboard

2. Frontend (ELDDashboard.tsx)
   ├─ Loads with selected date (today)
   ├─ Calls getELDLogs() from api.ts
   └─ Shows loading spinner

3. API Service (api.ts)
   ├─ Makes GET request:
   │  └─ URL: https://spotter-django-api.onrender.com/api/eld-logs/list/
   ├─ Includes query params:
   │  ├─ driver_username: "default_driver"
   │  ├─ start_date: "2025-10-21T00:00:00"
   │  ├─ end_date: "2025-10-21T23:59:59"
   │  ├─ limit: 100
   │  └─ offset: 0
   └─ Waits for response

4. Django Backend (views.py)
   ├─ Receives request at get_eld_logs view
   ├─ Queries database with filters
   ├─ Orders logs by start_time
   ├─ Applies pagination (limit/offset)
   ├─ Formats each log as JSON
   └─ Returns: {"logs": [...], "count": 5, "status": "success"}

5. Frontend
   ├─ Receives logs array
   ├─ Calculates durations for each log
   ├─ Sums up driving, on-duty, off-duty times
   ├─ Displays summary cards
   ├─ Renders activity timeline
   └─ If logs have coordinates, shows map
```

### Example 3: Route Planning

```
1. User enters pickup and dropoff locations

2. Frontend
   ├─ Geocodes addresses to coordinates
   │  ├─ Calls: /api/geocode?address=New+York
   │  └─ Gets: [longitude, latitude]
   └─ Shows markers on map

3. User clicks "Plan Trip"

4. Frontend (api.ts)
   ├─ Calls getRoute()
   └─ Makes GET request:
      └─ URL: /api/route?pickupLongitude=-74&pickupLatitude=40&...

5. Django Backend (views.py)
   ├─ Receives request at get_route view
   ├─ Calls Google Maps Directions API
   ├─ Receives route with polyline
   ├─ Decodes polyline to coordinates
   └─ Returns: {"route": {"geometry": {...}, "distance": 345000, "duration": 14400}}

6. Frontend (EnhancedMap.tsx)
   ├─ Receives route geometry
   ├─ Draws route line on map
   ├─ Displays distance (345 km)
   └─ Displays duration (4 hours)
```

---

## Data Models

### ELD Log

```python
{
  "id": 1,
  "driver_username": "default_driver",
  "driver_first_name": "John",
  "driver_last_name": "Doe",
  "driver_email": "john@example.com",
  "activityStatus": "driving",
  "currentLocation": "New York, NY",
  "currentLatitude": 40.7128,
  "currentLongitude": -74.0060,
  "pickupLocation": "Times Square, NYC",
  "pickupLatitude": 40.7580,
  "pickupLongitude": -73.9855,
  "dropoffLocation": "Boston, MA",
  "dropoffLatitude": 42.3601,
  "dropoffLongitude": -71.0589,
  "startTime": "2025-10-21T08:00:00Z",
  "endTime": "2025-10-21T12:30:00Z",
  "remarks": "Highway traffic was heavy",
  "currentCycleUsed": 4.5,
  "odometerReading": 125340,
  "engineHours": 3200.5,
  "vehicleId": "TRUCK-001",
  "createdAt": "2025-10-21T08:00:00Z",
  "updatedAt": "2025-10-21T12:30:00Z"
}
```

### Route Response

```json
{
  "route": {
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [-74.0060, 40.7128],
        [-73.9855, 40.7580],
        [-73.5673, 41.0534],
        [-71.0589, 42.3601]
      ]
    },
    "distance": 345000,
    "duration": 14400
  },
  "status": "success"
}
```

### Location Suggestion

```json
{
  "name": "Times Square",
  "fullAddress": "Times Square, Manhattan, NY 10036, USA",
  "coordinates": [-73.9855, 40.7580]
}
```

---

## Environment Configuration

### Development (Local)

```
Frontend:
- Runs on: http://localhost:5173
- API calls go to: http://localhost:8000/api

Backend:
- Runs on: http://localhost:8000
- Database: db.sqlite3 (local file)
- DEBUG=True
```

### Production (Deployed)

```
Frontend (Vercel):
- Runs on: https://eld-system-frontend.vercel.app
- API calls go to: https://spotter-django-api.onrender.com/api
- Environment variable: VITE_API_BASE_URL

Backend (Render):
- Runs on: https://spotter-django-api.onrender.com
- Database: Persistent SQLite volume
- DEBUG=False
- CORS: Allows requests from Vercel domain
```

---

## Security & CORS

### How CORS Works

```
1. Browser makes request from Vercel to Render
   ├─ Origin: https://eld-system-frontend.vercel.app
   └─ Destination: https://spotter-django-api.onrender.com

2. Browser first sends OPTIONS request (preflight)
   └─ Checks if backend allows cross-origin requests

3. Django CORS Middleware
   ├─ Checks CORS_ALLOWED_ORIGINS list
   ├─ If origin matches, adds headers:
   │  ├─ Access-Control-Allow-Origin: https://eld-system-frontend.vercel.app
   │  ├─ Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS
   │  └─ Access-Control-Allow-Headers: Content-Type
   └─ Browser allows the request

4. Browser makes actual API request
   └─ Django processes and returns response
```

### Security Headers

Django automatically includes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (configurable)

---

## Database Schema

```sql
-- ELD Logs Table
CREATE TABLE routes_eldlog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    activity_status VARCHAR(50) NOT NULL,
    current_location TEXT NOT NULL,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    pickup_location TEXT,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    dropoff_location TEXT,
    dropoff_latitude DECIMAL(10, 8),
    dropoff_longitude DECIMAL(11, 8),
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    remarks TEXT,
    current_cycle_used DECIMAL(5, 2),
    odometer_reading INTEGER,
    engine_hours DECIMAL(10, 2),
    vehicle_id VARCHAR(50),
    is_edited BOOLEAN DEFAULT 0,
    edit_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES auth_user(id)
);

-- Users Table (Django default)
CREATE TABLE auth_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    email VARCHAR(254),
    password VARCHAR(128),
    is_active BOOLEAN DEFAULT 1,
    is_staff BOOLEAN DEFAULT 0,
    is_superuser BOOLEAN DEFAULT 0,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Scaling Considerations

### Current (Free Tier)
- ✅ Perfect for development and testing
- ✅ Handles low to moderate traffic
- ⚠️ Render spins down after 15 min inactivity
- ⚠️ Limited database size (SQLite)

### Future Growth (Paid Tier)
- 🚀 24/7 uptime (no spin-down)
- 🚀 PostgreSQL database (more robust)
- 🚀 Multiple instances (load balancing)
- 🚀 Custom domain support
- 🚀 More CPU and memory

---

## Monitoring & Logging

### What to Monitor

**Backend (Render):**
- Request count and response times
- Error rates (4xx, 5xx)
- Database query performance
- Memory and CPU usage

**Frontend (Vercel):**
- Page load times
- API call success rates
- JavaScript errors
- User engagement metrics

### Log Locations

**Render Logs:**
```
Dashboard → Your Service → Logs tab
Shows:
- Incoming HTTP requests
- Python print statements
- Django errors and warnings
- Database queries (if DEBUG=True)
```

**Vercel Logs:**
```
Dashboard → Project → Deployments → View Function Logs
Shows:
- Build logs
- Function invocations
- Runtime errors
```

**Browser Console:**
```
F12 → Console tab
Shows:
- JavaScript errors
- API request/response details
- CORS errors
- Network failures
```

---

## Backup & Recovery

### Database Backups

**Manual backup:**
```bash
# SSH into Render service
cd /opt/render/project/src
cp db.sqlite3 db.sqlite3.backup
```

**Recommended:** Upgrade to PostgreSQL for:
- Automatic backups
- Point-in-time recovery
- Better concurrency
- Larger capacity

### Code Recovery

All code is in Git:
```bash
# Rollback to previous version
git log  # Find commit hash
git reset --hard <commit-hash>
git push --force
```

Render and Vercel will auto-redeploy.

---

## Performance Tips

1. **Enable caching:**
   - Cache geocoding results
   - Cache frequently accessed logs
   - Use Django's cache framework

2. **Optimize queries:**
   - Use `select_related()` for foreign keys
   - Add database indexes
   - Limit query result sizes

3. **Frontend optimization:**
   - Lazy load components
   - Debounce API calls
   - Cache map tiles

4. **API rate limiting:**
   - Implement rate limiting
   - Use Django REST Framework throttling
   - Monitor API usage

---

**This architecture provides a solid foundation for your ELD management system! 🚀**
