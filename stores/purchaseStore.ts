import { create } from "zustand";
import type { PurchaseRecord, PurchaseStats, GroceryItem } from "../types";
import * as dbService from "../services/firebase/db";

export interface PriceAlert {
  name: string;
  latestPrice: number;
  avgPrice: number;
  percentAbove: number;
  purchaseCount: number;
}

export interface SpendingInsight {
  thisWeekSpent: number;
  lastWeekSpent: number;
  weekOverWeekChange: number; // percentage
  thisMonthSpent: number;
  monthlyBudget: number;
  budgetUsedPercent: number;
  projectedMonthlySpend: number;
}

export interface FrequentItemWithTrend {
  name: string;
  count: number;
  lastPurchased: string;
  avgPrice: number;
  latestPrice: number;
  priceTrend: "up" | "down" | "stable";
  trendPercent: number;
}

interface PurchaseState {
  purchases: PurchaseRecord[];
  isLoading: boolean;
  stats: PurchaseStats | null;

  // Subscription
  subscribe: (userId: string) => () => void;

  // Actions
  recordPurchases: (
    userId: string,
    listId: string,
    listName: string,
    items: GroceryItem[]
  ) => Promise<void>;

  // Computed
  computeStats: () => PurchaseStats;
  getItemHistory: (itemName: string) => PurchaseRecord[];
  getFrequentItems: (topN?: number) => { name: string; count: number; lastPurchased: string; avgPrice: number }[];
  getPriceAlerts: () => PriceAlert[];
  getSpendingInsights: (weeklyBudget?: number) => SpendingInsight;
  getFrequentItemsWithTrends: (topN?: number) => FrequentItemWithTrend[];
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  isLoading: true,
  stats: null,

  subscribe: (userId: string) => {
    set({ isLoading: true });

    const unsubscribe = dbService.subscribePurchases(
      userId,
      (purchases) => {
        set({ purchases, isLoading: false });
        // Recompute stats when purchases change
        const stats = get().computeStats();
        set({ stats });
      },
      (err) => {
        console.error("Purchase subscription error:", err);
        set({ isLoading: false });
      }
    );

    return unsubscribe;
  },

  recordPurchases: async (userId, listId, listName, items) => {
    await dbService.recordPurchases(userId, listId, listName, items);
  },

  computeStats: () => {
    const { purchases } = get();
    if (purchases.length === 0) {
      return {
        totalSpent: 0,
        totalItems: 0,
        totalLists: 0,
        avgListCost: 0,
        topCategories: [],
        weeklySpending: [],
        monthlySpending: [],
        frequentItems: [],
      };
    }

    const totalSpent = purchases.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const totalItems = purchases.length;
    const uniqueLists = new Set(purchases.map((p) => p.listId));
    const totalLists = uniqueLists.size;
    const avgListCost = totalLists > 0 ? totalSpent / totalLists : 0;

    // Top categories
    const catMap = new Map<string, { count: number; spent: number }>();
    for (const p of purchases) {
      const existing = catMap.get(p.category) || { count: 0, spent: 0 };
      catMap.set(p.category, {
        count: existing.count + 1,
        spent: existing.spent + p.price * p.quantity,
      });
    }
    const topCategories = Array.from(catMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Weekly spending (last 8 weeks)
    const now = Date.now();
    const weeklySpending: { week: string; amount: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const amount = purchases
        .filter((p) => {
          const t = new Date(p.purchasedAt).getTime();
          return t >= weekStart && t < weekEnd;
        })
        .reduce((sum, p) => sum + p.price * p.quantity, 0);
      const label = `W${8 - i}`;
      weeklySpending.push({ week: label, amount: Math.round(amount * 100) / 100 });
    }

    // Monthly spending (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySpending: { month: string; amount: number }[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const amount = purchases
        .filter((p) => {
          const pd = new Date(p.purchasedAt);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.price * p.quantity, 0);
      monthlySpending.push({ month, amount: Math.round(amount * 100) / 100 });
    }

    // Frequent items
    const itemMap = new Map<string, { count: number; lastPurchased: string }>();
    for (const p of purchases) {
      const key = p.itemName.toLowerCase();
      const existing = itemMap.get(key);
      if (!existing || p.purchasedAt > existing.lastPurchased) {
        itemMap.set(key, {
          count: (existing?.count || 0) + 1,
          lastPurchased: p.purchasedAt,
        });
      } else {
        itemMap.set(key, { ...existing, count: existing.count + 1 });
      }
    }
    const frequentItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalItems,
      totalLists,
      avgListCost: Math.round(avgListCost * 100) / 100,
      topCategories,
      weeklySpending,
      monthlySpending,
      frequentItems,
    };
  },

  getItemHistory: (itemName: string) => {
    return get().purchases.filter(
      (p) => p.itemName.toLowerCase() === itemName.toLowerCase()
    );
  },

  getFrequentItems: (topN = 10) => {
    const { purchases } = get();
    const itemMap = new Map<string, { count: number; lastPurchased: string; totalPrice: number }>();

    for (const p of purchases) {
      const key = p.itemName.toLowerCase();
      const existing = itemMap.get(key) || { count: 0, lastPurchased: "", totalPrice: 0 };
      itemMap.set(key, {
        count: existing.count + 1,
        lastPurchased:
          !existing.lastPurchased || p.purchasedAt > existing.lastPurchased
            ? p.purchasedAt
            : existing.lastPurchased,
        totalPrice: existing.totalPrice + p.price,
      });
    }

    return Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastPurchased: data.lastPurchased,
        avgPrice: Math.round((data.totalPrice / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  },

  getPriceAlerts: () => {
    const { purchases } = get();
    const itemMap = new Map<string, { prices: { price: number; date: string }[] }>();

    for (const p of purchases) {
      const key = p.itemName.toLowerCase();
      const existing = itemMap.get(key) || { prices: [] };
      existing.prices.push({ price: p.price, date: p.purchasedAt });
      itemMap.set(key, existing);
    }

    const alerts: PriceAlert[] = [];
    for (const [name, data] of itemMap.entries()) {
      if (data.prices.length < 2) continue; // Need at least 2 purchases to compare

      // Sort by date, most recent first
      data.prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestPrice = data.prices[0].price;
      const avgPrice =
        data.prices.reduce((sum, p) => sum + p.price, 0) / data.prices.length;

      const percentAbove = ((latestPrice - avgPrice) / avgPrice) * 100;

      // Alert if latest price is >10% above average
      if (percentAbove > 10) {
        alerts.push({
          name,
          latestPrice: Math.round(latestPrice * 100) / 100,
          avgPrice: Math.round(avgPrice * 100) / 100,
          percentAbove: Math.round(percentAbove),
          purchaseCount: data.prices.length,
        });
      }
    }

    return alerts.sort((a, b) => b.percentAbove - a.percentAbove).slice(0, 5);
  },

  getSpendingInsights: (weeklyBudget = 0) => {
    const { purchases } = get();
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const thisWeekStart = now - oneWeek;
    const lastWeekStart = now - 2 * oneWeek;

    const thisWeekSpent = purchases
      .filter((p) => new Date(p.purchasedAt).getTime() >= thisWeekStart)
      .reduce((sum, p) => sum + p.price * p.quantity, 0);

    const lastWeekSpent = purchases
      .filter((p) => {
        const t = new Date(p.purchasedAt).getTime();
        return t >= lastWeekStart && t < thisWeekStart;
      })
      .reduce((sum, p) => sum + p.price * p.quantity, 0);

    const weekOverWeekChange =
      lastWeekSpent > 0
        ? ((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100
        : 0;

    // This month spending
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const thisMonthSpent = purchases
      .filter((p) => new Date(p.purchasedAt) >= monthStart)
      .reduce((sum, p) => sum + p.price * p.quantity, 0);

    const dayOfMonth = currentDate.getDate();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const projectedMonthlySpend =
      dayOfMonth > 0 ? (thisMonthSpent / dayOfMonth) * daysInMonth : 0;

    const monthlyBudget = weeklyBudget * 4.33;
    const budgetUsedPercent =
      monthlyBudget > 0 ? (thisMonthSpent / monthlyBudget) * 100 : 0;

    return {
      thisWeekSpent: Math.round(thisWeekSpent * 100) / 100,
      lastWeekSpent: Math.round(lastWeekSpent * 100) / 100,
      weekOverWeekChange: Math.round(weekOverWeekChange),
      thisMonthSpent: Math.round(thisMonthSpent * 100) / 100,
      monthlyBudget: Math.round(monthlyBudget * 100) / 100,
      budgetUsedPercent: Math.round(budgetUsedPercent),
      projectedMonthlySpend: Math.round(projectedMonthlySpend * 100) / 100,
    };
  },

  getFrequentItemsWithTrends: (topN = 10) => {
    const { purchases } = get();
    const itemMap = new Map<
      string,
      { count: number; lastPurchased: string; totalPrice: number; prices: { price: number; date: string }[] }
    >();

    for (const p of purchases) {
      const key = p.itemName.toLowerCase();
      const existing = itemMap.get(key) || {
        count: 0,
        lastPurchased: "",
        totalPrice: 0,
        prices: [],
      };
      itemMap.set(key, {
        count: existing.count + 1,
        lastPurchased:
          !existing.lastPurchased || p.purchasedAt > existing.lastPurchased
            ? p.purchasedAt
            : existing.lastPurchased,
        totalPrice: existing.totalPrice + p.price,
        prices: [...existing.prices, { price: p.price, date: p.purchasedAt }],
      });
    }

    return Array.from(itemMap.entries())
      .map(([name, data]) => {
        const avgPrice = Math.round((data.totalPrice / data.count) * 100) / 100;
        // Sort prices by date, most recent first
        data.prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestPrice = data.prices[0]?.price || avgPrice;
        const trendPercent =
          avgPrice > 0
            ? Math.round(((latestPrice - avgPrice) / avgPrice) * 100)
            : 0;
        const priceTrend: "up" | "down" | "stable" =
          trendPercent > 5 ? "up" : trendPercent < -5 ? "down" : "stable";

        return {
          name,
          count: data.count,
          lastPurchased: data.lastPurchased,
          avgPrice,
          latestPrice: Math.round(latestPrice * 100) / 100,
          priceTrend,
          trendPercent: Math.abs(trendPercent),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  },
}));
