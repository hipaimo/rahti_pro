"""
RAHTI Pro - API FastAPI avec Design Patterns
Système Intelligent de Gestion des Stocks
Architecture: Strategy + Factory Method + Observer
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime, timedelta
from pathlib import Path
import uvicorn

# Import des services avec Design Patterns
from backend.app.services.prediction_service import PredictionService
from backend.app.models.stocks.observer import StockAlertSubject, DashboardAlertObserver, EmailAlertObserver
from backend.app.models.predictions.factory import ModelFactory

# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="RAHTI Pro API",
    description="Système Intelligent avec Design Patterns (Strategy, Factory, Observer)",
    version="3.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class StockItem(BaseModel):
    produit_id: str
    nom: str
    categorie: str
    stock_actuel: int
    seuil_alerte: int
    prix_unitaire: float

class PredictionRequest(BaseModel):
    produit_id: str
    horizon_jours: int = Field(default=7, ge=1, le=30)
    model_type: str = Field(default="lightgbm", description="random_forest ou lightgbm")

class PredictionResponse(BaseModel):
    produit_id: str
    date: str
    prediction: float
    intervalle_min: float
    intervalle_max: float
    confiance: str

class ModelInfo(BaseModel):
    type: str
    metrics: Dict
    feature_importance: Dict[str, float]

class AlerteStock(BaseModel):
    produit_id: str
    nom: str
    stock_actuel: int
    seuil_alerte: int
    jours_avant_rupture: int
    urgence: str

# ============================================================
# DATA STORE - Singleton
# ============================================================

class DataStore:
    """Singleton pour stocker les données en mémoire"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.ventes = None
        self.stocks = None
        self.artisans = None
        self.features = None
        self.prediction_service = None
        self.alert_system = None

    def load(self):
        """Charge toutes les données au démarrage"""
        import os
        BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        data_dir = BASE_DIR / "data"

        # Données brutes
        self.ventes = pd.read_csv(data_dir / "raw" / "ventes.csv", parse_dates=["date"])
        self.stocks = pd.read_csv(data_dir / "raw" / "stocks.csv")
        self.artisans = pd.read_csv(data_dir / "raw" / "artisans.csv")
        self.features = pd.read_csv(data_dir / "processed" / "features_hijri.csv", parse_dates=["date"])

        # Initialisation du service de prédiction (Strategy Pattern)
        model_path = data_dir / "models" / "best_model.joblib"
        if model_path.exists():
            self.prediction_service = PredictionService(model_path=str(model_path))
        else:
            self.prediction_service = PredictionService(model_type='lightgbm')

        # Initialisation du système d'alertes (Observer Pattern)
        self.alert_system = StockAlertSubject()
        dashboard_observer = DashboardAlertObserver()
        email_observer = EmailAlertObserver()

        self.alert_system.attach(dashboard_observer)
        self.alert_system.attach(email_observer)

        # Vérifier les stocks et notifier
        for _, row in self.stocks.iterrows():
            if row["stock_actuel"] <= row["seuil_alerte"]:
                self.alert_system.update_stock(
                    f"{row['artisan_id']}_{row['produit']}",
                    row["stock_actuel"],
                    row["seuil_alerte"]
                )

        print(f"✅ Données chargées: {len(self.ventes):,} ventes, {len(self.stocks)} stocks")
        print(f"✅ Service de prédiction: {self.prediction_service.get_model_info()['type']}")
        print(f"✅ Système d'alertes: {len(self.alert_system._observers)} observateurs")

        return self

# Instance globale (Singleton)
store = DataStore()

@app.on_event("startup")
async def startup():
    store.load()

# ============================================================
# ENDPOINTS API
# ============================================================

@app.get("/api/health")
async def health():
    """Vérification de santé avec info modèle"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_type": store.prediction_service.get_model_info()['type'],
        "model_metrics": store.prediction_service.get_model_info().get('metrics', {}),
        "data_loaded": store.ventes is not None
    }

# ============================================================
# MODÈLES - Factory Pattern
# ============================================================

@app.get("/api/models/available")
async def get_available_models():
    """Liste les modèles disponibles (Factory Pattern)"""
    return {
        "models": ModelFactory.get_available_models(),
        "default": "lightgbm"
    }

@app.get("/api/models/{model_type}/info")
async def get_model_info(model_type: str):
    """Info sur un modèle spécifique"""
    try:
        info = ModelFactory.get_model_info(model_type)
        return info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/models/switch/{model_type}")
async def switch_model(model_type: str):
    """Change de modèle dynamiquement (Strategy Pattern)"""
    try:
        store.prediction_service.switch_model(model_type)
        return {
            "status": "success",
            "new_model": model_type,
            "model_info": store.prediction_service.get_model_info()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================
# STOCKS - Observer Pattern
# ============================================================

@app.get("/api/stocks", response_model=List[StockItem])
async def get_stocks():
    """Récupère tous les stocks"""
    if store.stocks is None:
        raise HTTPException(status_code=503, detail="Données non chargées")

    stocks = []
    for _, row in store.stocks.iterrows():
        stocks.append(StockItem(
            produit_id=f"{row['artisan_id']}_{row['produit']}",
            nom=row["produit"],
            categorie=store.artisans[store.artisans["artisan_id"] == row["artisan_id"]]["specialite"].iloc[0],
            stock_actuel=row["stock_actuel"],
            seuil_alerte=row["seuil_alerte"],
            prix_unitaire=row["prix_unitaire"]
        ))

    return stocks

@app.get("/api/stocks/alertes", response_model=List[AlerteStock])
async def get_alertes():
    """Récupère les alertes (Observer Pattern)"""
    if store.stocks is None:
        raise HTTPException(status_code=503, detail="Données non chargées")

    alertes = []
    for _, row in store.stocks.iterrows():
        if row["stock_actuel"] <= row["seuil_alerte"]:
            ventes_produit = store.ventes[store.ventes["produit"] == row["produit"]]
            vente_moyenne = ventes_produit["quantite"].mean() if len(ventes_produit) > 0 else 0.1
            jours_rupture = int(row["stock_actuel"] / max(vente_moyenne, 0.1))

            urgence = "critique" if row["stock_actuel"] == 0 else "moyenne" if row["stock_actuel"] <= row["seuil_alerte"] / 2 else "faible"

            alertes.append(AlerteStock(
                produit_id=f"{row['artisan_id']}_{row['produit']}",
                nom=row["produit"],
                stock_actuel=row["stock_actuel"],
                seuil_alerte=row["seuil_alerte"],
                jours_avant_rupture=jours_rupture,
                urgence=urgence
            ))

    return sorted(alertes, key=lambda x: x.stock_actuel)

@app.post("/api/stocks/update/{produit_id}")
async def update_stock(produit_id: str, quantite: int):
    """Met à jour le stock et notifie (Observer Pattern)"""
    # Simulation de mise à jour
    store.alert_system.update_stock(produit_id, quantite, 10)
    return {"status": "updated", "produit_id": produit_id, "new_stock": quantite}

# ============================================================
# PRÉDICTIONS - Strategy Pattern
# ============================================================

@app.post("/api/predict", response_model=List[PredictionResponse])
async def predict(request: PredictionRequest):
    """
    Prédit la demande future avec le modèle actuel (Strategy Pattern).

    Peut utiliser différents modèles selon la configuration.
    """
    if store.features is None:
        raise HTTPException(status_code=503, detail="Données non chargées")

    # Vérifier si on doit changer de modèle
    current_info = store.prediction_service.get_model_info()
    if request.model_type != current_info.get('type', '').lower():
        try:
            store.prediction_service.switch_model(request.model_type)
        except ValueError:
            pass  # Garde le modèle actuel si le type demandé n'existe pas

    # Trouver le produit
    produit_data = store.features[store.features["produit"] == request.produit_id]
    if len(produit_data) == 0:
        raise HTTPException(status_code=404, detail=f"Produit {request.produit_id} non trouvé")

    # Prédire
    last_row = produit_data.iloc[-1]
    predictions = store.prediction_service.predict_future(last_row, request.horizon_jours)

    # Ajouter le produit_id
    for pred in predictions:
        pred['produit_id'] = request.produit_id

    return predictions

@app.get("/api/predict/features/importance")
async def get_feature_importance():
    """Retourne l'importance des features du modèle actuel"""
    importance = store.prediction_service.get_feature_importance()
    return {
        "model_type": store.prediction_service.get_model_info()['type'],
        "feature_importance": importance,
        "top_features": dict(sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10])
    }

# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard/kpis")
async def get_kpis():
    """KPIs pour le tableau de bord"""
    if store.ventes is None:
        raise HTTPException(status_code=503, detail="Données non chargées")

    ca_total = store.ventes["total"].sum()
    alertes = store.stocks[store.stocks["stock_actuel"] <= store.stocks["seuil_alerte"]]
    top_produit = store.ventes.groupby("produit")["quantite"].sum().idxmax()

    return {
        "ca_total_mois": ca_total / 30,
        "ca_prevu_mois": ca_total / 30 * 1.1,
        "produits_en_alerte": len(alertes),
        "produits_en_rupture": len(store.stocks[store.stocks["stock_actuel"] == 0]),
        "top_produit": top_produit,
        "croissance_mois": 0.15,
        "model_type": store.prediction_service.get_model_info()['type']
    }

@app.get("/api/dashboard/tendances")
async def get_tendances():
    """Tendances pour les graphiques"""
    if store.ventes is None:
        raise HTTPException(status_code=503, detail="Données non chargées")

    ventes_mensuel = store.ventes.groupby(store.ventes["date"].dt.to_period("M")).agg({
        "quantite": "sum",
        "total": "sum"
    }).reset_index()
    ventes_mensuel["date"] = ventes_mensuel["date"].astype(str)

    return {
        "dates": ventes_mensuel["date"].tolist(),
        "quantites": ventes_mensuel["quantite"].tolist(),
        "ca": ventes_mensuel["total"].tolist()
    }

# ============================================================
# POINT D'ENTRÉE
# ============================================================

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
