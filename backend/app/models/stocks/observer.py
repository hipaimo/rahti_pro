"""
Observer Pattern - Système de notifications pour les alertes de stock
Permet de notifier automatiquement quand un stock passe sous le seuil
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime

class Observer(ABC):
    """
    Interface pour les observateurs (notifications).

    Pattern: Observer (GoF)
    But: Définir une dépendance un-à-plusieurs entre objets pour notifier les changements
    """

    @abstractmethod
    def update(self, event: str, data: Dict[str, Any]):
        """Reçoit une notification d'événement"""
        pass

class Subject(ABC):
    """
    Interface pour les sujets observables.
    """

    def __init__(self):
        self._observers: List[Observer] = []

    def attach(self, observer: Observer):
        """Ajoute un observateur"""
        if observer not in self._observers:
            self._observers.append(observer)

    def detach(self, observer: Observer):
        """Retire un observateur"""
        self._observers.remove(observer)

    def notify(self, event: str, data: Dict[str, Any]):
        """Notifie tous les observateurs"""
        for observer in self._observers:
            observer.update(event, data)

class StockAlertSubject(Subject):
    """
    Sujet observable pour les alertes de stock.

    Quand un stock passe sous le seuil, notifie tous les observateurs.
    """

    def __init__(self):
        super().__init__()
        self._stock_levels: Dict[str, int] = {}

    def update_stock(self, produit_id: str, stock_actuel: int, seuil_alerte: int):
        """
        Met à jour le niveau de stock et notifie si nécessaire.

        Args:
            produit_id: Identifiant du produit
            stock_actuel: Quantité actuelle en stock
            seuil_alerte: Seuil d'alerte
        """
        self._stock_levels[produit_id] = stock_actuel

        if stock_actuel <= seuil_alerte:
            event_data = {
                'produit_id': produit_id,
                'stock_actuel': stock_actuel,
                'seuil_alerte': seuil_alerte,
                'timestamp': datetime.now().isoformat(),
                'niveau': 'critique' if stock_actuel == 0 else 'alerte' if stock_actuel <= seuil_alerte / 2 else 'attention'
            }
            self.notify('stock_alert', event_data)

class EmailAlertObserver(Observer):
    """
    Observateur qui envoie des alertes par email (simulation).
    """

    def update(self, event: str, data: Dict[str, Any]):
        if event == 'stock_alert':
            print(f"📧 EMAIL ALERTE: Produit {data['produit_id']} - Stock: {data['stock_actuel']}/{data['seuil_alerte']}")

class DashboardAlertObserver(Observer):
    """
    Observateur qui met à jour le dashboard en temps réel.
    """

    def __init__(self):
        self.alerts = []

    def update(self, event: str, data: Dict[str, Any]):
        if event == 'stock_alert':
            self.alerts.append(data)
            print(f"📊 DASHBOARD ALERTE: {data['produit_id']} - {data['niveau']}")

    def get_alerts(self) -> List[Dict[str, Any]]:
        """Retourne les alertes accumulées"""
        return self.alerts

class LogAlertObserver(Observer):
    """
    Observateur qui log les alertes dans un fichier.
    """

    def update(self, event: str, data: Dict[str, Any]):
        if event == 'stock_alert':
            with open('logs/alerts.log', 'a') as f:
                f.write(f"{data['timestamp']} - {data['produit_id']} - {data['niveau']}\n")
