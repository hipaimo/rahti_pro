import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Predictions from './pages/Predictions';
import Alertes from './pages/Alertes';
import Recommandations from './pages/Recommandations';
import Simulation from './pages/Simulation';
import './App.css';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [health, setHealth] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Backend non disponible:', err));

    // Horloge en temps réel
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => date.toLocaleDateString('fr-MA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatTime = (date) => date.toLocaleTimeString('fr-MA', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <Router>
      <div className="app">

        {/* ── HEADER ── */}
        <header className="header">
          {/* Gauche: logo + titre */}
          <div className="logo">
            <span className="icon">🏺</span>
            <div>
              <h1>RAHTI <span style={{ fontSize:'1rem', fontWeight:400, opacity:0.85 }}>Pro</span></h1>
              <p className="subtitle">Système Intelligent de Gestion des Stocks — Artisanat Marocain</p>
              <div style={{ display:'flex', gap:'12px', marginTop:'4px', flexWrap:'wrap' }}>
                {['Strategy Pattern','Factory Method','Observer','Singleton'].map(dp => (
                  <span key={dp} style={{
                    fontSize:'0.7rem', background:'rgba(255,255,255,0.2)',
                    padding:'2px 8px', borderRadius:'12px', opacity:0.9
                  }}>{dp}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Droite: statut + date/heure */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
            {/* Statut backend */}
            <div className="status">
              <span className={`status-dot ${health?.status === 'healthy' ? 'green' : 'red'}`}></span>
              <span style={{ fontSize:'0.85rem' }}>
                {health ? `Modèle: ${health.model_type} | R²: ${health.model_metrics?.r2?.toFixed(3) || 'N/A'}` : 'Connexion...'}
              </span>
            </div>
            {/* Date & heure */}
            <div style={{
              background:'rgba(255,255,255,0.15)', borderRadius:'10px',
              padding:'6px 14px', textAlign:'right'
            }}>
              <div style={{ fontSize:'0.78rem', opacity:0.85 }}>{formatDate(currentTime)}</div>
              <div style={{ fontSize:'1rem', fontWeight:'700', letterSpacing:'1px' }}>
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </header>

        {/* ── NAVIGATION ── */}
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
          <NavLink to="/recommandations" className={({isActive}) => isActive ? 'active' : ''}>
            🛒 Réapprovisionnement
          </NavLink>
          <NavLink to="/simulation" className={({isActive}) => isActive ? 'active' : ''}>
            🎯 Simulation
          </NavLink>
          <NavLink to="/alertes" className={({isActive}) => isActive ? 'active' : ''}>
            🚨 Alertes
          </NavLink>
        </nav>

        {/* ── CONTENU ── */}
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard apiUrl={API_URL} />} />
            <Route path="/stocks" element={<Stocks apiUrl={API_URL} />} />
            <Route path="/predictions" element={<Predictions apiUrl={API_URL} />} />
            <Route path="/recommandations" element={<Recommandations apiUrl={API_URL} />} />
            <Route path="/simulation" element={<Simulation apiUrl={API_URL} />} />
            <Route path="/alertes" element={<Alertes apiUrl={API_URL} />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;