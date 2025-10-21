# 🚛 ELD Spotter - Professional Route Planning & ELD Compliance Management

A comprehensive full-stack application for trucking professionals that combines intelligent route planning with Electronic Logging Device (ELD) compliance monitoring.

## 🎯 Features

### ✅ Current Features (Interface Complete)
- **Trip Planning Form**: Input current location, pickup location, dropoff location, and current cycle hours
- **ELD Compliance Monitoring**: Real-time cycle hour tracking with visual progress indicators
- **Route Display**: Comprehensive route instructions with step-by-step navigation
- **Compliance Predictions**: Projections of cycle hour usage after trip completion
- **Professional UI**: Modern, responsive design optimized for trucking operations
- **API Backend**: RESTful endpoints for trip planning and ELD data management

### 🚧 Planned Features (Next Phase)
- **Real-time Route Optimization**: Integration with mapping services (Google Maps, HERE, etc.)
- **Live ELD Integration**: Connect with actual ELD devices and systems
- **Multi-day Trip Planning**: Extended route planning with required rest periods
- **Weather Integration**: Real-time weather conditions affecting routes
- **Fuel Stop Optimization**: Strategic fuel stop planning based on route and truck specs
- **Driver Performance Analytics**: Historical data and performance metrics

## 📁 Project Structure

```
packages/
├── Client/                 # React Frontend (Port 3000)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TripPlanningPage.tsx    # Main trip planning interface
│   │   │   └── RouteDisplayPage.tsx    # Route results and ELD analysis
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── Server/                 # TypeScript API Backend (Port 3001)
│   ├── src/
│   │   └── index.ts        # Express server with ELD endpoints
│   ├── package.json
│   └── tsconfig.json
│
└── eldspotter/            # Django Backend (Port 8000)
    └── backend/
        ├── manage.py
        ├── config/
        └── routes/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- npm or yarn

### Installation

1. **Clone and setup the workspace**
   ```bash
   git clone <repository-url>
   cd "Spotter project"
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Setup Python environment (Django)**
   ```bash
   cd eldspotter/backend
   python -m venv venv
   venv\Scripts\activate    # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   python manage.py migrate
   ```

### Running the Application

**Option 1: Individual Services**
```bash
# Terminal 1 - Django Backend
cd eldspotter/backend
python manage.py runserver

# Terminal 2 - TypeScript API
cd packages/Server
npm run dev

# Terminal 3 - React Frontend
cd packages/Client
npm run dev
```

**Option 2: VS Code Tasks** (Recommended)
1. Open `spotter-project.code-workspace`
2. Use Command Palette (`Ctrl+Shift+P`)
3. Run tasks:
   - "Start Django Development Server"
   - "Start TypeScript Backend" 
   - "Start Frontend Development Server"

## 🌐 Application Access

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| React Frontend | 3000 | http://localhost:3000 | Main application interface |
| TypeScript API | 3001 | http://localhost:3001 | ELD and routing endpoints |
| Django Backend | 8000 | http://localhost:8000 | Database and admin panel |

## 📋 How to Use

### 1. Trip Planning
1. **Enter Current Location**: Your starting point or current truck location
2. **Add Pickup Location**: Where you need to collect the load
3. **Add Dropoff Location**: Final destination for delivery
4. **Input Current Cycle Hours**: How many hours you've already used in your 70-hour cycle

### 2. ELD Compliance Check
- The app automatically calculates your compliance status
- Visual indicators show:
  - 🟢 **Green**: Safe, within limits
  - 🟡 **Yellow**: Warning, approaching 70-hour limit
  - 🔴 **Red**: Critical, near or exceeding federal limits

### 3. Route Analysis
- Click "Plan Trip & Generate Route" to see:
  - **Step-by-step driving directions**
  - **Projected ELD compliance after trip**
  - **Recommended fuel stops**
  - **Total distance and estimated driving time**

## 🔌 API Endpoints

### POST /api/plan-trip
Plan a route with ELD compliance analysis
```json
{
  "currentLocation": "Chicago, IL",
  "pickupLocation": "Detroit, MI", 
  "dropoffLocation": "Atlanta, GA",
  "currentCycleUsed": 45.5
}
```

### GET /api/eld-logs
Retrieve recent ELD activity logs

### POST /api/check-compliance
Check ELD compliance for given cycle hours
```json
{
  "currentCycleUsed": 45.5,
  "plannedDrivingHours": 6.25
}
```

## 🎨 User Interface

### Trip Planning Interface
- **Modern gradient design** with professional trucking aesthetics
- **Real-time validation** with helpful error messages
- **Visual cycle tracking** with progress bars and compliance indicators
- **Responsive design** that works on desktop, tablet, and mobile

### Route Display Interface
- **Interactive route steps** with clear turn-by-turn directions
- **ELD compliance dashboard** with projected cycle usage
- **Professional recommendations** for safe trip completion
- **Mock map placeholder** ready for integration with mapping services

## 🔧 Technical Implementation

### Frontend (React + TypeScript + Vite)
- **Modern React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **CSS Modules** with responsive design patterns
- **Form validation** with real-time feedback

### Backend (Express + TypeScript)
- **RESTful API** with proper error handling
- **CORS enabled** for cross-origin requests
- **Input validation** and sanitization
- **Mock data generation** for development

### Additional Backend (Django + Python)
- **Django REST Framework** for additional API capabilities
- **Database integration** ready for production data
- **Admin panel** for system management

## 🚀 Next Steps for Production

### Phase 1: Core Functionality
- [ ] Integrate with real mapping services (Google Maps, HERE)
- [ ] Connect to actual ELD device APIs
- [ ] Add user authentication and driver profiles
- [ ] Implement data persistence and trip history

### Phase 2: Advanced Features  
- [ ] Multi-day trip planning with mandatory rest periods
- [ ] Real-time traffic and weather integration
- [ ] Fuel optimization based on truck specifications
- [ ] Fleet management capabilities

### Phase 3: Analytics & Optimization
- [ ] Driver performance analytics
- [ ] Route optimization machine learning
- [ ] Predictive maintenance alerts
- [ ] Compliance reporting and exports

## 💡 Key Benefits

- **Compliance Focused**: Helps drivers stay within federal HOS regulations
- **Route Optimized**: Truck-friendly routes that avoid restrictions
- **Time Efficient**: Reduces planning time and improves delivery schedules  
- **Cost Effective**: Optimizes fuel stops and reduces operational costs
- **User Friendly**: Intuitive interface designed for professional drivers

## 📞 Support

For questions about implementation or extending functionality, refer to the code comments and API documentation within the source files.

---

**Built with ❤️ for the trucking industry** 🚛