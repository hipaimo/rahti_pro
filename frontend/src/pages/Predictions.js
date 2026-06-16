import React, { useState, useEffect } from 'react';

function Predictions({ apiUrl }) {
  const [stocks, setStocks] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/stocks`)
      .then(r => r.json())
      .then(data => setStocks(data));

    fetch(`${apiUrl}/predict/features/importance`)
      .then(r => r.json())
      .then(data => setFeatureImportance(data));
  }, [apiUrl]);

  const predict = async () => {
    if (!selectedProduct) return;
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produit_id: selectedProduct, 
          horizon_jours: 7,
          model_type: 'lightgbm'
        })
      });
      const data = await res.json();
      setPredictions(data);
    } catch (err) {
      console.error('Erreur prédiction:', err);
    }
    setLoading(false);
  };

  return (
    <div className="predictions">
      <h2>🔮 Prédictions IA (Strategy Pattern)</h2>

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
                  <div className={`prediction-confidence ${pred.confiance}`}>
                    {pred.confiance}
                  </div>
                </div>
              ))}
            </div>

            <div className="recommendation">
              <h4>💡 Recommandation IA</h4>
              <p>Demande totale prévue: <strong>{predictions.reduce((a, p) => a + p.prediction, 0).toFixed(1)} unités</strong></p>
              <p className="action">
                → Lancer production de <strong>{Math.ceil(predictions.reduce((a, p) => a + p.prediction, 0))} unités</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feature Importance */}
      {featureImportance && (
        <div className="feature-importance">
          <h3>📊 Importance des Features (Modèle: {featureImportance.model_type})</h3>
          <div className="features-list">
            {Object.entries(featureImportance.top_features || {}).map(([feature, importance]) => (
              <div key={feature} className="feature-bar">
                <span className="feature-name">{feature}</span>
                <div className="feature-progress">
                  <div className="feature-fill" style={{width: `${Math.min(importance * 100, 100)}%`}}></div>
                </div>
                <span className="feature-value">{importance.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Predictions;
