"""
GRU-based next-basket recommender.

Loads the trained GRU model and predicts which products the user is likely
to buy next, given their recent purchase sequence.
"""

import os
import re

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from product_matcher import find_product_id, get_product_name

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
GRU_WEIGHTS   = os.path.join(BASE_DIR, '..', 'saved_models', 'gru_weights.pt')
PRODUCTS_CSV  = os.path.join(BASE_DIR, '..', 'data', 'products.csv')
DEPTS_CSV     = os.path.join(BASE_DIR, '..', 'data', 'departments.csv')

N_PRODUCTS  = 49677
EMBED_DIM   = 64
HIDDEN_SIZE = 128
N_LAYERS    = 2
DROPOUT     = 0.3
MAX_SEQ_LEN = 20

# Instacart department IDs that are actual food/grocery categories
FOOD_DEPT_IDS = {1, 3, 4, 6, 7, 9, 10, 12, 13, 14, 15, 16, 19, 20}
# Excluded: 2=other, 5=alcohol, 8=pets, 11=personal care,
#           17=household, 18=babies, 21=missing

# Strip common Instacart prefixes/suffixes that make names ugly
_STRIP_PREFIXES = re.compile(
    r'^(organic|natural|premium|original|classic|traditional|simple|'
    r'pure|real|farm fresh|cage free|free range|grass fed|all natural|'
    r'wild caught|wild\-caught|grade a|grade aa|large |extra large )',
    re.IGNORECASE,
)
_STRIP_SUFFIXES = re.compile(
    r',\s*.+$'   # remove everything after a comma: "Peanuts, Dry Roasted" → "Peanuts"
)


def _clean_name(raw: str) -> str:
    name = _STRIP_SUFFIXES.sub('', raw).strip()
    name = _STRIP_PREFIXES.sub('', name).strip()
    # Title-case so it looks consistent
    return name[:1].upper() + name[1:] if name else raw


# ─── Model definition (must match training notebook exactly) ─────────────────

class GRURecommender(nn.Module):
    def __init__(self, n_products=N_PRODUCTS, embed_dim=EMBED_DIM,
                 hidden_size=HIDDEN_SIZE, n_layers=N_LAYERS, dropout=DROPOUT):
        super().__init__()
        self.embedding = nn.Embedding(n_products + 1, embed_dim, padding_idx=0)
        self.gru       = nn.GRU(
            embed_dim, hidden_size, n_layers,
            batch_first=True,
            dropout=dropout if n_layers > 1 else 0.0,
        )
        self.fc = nn.Linear(hidden_size, n_products)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(x)
        out, _ = self.gru(emb)
        return self.fc(out[:, -1, :])


# ─── Module-level state ───────────────────────────────────────────────────────

_model: GRURecommender | None   = None
_product2idx: dict[int, int]    = {}   # instacart product_id → gru index (1-based)
_idx2product: dict[int, int]    = {}   # gru index → instacart product_id
_food_product_ids: set[int]     = set()
_loaded = False


def _load() -> None:
    global _model, _product2idx, _idx2product, _food_product_ids, _loaded
    if _loaded:
        return

    # Load products + departments to build food-only set
    products = pd.read_csv(PRODUCTS_CSV)
    products['product_id'] = products['product_id'].astype(int)
    products['department_id'] = products['department_id'].astype(int)
    food_products = products[products['department_id'].isin(FOOD_DEPT_IDS)]
    _food_product_ids = set(int(x) for x in food_products['product_id'])

    # Build product2idx from ALL products (sorted), same as training
    sorted_ids   = sorted(products['product_id'].unique())
    _product2idx = {pid: i + 1 for i, pid in enumerate(sorted_ids)}
    _idx2product = {i + 1: pid for i, pid in enumerate(sorted_ids)}

    # Load model
    _model = GRURecommender()
    state  = torch.load(GRU_WEIGHTS, map_location='cpu', weights_only=False)
    _model.load_state_dict(state)
    _model.eval()
    _loaded = True


def predict_next_basket(
    item_names: list[str],
    top_k: int = 10,
) -> list[dict]:
    """
    Given CartIQ item names (chronological), return top_k next-basket predictions.
    Only food-department products are returned; names are cleaned.

    Returns list of dicts: {productName, score}
    """
    _load()
    assert _model is not None

    # Map names → GRU indices
    gru_indices: list[int] = []
    known_product_ids: set[int] = set()

    for name in item_names[-MAX_SEQ_LEN:]:
        pid = find_product_id(name)
        if pid is not None and pid in _product2idx:
            gru_indices.append(_product2idx[pid])
            known_product_ids.add(pid)

    if not gru_indices:
        return []

    seq = torch.tensor([gru_indices], dtype=torch.long)

    with torch.no_grad():
        logits = _model(seq)[0]                        # [n_products]
        probs  = torch.sigmoid(logits).numpy()

    # Zero out known purchases
    for gru_idx in set(gru_indices):
        pos = gru_idx - 1
        if 0 <= pos < len(probs):
            probs[pos] = 0.0

    # Scan top candidates, keep only food products
    top_positions = np.argsort(probs)[::-1]

    results = []
    for pos in top_positions:
        if len(results) >= top_k:
            break
        gru_idx = int(pos) + 1
        pid     = _idx2product.get(gru_idx)
        if pid is None or pid in known_product_ids:
            continue
        if pid not in _food_product_ids:          # skip non-food
            continue
        raw_name = get_product_name(pid)
        if raw_name is None:
            continue
        results.append({
            'productName': _clean_name(raw_name),
            'score':       float(probs[pos]),
        })

    return results
