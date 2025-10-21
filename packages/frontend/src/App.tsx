import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import TripPlanningPage from './pages/TripPlanningPage';
import ELDDashboard from './pages/ELDDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1D1C4E',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/trip-planning" element={<TripPlanningPage />} />
          <Route path="/dashboard" element={<ELDDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
