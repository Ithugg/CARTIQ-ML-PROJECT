/**
 * CartIQ Prediction Engine
 *
 * Calls the local LightGBM GBDT API (ml/api/app.py) for predictions.
 * Falls back to the rule-based engine when the API is unreachable.
 */

import type { PurchaseRecord, Prediction, Reminder } from "../../types";
import { estimatePrice } from "../../data/prices";
import { mapIngredientToCategory } from "../../data/categories";

const ML_API_URL = "http://localhost:5001";

interface ItemAggregation {
  name: string;
  category: string;
  categoryId: string;
  purchaseCount: number;
  firstPurchase: string;
  lastPurchase: string;
  avgDaysBetweenPurchases: number;
  daysSinceLastPurchase: number;
  avgPrice: number;
  purchaseDates: Date[];
}

function aggregatePurchases(purchases: PurchaseRecord[]): ItemAggregation[] {
  const map = new Map<string, PurchaseRecord[]>();

  for (const p of purchases) {
    const key = p.itemName.toLowerCase();
    const existing = map.get(key) || [];
    existing.push(p);
    map.set(key, existing);
  }

  const now = new Date();
  const aggregations: ItemAggregation[] = [];

  for (const [, records] of map) {
    const sorted = records.sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    );

    const dates = sorted.map((r) => new Date(r.purchasedAt));
    const daysSinceFirst = (now.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLast = (now.getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);

    // Average days between purchases
    let avgDays = 14; // default
    if (dates.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
      }
      avgDays = intervals.reduce((s, d) => s + d, 0) / intervals.length;
    } else if (dates.length === 1 && daysSinceFirst > 0) {
      avgDays = Math.max(daysSinceFirst, 7); // Assume at least weekly if only one purchase
    }

    const cat = mapIngredientToCategory(records[0].itemName);
    const avgPrice = records.reduce((s, r) => s + r.price, 0) / records.length;

    aggregations.push({
      name: records[0].itemName,
      category: cat.name,
      categoryId: cat.id,
      purchaseCount: records.length,
      firstPurchase: sorted[0].purchasedAt,
      lastPurchase: sorted[sorted.length - 1].purchasedAt,
      avgDaysBetweenPurchases: Math.round(avgDays),
      daysSinceLastPurchase: Math.round(daysSinceLast),
      avgPrice: Math.round(avgPrice * 100) / 100,
      purchaseDates: dates,
    });
  }

  return aggregations;
}

function frequencyScore(item: ItemAggregation): number {
  // More purchases = higher score, with diminishing returns
  const freq = Math.min(item.purchaseCount / 10, 1); // Caps at 10 purchases
  return 0.3 + 0.7 * freq;
}

function recencyScore(item: ItemAggregation): number {
  // How close we are to the expected next purchase
  const ratio = item.daysSinceLastPurchase / Math.max(item.avgDaysBetweenPurchases, 1);

  if (ratio >= 1.5) return 0.95; // Overdue
  if (ratio >= 1.0) return 0.85; // Due now
  if (ratio >= 0.8) return 0.7; // Almost due
  if (ratio >= 0.5) return 0.5; // Getting close
  return 0.3; // Recently purchased
}

function patternScore(item: ItemAggregation): number {
  // Regularity — items with consistent intervals score higher
  if (item.purchaseDates.length < 3) return 0.5; // Not enough data

  const intervals: number[] = [];
  for (let i = 1; i < item.purchaseDates.length; i++) {
    intervals.push(
      (item.purchaseDates[i].getTime() - item.purchaseDates[i - 1].getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  const mean = intervals.reduce((s, d) => s + d, 0) / intervals.length;
  const variance =
    intervals.reduce((s, d) => s + (d - mean) ** 2, 0) / intervals.length;
  const cv = Math.sqrt(variance) / Math.max(mean, 1); // Coefficient of variation

  // Low CV = regular pattern = high score
  if (cv < 0.2) return 0.95;
  if (cv < 0.4) return 0.8;
  if (cv < 0.6) return 0.65;
  return 0.4;
}

function getConfidence(probability: number, purchaseCount: number): "high" | "medium" | "low" {
  if (purchaseCount >= 5 && probability >= 0.7) return "high";
  if (purchaseCount >= 3 && probability >= 0.5) return "medium";
  return "low";
}

function generateReason(item: ItemAggregation, scores: Prediction["scores"]): string {
  const parts: string[] = [];

  if (item.daysSinceLastPurchase >= item.avgDaysBetweenPurchases) {
    parts.push(`Last purchased ${item.daysSinceLastPurchase} days ago (avg cycle: ${item.avgDaysBetweenPurchases}d)`);
  }

  if (item.purchaseCount >= 5) {
    parts.push(`Bought ${item.purchaseCount} times — a regular purchase`);
  } else if (item.purchaseCount >= 3) {
    parts.push(`Bought ${item.purchaseCount} times`);
  }

  if (scores.pattern >= 0.8) {
    parts.push("Very consistent purchase pattern detected");
  }

  if (parts.length === 0) {
    parts.push("Based on your purchase history");
  }

  return parts.join(". ");
}

// ─── Rule-based engine (fallback) ────────────────────────────────────────────

function generateRuleBasedPredictions(purchases: PurchaseRecord[]): Prediction[] {
  const aggregations = aggregatePurchases(purchases);

  return aggregations
    .map((item) => {
      const freq    = frequencyScore(item);
      const recency = recencyScore(item);
      const pattern = patternScore(item);
      const combined = freq * 0.25 + recency * 0.45 + pattern * 0.30;
      const probability = Math.min(Math.round(combined * 100) / 100, 0.99);

      const scores = {
        frequency: Math.round(freq * 100) / 100,
        recency:   Math.round(recency * 100) / 100,
        pattern:   Math.round(pattern * 100) / 100,
        combined:  probability,
      };

      return {
        id:                       `pred_${item.name.toLowerCase().replace(/\s+/g, "_")}`,
        itemName:                 item.name,
        category:                 item.category,
        categoryId:               item.categoryId,
        probability,
        confidence:               getConfidence(probability, item.purchaseCount),
        reason:                   generateReason(item, scores),
        estimatedPrice:           item.avgPrice || estimatePrice(item.name, item.categoryId),
        avgDaysBetweenPurchases:  item.avgDaysBetweenPurchases,
        daysSinceLastPurchase:    item.daysSinceLastPurchase,
        purchaseCount:            item.purchaseCount,
        scores,
      };
    })
    .sort((a, b) => b.probability - a.probability);
}

// ─── ML API call ──────────────────────────────────────────────────────────────

interface ApiPrediction {
  itemName:                string;
  category:                string;
  categoryId:              string;
  probability:             number;
  purchaseCount:           number;
  avgDaysBetweenPurchases: number;
  daysSinceLastPurchase:   number;
  estimatedPrice:          number;
}

function mapApiPrediction(p: ApiPrediction): Prediction {
  const probability = Math.min(Math.round(p.probability * 100) / 100, 0.99);
  const ratio       = p.daysSinceLastPurchase / Math.max(p.avgDaysBetweenPurchases, 1);

  const freq    = Math.min(0.3 + 0.7 * Math.min(p.purchaseCount / 10, 1), 1);
  const recency = ratio >= 1.5 ? 0.95 : ratio >= 1.0 ? 0.85 : ratio >= 0.8 ? 0.7 : ratio >= 0.5 ? 0.5 : 0.3;

  const reason = [
    p.daysSinceLastPurchase >= p.avgDaysBetweenPurchases
      ? `Last purchased ${Math.round(p.daysSinceLastPurchase)} days ago (avg cycle: ${Math.round(p.avgDaysBetweenPurchases)}d)`
      : null,
    p.purchaseCount >= 5
      ? `Bought ${p.purchaseCount} times — a regular purchase`
      : p.purchaseCount >= 3
      ? `Bought ${p.purchaseCount} times`
      : null,
  ]
    .filter(Boolean)
    .join(". ") || "Based on your purchase history";

  return {
    id:                       `pred_${p.itemName.toLowerCase().replace(/\s+/g, "_")}`,
    itemName:                 p.itemName,
    category:                 p.category,
    categoryId:               p.categoryId,
    probability,
    confidence:               getConfidence(probability, p.purchaseCount),
    reason,
    estimatedPrice:           p.estimatedPrice,
    avgDaysBetweenPurchases:  Math.round(p.avgDaysBetweenPurchases),
    daysSinceLastPurchase:    Math.round(p.daysSinceLastPurchase),
    purchaseCount:            p.purchaseCount,
    scores: {
      frequency: Math.round(freq * 100) / 100,
      recency,
      pattern:   0,
      combined:  probability,
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePredictions(purchases: PurchaseRecord[]): Promise<Prediction[]> {
  if (purchases.length === 0) return [];

  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ purchases }),
      signal:  AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.predictions) && data.predictions.length > 0) {
        return data.predictions.map(mapApiPrediction);
      }
    }
  } catch {
    // API unavailable — fall through to rule-based engine
  }

  return generateRuleBasedPredictions(purchases);
}

export function generateReminders(purchases: PurchaseRecord[]): Reminder[] {
  if (purchases.length === 0) return [];

  const aggregations = aggregatePurchases(purchases);

  const reminders: Reminder[] = aggregations
    .filter((item) => item.purchaseCount >= 2) // Need at least 2 purchases to predict
    .map((item) => {
      const estimatedDaysLeft = Math.max(
        0,
        Math.round(item.avgDaysBetweenPurchases - item.daysSinceLastPurchase)
      );

      let urgency: Reminder["urgency"];
      let message: string;

      if (estimatedDaysLeft <= 0) {
        urgency = "critical";
        message = `You're ${Math.abs(estimatedDaysLeft)} days overdue for ${item.name}. You typically buy this every ${item.avgDaysBetweenPurchases} days.`;
      } else if (estimatedDaysLeft <= 2) {
        urgency = "high";
        message = `You'll likely need ${item.name} in the next ${estimatedDaysLeft} day${estimatedDaysLeft === 1 ? "" : "s"}. Add it to your list?`;
      } else if (estimatedDaysLeft <= 5) {
        urgency = "medium";
        message = `${item.name} is coming up in about ${estimatedDaysLeft} days based on your usual pattern.`;
      } else {
        urgency = "low";
        message = `${item.name}: next purchase estimated in ~${estimatedDaysLeft} days.`;
      }

      return {
        id: `rem_${item.name.toLowerCase().replace(/\s+/g, "_")}`,
        itemName: item.name,
        category: item.category,
        urgency,
        message,
        estimatedDaysLeft,
        avgConsumptionDays: item.avgDaysBetweenPurchases,
        lastPurchased: item.lastPurchase,
        estimatedPrice: item.avgPrice || estimatePrice(item.name, item.categoryId),
        dismissed: false,
      };
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

  return reminders;
}
