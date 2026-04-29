"""
CartIQ ML Prediction API

Serves GBDT predictions + NCF/GRU recommendations for the CartIQ app.
Run: python app.py
"""

import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS
import lightgbm as lgb

from features import compute_features, FEATURE_COLS

# NCF and GRU modules load lazily on first request
import ncf_recommender
import gru_recommender

# ─── Model ────────────────────────────────────────────────────────────────────

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'saved_models', 'lightgbm_model.txt')

if not os.path.exists(MODEL_PATH):
    print(f"\nERROR: Model not found at:\n  {MODEL_PATH}")
    print("Make sure lightgbm_model.txt is in ml/saved_models/\n")
    sys.exit(1)

print(f"Loading GBDT model...")
model = lgb.Booster(model_file=MODEL_PATH)
print("Model ready.\n")

# ─── App ──────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'lightgbm_gbdt'})


@app.route('/predict', methods=['POST'])
def predict():
    data      = request.get_json(force=True)
    purchases = data.get('purchases', [])

    if len(purchases) < 2:
        return jsonify({
            'predictions': [],
            'source': 'ml_api',
            'error': 'insufficient_history',
        })

    try:
        features_df = compute_features(purchases)
    except Exception as exc:
        return jsonify({'predictions': [], 'source': 'ml_api', 'error': str(exc)}), 500

    if features_df.empty:
        return jsonify({'predictions': [], 'source': 'ml_api'})

    X             = features_df[FEATURE_COLS].values
    probabilities = model.predict(X)

    results = []
    for i, (_, row) in enumerate(features_df.iterrows()):
        results.append({
            'itemName':                row['itemName'],
            'category':                row['category'],
            'categoryId':              row['categoryId'],
            'probability':             float(probabilities[i]),
            'purchaseCount':           int(row['up_times_ordered']),
            'avgDaysBetweenPurchases': float(row['avg_days_between_orders']),
            'daysSinceLastPurchase':   float(row['up_days_since_last']),
            'estimatedPrice':          float(row['avgPrice']),
        })

    results.sort(key=lambda x: x['probability'], reverse=True)

    return jsonify({
        'predictions': results[:30],
        'source': 'ml_api',
        'total': len(results),
    })


@app.route('/recommend/ncf', methods=['POST'])
def recommend_ncf():
    data  = request.get_json(force=True)
    items = data.get('items', [])

    if not items:
        return jsonify({'discoveries': [], 'source': 'ncf'})

    try:
        discoveries = ncf_recommender.get_discoveries(items, top_k=12)
    except Exception as exc:
        return jsonify({'discoveries': [], 'source': 'ncf', 'error': str(exc)}), 500

    return jsonify({'discoveries': discoveries, 'source': 'ncf'})


@app.route('/recommend/gru', methods=['POST'])
def recommend_gru():
    data  = request.get_json(force=True)
    items = data.get('items', [])

    if not items:
        return jsonify({'nextBasket': [], 'source': 'gru'})

    try:
        next_basket = gru_recommender.predict_next_basket(items, top_k=10)
    except Exception as exc:
        return jsonify({'nextBasket': [], 'source': 'gru', 'error': str(exc)}), 500

    return jsonify({'nextBasket': next_basket, 'source': 'gru'})


if __name__ == '__main__':
    print("CartIQ ML API → http://localhost:5001")
    print("Endpoints: GET /health  |  POST /predict  |  POST /recommend/ncf  |  POST /recommend/gru\n")
    app.run(host='0.0.0.0', port=5001, debug=False)