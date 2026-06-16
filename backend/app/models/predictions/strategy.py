"""
Strategy Pattern - Interface pour les modèles de prédiction
Permet d'interchanger les modèles (RF, LightGBM, Prophet) sans modifier le code client
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
import pandas as pd
import numpy as np

class PredictionStrategy(ABC):
    """
    Interface commune pour tous les modèles de prédiction.

    Pattern: Strategy (GoF)
    But: Définir une famille d'algorithmes, les encapsuler et les rendre interchangeables
    """

    @abstractmethod
    def fit(self, X: pd.DataFrame, y: pd.Series) -> 'PredictionStrategy':
        """Entraîne le modèle"""
        pass

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Prédit les valeurs futures"""
        pass

    @abstractmethod
    def get_feature_importance(self) -> Dict[str, float]:
        """Retourne l'importance des features"""
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Retourne les informations du modèle"""
        pass
