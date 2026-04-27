/**
 * CartIQ AI Personalization Engine
 *
 * Uses onboarding data (dietary preferences, allergies, fitness goals,
 * cooking frequency, budget) to personalize predictions, recommendations,
 * and grocery suggestions.
 */

import type { User, Prediction, PurchaseRecord } from "../../types";
import { estimatePrice } from "../../data/prices";
import { mapIngredientToCategory } from "../../data/categories";

// ─── Dietary & Allergy Filters ───

const DIETARY_EXCLUDED_CATEGORIES: Record<string, string[]> = {
  vegan: ["meat", "dairy"],
  vegetarian: ["meat"],
  pescatarian: ["meat"], // meat but not seafood
  dairy_free: ["dairy"],
};

const DIETARY_EXCLUDED_KEYWORDS: Record<string, string[]> = {
  vegan: [
    "chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "ham",
    "steak", "salmon", "tuna", "shrimp", "milk", "cheese", "yogurt", "butter",
    "cream", "egg", "honey", "gelatin", "whey",
  ],
  vegetarian: [
    "chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "ham",
    "steak", "salmon", "tuna", "shrimp", "cod", "tilapia", "crab",
    "lobster", "anchovy", "sardine", "deli meat", "pepperoni", "salami",
  ],
  pescatarian: [
    "chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "ham",
    "steak", "deli meat", "pepperoni", "salami", "hot dog",
  ],
  halal: [
    "pork", "bacon", "ham", "pepperoni", "salami", "prosciutto", "beer",
    "wine", "gelatin",
  ],
  kosher: [
    "pork", "bacon", "ham", "shellfish", "shrimp", "crab", "lobster",
    "scallop", "mussel", "clam",
  ],
  keto: [
    "bread", "pasta", "rice", "cereal", "oatmeal", "pancake", "sugar",
    "flour", "corn", "potato", "soda", "juice",
  ],
  paleo: [
    "bread", "pasta", "rice", "cereal", "oatmeal", "sugar", "flour",
    "soy sauce", "peanut butter", "cheese", "yogurt", "milk",
  ],
  gluten_free: [
    "bread", "pasta", "flour", "cereal", "cracker", "bagel", "muffin",
    "croissant", "naan", "pita", "tortilla", "ramen", "soy sauce",
    "pancake mix", "breadcrumb",
  ],
  dairy_free: [
    "milk", "cheese", "yogurt", "butter", "cream", "sour cream",
    "cottage cheese", "cream cheese", "mozzarella", "cheddar", "parmesan",
    "brie", "gouda", "feta", "ricotta", "ghee", "whipping cream",
    "half and half", "ice cream",
  ],
};

const ALLERGY_KEYWORDS: Record<string, string[]> = {
  nuts: [
    "almond", "cashew", "walnut", "pecan", "pistachio", "macadamia",
    "hazelnut", "brazil nut", "pine nut", "nutella", "almond butter",
    "almond milk", "trail mix",
  ],
  peanuts: ["peanut", "peanut butter"],
  shellfish: [
    "shrimp", "crab", "lobster", "scallop", "mussel", "clam", "oyster",
  ],
  dairy: [
    "milk", "cheese", "yogurt", "butter", "cream", "sour cream",
    "ice cream", "cottage cheese", "cream cheese", "mozzarella", "cheddar",
    "parmesan", "ghee", "whey",
  ],
  eggs: ["egg"],
  soy: ["soy sauce", "tofu", "edamame", "soy milk", "tempeh", "miso"],
  wheat: [
    "bread", "pasta", "flour", "cereal", "cracker", "bagel", "muffin",
    "tortilla", "naan", "pita", "ramen", "pancake",
  ],
  fish: ["salmon", "tuna", "cod", "tilapia", "anchovy", "sardine", "fish"],
  sesame: ["sesame", "tahini", "hummus"],
};

// ─── Fitness Goal Item Boosts ───

const FITNESS_BOOSTED_ITEMS: Record<string, { items: string[]; categories: string[] }> = {
  lose_weight: {
    items: [
      "chicken breast", "broccoli", "spinach", "egg", "salmon", "Greek yogurt",
      "quinoa", "brown rice", "sweet potato", "avocado", "berries", "almond",
    ],
    categories: ["produce"],
  },
  build_muscle: {
    items: [
      "chicken breast", "egg", "Greek yogurt", "salmon", "tuna", "beef",
      "cottage cheese", "milk", "protein bar", "oatmeal", "rice", "banana",
      "peanut butter", "sweet potato",
    ],
    categories: ["meat", "dairy"],
  },
  eat_healthy: {
    items: [
      "spinach", "kale", "broccoli", "avocado", "quinoa", "oatmeal",
      "salmon", "blueberry", "sweet potato", "almond", "olive oil",
      "Greek yogurt", "lentil", "chia seed",
    ],
    categories: ["produce"],
  },
  save_money: {
    items: [
      "rice", "bean", "lentil", "pasta", "egg", "banana", "potato",
      "onion", "carrot", "oatmeal", "chicken thigh", "canned tomato",
      "frozen vegetable", "bread",
    ],
    categories: ["pantry", "frozen"],
  },
  meal_variety: {
    items: [],
    categories: [], // boost seasonal items instead
  },
};

// ─── Smart Suggestions Based on Profile ───

export interface PersonalizedSuggestion {
  itemName: string;
  category: string;
  categoryId: string;
  reason: string;
  score: number;
  estimatedPrice: number;
  tags: string[];
}

/**
 * Check if an item conflicts with user's dietary preferences or allergies.
 */
export function isItemRestricted(
  itemName: string,
  user: Pick<User, "dietaryPreferences" | "allergies">
): { restricted: boolean; reason?: string } {
  const lower = itemName.toLowerCase();

  // Check allergies first (safety-critical)
  for (const allergy of user.allergies) {
    const keywords = ALLERGY_KEYWORDS[allergy];
    if (keywords) {
      for (const keyword of keywords) {
        if (lower.includes(keyword) || keyword.includes(lower)) {
          return { restricted: true, reason: `Contains ${allergy} allergen` };
        }
      }
    }
  }

  // Check dietary preferences
  for (const diet of user.dietaryPreferences) {
    const keywords = DIETARY_EXCLUDED_KEYWORDS[diet];
    if (keywords) {
      for (const keyword of keywords) {
        if (lower.includes(keyword) || keyword.includes(lower)) {
          return { restricted: true, reason: `Not ${diet.replace("_", "-")}` };
        }
      }
    }
  }

  return { restricted: false };
}

/**
 * Filter predictions to remove items that conflict with user preferences.
 */
export function filterPredictions(
  predictions: Prediction[],
  user: Pick<User, "dietaryPreferences" | "allergies">
): Prediction[] {
  return predictions.filter((pred) => {
    const check = isItemRestricted(pred.itemName, user);
    return !check.restricted;
  });
}

/**
 * Generate personalized suggestions based on user profile.
 * These are items the user might want to add to their list, based on their
 * goals, diet, cooking frequency, and budget — even before purchase history.
 */
export function getPersonalizedSuggestions(
  user: Pick<User, "dietaryPreferences" | "allergies" | "fitnessGoals" | "cookingFrequency" | "householdSize" | "priceSensitivity">,
  existingItems: string[] = [],
  purchaseHistory: PurchaseRecord[] = []
): PersonalizedSuggestion[] {
  const suggestions: PersonalizedSuggestion[] = [];
  const existingLower = new Set(existingItems.map((i) => i.toLowerCase()));
  const purchasedItems = new Set(purchaseHistory.map((p) => p.itemName.toLowerCase()));

  // 1. Goal-based suggestions
  for (const goal of user.fitnessGoals) {
    const boosted = FITNESS_BOOSTED_ITEMS[goal];
    if (!boosted) continue;

    for (const itemName of boosted.items) {
      if (existingLower.has(itemName.toLowerCase())) continue;

      const check = isItemRestricted(itemName, user);
      if (check.restricted) continue;

      const cat = mapIngredientToCategory(itemName);
      const isPreviouslyBought = purchasedItems.has(itemName.toLowerCase());

      suggestions.push({
        itemName: itemName.charAt(0).toUpperCase() + itemName.slice(1),
        category: cat.name,
        categoryId: cat.id,
        reason: getGoalReason(goal, itemName),
        score: isPreviouslyBought ? 0.85 : 0.7,
        estimatedPrice: estimatePrice(itemName, cat.id),
        tags: [goal.replace("_", " ")],
      });
    }
  }

  // 2. Cooking frequency-based suggestions
  const cookingSuggestions = getCookingFrequencySuggestions(user.cookingFrequency);
  for (const item of cookingSuggestions) {
    if (existingLower.has(item.name.toLowerCase())) continue;

    const check = isItemRestricted(item.name, user);
    if (check.restricted) continue;

    const cat = mapIngredientToCategory(item.name);

    suggestions.push({
      itemName: item.name,
      category: cat.name,
      categoryId: cat.id,
      reason: item.reason,
      score: 0.6,
      estimatedPrice: estimatePrice(item.name, cat.id),
      tags: ["cooking staple"],
    });
  }

  // 3. Budget-adjusted: for price-sensitive users, boost budget-friendly items
  if (user.priceSensitivity === "high") {
    for (const s of suggestions) {
      if (s.estimatedPrice < 3) {
        s.score += 0.1;
        s.tags.push("budget-friendly");
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = suggestions.filter((s) => {
    const key = s.itemName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by score and limit
  return unique.sort((a, b) => b.score - a.score).slice(0, 15);
}

/**
 * Get a human-readable reason for a goal-based suggestion.
 */
function getGoalReason(goal: string, itemName: string): string {
  switch (goal) {
    case "lose_weight":
      return `Great for weight management`;
    case "build_muscle":
      return `High protein — supports muscle growth`;
    case "eat_healthy":
      return `Nutrient-dense whole food`;
    case "save_money":
      return `Budget-friendly staple`;
    case "meal_variety":
      return `Try something new this week`;
    default:
      return `Recommended for you`;
  }
}

/**
 * Suggest pantry staples based on how often the user cooks.
 */
function getCookingFrequencySuggestions(
  frequency: User["cookingFrequency"]
): { name: string; reason: string }[] {
  switch (frequency) {
    case "daily":
    case "meal_prep":
      return [
        { name: "Olive Oil", reason: "Essential for daily cooking" },
        { name: "Garlic", reason: "Key ingredient for most meals" },
        { name: "Onion", reason: "Base for many recipes" },
        { name: "Salt", reason: "Everyday seasoning" },
        { name: "Black Pepper", reason: "Everyday seasoning" },
        { name: "Rice", reason: "Versatile carb staple" },
        { name: "Chicken Broth", reason: "Great for soups and sauces" },
      ];
    case "few_times_week":
      return [
        { name: "Olive Oil", reason: "Cooking essential" },
        { name: "Garlic", reason: "Flavor base" },
        { name: "Pasta", reason: "Quick weeknight meal" },
        { name: "Canned Tomato", reason: "Quick sauce base" },
      ];
    case "rarely":
      return [
        { name: "Bread", reason: "Quick meal base" },
        { name: "Eggs", reason: "Easy protein source" },
        { name: "Cereal", reason: "Quick breakfast" },
      ];
  }
}

/**
 * Get a personalized weekly meal plan suggestion count based on cooking frequency.
 */
export function getSuggestedMealsPerWeek(frequency: User["cookingFrequency"]): number {
  switch (frequency) {
    case "rarely": return 2;
    case "few_times_week": return 4;
    case "daily": return 7;
    case "meal_prep": return 7;
  }
}

/**
 * Calculate adjusted quantities based on household size.
 */
export function adjustQuantityForHousehold(
  baseQuantity: number,
  householdSize: number
): number {
  if (householdSize <= 1) return baseQuantity;
  // Scale: 2 people = 1.5x, 3 = 2x, 4 = 2.5x, 5 = 3x, 6+ = 3.5x
  const multiplier = 1 + (Math.min(householdSize, 6) - 1) * 0.5;
  return Math.ceil(baseQuantity * multiplier);
}
