import React, { useState, useCallback } from 'react';

const EVENTS = [
  { id: 'ramadan',     label: 'Ramadan',                emoji: '🌙', color: '#E31E24', impact: '+139%' },
  { id: 'aid_fitr',   label: 'Aïd Al-Fitr',            emoji: '🎊', color: '#FF6B35', impact: '+204%' },
  { id: 'aid_adha',   label: 'Aïd Al-Adha',            emoji: '🐑', color: '#28A745', impact: '+62%'  },
  { id: 'moussem',    label: 'Moussem Tan-Tan',         emoji: '🎭', color: '#6F42C1', impact: '+24%'  },
  { id: 'touristique',label: 'Saison Touristique',      emoji: '🌞', color: '#FFC107', impact: '+50%'  },
];

const RISQUE_CFG = {
  rupture_avant_event: { label: '🔴 Rupture avant événement', color: '#E31E24', bg: '#fff0f0' },
  critique:            { label: '🟠 Critique',                color: '#FF6B35', bg: '#fff5f0' },
  attention:           { label: '🟡 Attention',               color: '#FFC107', bg: '#fffbf0' },
  ok:                  { label: '🟢 OK',                      color: '#28A745', bg: '#f0fff4' },
};

const CAT_EMOJI = { tapis:'🪆', poterie:'🏺', bijouterie:'💎', maroquinerie:'👜', menuiserie:'🪑' };

function fmtDH(n) {
  if (n >= 1e6) return `${(n/1e6).toFixed(2)}M DH`;
  if (n >= 1e3) return `${(n/1e3).toFixed(0)}K DH`;
  return `${n} DH`;
}

function Simulation({ apiUrl }) {
  const [evenement, setEvenement]       = useState('ramadan');
  const [joursAvant, setJoursAvant]     = useState(30);
  const [horizonJours, setHorizonJours] = useState(30);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [filtre, setFiltre]             = useState('tous');

  const simulate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/simulation/whatif?evenement=${evenement}&jours_avant=${joursAvant}&horizon_jours=${horizonJours}`
      );
      setResult(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [apiUrl, evenement, joursAvant, horizonJours]);

  const eventCfg = EVENTS.find(e => e.id === evenement);

  const liste = result?.resultats?.filter(r =>
    filtre === 'tous' ? true :
    filtre === 'risque' ? ['rupture_avant_event','critique'].includes(r.risque) :
    r.risque === filtre
  ) || [];

  return (
    <div style={{ padding: '0 8px' }}>
      <h2>🎯 Simulation What-If</h2>
      <p style={{ color:'#777', marginTop:'-8px', marginBottom:'24px', fontSize:'0.9rem' }}>
        Simulez l'impact d'un événement sur vos stocks — basé sur les données réelles 2023–2025
      </p>

      {/* ── PANNEAU DE CONTRÔLE ── */}
      <div style={{
        background:'#fff', borderRadius:'14px', padding:'24px',
        boxShadow:'0 2px 12px #0001', marginBottom:'24px',
        border:'1px solid #f0f0f0'
      }}>
        <h3 style={{ margin:'0 0 20px', color:'#333', fontSize:'1rem' }}>
          ⚙️ Paramètres de la simulation
        </h3>

        {/* Choix événement */}
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'0.85rem', color:'#666', display:'block', marginBottom:'10px', fontWeight:'600' }}>
            Événement à simuler
          </label>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {EVENTS.map(ev => (
              <button key={ev.id} onClick={() => setEvenement(ev.id)} style={{
                padding:'10px 16px', borderRadius:'10px', cursor:'pointer',
                border: `2px solid ${evenement === ev.id ? ev.color : '#e0e0e0'}`,
                background: evenement === ev.id ? `${ev.color}15` : '#fafafa',
                color: evenement === ev.id ? ev.color : '#666',
                fontWeight: evenement === ev.id ? '700' : '400',
                fontSize:'0.85rem', transition:'all 0.2s'
              }}>
                {ev.emoji} {ev.label}
                <span style={{
                  marginLeft:'6px', fontSize:'0.75rem',
                  color: evenement === ev.id ? ev.color : '#aaa'
                }}>
                  {ev.impact}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
          <div>
            <label style={{ fontSize:'0.85rem', color:'#666', fontWeight:'600' }}>
              📅 L'événement arrive dans
              <strong style={{ color: eventCfg?.color, marginLeft:'8px', fontSize:'1rem' }}>
                {joursAvant} jours
              </strong>
            </label>
            <input type="range" min="7" max="90" value={joursAvant}
              onChange={e => setJoursAvant(+e.target.value)}
              style={{ width:'100%', margin:'10px 0', accentColor: eventCfg?.color }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#aaa' }}>
              <span>7j (urgent)</span><span>45j</span><span>90j (planifié)</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize:'0.85rem', color:'#666', fontWeight:'600' }}>
              ⏱️ Durée de l'événement
              <strong style={{ color: eventCfg?.color, marginLeft:'8px', fontSize:'1rem' }}>
                {horizonJours} jours
              </strong>
            </label>
            <input type="range" min="1" max="45" value={horizonJours}
              onChange={e => setHorizonJours(+e.target.value)}
              style={{ width:'100%', margin:'10px 0', accentColor: eventCfg?.color }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#aaa' }}>
              <span>1j</span><span>15j</span><span>30j</span><span>45j</span>
            </div>
          </div>
        </div>

        {/* Bouton */}
        <button onClick={simulate} disabled={loading} style={{
          marginTop:'20px', padding:'12px 32px', borderRadius:'10px',
          background: loading ? '#ccc' : eventCfg?.color,
          color:'#fff', fontWeight:'700', fontSize:'1rem',
          border:'none', cursor: loading ? 'default' : 'pointer',
          width:'100%', transition:'opacity 0.2s'
        }}>
          {loading ? '⏳ Simulation en cours...' : `🚀 Simuler — ${eventCfg?.emoji} ${eventCfg?.label} dans ${joursAvant}j`}
        </button>
      </div>

      {/* ── RÉSULTATS ── */}
      {result && (
        <>
          {/* KPIs résumé */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4,1fr)',
            gap:'14px', marginBottom:'20px'
          }}>
            {[
              { emoji:'⚠️', value: result.resume.produits_en_risque !== undefined ? result.resume.produits_en_risque : '?',
                label:'Produits en risque', color:'#E31E24' },
              { emoji:'📦', value: result.resume.total_a_commander !== undefined ? result.resume.total_a_commander.toLocaleString() : '?',
                label:'Unités à commander', color:'#FF6B35' },
              { emoji:'💰', value: fmtDH(result.resume.valeur_totale_dh),
                label:'Valeur totale', color:'#28A745' },
              { emoji:'📅', value: `J-${result.jours_avant}`,
                label:`Avant ${eventCfg?.label}`, color: eventCfg?.color },
            ].map((k,i) => (
              <div key={i} style={{
                background:'#fff', borderRadius:'12px', padding:'16px',
                textAlign:'center', boxShadow:'0 1px 6px #0001',
                borderTop:`3px solid ${k.color}`
              }}>
                <div style={{ fontSize:'1.4rem' }}>{k.emoji}</div>
                <div style={{ fontSize:'1.3rem', fontWeight:'bold', color:k.color, margin:'6px 0' }}>
                  {k.value}
                </div>
                <div style={{ fontSize:'0.75rem', color:'#999' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Alerte résumé */}
          <div style={{
            background:`${eventCfg?.color}12`,
            border:`2px solid ${eventCfg?.color}`,
            borderRadius:'12px', padding:'14px 20px',
            marginBottom:'20px', display:'flex', gap:'12px', alignItems:'center'
          }}>
            <span style={{ fontSize:'2rem' }}>{eventCfg?.emoji}</span>
            <div>
              <strong style={{ color: eventCfg?.color, fontSize:'1rem' }}>
                Scénario : {eventCfg?.label} dans {result.jours_avant} jours pendant {result.horizon_jours} jours
              </strong>
              <div style={{ color:'#555', fontSize:'0.85rem', marginTop:'3px' }}>
                Il faut commander <strong>{result.resume.total_a_commander?.toLocaleString()} unités</strong> supplémentaires
                pour une valeur de <strong>{fmtDH(result.resume.valeur_totale_dh)}</strong>.
                {result.resume.produits_en_risque > 0 &&
                  <span style={{ color:'#E31E24', fontWeight:'600' }}>
                    {' '}⚠️ {result.resume.produits_en_risque} produits en risque de rupture !
                  </span>
                }
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
            {[
              { id:'tous',   label:`Tous (${result.resultats.filter(r=>r.a_commander>0).length})` },
              { id:'risque', label:`🔴 En risque (${result.resume.produits_en_risque})` },
              { id:'attention', label:'🟡 Attention' },
              { id:'ok',     label:'🟢 OK' },
            ].map(f => (
              <button key={f.id} onClick={() => setFiltre(f.id)} style={{
                padding:'5px 14px', borderRadius:'20px', cursor:'pointer',
                border:`1.5px solid ${filtre===f.id ? eventCfg?.color : '#ddd'}`,
                background: filtre===f.id ? `${eventCfg?.color}15` : '#fff',
                color: filtre===f.id ? eventCfg?.color : '#666',
                fontWeight: filtre===f.id ? '600' : '400', fontSize:'0.82rem'
              }}>{f.label}</button>
            ))}
          </div>

          {/* Liste produits */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {liste.filter(r => r.a_commander > 0).map((r, idx) => {
              const cfg = RISQUE_CFG[r.risque];
              const pctStock = Math.min(100, (r.stock_actuel / Math.max(r.total_necessaire, 1)) * 100);
              return (
                <div key={idx} style={{
                  background:'#fff', borderRadius:'12px', padding:'16px 20px',
                  border:`1px solid ${cfg.color}33`,
                  borderLeft:`4px solid ${cfg.color}`,
                  boxShadow:'0 1px 4px #0001'
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
                    
                    {/* Info produit */}
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                        <span style={{ fontSize:'1.1rem' }}>{CAT_EMOJI[r.categorie] || '📦'}</span>
                        <strong style={{ color:'#222' }}>{r.produit}</strong>
                        <span style={{
                          fontSize:'0.72rem', background:cfg.bg, color:cfg.color,
                          padding:'2px 8px', borderRadius:'12px', fontWeight:'600'
                        }}>{cfg.label}</span>
                      </div>

                      {/* Stats ventes */}
                      <div style={{
                        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                        gap:'8px', marginBottom:'10px'
                      }}>
                        {[
                          { label:'Normal/j',  value: r.vente_normale_jour, color:'#888' },
                          { label:'Pendant/j', value: r.vente_event_jour,   color: eventCfg?.color },
                          { label:'Multiplicateur', value: `×${r.multiplicateur}`, color: eventCfg?.color },
                        ].map((s,i) => (
                          <div key={i} style={{
                            background:'#f8f8f8', borderRadius:'8px',
                            padding:'6px 10px', textAlign:'center'
                          }}>
                            <div style={{ fontSize:'0.85rem', fontWeight:'700', color:s.color }}>{s.value}</div>
                            <div style={{ fontSize:'0.68rem', color:'#aaa' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Barre stock */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontSize:'0.72rem', color:'#aaa', minWidth:'80px' }}>
                          Stock actuel
                        </span>
                        <div style={{ flex:1, background:'#f0f0f0', borderRadius:'6px', height:'7px' }}>
                          <div style={{
                            width:`${pctStock}%`, height:'100%', borderRadius:'6px',
                            background: pctStock < 30 ? '#E31E24' : pctStock < 60 ? '#FFC107' : '#28A745'
                          }}/>
                        </div>
                        <span style={{ fontSize:'0.72rem', color:'#555', minWidth:'50px' }}>
                          {r.stock_actuel} u.
                        </span>
                      </div>

                      <div style={{ fontSize:'0.75rem', color:'#aaa', marginTop:'6px' }}>
                        Besoin : {r.conso_avant_event}u avant + {r.conso_pendant_event}u pendant = {r.total_necessaire}u total
                      </div>
                    </div>

                    {/* Commander */}
                    <div style={{
                      background: cfg.bg, borderRadius:'10px', padding:'14px 18px',
                      textAlign:'center', minWidth:'160px',
                      border:`1px solid ${cfg.color}33`
                    }}>
                      <div style={{ fontSize:'0.72rem', color:'#888' }}>Commander</div>
                      <div style={{ fontSize:'2rem', fontWeight:'bold', color:cfg.color, lineHeight:1.1 }}>
                        {r.a_commander}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'#aaa', marginBottom:'6px' }}>unités</div>
                      <div style={{ fontSize:'0.9rem', fontWeight:'700', color:'#333' }}>
                        {fmtDH(r.valeur_commande_dh)}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'#aaa', marginTop:'4px' }}>
                        à {r.prix_unitaire} DH/u
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ color:'#ccc', fontSize:'0.75rem', marginTop:'16px', textAlign:'center', fontStyle:'italic' }}>
            Simulation basée sur les multiplicateurs réels calculés sur 106,702 transactions (2023–2025)
          </p>
        </>
      )}

      {!result && !loading && (
        <div style={{
          textAlign:'center', padding:'60px 20px', color:'#bbb',
          background:'#fafafa', borderRadius:'14px', border:'2px dashed #e0e0e0'
        }}>
          <div style={{ fontSize:'3rem', marginBottom:'12px' }}>🎯</div>
          <p style={{ fontSize:'1rem', color:'#999' }}>
            Choisissez un événement, réglez les curseurs et lancez la simulation
          </p>
        </div>
      )}
    </div>
  );
}

export default Simulation;