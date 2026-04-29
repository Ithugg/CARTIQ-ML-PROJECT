"""
Feature computation for CartIQ → GBDT inference.

Takes raw CartIQ purchase records (same shape as Firestore `purchases` docs)
and computes the 16 features the trained LightGBM model expects.
"""

from datetime import datetime
import pandas as pd
import numpy as np

FEATURE_COLS = [
    'total_orders', 'avg_basket_size', 'avg_days_between_orders', 'user_reorder_rate',
    'product_order_freq', 'product_reorder_rate', 'avg_add_to_cart_position',
    'up_times_ordered', 'up_times_reordered', 'up_reorder_ratio',
    'up_days_since_last', 'up_order_streak',
    'order_dow', 'order_hour_of_day', 'days_since_last_order', 'purchase_velocity',
]

# Mean avg_add_to_cart_position from Instacart training data (SHAP ≈ 0, safe to fix)
MEAN_CART_POSITION = 8.35


def compute_features(purchases: list[dict]) -> pd.DataFrame:
    """
    purchases: list of CartIQ purchase dicts with keys:
      itemName, category, categoryId, price, quantity, purchasedAt, listId

    Returns a DataFrame with columns: itemName, category, categoryId, avgPrice,
    + all 16 FEATURE_COLS ready for model.predict().
    """
    df = pd.DataFrame(purchases)
    df['purchasedAt'] = pd.to_datetime(df['purchasedAt'], utc=True)
    df['item_key'] = df['itemName'].str.lower().str.strip()

    now = pd.Timestamp.now(tz='UTC')

    # ── Trip-level aggregation ──────────────────────────────────────────────
    # Use listId as the trip identifier (each list = one shopping trip)
    if 'listId' in df.columns and df['listId'].notna().any():
        trips = (
            df.groupby('listId')
              .agg(trip_date=('purchasedAt', 'min'), n_items=('itemName', 'count'))
              .reset_index()
              .sort_values('trip_date')
              .reset_index(drop=True)
        )
        trip_id_col = 'listId'
    else:
        df['_date'] = df['purchasedAt'].dt.date.astype(str)
        trips = (
            df.groupby('_date')
              .agg(trip_date=('purchasedAt', 'min'), n_items=('itemName', 'count'))
              .reset_index()
              .rename(columns={'_date': 'listId'})
              .sort_values('trip_date')
              .reset_index(drop=True)
        )
        df['listId'] = df['_date']
        trip_id_col = 'listId'

    total_orders    = len(trips)
    avg_basket_size = float(trips['n_items'].mean())

    trip_dates = trips['trip_date'].tolist()
    if total_orders > 1:
        intervals = [(trip_dates[i + 1] - trip_dates[i]).days for i in range(len(trip_dates) - 1)]
        avg_days_between_orders = float(np.mean(intervals))
    else:
        avg_days_between_orders = 7.0

    days_since_last_order = float((now - trips['trip_date'].max()).days)
    span_days             = max((now - trips['trip_date'].min()).days, 1)
    purchase_velocity     = total_orders / span_days

    item_counts      = df.groupby('item_key')['itemName'].count()
    user_reorder_rate = float((item_counts > 1).sum() / max(len(item_counts), 1))

    # ── Per-trip item sets (for streak calculation) ─────────────────────────
    trip_item_sets = (
        df.groupby(trip_id_col)['item_key']
          .apply(set)
          .reindex(trips[trip_id_col])
          .tolist()
    )

    # ── Per-item features ───────────────────────────────────────────────────
    records = []
    for item_key, item_df in df.groupby('item_key'):
        item_df = item_df.sort_values('purchasedAt')

        up_times_ordered   = len(item_df)
        up_times_reordered = max(0, up_times_ordered - 1)
        up_reorder_ratio   = up_times_reordered / up_times_ordered

        last_purchase      = item_df['purchasedAt'].max()
        up_days_since_last = float((now - last_purchase).days)

        # Streak: how many consecutive recent trips included this item
        streak = 0
        for trip_items in reversed(trip_item_sets):
            if item_key in trip_items:
                streak += 1
            else:
                break

        # Product-level proxies (Instacart uses global stats; we use user-scoped)
        product_order_freq   = float(up_times_ordered)
        product_reorder_rate = up_reorder_ratio

        # Temporal: from the most recent purchase of this item
        # Convert Python weekday (Mon=0) to Instacart convention (Sun=0)
        order_dow  = float((last_purchase.weekday() + 1) % 7)
        order_hour = float(last_purchase.hour)

        avg_price = float(item_df['price'].mean()) if 'price' in item_df.columns else 5.0

        records.append({
            'itemName':   item_df['itemName'].iloc[-1],
            'category':   item_df['category'].iloc[-1] if 'category' in item_df.columns else 'Other',
            'categoryId': item_df['categoryId'].iloc[-1] if 'categoryId' in item_df.columns else 'other',
            'avgPrice':   avg_price,
            # ── 16 model features ──
            'total_orders':              float(total_orders),
            'avg_basket_size':           avg_basket_size,
            'avg_days_between_orders':   avg_days_between_orders,
            'user_reorder_rate':         user_reorder_rate,
            'product_order_freq':        product_order_freq,
            'product_reorder_rate':      product_reorder_rate,
            'avg_add_to_cart_position':  MEAN_CART_POSITION,
            'up_times_ordered':          float(up_times_ordered),
            'up_times_reordered':        float(up_times_reordered),
            'up_reorder_ratio':          up_reorder_ratio,
            'up_days_since_last':        up_days_since_last,
            'up_order_streak':           float(streak),
            'order_dow':                 order_dow,
            'order_hour_of_day':         order_hour,
            'days_since_last_order':     days_since_last_order,
            'purchase_velocity':         purchase_velocity,
        })

    return pd.DataFrame(records)