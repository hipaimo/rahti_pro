"""
Factory Method Pattern - Création des modèles de prédiction
Décore la création des modèles sans couplage fort avec les classes concrètes
"""

from typing import Dict, Type
from .strategy import PredictionStrategy
from .random_forest_strategy import RandomForestStrategy
from .lightgbm_strategy import LightGBMStrategy

class ModelFactory:
    """
    Factory Method pour créer les modèles de prédiction.

    Pattern: Factory Method (GoF)
    But: Définir une interface pour créer un objet, mais laisser les sous-classes décider quelle classe instancier
    """

    # Registry des modèles disponibles
    _models: Dict[str, Type[PredictionStrategy]] = {
        'random_forest': RandomForestStrategy,
        'lightgbm': LightGBMStrategy,
        'rf': RandomForestStrategy,
        'lgb': LightGBMStrategy
    }

    @classmethod
    def register_model(cls, name: str, model_class: Type[PredictionStrategy]):
        """Enregistre un nouveau modèle dans la factory"""
        cls._models[name] = model_class

    @classmethod
    def create_model(cls, model_type: str, **kwargs) -> PredictionStrategy:
        """
        Crée un modèle selon le type demandé.

        Args:
            model_type: Type de modèle ('random_forest', 'lightgbm', etc.)
            **kwargs: Paramètres du modèle

        Returns:
            Instance du modèle demandé

        Raises:
            ValueError: Si le type de modèle n'est pas reconnu
        """
        model_type = model_type.lower()

        if model_type not in cls._models:
            available = ', '.join(cls._models.keys())
            raise ValueError(f"Modèle '{model_type}' non reconnu. Disponibles: {available}")

        model_class = cls._models[model_type]
        return model_class(**kwargs)

    @classmethod
    def get_available_models(cls) -> list:
        """Retourne la liste des modèles disponibles"""
        return list(cls._models.keys())

    @classmethod
    def get_model_info(cls, model_type: str) -> dict:
        """Retourne les informations sur un modèle"""
        model_type = model_type.lower()
        if model_type not in cls._models:
            return {}

        # Créer une instance temporaire pour obtenir les infos
        model = cls._models[model_type]()
        return model.get_model_info()
