import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { createDatabase } from './database';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import './index.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize database
    createDatabase()
      .then(() => console.log('Database initialized successfully'))
      .catch((error) => console.error('Database initialization failed:', error));
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
