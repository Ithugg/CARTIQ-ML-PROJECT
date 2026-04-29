"""
Neural Collaborative Filtering (NCF).

Architecture: Embedding(user) + Embedding(product) -> concat -> MLP [256, 128, 64] -> Sigmoid
Reference: He et al., 2017. Neural Collaborative Filtering. WWW '17, 173-182.
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset


class NCFModel(nn.Module):
    """
    NCF model: user/product embeddings concatenated and passed through an MLP.

    Args:
        n_users:     Number of unique users.
        n_products:  Number of unique products.
        embed_dim:   Embedding dimension for both users and products.
        mlp_layers:  Hidden layer sizes for the MLP.
        dropout:     Dropout probability applied after each hidden layer.
    """

    def __init__(
        self,
        n_users: int,
        n_products: int,
        embed_dim: int = 64,
        mlp_layers: list = None,
        dropout: float = 0.3,
    ):
        super().__init__()
        if mlp_layers is None:
            mlp_layers = [256, 128, 64]

        self.user_embedding = nn.Embedding(n_users, embed_dim)
        self.product_embedding = nn.Embedding(n_products, embed_dim)

        input_size = embed_dim * 2
        layers = []
        for layer_size in mlp_layers:
            layers.append(nn.Linear(input_size, layer_size))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            input_size = layer_size

        layers.append(nn.Linear(input_size, 1))
        layers.append(nn.Sigmoid())
        self.mlp = nn.Sequential(*layers)

        self._init_weights()

    def _init_weights(self):
        nn.init.normal_(self.user_embedding.weight, std=0.01)
        nn.init.normal_(self.product_embedding.weight, std=0.01)
        for layer in self.mlp:
            if isinstance(layer, nn.Linear):
                nn.init.xavier_uniform_(layer.weight)
                nn.init.zeros_(layer.bias)

    def forward(self, user_ids: torch.Tensor, product_ids: torch.Tensor) -> torch.Tensor:
        """
        Args:
            user_ids:    (B,) long tensor of user indices
            product_ids: (B,) long tensor of product indices
        Returns:
            (B,) float tensor of reorder probabilities
        """
        user_embed = self.user_embedding(user_ids)
        product_embed = self.product_embedding(product_ids)
        x = torch.cat([user_embed, product_embed], dim=1)
        return self.mlp(x).squeeze(-1)


class NCFDataset(Dataset):
    """
    Dataset for NCF training with in-batch negative sampling.

    For every positive (user, product) pair, neg_ratio random negative
    product samples are generated (products the user has not interacted with).

    Args:
        user_ids:    Array of user indices (positives).
        product_ids: Array of product indices (positives).
        labels:      Array of binary labels (positives = 1).
        n_products:  Total number of products (for sampling).
        neg_ratio:   Number of negatives per positive (0 = no negatives added).
    """

    def __init__(
        self,
        user_ids: np.ndarray,
        product_ids: np.ndarray,
        labels: np.ndarray,
        n_products: int,
        neg_ratio: int = 4,
    ):
        self.user_ids = torch.LongTensor(user_ids)
        self.product_ids = torch.LongTensor(product_ids)
        self.labels = torch.FloatTensor(labels)
        self.n_products = n_products
        self.neg_ratio = neg_ratio

        # Build per-user positive set for efficient negative sampling
        self.user_pos_products: dict = {}
        for u, p in zip(user_ids, product_ids):
            self.user_pos_products.setdefault(int(u), set()).add(int(p))

        if neg_ratio > 0:
            self._generate_negatives()
        else:
            self.neg_user_ids = torch.LongTensor([])
            self.neg_product_ids = torch.LongTensor([])
            self.neg_labels = torch.FloatTensor([])

    def _generate_negatives(self):
        rng = np.random.default_rng(seed=42)
        neg_users, neg_products = [], []
        for u, p in zip(self.user_ids.numpy(), self.product_ids.numpy()):
            pos_set = self.user_pos_products.get(int(u), set())
            for _ in range(self.neg_ratio):
                neg_p = rng.integers(0, self.n_products)
                while neg_p in pos_set:
                    neg_p = rng.integers(0, self.n_products)
                neg_users.append(u)
                neg_products.append(neg_p)

        self.neg_user_ids = torch.LongTensor(neg_users)
        self.neg_product_ids = torch.LongTensor(neg_products)
        self.neg_labels = torch.zeros(len(neg_users))

    def __len__(self):
        return len(self.user_ids) + len(self.neg_user_ids)

    def __getitem__(self, idx):
        n_pos = len(self.user_ids)
        if idx < n_pos:
            return self.user_ids[idx], self.product_ids[idx], self.labels[idx]
        neg_idx = idx - n_pos
        return self.neg_user_ids[neg_idx], self.neg_product_ids[neg_idx], self.neg_labels[neg_idx]
