# CartIQ — ML-Powered Grocery Intelligence

CartIQ is a React Native (Expo) grocery assistant app with three integrated ML models:

| Model | Purpose | Endpoint |
|---|---|---|
| LightGBM (GBDT) | Reorder probability per item | `POST /predict` |
| GRU | Next-basket sequence prediction | `POST /recommend/gru` |
| NCF | Discovery recommendations (collaborative filtering) | `POST /recommend/ncf` |

A fourth model (Random Forest) was trained and evaluated for comparison but is not deployed.

---

## Requirements

- **Python 3.13+**
- **Node.js 18+**

---

## Quick Start

### 1. Install app dependencies
```bash
npm install
npx expo start
```

### 2. Set up the ML API

```bash
cd ml/api
pip install -r requirements.txt
python app.py        # starts Flask on localhost:5001
```

### 3. Download trained model weights

The model weights exceed GitHub's file size limit and are hosted separately.

**Download:** [Google Drive — CartIQ model weights](https://drive.google.com/drive/folders/1R8dJdM-7xcIz3BOWI6dnddasS_vIRkmc?usp=sharing)

After downloading, extract and place the files in `ml/saved_models/`:

```
ml/saved_models/
├── lightgbm_model.txt     (32 KB)
├── ncf_weights.pt         (63 MB)
├── ncf_id_maps.pkl        (5.7 MB)
└── gru_weights.pt         (38 MB)
```

Once weights are in place, `python ml/api/app.py` will load them automatically.

### 4. Get the Instacart dataset (required only for re-training)

The three large Instacart CSV files are not in this repo. Download them from Kaggle:

**Download:** https://www.kaggle.com/datasets/yasserh/instacart-online-grocery-basket-analysis-dataset

After extracting, place these files in `ml/data/`:

```
ml/data/
├── orders.csv                   (~3.4M rows, 104 MB)  ← download from Kaggle
├── order_products__prior.csv    (~32M rows, 551 MB)   ← download from Kaggle
├── order_products__train.csv    (~1.4M rows, 24 MB)   ← download from Kaggle
├── products.csv                 (included in repo)
├── departments.csv              (included in repo)
└── aisles.csv                   (included in repo)
```

---

## Running the Experiments

All training and evaluation notebooks are in `notebooks/` (project root):

| Notebook | Description |
|---|---|
| `01_data_preparation.ipynb` | Load and explore the Instacart dataset |
| `02_feature_engineering.ipynb` | Build user/product/interaction feature matrix |
| `03_models_rf_gbdt.ipynb` | Train Random Forest and LightGBM (GBDT); Optuna tuning; SHAP analysis |
| `04_ncf.ipynb` | Train Neural Collaborative Filtering model |
| `05_gru_sequential.ipynb` | Train GRU next-basket sequence model |
| `06_evaluation_comparison.ipynb` | Unified model comparison, cold-start analysis, error characterisation |

Run notebooks in order (01 → 06). Each notebook saves intermediate outputs to `ml/features/` and final weights to `ml/saved_models/`.

> `ml/notebooks/` contains development/working versions of the same notebooks used during the Flask API integration phase.

---

## Project Structure

```
├── notebooks/              # Course experiment notebooks (01–06, run these)
├── app/                    # Expo Router screens (React Native)
│   └── (app)/
│       ├── dashboard.tsx   # Home — predictions + next basket
│       └── predictions.tsx # Tabs: predictions / reminders / discover
├── ml/
│   ├── api/                # Flask API (Python 3.13)
│   │   ├── app.py
│   │   ├── gru_recommender.py
│   │   ├── ncf_recommender.py
│   │   ├── product_matcher.py
│   │   └── requirements.txt
│   ├── data/               # CSV data files (large ones excluded from git)
│   ├── models/             # PyTorch model class definitions
│   │   ├── gru.py
│   │   └── ncf.py
│   ├── notebooks/          # Development/API-integration notebooks
│   ├── outputs/            # Training plots and result JSONs
│   ├── saved_models/       # Trained weights (download separately — see above)
│   └── utils/
│       └── metrics.py
├── services/
│   └── ml/
│       ├── predictionEngine.ts   # GBDT reorder predictions
│       └── mlRecommender.ts      # GRU + NCF API calls
├── stores/
│   └── predictionsStore.ts
└── types/index.ts
```

---

## Seeding Demo Data

```bash
node scripts/seedYunusData.mjs <firebase-email> <firebase-password>
```

Populates ~2000 purchase records across 32 weeks for demo purposes.
