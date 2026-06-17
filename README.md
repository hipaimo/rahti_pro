# RAHTI Pro - Architecture avec Design Patterns

## Design Patterns Implémentés

### 1. Strategy Pattern (Comportemental)

**Fichier:** `app/models/predictions/strategy.py`

Permet d'interchanger les algorithmes de prédiction sans modifier le code client.

```python
# Interface
class PredictionStrategy(ABC):
    @abstractmethod
    def predict(self, X): pass

# Implémentations
class RandomForestStrategy(PredictionStrategy): ...
class LightGBMStrategy(PredictionStrategy): ...
```

**Utilisation:**

```python
service = PredictionService(model_type='lightgbm')
service.predict(X)  # Utilise LightGBM

service.switch_model('random_forest')  # Change dynamiquement
service.predict(X)  # Utilise maintenant Random Forest
```

### 2. Factory Method (Création)

**Fichier:** `app/models/predictions/factory.py`

Crée des objets sans spécifier la classe exacte.

```python
model = ModelFactory.create_model('lightgbm')
# Retourne une instance de LightGBMStrategy
```

### 3. Observer Pattern (Comportemental)

**Fichier:** `app/models/stocks/observer.py`

Notifie automatiquement les observateurs quand un stock change.

```python
# Sujet observable
alert_system = StockAlertSubject()

# Observateurs
alert_system.attach(DashboardAlertObserver())
alert_system.attach(EmailAlertObserver())

# Quand le stock change, tous les observateurs sont notifiés
alert_system.update_stock('PROD_001', 3, 10)
# → Dashboard affiche l'alerte
# → Email est envoyé
```

### 4. Singleton (Création)

**Fichier:** `app/main.py` (DataStore)

Une seule instance des données en mémoire.

```python
store = DataStore()  # Créé au démarrage
# Tous les endpoints utilisent la même instance
```

## Architecture

```
backend/
├── app/
│   ├── models/
│   │   ├── predictions/
│   │   │   ├── strategy.py              # Interface Strategy
│   │   │   ├── random_forest_strategy.py # Concrete Strategy
│   │   │   ├── lightgbm_strategy.py     # Concrete Strategy
│   │   │   └── factory.py               # Factory Method
│   │   └── stocks/
│   │       └── observer.py            # Observer Pattern
│   ├── services/
│   │   └── prediction_service.py        # Service qui utilise Strategy
│   └── main.py                          # API FastAPI
```

## Endpoints API

| Endpoint                         | Pattern  | Description                  |
| -------------------------------- | -------- | ---------------------------- |
| `POST /api/predict`              | Strategy | Prédit avec le modèle actuel |
| `POST /api/models/switch/{type}` | Strategy | Change de modèle             |
| `GET /api/models/available`      | Factory  | Liste les modèles            |
| `POST /api/stocks/update/{id}`   | Observer | Met à jour et notifie        |
| `GET /api/stocks/alertes`        | Observer | Liste les alertes            |

## Lancement

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

terminal 2:

cd C:\Users\HP\Desktop\vscode\PI\rahti_pro\frontend

```bash
npm start
```
## To run with docker 

```bash
docker compose up --build
```
