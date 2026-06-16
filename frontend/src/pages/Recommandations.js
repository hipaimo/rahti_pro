import React, { useState, useEffect } from 'react';

const URGENCE_CONFIG = {
  critique: { color: '#E31E24', bg: '#fff0f0', label: '🔴 Critique', border: '#E31E24' },
  haute:    { color: '#FF6B35', bg: '#fff5f0', label: '🟠 Haute',    border: '#FF6B35' },
  moyenne:  { color: '#FFC107', bg: '#fffbf0', label: '🟡 Moyenne',  border: '#FFC107' },
  faible:   { color: '#28A745', bg: '#f0fff4', label: '🟢 Faible',   border: '#28A745' },
};

const CAT_EMOJI = {
  tapis: '🪆', poterie: '🏺', bijouterie: '💎',
  maroquinerie: '👜', menuiserie: '🪑',
};

function Recommandations({ apiUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous');
  const [tri, setTri] = useState('priorite');

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/recommandations`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p>Calcul des recommandations...</p>
    </div>
  );

  if (!data) return <div style={{ padding: '20px', color: 'red' }}>Erreur de chargement</div>;

  const { recommandations, resume, evenement_actif, multiplicateur_actif } = data;

  // Filtrage
  let liste = recommandations.filter(r => r.quantite_a_commander > 0);
  if (filtre !== 'tous') liste = liste.filter(r => r.urgence === filtre);

  // Tri
  if (tri === 'valeur') liste = [...liste].sort((a, b) => b.valeur_commande_dh - a.valeur_commande_dh);
  else if (tri === 'jours') liste = [...liste].sort((a, b) => a.jours_stock_restants - b.jours_stock_restants);

  return (
    <div style={{ padding: '0 8px' }}>
      <h2>🛒 Recommandations de Réapprovisionnement</h2>

      {/* BANNIÈRE ÉVÉNEMENT ACTIF */}
      {evenement_actif && (
        <div style={{
          background: 'linear-gradient(135deg, #FFC10722, #FF6B3511)',
          border: '2px solid #FFC107',
          borderRadius: '12px', padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '1.8rem' }}>🌞</span>
          <div>
            <strong style={{ color: '#c47a00', fontSize: '1rem' }}>
              {evenement_actif} en cours — Demande boostée ×{multiplicateur_actif}
            </strong>
            <div style={{ color: '#777', fontSize: '0.85rem', marginTop: '3px' }}>
              Les recommandations intègrent le pic touristique (+50% mesuré sur les données réelles)
            </div>
          </div>
        </div>
      )}

      {/* KPI RÉSUMÉ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px', marginBottom: '28px'
      }}>
        {[
          { label: 'Produits critiques', value: resume.produits_critiques, color: '#E31E24', emoji: '🔴' },
          { label: 'À commander', value: resume.produits_a_commander, color: '#FF6B35', emoji: '📦' },
          { label: 'Quantité totale', value: resume.quantite_totale.toLocaleString(), color: '#002855', emoji: '🔢' },
          { label: 'Valeur totale', value: `${resume.valeur_totale_dh.toLocaleString()} DH`, color: '#28A745', emoji: '💰' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: '#fff', borderRadius: '12px', padding: '16px',
            boxShadow: '0 2px 8px #0001', textAlign: 'center',
            borderTop: `3px solid ${kpi.color}`
          }}>
            <div style={{ fontSize: '1.6rem' }}>{kpi.emoji}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: kpi.color, margin: '6px 0' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#888' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* FILTRES ET TRI */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>Filtrer :</span>
        {['tous', 'critique', 'haute', 'moyenne'].map(f => (
          <button key={f} onClick={() => setFiltre(f)} style={{
            padding: '5px 14px', borderRadius: '20px', border: '1.5px solid',
            borderColor: filtre === f ? (URGENCE_CONFIG[f]?.color || '#002855') : '#ddd',
            background: filtre === f ? (URGENCE_CONFIG[f]?.bg || '#e8eaf6') : '#fff',
            color: filtre === f ? (URGENCE_CONFIG[f]?.color || '#002855') : '#666',
            fontWeight: filtre === f ? '600' : '400',
            cursor: 'pointer', fontSize: '0.82rem'
          }}>
            {f === 'tous' ? `Tous (${liste.length + (filtre === 'tous' ? 0 : recommandations.filter(r=>r.quantite_a_commander>0).length - liste.length)})` : URGENCE_CONFIG[f]?.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#666', fontSize: '0.85rem' }}>Trier par :</span>
          <select value={tri} onChange={e => setTri(e.target.value)} style={{
            padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.82rem'
          }}>
            <option value="priorite">Priorité</option>
            <option value="jours">Jours restants</option>
            <option value="valeur">Valeur commande</option>
          </select>
        </div>
      </div>

      {/* LISTE RECOMMANDATIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {liste.map((r, idx) => {
          const cfg = URGENCE_CONFIG[r.urgence];
          const pctStock = Math.min(100, (r.stock_actuel / Math.max(r.stock_actuel + r.quantite_a_commander, 1)) * 100);
          return (
            <div key={idx} style={{
              background: '#fff', borderRadius: '12px', padding: '18px 20px',
              border: `1px solid ${cfg.border}33`,
              borderLeft: `4px solid ${cfg.border}`,
              boxShadow: '0 1px 6px #0001'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                
                {/* Gauche: infos produit */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{CAT_EMOJI[r.categorie] || '📦'}</span>
                    <strong style={{ fontSize: '1rem', color: '#222' }}>{r.produit}</strong>
                    <span style={{
                      fontSize: '0.72rem', background: cfg.bg, color: cfg.color,
                      padding: '2px 8px', borderRadius: '12px', fontWeight: '600'
                    }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '8px' }}>
                    {r.categorie} • {r.vente_journaliere} unités/jour
                    {r.evenement_impact && <span style={{ color: '#FFC107', marginLeft: '6px' }}>🌞 ×{r.multiplicateur}</span>}
                  </div>
                  {/* Barre de stock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#aaa', minWidth: '55px' }}>Stock</span>
                    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pctStock}%`, height: '100%',
                        background: r.urgence === 'critique' ? '#E31E24' : r.urgence === 'haute' ? '#FF6B35' : '#FFC107',
                        borderRadius: '6px', transition: 'width 0.5s'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#555', minWidth: '60px' }}>
                      {r.stock_actuel} unités
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: cfg.color, marginTop: '6px', fontStyle: 'italic' }}>
                    ⚠️ {r.raison}
                  </div>
                </div>

                {/* Droite: recommandation */}
                <div style={{
                  background: cfg.bg, borderRadius: '10px', padding: '14px 18px',
                  textAlign: 'center', minWidth: '180px', border: `1px solid ${cfg.border}33`
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Commander</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: cfg.color, lineHeight: 1 }}>
                    {r.quantite_a_commander}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#888', margin: '4px 0' }}>unités</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#333' }}>
                    {r.valeur_commande_dh.toLocaleString()} DH
                  </div>
                  <div style={{
                    marginTop: '8px', fontSize: '0.72rem',
                    color: r.jours_stock_restants <= 3 ? '#E31E24' : '#888'
                  }}>
                    ⏳ {r.jours_stock_restants}j restants
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {liste.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          ✅ Aucune recommandation pour ce filtre
        </div>
      )}

      <p style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '20px', fontStyle: 'italic', textAlign: 'center' }}>
        💡 Recommandations calculées sur les ventes réelles 2023–2025 · Mise à jour en temps réel
      </p>
    </div>
  );
}

export default Recommandations;