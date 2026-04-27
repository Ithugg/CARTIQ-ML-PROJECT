/**
 * ML-Ready Recommendation Service
 *
 * Currently uses rule-based heuristics as placeholders.
 * Designed to be swapped with actual ML models (collaborative filtering,
 * item-to-item similarity, etc.) without changing the API surface.
 */

import { getPurchaseHistory, PurchaseRecord } from "../purchaseTracking";

export interface Recommendation {
  itemName: string;
  category: string;
  reason: string;
  confidence: number; // 0-1
  source: "frequency" | "complementary" | "seasonal" | "trending";
}

// Common complementary item pairs
const COMPLEMENTARY_PAIRS: Record<string, string[]> = {
  pasta: ["tomato sauce", "parmesan", "garlic", "olive oil", "basil"],
  bread: ["butter", "jam", "peanut butter"],
  eggs: ["bacon", "butter", "milk", "cheese"],
  "chicken breast": ["olive oil", "garlic", "lemon", "salt", "pepper"],
  rice: ["soy sauce", "chicken broth", "garlic", "onion"],
  "ground beef": ["onion", "garlic", "tomato sauce", "taco shells"],
  chips: ["salsa", "sour cream", "guacamole"],
  cereal: ["milk", "bananas", "blueberries"],
  salmon: ["lemon", "dill", "asparagus", "olive oil"],
  burger: ["lettuce", "tomato", "onion", "ketchup", "mustard", "buns"],
  taco: ["cheese", "lettuce", "tomato", "sour cream", "salsa"],
  pancake: ["maple syrup", "butter", "eggs", "milk"],
  salad: ["lettuce", "tomato", "cucumber", "dressing"],
  pizza: ["mozzarella", "tomato sauce", "pepperoni", "mushrooms"],
  coffee: ["milk", "sugar", "cream"],
  sandwich: ["bread", "lettuce", "tomato", "mayo", "deli meat"],
};

// Seasonal suggestions (month-based)
const SEASONAL_ITEMS: Record<number, string[]> = {
  0: ["oranges", "grapefruit", "leeks", "kale"], // January
  1: ["citrus", "beets", "cabbage", "parsnips"],
  2: ["asparagus", "artichokes", "peas", "spinach"],
  3: ["strawberries", "asparagus", "peas", "radishes"],
  4: ["cherries", "apricots", "zucchini", "corn"],
  5: ["peaches", "blueberries", "tomatoes", "watermelon"],
  6: ["watermelon", "corn", "tomatoes", "peaches"],
  7: ["corn", "peppers", "tomatoes", "eggplant"],
  8: ["apples", "pears", "grapes", "squash"],
  9: ["pumpkin", "apples", "cranberries", "squash"],
  10: ["sweet potato", "cranberries", "pomegranate", "pears"],
  11: ["citrus", "pomegranate", "sweet potato", "brussels sprouts"],
};

/**
 * Get personalized item recommendations based on purchase history.
 */
export async function getRecommendations(
  currentListItems: string[] = [],
  limit = 5
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  const history = await getPurchaseHistory();
  const currentItemsLower = new Set(currentListItems.map((i) => i.toLowerCase()));

  // 1. Frequency-based: suggest frequently purchased items not in current list
  const frequencyRecs = getFrequencyRecommendations(history, currentItemsLower);
  recommendations.push(...frequencyRecs);

  // 2. Complementary items based on what's already in the list
  const complementaryRecs = getComplementaryRecommendations(currentListItems, currentItemsLower);
  recommendations.push(...complementaryRecs);

  // 3. Seasonal suggestions
  const seasonalRecs = getSeasonalRecommendations(currentItemsLower);
  recommendations.push(...seasonalRecs);

  // Deduplicate by item name
  const seen = new Set<string>();
  const unique = recommendations.filter((r) => {
    const key = r.itemName.toLowerCase();
    if (seen.has(key) || currentItemsLower.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by confidence descending
  unique.sort((a, b) => b.confidence - a.confidence);
  return unique.slice(0, limit);
}

function getFrequencyRecommendations(
  history: PurchaseRecord[],
  excludeItems: Set<string>
): Recommendation[] {
  const itemCounts: Record<string, { count: number; category: string }> = {};

  for (const item of history) {
    const key = item.name.toLowerCase();
    if (!itemCounts[key]) {
      itemCounts[key] = { count: 0, category: item.category };
    }
    itemCounts[key].count++;
  }

  return Object.entries(itemCounts)
    .filter(([name]) => !excludeItems.has(name))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      itemName: name.charAt(0).toUpperCase() + name.slice(1),
      category: data.category,
      reason: `Purchased ${data.count} times before`,
      confidence: Math.min(data.count / 10, 0.95),
      source: "frequency" as const,
    }));
}

function getComplementaryRecommendations(
  currentItems: string[],
  excludeItems: Set<string>
): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const item of currentItems) {
    const lower = item.toLowerCase();
    for (const [key, complements] of Object.entries(COMPLEMENTARY_PAIRS)) {
      if (lower.includes(key) || key.includes(lower)) {
        for (const complement of complements) {
          if (!excludeItems.has(complement)) {
            recs.push({
              itemName: complement.charAt(0).toUpperCase() + complement.slice(1),
              category: "",
              reason: `Goes well with ${item}`,
              confidence: 0.7,
              source: "complementary",
            });
          }
        }
      }
    }
  }

  return recs;
}

function getSeasonalRecommendations(excludeItems: Set<string>): Recommendation[] {
  const month = new Date().getMonth();
  const seasonal = SEASONAL_ITEMS[month] || [];

  return seasonal
    .filter((item) => !excludeItems.has(item))
    .map((item) => ({
      itemName: item.charAt(0).toUpperCase() + item.slice(1),
      category: "Produce",
      reason: "In season right now",
      confidence: 0.5,
      source: "seasonal" as const,
    }));
}

/**
 * Get "frequently bought together" suggestions for a specific item.
 */
export function getComplementaryItems(itemName: string): string[] {
  const lower = itemName.toLowerCase();
  for (const [key, complements] of Object.entries(COMPLEMENTARY_PAIRS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return complements;
    }
  }
  return [];
}
