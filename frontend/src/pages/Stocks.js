import React, { useState, useEffect } from 'react';

function Stocks({ apiUrl }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/stocks`)
      .then(r => r.json())
      .then(data => {
        setStocks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setLoading(false);
      });
  }, [apiUrl]);

  if (loading) return <div className="loading">⏳ Chargement...</div>;

  return (
    <div className="stocks">
      <h2>📦 Gestion des Stocks</h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Stock</th>
              <th>Seuil</th>
              <th>Prix</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <tr key={stock.produit_id} className={
                stock.stock_actuel === 0 ? 'rupture' :
                stock.stock_actuel <= stock.seuil_alerte / 2 ? 'critique' :
                stock.stock_actuel <= stock.seuil_alerte ? 'alerte' : ''
              }>
                <td><strong>{stock.nom}</strong></td>
                <td>{stock.categorie}</td>
                <td>{stock.stock_actuel}</td>
                <td>{stock.seuil_alerte}</td>
                <td>{stock.prix_unitaire} DH</td>
                <td>
                  {stock.stock_actuel === 0 ? <span className="badge rouge">RUPTURE</span> :
                   stock.stock_actuel <= stock.seuil_alerte / 2 ? <span className="badge rouge">CRITIQUE</span> :
                   stock.stock_actuel <= stock.seuil_alerte ? <span className="badge orange">ALERTE</span> :
                   <span className="badge vert">OK</span>}
                </td>
                <td>
                  <button className="btn-small">📦 Réappro</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stocks;
