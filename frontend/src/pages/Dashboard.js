import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend);

const ORANGE = '#E67E22';
const COLORS = ['#D35400','#E67E22','#F39C12','#27AE60','#2980B9','#8E44AD'];
const CAT_EMOJI = { tapis:'🪆', menuiserie:'🪑', poterie:'🏺', maroquinerie:'👜', bijouterie:'💎' };

function fmtDH(n) {
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M DH`;
  if (n >= 1e3) return `${(n/1e3).toFixed(0)}K DH`;
  return `${n} DH`;
}

function Dashboard({ apiUrl }) {
  const [kpis, setKpis]           = useState(null);
  const [tendances, setTendances] = useState(null);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/dashboard/kpis`).then(r => r.json()),
      fetch(`${apiUrl}/dashboard/tendances`).then(r => r.json()),
      fetch(`${apiUrl}/dashboard/stats-reelles`).then(r => r.json()),
    ]).then(([k, t, s]) => {
      setKpis(k); setTendances(t); setStats(s); setLoading(false);
    }).catch(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return <div className="loading">⏳ Chargement...</div>;

  // ── Données graphiques ──────────────────────────────────
  const lineData = {
    labels: tendances?.dates || [],
    datasets: [{ label: 'Ventes (DH)', data: tendances?.ca || [],
      borderColor: ORANGE, backgroundColor: 'rgba(230,126,34,0.12)',
      tension: 0.4, fill: true, pointRadius: 3 }]
  };

  const catLabels = Object.keys(stats?.ca_par_categorie || {});
  const catValues = Object.values(stats?.ca_par_categorie || {});
  const doughnutData = {
    labels: catLabels.map(c => `${CAT_EMOJI[c] || ''} ${c}`),
    datasets: [{ data: catValues, backgroundColor: COLORS,
      borderWidth: 2, borderColor: '#fff' }]
  };

  const villeLabels = Object.keys(stats?.ca_par_ville || {});
  const villeValues = Object.values(stats?.ca_par_ville || {});
  const barVilleData = {
    labels: villeLabels,
    datasets: [{ label: 'CA (DH)', data: villeValues,
      backgroundColor: COLORS, borderRadius: 8 }]
  };

  const topLabels = Object.keys(stats?.top_produits || {});
  const topValues = Object.values(stats?.top_produits || {});
  const barTopData = {
    labels: topLabels.map(l => l.length > 14 ? l.slice(0,14)+'…' : l),
    datasets: [{ label: 'CA (DH)', data: topValues,
      backgroundColor: ORANGE, borderRadius: 8 }]
  };

  const chartOpts = (title) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false },
      title: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${fmtDH(ctx.raw)}` } }
    },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' },
      ticks: { callback: v => fmtDH(v) } } }
  });

  const croissanceMois = stats?.croissance_mois ?? 0;

  return (
    <div className="dashboard">
      <h2>📊 Tableau de Bord</h2>

      {/* ── KPIs PRINCIPAUX ── */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { icon:'💰', value: fmtDH(stats?.ca_mois_actuel || 0),
            label:'CA du Mois', delta: `${croissanceMois > 0 ? '+' : ''}${croissanceMois}% vs mois préc.`,
            positive: croissanceMois >= 0 },
          { icon:'📦', value: kpis?.produits_en_alerte || 0,
            label:'Alertes Stock', delta:'Observer Pattern', positive: false },
          { icon:'🔮', value: kpis?.model_type || 'N/A',
            label:'Modèle Actif', delta:'Strategy Pattern', positive: true },
          { icon:'🏆', value: kpis?.top_produit || 'N/A',
            label:'Top Produit', delta:`${fmtDH(topValues[0] || 0)} de CA`, positive: true },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon">{kpi.icon}</div>
            <div className="kpi-value" style={{ fontSize: kpi.value.toString().length > 10 ? '1rem' : undefined }}>
              {kpi.value}
            </div>
            <div className="kpi-label">{kpi.label}</div>
            <div className={`kpi-delta ${kpi.positive ? 'positive' : 'negative'}`}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* ── STATS RÉELLES (mini-KPIs) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px', marginBottom:'24px' }}>
        {[
          { label:'CA Total (2023–2025)', value: fmtDH(stats?.ca_total || 0), emoji:'💵' },
          { label:'Transactions', value: stats?.nb_transactions?.toLocaleString(), emoji:'🧾' },
          { label:'Artisans actifs', value: stats?.nb_artisans, emoji:'👨‍🎨' },
          { label:'Unités vendues', value: stats?.quantite_totale?.toLocaleString(), emoji:'📦' },
          { label:'Tapis % du CA', value: `${stats?.tapis_part_ca}%`, emoji:'🪆' },
        ].map((s, i) => (
          <div key={i} style={{
            background:'#fff', borderRadius:'10px', padding:'14px',
            boxShadow:'0 1px 6px #0001', textAlign:'center',
            borderBottom:`3px solid ${ORANGE}`
          }}>
            <div style={{ fontSize:'1.3rem' }}>{s.emoji}</div>
            <div style={{ fontSize:'1.1rem', fontWeight:'bold', color:'#222', margin:'4px 0' }}>{s.value}</div>
            <div style={{ fontSize:'0.72rem', color:'#999' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── GRAPHIQUE VENTES + DOUGHNUT CATÉGORIES ── */}
      <div className="charts" style={{ gridTemplateColumns:'2fr 1fr' }}>
        <div className="chart-card">
          <h3>📈 Évolution Mensuelle du CA</h3>
          <div style={{ height:'260px' }}>
            <Line data={lineData} options={{
              ...chartOpts(), responsive: true, maintainAspectRatio: false,
              plugins: { legend:{ display:false },
                tooltip:{ callbacks:{ label: ctx => ` ${fmtDH(ctx.raw)}` } } },
              scales:{ x:{ grid:{display:false} },
                y:{ grid:{color:'#f0f0f0'}, ticks:{callback: v => fmtDH(v)} } }
            }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>🥧 Répartition par Catégorie</h3>
          <div style={{ height:'260px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Doughnut data={doughnutData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend:{ position:'bottom', labels:{ font:{size:11}, padding:8 } },
                tooltip:{ callbacks:{ label: ctx => ` ${fmtDH(ctx.raw)} (${((ctx.raw/stats.ca_total)*100).toFixed(1)}%)` } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* ── CA PAR VILLE + TOP PRODUITS ── */}
      <div className="charts" style={{ gridTemplateColumns:'1fr 1fr', marginTop:'0' }}>
        <div className="chart-card">
          <h3>🗺️ CA par Ville</h3>
          <div style={{ height:'220px' }}>
            <Bar data={barVilleData} options={{
              ...chartOpts(), responsive: true, maintainAspectRatio: false,
              plugins: { legend:{display:false},
                tooltip:{ callbacks:{ label: ctx => ` ${fmtDH(ctx.raw)}` } } },
              scales:{ x:{grid:{display:false}},
                y:{ grid:{color:'#f0f0f0'}, ticks:{callback: v => fmtDH(v)} } }
            }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>🏆 Top 5 Produits</h3>
          <div style={{ height:'220px' }}>
            <Bar data={barTopData} options={{
              indexAxis:'y', responsive: true, maintainAspectRatio: false,
              plugins: { legend:{display:false},
                tooltip:{ callbacks:{ label: ctx => ` ${fmtDH(ctx.raw)}` } } },
              scales:{ x:{ grid:{color:'#f0f0f0'}, ticks:{callback: v => fmtDH(v)} },
                y:{ grid:{display:false} } }
            }} />
          </div>
        </div>
      </div>

      {/* ── INSIGHT FINAL ── */}
      <div style={{
        background:'linear-gradient(135deg, #E67E2215, #D3540010)',
        border:'1px solid #E67E2233', borderRadius:'12px',
        padding:'16px 20px', marginTop:'8px',
        display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center'
      }}>
        <span style={{ fontSize:'1.8rem' }}>💡</span>
        <div>
          <strong style={{ color:'#D35400' }}>Insight clé</strong>
          <p style={{ margin:'4px 0 0', color:'#555', fontSize:'0.88rem' }}>
            Les <strong>tapis représentent {stats?.tapis_part_ca}% du CA total</strong> et Marrakech génère à elle seule {
              stats?.ca_par_ville ? Math.round(stats.ca_par_ville['Marrakech']/stats.ca_total*100) : 0
            }% du chiffre d'affaires.
            Le <strong>vendredi est le meilleur jour de vente</strong> (+47% vs moyenne semaine).
            Durant le <strong>Ramadan, les ventes bondissent de +139%</strong> sur toutes les catégories.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;