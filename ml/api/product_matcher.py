"""
Maps CartIQ item names (e.g. "Eggs") to Instacart product IDs via products.csv.
Used by both ncf_recommender and gru_recommender.
"""

import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTS_CSV = os.path.join(BASE_DIR, '..', 'data', 'products.csv')

_df: pd.DataFrame | None = None
_id_to_name: dict[int, str] = {}


def _load() -> None:
    global _df, _id_to_name
    if _df is not None:
        return
    raw = pd.read_csv(PRODUCTS_CSV)
    raw['product_name_lower'] = raw['product_name'].str.lower()
    _df = raw
    _id_to_name = dict(zip(raw['product_id'].astype(int), raw['product_name']))


def find_product_id(name: str) -> int | None:
    """Return the best-matching Instacart product_id for a CartIQ item name."""
    _load()
    assert _df is not None
    key = name.lower().strip()

    # 1. Exact match
    m = _df[_df['product_name_lower'] == key]
    if not m.empty:
        return int(m.iloc[0]['product_id'])

    # 2. CartIQ name is a substring of an Instacart product name
    m = _df[_df['product_name_lower'].str.contains(key, regex=False, na=False)]
    if not m.empty:
        # Prefer shorter names (closer to exact)
        return int(m.loc[m['product_name_lower'].str.len().idxmin(), 'product_id'])

    # 3. First significant word of the CartIQ name appears in a product name
    words = [w for w in key.split() if len(w) > 3]
    for word in words:
        m = _df[_df['product_name_lower'].str.contains(word, regex=False, na=False)]
        if not m.empty:
            return int(m.loc[m['product_name_lower'].str.len().idxmin(), 'product_id'])

    return None


def get_product_name(product_id: int) -> str | None:
    _load()
    return _id_to_name.get(product_id)
