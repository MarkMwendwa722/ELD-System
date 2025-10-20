import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <header className="App-header">
          <h1>🔍 Spotter Project</h1>
          <p>Full-Stack Application with Django + TypeScript + React</p>
          
          <div className="service-status">
            <div className="status-card">
              <h3>Django Backend</h3>
              <p>Port: 8000</p>
              <a href="http://localhost:8000/admin" target="_blank" rel="noopener noreferrer">
                Admin Panel
              </a>
            </div>
            
            <div className="status-card">
              <h3>TypeScript API</h3>
              <p>Port: 3001</p>
              <a href="http://localhost:3001/health" target="_blank" rel="noopener noreferrer">
                Health Check
              </a>
            </div>
            
            <div className="status-card">
              <h3>React Frontend</h3>
              <p>Port: 3000</p>
              <span>Current Page</span>
            </div>
          </div>
        </header>
      </div>
    </QueryClientProvider>
  );
}

export default App;
