import React, { useState, useEffect } from 'react';

function Predictions({ apiUrl }) {
  const [stocks, setStocks] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evenements, setEvenements] = useState(null);

  // Données réelles tirées du dataset (2023-2025)
  const REAL_IMPACTS = {
    "Ramadan":               { pct: 139, label: "très fort", couleur: "#E31E24" },
    "Aïd Al-Fitr":          { pct: 204, label: "exceptionnel", couleur: "#FF6B35" },
    "Aïd Al-Adha":          { pct: 62,  label: "fort", couleur: "#28A745" },
    "Moussem de Tan-Tan":   { pct: 24,  label: "modéré", couleur: "#6F42C1" },
    "Haute Saison Touristique": { pct: 50, label: "très fort", couleur: "#FFC107" },
    "Mawlid An-Nabawi":     { pct: 20,  label: "modéré", couleur: "#17A2B8" },
  };

  // Calcul correct des jours restants depuis la date texte
  const joursRestantsDebut = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  };

  const getStatut = (joursDebut, joursFin) => {
    if (joursFin < 0)      return { label: "Passé",        color: "#aaa" };
    if (joursDebut <= 0)   return { label: "🟢 En cours",   color: "#28A745" };
    if (joursDebut <= 7)   return { label: "🔥 Urgent",     color: "#E31E24" };
    if (joursDebut <= 30)  return { label: "⚠️ Préparer",  color: "#FF6B35" };
    return                        { label: `📅 J-${joursDebut}`, color: "#555" };




  };

  useEffect(() => {
    fetch(`${apiUrl}/stocks`).then(r => r.json()).then(setStocks);
    fetch(`${apiUrl}/predict/features/importance`).then(r => r.json()).then(setFeatureImportance);
    fetch(`${apiUrl}/evenements/marocains`).then(r => r.json()).then(setEvenements);
  }, [apiUrl]);

  const predict = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produit_id: selectedProduct, horizon_jours: 7, model_type: 'lightgbm' })
      });
      setPredictions(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // Trouver le prochain événement (calcul frontend = fiable)
  const prochainEvent = evenements?.evenements
    ?.map(e => ({ ...e, jours: joursRestantsDebut(e.date_debut), joursAvantFin: joursRestantsDebut(e.date_fin) }))
    .filter(e => e.joursAvantFin >= 0)
    .filter(e => e.jours >= 0)
    .sort((a, b) => a.jours - b.jours)[0];

  return (
    <div className="predictions">
      <h2>🔮 Prédictions IA (Strategy Pattern)</h2>

      {/* ALERTE PROCHAIN ÉVÉNEMENT */}
      {prochainEvent && prochainEvent.jours <= 45 && (() => {
        const impact = REAL_IMPACTS[prochainEvent.nom] || {};
        return (
          <div style={{
            background: `linear-gradient(135deg, ${impact.couleur || '#E31E24'}18, ${impact.couleur || '#E31E24'}08)`,
            border: `2px solid ${impact.couleur || '#E31E24'}`,
            borderRadius: '12px', padding: '14px 20px', marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <span style={{ fontSize: '2rem' }}>{prochainEvent.emoji}</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: impact.couleur, fontSize: '1.05rem' }}>
                {prochainEvent.nom} — dans {prochainEvent.jours} jour{prochainEvent.jours > 1 ? 's' : ''}
              </strong>
              <div style={{ color: '#555', fontSize: '0.88rem', marginTop: '3px' }}>
                📈 Hausse historique constatée : <strong>+{impact.pct}%</strong> — 
                Augmentez votre stock {prochainEvent.jours <= 7 ? 'immédiatement !' : 'maintenant.'}
              </div>
            </div>
            <div style={{
              background: impact.couleur, color: '#fff', borderRadius: '20px',
              padding: '6px 14px', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap'
            }}>
              +{impact.pct}% prévu
            </div>
          </div>
        );
      })()}

      {/* FORMULAIRE PRÉDICTION */}
      <div className="predict-section">
        <div className="predict-form">
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
            <option value="">Choisir un produit...</option>
            {stocks.map(s => (
              <option key={s.produit_id} value={s.produit_id}>{s.nom}</option>
            ))}
          </select>
          <button onClick={predict} disabled={loading || !selectedProduct}>
            {loading ? '⏳ Calcul...' : '🔮 Prédire'}
          </button>
        </div>

        {predictions.length > 0 && (
          <div className="predictions-results">
            <h3>Prévisions 7 jours</h3>
            <div className="predictions-grid">
              {predictions.map((pred, idx) => (
                <div key={idx} className="prediction-card">
                  <div className="prediction-date">{pred.date}</div>
                  <div className="prediction-value">{pred.prediction} unités</div>
                  <div className="prediction-range">[{pred.intervalle_min} - {pred.intervalle_max}]</div>
                  <div className={`prediction-confidence ${pred.confiance}`}>{pred.confiance}</div>
                </div>
              ))}
            </div>
            <div className="recommendation">
              <h4>💡 Recommandation IA</h4>
              <p>Demande totale prévue : <strong>{predictions.reduce((a, p) => a + p.prediction, 0).toFixed(1)} unités</strong></p>
              <p className="action">→ Lancer production de <strong>{Math.ceil(predictions.reduce((a, p) => a + p.prediction, 0))} unités</strong></p>
            </div>
          </div>
        )}
      </div>

      {/* CALENDRIER ÉVÉNEMENTS MAROCAINS */}
      {evenements && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>
            📅 Calendrier Hijri & Événements Marocains
            <span style={{ fontSize: '0.78rem', fontWeight: 'normal', color: '#999', marginLeft: '10px' }}>
              {evenements.annee} — données réelles 2023–2025
            </span>
          </h3>

          {/* Statistiques réelles */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px', marginBottom: '20px'
          }}>
            {[
              { label: "Ramadan",     pct: 139, emoji: "🌙", color: "#E31E24" },
              { label: "Aïd Al-Fitr",pct: 204, emoji: "🎊", color: "#FF6B35" },
              { label: "Aïd Al-Adha",pct: 62,  emoji: "🐑", color: "#28A745" },
              { label: "Moussem",    pct: 24,  emoji: "🎭", color: "#6F42C1" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', border: `1px solid ${stat.color}33`,
                borderTop: `3px solid ${stat.color}`, borderRadius: '10px',
                padding: '12px 14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.4rem' }}>{stat.emoji}</div>
                <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: stat.color }}>+{stat.pct}%</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>données réelles</div>
              </div>
            ))}
          </div>

          {/* Grille événements */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '14px' }}>
            {evenements.evenements.map((event, idx) => {
              const jours = joursRestantsDebut(event.date_debut);
              const joursAvantFin = joursRestantsDebut(event.date_fin);
              const isPassé = joursAvantFin < 0;
              const realImpact = REAL_IMPACTS[event.nom];
              const urgence = getStatut(jours, joursAvantFin);

              return (
                <div key={idx} style={{
                  background: '#fff',
                  border: `1px solid ${event.couleur}44`,
                  borderLeft: `4px solid ${event.couleur}`,
                  borderRadius: '10px', padding: '15px',
                  opacity: isPassé ? 0.55 : 1,
                  transition: 'opacity 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem' }}>{event.emoji}</span>
                      <strong style={{ marginLeft: '7px', color: event.couleur }}>{event.nom}</strong>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', color: urgence.color, fontWeight: 'bold',
                      background: `${urgence.color}18`, padding: '2px 9px', borderRadius: '20px'
                    }}>
                      {urgence.label}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '0.83rem', color: '#555', lineHeight: '1.6' }}>
                    <div>📆 {event.date_debut} → {event.date_fin}</div>

                    {/* Impact: valeur réelle si dispo, sinon estimée */}
                    {realImpact ? (
                      <div style={{ marginTop: '5px' }}>
                        📈 Impact réel mesuré : <strong style={{ color: event.couleur }}>+{realImpact.pct}%</strong>
                        <span style={{ color: '#aaa', fontSize: '0.72rem', marginLeft: '5px' }}>({realImpact.label})</span>
                      </div>
                    ) : (
                      <div style={{ marginTop: '5px' }}>
                        📈 Impact estimé : <strong style={{ color: event.couleur }}>+{event.impact_pct}%</strong>
                      </div>
                    )}

                    <div style={{ color: '#888', fontStyle: 'italic', marginTop: '5px', fontSize: '0.8rem' }}>
                      {event.description}
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {event.categories_impactees.map(cat => (
                        <span key={cat} style={{
                          background: `${event.couleur}18`, color: event.couleur,
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '500'
                        }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '12px', fontStyle: 'italic' }}>
            💡 {evenements.message} — Impacts calculés sur {(90641+10560+9506+8467+9393).toLocaleString()} transactions réelles (2023–2025)
          </p>
        </div>
      )}

      {/* Feature Importance */}
      {featureImportance && (
        <div className="feature-importance" style={{ marginTop: '32px' }}>
          <h3>📊 Importance des Features (Modèle: {featureImportance.model_type})</h3>
          <div className="features-list">
            {Object.entries(featureImportance.top_features || {}).map(([feature, importance]) => {
              const maxVal = Math.max(...Object.values(featureImportance.top_features));
              return (
                <div key={feature} className="feature-bar">
                  <span className="feature-name">{feature}</span>
                  <div className="feature-progress">
                    <div className="feature-fill" style={{ width: `${(importance / maxVal) * 100}%` }}></div>
                  </div>
                  <span className="feature-value">{Math.round(importance).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Predictions;