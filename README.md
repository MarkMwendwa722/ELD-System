# 🚛 Spotter ELD System

> **Electronic Logging Device (ELD) system for managing driver hours of service, trip planning, and route tracking.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## � Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [Contributing](#contributing)

## 🎯 Overview

Spotter ELD is a comprehensive fleet management solution that helps trucking companies and drivers maintain compliance with Hours of Service (HOS) regulations while optimizing route planning and tracking.

## ✨ Features

- **📊 ELD Compliance** - Track driver hours of service and maintain FMCSA compliance
- **🗺️ Route Planning** - Interactive map-based trip planning with MapLibre GL
- **📍 Geocoding** - Address lookup and reverse geocoding
- **📈 Dashboard** - Real-time driver status and activity monitoring
- **🔄 Real-time Updates** - Live tracking and status updates
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices

## 📁 Project Structure

```
spotter-eld-system/
├── api/                        # Vercel Serverless Functions (Production)
│   ├── health.ts              # Health check endpoint
│   ├── status.ts              # Status endpoint
│   ├── geocode.ts             # Geocoding service
│   └── reverse-geocode.ts     # Reverse geocoding service
│
├── packages/
│   ├── frontend/              # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── services/      # API and service utilities
│   │   │   └── styles/        # CSS and styling
│   │   └── dist/              # Build output (generated)
│   │
│   ├── local-dev-backend/     # Express.js Backend (Local Dev Only)
│   │   └── src/
│   │       └── index.ts       # Express server
│   │
│   └── django-backend/        # Django REST API (Local Dev Only)
│       ├── config/            # Django settings
│       ├── routes/            # API routes and models
│       └── manage.py          # Django management
│
├── docs/                       # Documentation
│   ├── QUICK_DEPLOY.md        # Quick deployment guide
│   ├── DEPLOYMENT_GUIDE.md    # Complete deployment guide
│   ├── ELD-GRID-FORMAT.md     # ELD data format specs
│   └── ELD-SPOTTER-README.md  # ELD system details
│
├── .github/                    # GitHub Actions & workflows
├── .vscode/                    # VS Code settings
├── vercel.json                # Vercel deployment config
├── .gitignore                 # Git ignore rules
└── package.json               # Root package configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (for Django backend)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/MarkMwendwa722/ELD-System.git
cd ELD-System

# Install dependencies
npm install

# Install Python dependencies (for Django)
cd packages/django-backend
pip install -r requirements.txt
cd ../..
```

## 💻 Development

### Start Frontend

```bash
# Start the React development server
npm run dev

# Opens at http://localhost:3000
```

### Start Django Backend (Optional)

```bash
# In a separate terminal
npm run dev:django

# Or manually:
cd packages/django-backend
python manage.py runserver

# Runs at http://localhost:8000
```

### Start Express Backend (Optional)

```bash
# For testing the Node.js backend locally
npm run dev:backend

# Runs at http://localhost:3001
```

## 🌐 Deployment

### Deploy to GitHub Pages (Recommended)

**3-Step Quick Deploy:**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to [Repository Settings → Pages](https://github.com/MarkMwendwa722/ELD-System/settings/pages)
   - Under "Source", select **GitHub Actions**
   - Click **Save**

3. **Visit Your Site:**
   - Wait 2-3 minutes for deployment
   - Visit: **https://markmwendwa722.github.io/ELD-System**

**Configuration:**
- ✅ GitHub Actions workflow configured
- ✅ Automatic deployment on push to main
- ✅ Free and simple

📖 **Detailed Guide:** See [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)

### Deploy Django Backend Separately

The Django backend should be deployed separately to:
- [Railway](https://railway.app)
- [Render](https://render.com)
- [Heroku](https://heroku.com)
- [PythonAnywhere](https://www.pythonanywhere.com)

## �️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **MapLibre GL** - Interactive maps
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend (Local Dev)
- **Express.js** - Node.js web framework
- **Django 4** - Python web framework
- **Django REST Framework** - API toolkit

### Production API
- **Vercel Serverless Functions** - Scalable API endpoints
- **TypeScript** - Serverless function logic

### DevOps
- **Vercel** - Hosting and deployment
- **GitHub Actions** - CI/CD
- **ESLint** - Code linting
- **Prettier** - Code formatting

## � Documentation

- **[Quick Deploy Guide](./docs/QUICK_DEPLOY.md)** - Fast deployment reference
- **[Complete Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[Deployment Summary](./docs/DEPLOYMENT_SUMMARY.md)** - Architecture overview
- **[ELD Format Specification](./docs/ELD-GRID-FORMAT.md)** - ELD data format
- **[ELD System Details](./docs/ELD-SPOTTER-README.md)** - System documentation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- FMCSA for ELD compliance standards
- MapLibre GL for mapping capabilities
- The open-source community

## 📧 Support

For questions or issues:
- Open an [issue](https://github.com/MarkMwendwa722/ELD-System/issues)
- Check the [documentation](./docs/)

---

**Built with ❤️ for the trucking industry**
