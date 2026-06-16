import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend);

function Dashboard({ apiUrl }) {
  const [kpis, setKpis] = useState(null);
  const [tendances, setTendances] = useState(null);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/dashboard/kpis`).then(r => r.json()),
      fetch(`${apiUrl}/dashboard/tendances`).then(r => r.json()),
      fetch(`${apiUrl}/dashboard/categories`).then(r => r.json())
    ]).then(([kpisData, tendancesData, catData]) => {
      setKpis(kpisData);
      setTendances(tendancesData);
      setCategories(catData);
      setLoading(false);
    }).catch(err => {
      console.error('Erreur chargement dashboard:', err);
      setLoading(false);
    });
  }, [apiUrl]);

  if (loading) return <div className="loading">⏳ Chargement...</div>;

  const lineData = {
    labels: tendances?.dates || [],
    datasets: [{
      label: 'Ventes',
      data: tendances?.quantites || [],
      borderColor: '#E67E22',
      backgroundColor: 'rgba(230, 126, 34, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const pieData = {
    labels: categories?.categories || [],
    datasets: [{
      data: categories?.ca || [],
      backgroundColor: ['#D35400', '#E67E22', '#F39C12', '#F1C40F', '#27AE60']
    }]
  };

  return (
    <div className="dashboard">
      <h2>📊 Tableau de Bord</h2>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-value">{kpis?.ca_total_mois?.toLocaleString() || '0'} DH</div>
          <div className="kpi-label">CA du Mois</div>
          <div className="kpi-delta positive">+15.3%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-value">{kpis?.produits_en_alerte || 0}</div>
          <div className="kpi-label">Alertes Stock</div>
          <div className="kpi-delta negative">Attention</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔮</div>
          <div className="kpi-value">{kpis?.model_type || 'N/A'}</div>
          <div className="kpi-label">Modèle Actif</div>
          <div className="kpi-delta positive">Strategy Pattern</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏆</div>
          <div className="kpi-value">{kpis?.top_produit || 'N/A'}</div>
          <div className="kpi-label">Top Produit</div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts">
        <div className="chart-card">
          <h3>Évolution des Ventes</h3>
          <Line data={lineData} options={{responsive: true}} />
        </div>
        <div className="chart-card">
          <h3>Répartition par Catégorie</h3>
          <Pie data={pieData} options={{responsive: true}} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
