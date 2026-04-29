# CartIQ — ML-Powered Grocery Intelligence

CartIQ is a React Native (Expo) grocery assistant app with three integrated ML models:

| Model | Purpose | Endpoint |
|---|---|---|
| LightGBM (GBDT) | Reorder probability per item | `POST /predict` |
| GRU | Next-basket sequence prediction | `POST /recommend/gru` |
| NCF | Discovery recommendations (collaborative filtering) | `POST /recommend/ncf` |

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

### 3. Get the Instacart dataset (required for ML API)

The three large Instacart CSV files are not in this repo due to GitHub file size limits. Download them from Kaggle:

**Download:** https://www.kaggle.com/c/instacart-market-basket-analysis/data

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

> The ML API only needs `products.csv` and `departments.csv` at runtime.
> The large files are only needed if you want to re-train the models.

### 4. Trained model weights (included in repo)

The trained model weights are committed directly and require no extra download:

```
ml/saved_models/
├── lightgbm_model.txt     (32 KB)
├── ncf_weights.pt         (63 MB)
├── ncf_id_maps.pkl        (5.7 MB)
└── gru_weights.pt         (38 MB)
```

> A Random Forest model (~24 GB) was also evaluated but is not used in production.
> Contact the team if you need it.

---

## Project Structure

```
├── app/                    # Expo Router screens
│   └── (app)/
│       ├── dashboard.tsx   # Home — predictions + next basket
│       └── predictions.tsx # Tabs: predictions / reminders / discover
├── ml/
│   ├── api/                # Flask API (Python)
│   │   ├── app.py
│   │   ├── gru_recommender.py
│   │   ├── ncf_recommender.py
│   │   ├── product_matcher.py
│   │   └── requirements.txt
│   ├── data/               # CSV data files (large ones excluded from git)
│   ├── notebooks/          # Training notebooks
│   └── saved_models/       # Trained weights
├── services/
│   └── ml/
│       ├── predictionEngine.ts   # GBDT reorder predictions
│       └── mlRecommender.ts      # GRU + NCF API calls
├── stores/
│   └── predictionsStore.ts
├── scripts/
│   └── seedYunusData.mjs   # Demo data seeder
└── types/index.ts
```

## Re-training Models

Training notebooks are in `ml/notebooks/`. You need the full Instacart dataset (above) to re-train. The notebooks output weights to `ml/saved_models/`.

## Seeding Demo Data

```bash
node scripts/seedYunusData.mjs <firebase-email> <firebase-password>
```

Populates ~2000 purchase records across 32 weeks for demo purposes.
