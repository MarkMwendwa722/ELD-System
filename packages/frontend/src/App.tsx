import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TripPlanningPage from './pages/TripPlanningPage';
import ELDDashboard from './pages/ELDDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TripPlanningPage />} />
          <Route path="/dashboard" element={<ELDDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
