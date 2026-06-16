"""
Concrete Strategy - Random Forest
Implémentation du modèle Random Forest avec le Pattern Strategy
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any
from .strategy import PredictionStrategy

class RandomForestStrategy(PredictionStrategy):
    """
    Stratégie de prédiction utilisant Random Forest.

    Avantages:
    - Interprétable (feature importance)
    - Robuste aux outliers
    - Pas de scaling nécessaire
    """

    def __init__(self, n_estimators: int = 100, max_depth: int = 10, random_state: int = 42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model = None
        self.feature_names = None
        self.metrics = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'RandomForestStrategy':
        """Entraîne le modèle Random Forest"""
        self.feature_names = X.columns.tolist()

        self.model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            random_state=self.random_state,
            n_jobs=-1
        )

        self.model.fit(X, y)

        # Calcul des métriques sur le training set
        predictions = self.model.predict(X)
        self.metrics = {
            'mae': mean_absolute_error(y, predictions),
            'rmse': np.sqrt(mean_squared_error(y, predictions)),
            'r2': r2_score(y, predictions)
        }

        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit avec Random Forest"""
        if self.model is None:
            raise ValueError("Modèle non entraîné. Appelez fit() d'abord.")
        return self.model.predict(X)

    def get_feature_importance(self) -> Dict[str, float]:
        """Retourne l'importance des features"""
        if self.model is None:
            return {}

        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        return dict(zip(importance['feature'], importance['importance']))

    def get_model_info(self) -> Dict[str, Any]:
        """Retourne les informations du modèle"""
        return {
            'type': 'RandomForest',
            'n_estimators': self.n_estimators,
            'max_depth': self.max_depth,
            'metrics': self.metrics,
            'feature_count': len(self.feature_names) if self.feature_names else 0
        }
