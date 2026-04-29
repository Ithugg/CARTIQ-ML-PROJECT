"""
NCF-based discovery recommender.

Extracts product embeddings from the trained NCF model and uses
cosine similarity to find products similar to the user's purchase history.
"""

import os
import pickle
import re

import numpy as np
import pandas as pd
import torch

from product_matcher import find_product_id, get_product_name

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
NCF_WEIGHTS  = os.path.join(BASE_DIR, '..', 'saved_models', 'ncf_weights.pt')
NCF_ID_MAPS  = os.path.join(BASE_DIR, '..', 'saved_models', 'ncf_id_maps.pkl')
PRODUCTS_CSV = os.path.join(BASE_DIR, '..', 'data', 'products.csv')

# Same food-only department filter as gru_recommender
FOOD_DEPT_IDS = {1, 3, 4, 6, 7, 9, 10, 12, 13, 14, 15, 16, 19, 20}

# Skip products clearly aimed at babies/kids — these pass the department filter
# but aren't useful for adult grocery recommendations
_KIDS_PATTERN = re.compile(
    r'\b(baby|babies|infant|toddler|kids?|children|stage [12]|gerber|'
    r'similac|enfamil|pedialyte|squeeze[rz]|squeez)\b',
    re.IGNORECASE,
)

_STRIP_PREFIXES = re.compile(
    r'^(organic|natural|premium|original|classic|traditional|simple|'
    r'pure|real|farm fresh|cage free|free range|grass fed|all natural|'
    r'wild caught|wild\-caught|grade a|grade aa|large |extra large )',
    re.IGNORECASE,
)
_STRIP_SUFFIXES = re.compile(r',\s*.+$')

def _clean_name(raw: str) -> str:
    name = _STRIP_SUFFIXES.sub('', raw).strip()
    name = _STRIP_PREFIXES.sub('', name).strip()
    return name[:1].upper() + name[1:] if name else raw


_embeddings: np.ndarray | None  = None   # [n_products, 64], L2-normalised
_product2idx: dict[int, int]    = {}
_idx2product: dict[int, int]    = {}
_food_product_ids: set[int]     = set()
_loaded = False


def _load() -> None:
    global _embeddings, _product2idx, _idx2product, _food_product_ids, _loaded
    if _loaded:
        return

    # ── Food department filter ────────────────────────────────────────────────
    products = pd.read_csv(PRODUCTS_CSV)
    products['product_id']    = products['product_id'].astype(int)
    products['department_id'] = products['department_id'].astype(int)
    _food_product_ids = set(
        int(x) for x in products[products['department_id'].isin(FOOD_DEPT_IDS)]['product_id']
    )

    # ── ID maps ───────────────────────────────────────────────────────────────
    with open(NCF_ID_MAPS, 'rb') as f:
        id_maps = pickle.load(f)

    if isinstance(id_maps, dict):
        _product2idx = id_maps.get('product2idx', id_maps.get('item2idx', {}))
    elif isinstance(id_maps, (list, tuple)) and len(id_maps) >= 2:
        _product2idx = id_maps[1]
    else:
        _product2idx = id_maps

    _idx2product = {int(v): int(k) for k, v in _product2idx.items()}

    # ── Product embeddings ────────────────────────────────────────────────────
    state = torch.load(NCF_WEIGHTS, map_location='cpu', weights_only=False)

    embed_key = None
    for k in state:
        if 'product' in k.lower() and 'weight' in k.lower():
            embed_key = k
            break
        if 'item' in k.lower() and 'weight' in k.lower() and 'embed' in k.lower():
            embed_key = k
            break

    if embed_key is None:
        raise RuntimeError(f"Cannot find product embedding. Keys: {list(state.keys())[:10]}")

    raw = state[embed_key].float().numpy()          # [n_products, embed_dim]
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    _embeddings = raw / np.maximum(norms, 1e-8)
    _loaded = True


def get_discoveries(
    item_names: list[str],
    top_k: int = 10,
) -> list[dict]:
    """
    Return top_k food products similar to the user's purchase history.

    Scores are normalised to the visible range so they spread across
    40–90% rather than clustering at 96–97% (collapsed embedding space).

    Returns list of dicts: {productName, score, basedOn}
    """
    _load()
    assert _embeddings is not None

    # Map item names → embedding indices
    matched: list[tuple[str, int]] = []
    for name in item_names:
        pid = find_product_id(name)
        if pid is not None and pid in _product2idx:
            matched.append((name, pid))

    if not matched:
        return []

    known_product_ids = {pid for _, pid in matched}
    known_indices     = [_product2idx[pid] for _, pid in matched]

    # User profile = mean of L2-normalised embeddings, re-normalised
    user_vecs    = _embeddings[known_indices]
    user_profile = user_vecs.mean(axis=0)
    norm = np.linalg.norm(user_profile)
    if norm > 0:
        user_profile /= norm

    # Raw cosine similarities
    sims = _embeddings @ user_profile               # [n_products]

    # Zero out known items
    for idx in known_indices:
        sims[idx] = -2.0

    # Collect food-only candidates — scan top 500 for enough food items
    top_raw = np.argsort(sims)[-500:][::-1]
    candidates: list[tuple[int, int, float]] = []   # (raw_idx, pid, sim)

    for raw_idx in top_raw:
        pid = _idx2product.get(int(raw_idx))
        if pid is None or pid in known_product_ids:
            continue
        if pid not in _food_product_ids:
            continue
        pname = get_product_name(pid)
        if pname is None:
            continue
        if _KIDS_PATTERN.search(pname):          # skip baby/kids products
            continue
        candidates.append((int(raw_idx), pid, float(sims[raw_idx])))
        if len(candidates) >= top_k * 3:
            break

    if not candidates:
        return []

    # Normalise scores to a readable range (40 % → 90 %)
    raw_scores = np.array([c[2] for c in candidates])
    s_min, s_max = raw_scores.min(), raw_scores.max()
    score_range = s_max - s_min if s_max > s_min else 1.0

    def normalise(s: float) -> float:
        return 0.40 + 0.50 * (s - s_min) / score_range

    results = []
    for raw_idx, pid, sim in candidates[:top_k]:
        pname = get_product_name(pid)
        if pname is None:
            continue

        # Which of the user's items is closest to this recommendation?
        item_sims  = user_vecs @ _embeddings[raw_idx]
        best_match = matched[int(np.argmax(item_sims))][0]

        results.append({
            'productName': _clean_name(pname),
            'score':       normalise(sim),
            'basedOn':     best_match,
        })

    return results
