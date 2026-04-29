"""
Evaluation metrics for CartIQ ML models.
"""

import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score


def compute_classification_metrics(y_true, y_pred_proba, threshold: float = 0.5) -> dict:
    """
    Compute Precision, Recall, F1, and ROC-AUC from probability predictions.

    Args:
        y_true:        Ground-truth binary labels.
        y_pred_proba:  Predicted probabilities (continuous in [0, 1]).
        threshold:     Decision threshold.

    Returns:
        dict with keys: precision, recall, f1, roc_auc
    """
    y_pred = (np.asarray(y_pred_proba) >= threshold).astype(int)
    return {
        'precision': precision_score(y_true, y_pred, zero_division=0),
        'recall':    recall_score(y_true, y_pred, zero_division=0),
        'f1':        f1_score(y_true, y_pred, zero_division=0),
        'roc_auc':   roc_auc_score(y_true, y_pred_proba),
    }


def precision_at_k(actual: list, predicted: list, k: int) -> float:
    """Precision@K for a single user."""
    return len(set(predicted[:k]) & set(actual)) / k


def recall_at_k(actual: list, predicted: list, k: int) -> float:
    """Recall@K for a single user."""
    if not actual:
        return 0.0
    return len(set(predicted[:k]) & set(actual)) / len(actual)


def mean_precision_at_k(actuals: list, predictions: list, k: int = 10) -> float:
    """Mean Precision@K across all users."""
    return float(np.mean([precision_at_k(a, p, k) for a, p in zip(actuals, predictions)]))


def mean_recall_at_k(actuals: list, predictions: list, k: int = 10) -> float:
    """Mean Recall@K across all users."""
    return float(np.mean([recall_at_k(a, p, k) for a, p in zip(actuals, predictions)]))


def ndcg_at_k(actual: list, predicted: list, k: int) -> float:
    """NDCG@K for a single user."""
    actual_set = set(actual)
    dcg = sum(
        1.0 / np.log2(i + 2)
        for i, item in enumerate(predicted[:k])
        if item in actual_set
    )
    idcg = sum(1.0 / np.log2(i + 2) for i in range(min(len(actual), k)))
    return dcg / idcg if idcg > 0 else 0.0


def print_metrics_table(results: dict) -> None:
    """Print a formatted comparison table for all models."""
    header = f"{'Model':<22} {'Precision':<12} {'Recall':<12} {'F1':<12} {'ROC-AUC':<12}"
    print(f"\n{header}")
    print("-" * len(header))
    for model_name, m in results.items():
        p   = m.get('precision', m.get('precision_at_10', 0.0))
        r   = m.get('recall',    m.get('recall_at_10',    0.0))
        f1  = m.get('f1',        m.get('f1_at_10',        0.0))
        auc = m.get('roc_auc', 'Top-K only')
        auc_str = f'{auc:.4f}' if isinstance(auc, float) else auc
        print(f'{model_name:<22} {p:<12.4f} {r:<12.4f} {f1:<12.4f} {auc_str:<12}')
    print()
