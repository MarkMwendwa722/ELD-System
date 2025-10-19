# 🔍 Spotter Project

A full-stack monorepo application combining Django (Python), TypeScript/Node.js, and React.

## 🏗️ Project Structure

```
spotter-project/
├── eldspotter/               # Django Backend
│   └── backend/
│       ├── manage.py
│       ├── requirements.txt
│       └── config/
├── packages/                 # TypeScript/Node.js Components
│   ├── backend/             # TypeScript API Server
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/            # React Frontend
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
└── spotter-project.code-workspace  # VS Code Workspace
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm 7+

### 1. Open VS Code Workspace
```bash
code spotter-project.code-workspace
```

### 2. Setup Python Environment (Django)
```bash
cd eldspotter/backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 3. Install Node.js Dependencies
```bash
# From project root
npm run bootstrap
```

### 4. Start Development Servers (Frontend and Backend)
```bash
# From project root
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:5173 

## ✨ New Features

### Location-Based Trip Planning
- Geolocation to automatically detect user's current position
- Road-based routing using MapTiler API
- Address suggestions for pickup and dropoff locations
- Interactive map visualization of routes
- Backend API for efficient processing of geocoding and routing requests

### Backend API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/geocode` - Convert address to coordinates
- `GET /api/reverse-geocode` - Convert coordinates to address
- `GET /api/location-suggestions` - Get location suggestions based on search input
- `GET /api/route` - Get road-based route between two points
```

### 4. Start Development Servers

**All at once:**
- Use VS Code Command Palette (`Ctrl+Shift+P`)
- Run tasks: "Start Django Development Server", "Start TypeScript Backend", "Start Frontend Development Server"

**Manually:**
```bash
# Django (Terminal 1)
cd eldspotter/backend
venv\Scripts\activate
python manage.py runserver

# TypeScript API (Terminal 2)
cd packages/backend
npm run dev

# React Frontend (Terminal 3)
cd packages/frontend
npm run dev
```

## 🌐 Services

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Django Backend | 8000 | http://localhost:8000 | Python/Django API |
| TypeScript API | 3001 | http://localhost:3001 | Node.js/TypeScript API |
| React Frontend | 3000 | http://localhost:3000 | React Application |

## 🛠️ Development

### Available Scripts (Root)
```bash
npm run start:backend     # Start TypeScript backend
npm run start:frontend    # Start React frontend  
npm run build            # Build all packages
npm run lint             # Lint all TypeScript code
```

### VS Code Features
- Multi-root workspace configuration
- Integrated terminal sessions
- Python environment auto-detection
- TypeScript IntelliSense
- ESLint integration
- Auto-formatting on save

### Environment Variables
- Backend: `packages/backend/.env`
- Frontend: `packages/frontend/.env`

## 🔧 Configuration

### TypeScript Backend (`packages/backend`)
- Express.js server
- CORS enabled for frontend
- Health check endpoint: `/health`
- API routes: `/api/*`

### React Frontend (`packages/frontend`)
- Vite build tool
- React 18 with TypeScript
- Proxy configuration for API calls
- TanStack Query for state management

### Django Backend (`eldspotter/backend`)
- Django REST Framework
- Admin interface available
- Database: SQLite (development)

## 📦 Build & Deploy

```bash
# Build all packages
npm run build

# Individual builds
cd packages/backend && npm run build
cd packages/frontend && npm run build

# Django static files
cd eldspotter/backend && python manage.py collectstatic
```

## 🐛 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000, 3001, 8000 are available
2. **Python virtual environment**: Ensure venv is activated
3. **Node modules**: Run `npm install` from project root
4. **TypeScript errors**: Install dependencies with `npm install`

### VS Code Tasks
Use the Command Palette (`Ctrl+Shift+P`) to run predefined tasks:
- Install All Dependencies
- Setup Python Virtual Environment
- Start Development Servers
- Build All

## 📝 License

This project is licensed under the MIT License.
