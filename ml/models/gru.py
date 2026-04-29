"""
GRU-based Sequential Recommender.

Architecture: Embedding(product) -> GRU(hidden=128, layers=2) -> Linear -> Sigmoid
Reference: Hidasi et al., 2016. Session-based Recommendations with RNNs. ICLR.
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset


class GRURecommender(nn.Module):
    """
    GRU sequential recommender for next-basket prediction.

    Takes a padded sequence of product IDs representing a user's purchase
    history and outputs logits over the full product vocabulary.

    Args:
        n_products:   Vocabulary size (number of unique products).
        embed_dim:    Product embedding dimension.
        hidden_size:  GRU hidden state size.
        n_layers:     Number of stacked GRU layers.
        dropout:      Dropout between GRU layers and before the output linear.
        padding_idx:  Index reserved for padding (0).
    """

    def __init__(
        self,
        n_products: int,
        embed_dim: int = 64,
        hidden_size: int = 128,
        n_layers: int = 2,
        dropout: float = 0.3,
        padding_idx: int = 0,
    ):
        super().__init__()
        self.n_products = n_products
        self.hidden_size = hidden_size
        self.n_layers = n_layers

        self.embedding = nn.Embedding(n_products + 1, embed_dim, padding_idx=padding_idx)
        self.gru = nn.GRU(
            embed_dim,
            hidden_size,
            n_layers,
            batch_first=True,
            dropout=dropout if n_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, n_products)

        self._init_weights()

    def _init_weights(self):
        nn.init.normal_(self.embedding.weight, std=0.01)
        nn.init.zeros_(self.embedding.weight[0])  # zero out padding vector
        nn.init.xavier_uniform_(self.fc.weight)
        nn.init.zeros_(self.fc.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (B, L) long tensor of padded product-ID sequences.
        Returns:
            logits: (B, n_products) raw scores for each product.
        """
        embed = self.embedding(x)            # (B, L, embed_dim)
        gru_out, _ = self.gru(embed)         # (B, L, hidden_size)
        last_hidden = gru_out[:, -1, :]      # (B, hidden_size)  — last time step
        last_hidden = self.dropout(last_hidden)
        return self.fc(last_hidden)          # (B, n_products)

    def predict_top_k(self, x: torch.Tensor, k: int = 10) -> torch.Tensor:
        """Return top-K product indices (1-indexed) for each sequence in the batch."""
        logits = self.forward(x)
        return torch.topk(logits, k, dim=1).indices + 1  # +1 because idx 0 = padding


class GRUSequenceDataset(Dataset):
    """
    Sequence dataset for GRU training.

    Each sample is (padded_sequence, multi_hot_target) where:
      - padded_sequence: last max_len product indices (left-padded with 0)
      - multi_hot_target: binary vector of size n_products indicating
        which products appear in the next basket

    Args:
        sequences:  List of product-index sequences (variable length).
        targets:    List of target product-index lists.
        n_products: Total number of products (vocabulary size).
        max_len:    Sequence length after padding/truncation.
    """

    def __init__(
        self,
        sequences: list,
        targets: list,
        n_products: int,
        max_len: int = 50,
    ):
        self.sequences = sequences
        self.targets = targets
        self.n_products = n_products
        self.max_len = max_len

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        seq = self.sequences[idx]

        # Left-pad or truncate to max_len
        if len(seq) < self.max_len:
            seq = [0] * (self.max_len - len(seq)) + seq
        else:
            seq = seq[-self.max_len:]

        # Build multi-hot target vector
        multi_hot = torch.zeros(self.n_products)
        for p in self.targets[idx]:
            p_idx = int(p) - 1  # products are 1-indexed; tensor is 0-indexed
            if 0 <= p_idx < self.n_products:
                multi_hot[p_idx] = 1.0

        return torch.LongTensor(seq), multi_hot
