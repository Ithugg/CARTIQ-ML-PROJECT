import { create } from "zustand";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { PantryItem, PurchaseRecord } from "../types";
import { mapIngredientToCategory } from "../data/categories";
import {
  estimateExpirationDays,
  calculateExpirationDate,
  calculateDaysUntilExpiry,
  getFreshnessStatus,
} from "../services/ml/expirationPredictor";
import { cleanForFirestore } from "../services/firebase/utils";

interface PantryState {
  items: PantryItem[];
  isLoading: boolean;

  // Actions
  subscribe: (userId: string) => () => void;
  addToPantry: (userId: string, name: string, quantity: number, unit: string) => Promise<void>;
  addFromPurchases: (userId: string, purchases: PurchaseRecord[]) => Promise<void>;
  removeFromPantry: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  getExpiringItems: () => PantryItem[];
  getExpiredItems: () => PantryItem[];
}

export const usePantryStore = create<PantryState>((set, get) => ({
  items: [],
  isLoading: false,

  subscribe: (userId: string) => {
    set({ isLoading: true });

    const q = query(
      collection(db, "pantry"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: PantryItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const expiresAt = data.expiresAt || null;
          const daysUntilExpiry = expiresAt
            ? calculateDaysUntilExpiry(expiresAt)
            : null;

          return {
            id: d.id,
            name: data.name || "",
            category: data.category || "Other",
            categoryId: data.categoryId || "other",
            quantity: data.quantity || 1,
            unit: data.unit || "pcs",
            addedAt: data.addedAt || new Date().toISOString(),
            expiresAt,
            daysUntilExpiry,
            status: getFreshnessStatus(daysUntilExpiry),
          };
        });

        // Sort: expired first, then expiring soon, then fresh
        items.sort((a, b) => {
          const statusOrder = { expired: 0, expiring_soon: 1, fresh: 2 };
          const orderDiff = statusOrder[a.status] - statusOrder[b.status];
          if (orderDiff !== 0) return orderDiff;
          // Within same status, sort by days until expiry ascending
          return (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999);
        });

        set({ items, isLoading: false });
      },
      (error) => {
        console.error("Pantry subscription error:", error);
        set({ isLoading: false });
      }
    );

    return unsub;
  },

  addToPantry: async (userId, name, quantity, unit) => {
    const cat = mapIngredientToCategory(name);
    const shelfLife = estimateExpirationDays(name, cat.id);
    const now = new Date().toISOString();
    const expiresAt = calculateExpirationDate(now, shelfLife);

    await addDoc(collection(db, "pantry"), cleanForFirestore({
      userId,
      name,
      category: cat.name,
      categoryId: cat.id,
      quantity,
      unit,
      addedAt: now,
      expiresAt,
    }));
  },

  addFromPurchases: async (userId, purchases) => {
    for (const purchase of purchases) {
      const cat = mapIngredientToCategory(purchase.itemName);
      const shelfLife = estimateExpirationDays(purchase.itemName, cat.id);
      const now = new Date().toISOString();
      const expiresAt = calculateExpirationDate(now, shelfLife);

      await addDoc(collection(db, "pantry"), cleanForFirestore({
        userId,
        name: purchase.itemName,
        category: purchase.category || cat.name,
        categoryId: purchase.categoryId || cat.id,
        quantity: purchase.quantity || 1,
        unit: "pcs",
        addedAt: now,
        expiresAt,
      }));
    }
  },

  removeFromPantry: async (itemId) => {
    await deleteDoc(doc(db, "pantry", itemId));
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      await deleteDoc(doc(db, "pantry", itemId));
    } else {
      await updateDoc(doc(db, "pantry", itemId), { quantity });
    }
  },

  getExpiringItems: () => {
    return get().items.filter((i) => i.status === "expiring_soon");
  },

  getExpiredItems: () => {
    return get().items.filter((i) => i.status === "expired");
  },
}));
