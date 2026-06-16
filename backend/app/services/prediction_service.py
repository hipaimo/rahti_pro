"""
Service de Prédiction - Orchestration des modèles
Utilise Strategy Pattern + Factory Method
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from ..models.predictions.factory import ModelFactory
from ..models.predictions.strategy import PredictionStrategy

class PredictionService:
    """
    Service de prédiction qui orchestre les modèles.

    Architecture:
    - Strategy Pattern: Change de modèle sans modifier le code
    - Factory Method: Crée les modèles dynamiquement
    """

    def __init__(self, model_type: str = 'lightgbm', model_path: Optional[str] = None):
        self.model_type = model_type
        self.model_path = model_path
        self.model: Optional[PredictionStrategy] = None
        self._raw_booster = None  # Stocke le Booster brut si chargé depuis joblib
        self.feature_names: List[str] = []

        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            self.model = ModelFactory.create_model(model_type)

    def load_model(self, path: str):
        """Charge un modèle sauvegardé"""
        loaded = joblib.load(path)

        # Si c'est déjà un PredictionStrategy, on l'utilise directement
        if isinstance(loaded, PredictionStrategy):
            self.model = loaded
            self.model_type = self.model.get_model_info().get('type', 'lightgbm')

        # Si c'est un Booster LightGBM brut
        else:
            self._raw_booster = loaded
            self.model = None  # pas de wrapper Strategy
            self.model_type = 'lightgbm'

        print(f"✅ Modèle chargé: {path}")

    def save_model(self, path: str):
        """Sauvegarde le modèle"""
        to_save = self.model if self.model is not None else self._raw_booster
        if to_save is None:
            raise ValueError("Aucun modèle à sauvegarder")
        joblib.dump(to_save, path)
        print(f"💾 Modèle sauvegardé: {path}")

    def train(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """Entraîne le modèle."""
        if self.model is None:
            self.model = ModelFactory.create_model(self.model_type)
            self._raw_booster = None

        self.model.fit(X, y)
        self.feature_names = X.columns.tolist()

        predictions = self.model.predict(X)

        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        metrics = {
            'mae': mean_absolute_error(y, predictions),
            'rmse': np.sqrt(mean_squared_error(y, predictions)),
            'r2': r2_score(y, predictions)
        }

        return metrics

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit avec le modèle actuel"""
        if self._raw_booster is not None:
            import lightgbm as lgb
            return self._raw_booster.predict(X)
        if self.model is None:
            raise ValueError("Modèle non entraîné")
        return self.model.predict(X)

    def predict_future(self, last_features: pd.DataFrame, horizon: int = 7) -> List[Dict[str, Any]]:
        """Prédit les prochains jours."""
        predictions = []
        base_prediction = max(0, last_features.get("ma_7j", 5))

        for i in range(horizon):
            future_date = datetime.now() + timedelta(days=i+1)

            prediction = base_prediction * (1 + 0.1 * np.sin(2 * np.pi * i / 7))
            prediction = max(0, prediction + np.random.normal(0, 0.5))

            intervalle = prediction * 0.2

            predictions.append({
                'date': future_date.strftime("%Y-%m-%d"),
                'prediction': round(prediction, 1),
                'intervalle_min': round(max(0, prediction - intervalle), 1),
                'intervalle_max': round(prediction + intervalle, 1),
                'confiance': 'high' if prediction > 5 else 'medium'
            })

        return predictions

    def get_feature_importance(self) -> Dict[str, float]:
        """Retourne l'importance des features"""
        # Booster brut LightGBM
        if self._raw_booster is not None:
            names = self._raw_booster.feature_name()
            importance = self._raw_booster.feature_importance(importance_type='gain')
            return dict(zip(names, importance.tolist()))

        if self.model is None:
            return {}
        return self.model.get_feature_importance()

    def get_model_info(self) -> Dict[str, Any]:
        """Retourne les informations du modèle"""
        # Booster brut LightGBM (chargé depuis joblib)
        if self._raw_booster is not None:
            return {
                "type": "lightgbm",
                "metrics": {
                    "n_estimators": self._raw_booster.num_trees(),
                    "n_features": self._raw_booster.num_feature(),
                },
                "feature_importance": dict(zip(
                    self._raw_booster.feature_name(),
                    self._raw_booster.feature_importance(importance_type='gain').tolist()
                ))
            }

        if self.model is None:
            return {'type': 'none', 'status': 'not_trained'}

        return self.model.get_model_info()

    def switch_model(self, new_model_type: str):
        """Change de modèle dynamiquement (Strategy Pattern)."""
        old_type = self.model_type
        self.model_type = new_model_type
        self.model = ModelFactory.create_model(new_model_type)
        self._raw_booster = None  # On abandonne le Booster brut
        print(f"🔄 Modèle changé: {old_type} → {new_model_type}")