import React, { useState, useEffect } from 'react';

function Alertes({ apiUrl }) {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/stocks/alertes`)
      .then(r => r.json())
      .then(data => {
        setAlertes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setLoading(false);
      });
  }, [apiUrl]);

  if (loading) return <div className="loading">⏳ Chargement...</div>;

  return (
    <div className="alertes">
      <h2>🚨 Alertes de Stock (Observer Pattern)</h2>

      {alertes.length === 0 ? (
        <div className="no-alertes">
          <span className="big-icon">✅</span>
          <p>Aucune alerte active</p>
          <p>Tous les stocks sont au niveau optimal</p>
        </div>
      ) : (
        <div className="alertes-list">
          <p className="alertes-count">{alertes.length} alerte(s) détectée(s)</p>

          {alertes.map(alerte => (
            <div key={alerte.produit_id} className={`alerte-card ${alerte.urgence}`}>
              <div className="alerte-header">
                <span className="alerte-icon">
                  {alerte.urgence === 'critique' ? '🔴' : alerte.urgence === 'moyenne' ? '🟠' : '🟡'}
                </span>
                <h4>{alerte.nom}</h4>
                <span className={`badge ${alerte.urgence}`}>{alerte.urgence.toUpperCase()}</span>
              </div>
              <div className="alerte-details">
                <p>Stock actuel: <strong>{alerte.stock_actuel}</strong> / Seuil: {alerte.seuil_alerte}</p>
                <p>Jours avant rupture: <strong>{alerte.jours_avant_rupture}</strong></p>
                <p className="alerte-time">Détecté par: Observer Pattern</p>
              </div>
              <div className="alerte-actions">
                <button className="btn-primary">📦 Réapprovisionner</button>
                <button className="btn-secondary">📊 Détails</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alertes;
