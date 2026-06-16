"""
Concrete Strategy - LightGBM
Implémentation du modèle LightGBM avec le Pattern Strategy
"""

import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any
from .strategy import PredictionStrategy

class LightGBMStrategy(PredictionStrategy):
    """
    Stratégie de prédiction utilisant LightGBM.

    Avantages:
    - 20x plus rapide que XGBoost
    - Gère features catégorielles nativement
    - Feature importance (gain, split)
    """

    def __init__(self, num_leaves: int = 20, learning_rate: float = 0.05, 
                 n_estimators: int = 500, random_state: int = 42):
        self.num_leaves = num_leaves
        self.learning_rate = learning_rate
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model = None
        self.feature_names = None
        self.metrics = {}

    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'LightGBMStrategy':
        """Entraîne le modèle LightGBM"""
        import lightgbm as lgb

        self.feature_names = X.columns.tolist()

        train_data = lgb.Dataset(X, label=y)

        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': self.num_leaves,
            'learning_rate': self.learning_rate,
            'verbose': -1,
            'random_state': self.random_state
        }

        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=self.n_estimators,
            callbacks=[lgb.early_stopping(50, verbose=False)]
        )

        # Métriques
        predictions = self.model.predict(X, num_iteration=self.model.best_iteration)
        self.metrics = {
            'mae': mean_absolute_error(y, predictions),
            'rmse': np.sqrt(mean_squared_error(y, predictions)),
            'r2': r2_score(y, predictions),
            'best_iteration': self.model.best_iteration
        }

        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit avec LightGBM"""
        if self.model is None:
            raise ValueError("Modèle non entraîné. Appelez fit() d'abord.")
        return self.model.predict(X, num_iteration=self.model.best_iteration)

    def get_feature_importance(self) -> Dict[str, float]:
        """Retourne l'importance des features (gain)"""
        if self.model is None:
            return {}

        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importance(importance_type='gain')
        }).sort_values('importance', ascending=False)

        return dict(zip(importance['feature'], importance['importance']))

    def get_model_info(self) -> Dict[str, Any]:
        """Retourne les informations du modèle"""
        return {
            'type': 'LightGBM',
            'num_leaves': self.num_leaves,
            'learning_rate': self.learning_rate,
            'metrics': self.metrics,
            'feature_count': len(self.feature_names) if self.feature_names else 0
        }
