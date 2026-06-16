import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Predictions from './pages/Predictions';
import Alertes from './pages/Alertes';
import './App.css';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Backend non disponible:', err));
  }, []);

  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <span className="icon">🏺</span>
            <div>
              <h1>RAHTI</h1>
              <p className="subtitle">Système Intelligent de Gestion des Stocks</p>
              <p className="subtitle-small">Artisanat Marocain | Design Patterns: Strategy, Factory, Observer</p>
            </div>
          </div>
          {health && (
            <div className="status">
              <span className={`status-dot ${health.status === 'healthy' ? 'green' : 'red'}`}></span>
              <span>Backend: {health.model_type} | R²: {health.model_metrics?.r2?.toFixed(3) || 'N/A'}</span>
            </div>
          )}
        </header>

        {/* Navigation */}
        <nav className="nav">
          <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''} end>
            📊 Dashboard
          </NavLink>
          <NavLink to="/stocks" className={({isActive}) => isActive ? 'active' : ''}>
            📦 Stocks
          </NavLink>
          <NavLink to="/predictions" className={({isActive}) => isActive ? 'active' : ''}>
            🔮 Prédictions
          </NavLink>
          <NavLink to="/alertes" className={({isActive}) => isActive ? 'active' : ''}>
            🚨 Alertes
          </NavLink>
        </nav>

        {/* Routes */}
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard apiUrl={API_URL} />} />
            <Route path="/stocks" element={<Stocks apiUrl={API_URL} />} />
            <Route path="/predictions" element={<Predictions apiUrl={API_URL} />} />
            <Route path="/alertes" element={<Alertes apiUrl={API_URL} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>RAHTI Pro © 2025 - ENSIAS Projet Innovation</p>
          <p>Architecture: Strategy + Factory Method + Observer + Singleton</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
