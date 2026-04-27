/**
 * Default price estimates for common grocery items.
 * Used when no purchase history is available.
 * Prices are in USD and represent typical US grocery store prices.
 */

export interface PriceEntry {
  name: string;
  price: number;
  unit: string;
}

export const DEFAULT_PRICES: Record<string, PriceEntry> = {
  // Produce
  apple: { name: "Apple", price: 1.5, unit: "lb" },
  banana: { name: "Banana", price: 0.65, unit: "lb" },
  orange: { name: "Orange", price: 1.25, unit: "each" },
  avocado: { name: "Avocado", price: 1.75, unit: "each" },
  tomato: { name: "Tomato", price: 2.5, unit: "lb" },
  potato: { name: "Potato", price: 1.0, unit: "lb" },
  onion: { name: "Onion", price: 1.25, unit: "lb" },
  garlic: { name: "Garlic", price: 0.75, unit: "head" },
  carrot: { name: "Carrot", price: 1.5, unit: "lb" },
  broccoli: { name: "Broccoli", price: 2.0, unit: "bunch" },
  spinach: { name: "Spinach", price: 3.5, unit: "bag" },
  lettuce: { name: "Lettuce", price: 2.0, unit: "head" },
  cucumber: { name: "Cucumber", price: 1.0, unit: "each" },
  pepper: { name: "Bell Pepper", price: 1.5, unit: "each" },
  mushroom: { name: "Mushroom", price: 3.0, unit: "8oz" },
  lemon: { name: "Lemon", price: 0.75, unit: "each" },
  lime: { name: "Lime", price: 0.5, unit: "each" },
  strawberry: { name: "Strawberries", price: 4.0, unit: "16oz" },
  blueberry: { name: "Blueberries", price: 4.5, unit: "6oz" },
  grape: { name: "Grapes", price: 3.5, unit: "lb" },
  mango: { name: "Mango", price: 1.5, unit: "each" },
  corn: { name: "Corn", price: 0.75, unit: "ear" },
  celery: { name: "Celery", price: 2.0, unit: "bunch" },
  cilantro: { name: "Cilantro", price: 1.0, unit: "bunch" },
  ginger: { name: "Ginger", price: 4.0, unit: "lb" },

  // Dairy
  milk: { name: "Milk", price: 4.5, unit: "gallon" },
  egg: { name: "Eggs", price: 4.0, unit: "dozen" },
  eggs: { name: "Eggs", price: 4.0, unit: "dozen" },
  butter: { name: "Butter", price: 5.0, unit: "lb" },
  cheese: { name: "Cheese", price: 4.5, unit: "8oz" },
  yogurt: { name: "Yogurt", price: 1.25, unit: "6oz" },
  "cream cheese": { name: "Cream Cheese", price: 3.5, unit: "8oz" },
  "sour cream": { name: "Sour Cream", price: 2.5, unit: "16oz" },
  "heavy cream": { name: "Heavy Cream", price: 4.5, unit: "16oz" },

  // Meat
  "chicken breast": { name: "Chicken Breast", price: 4.5, unit: "lb" },
  "ground beef": { name: "Ground Beef", price: 6.0, unit: "lb" },
  bacon: { name: "Bacon", price: 7.0, unit: "12oz" },
  salmon: { name: "Salmon", price: 10.0, unit: "lb" },
  shrimp: { name: "Shrimp", price: 9.0, unit: "lb" },
  steak: { name: "Steak", price: 12.0, unit: "lb" },
  "ground turkey": { name: "Ground Turkey", price: 5.5, unit: "lb" },
  sausage: { name: "Sausage", price: 5.0, unit: "14oz" },
  ham: { name: "Ham", price: 4.5, unit: "lb" },
  tuna: { name: "Canned Tuna", price: 1.5, unit: "can" },

  // Bakery
  bread: { name: "Bread", price: 3.5, unit: "loaf" },
  bagel: { name: "Bagels", price: 4.5, unit: "6ct" },
  tortilla: { name: "Tortillas", price: 3.5, unit: "10ct" },

  // Pantry
  rice: { name: "Rice", price: 3.5, unit: "2lb" },
  pasta: { name: "Pasta", price: 1.75, unit: "16oz" },
  "olive oil": { name: "Olive Oil", price: 8.0, unit: "16oz" },
  flour: { name: "Flour", price: 4.0, unit: "5lb" },
  sugar: { name: "Sugar", price: 3.5, unit: "4lb" },
  salt: { name: "Salt", price: 1.5, unit: "26oz" },
  "soy sauce": { name: "Soy Sauce", price: 3.0, unit: "15oz" },
  ketchup: { name: "Ketchup", price: 3.5, unit: "20oz" },
  mustard: { name: "Mustard", price: 2.5, unit: "8oz" },
  mayonnaise: { name: "Mayonnaise", price: 4.5, unit: "30oz" },
  "peanut butter": { name: "Peanut Butter", price: 4.0, unit: "16oz" },
  honey: { name: "Honey", price: 6.0, unit: "12oz" },
  cereal: { name: "Cereal", price: 4.5, unit: "box" },
  oatmeal: { name: "Oatmeal", price: 4.0, unit: "42oz" },
  "canned tomatoes": { name: "Canned Tomatoes", price: 1.75, unit: "28oz" },
  broth: { name: "Broth", price: 2.5, unit: "32oz" },
  "baking powder": { name: "Baking Powder", price: 3.0, unit: "8oz" },
  vanilla: { name: "Vanilla Extract", price: 5.0, unit: "2oz" },

  // Beverages
  coffee: { name: "Coffee", price: 8.0, unit: "12oz" },
  tea: { name: "Tea", price: 4.5, unit: "20ct" },
  juice: { name: "Juice", price: 4.0, unit: "64oz" },
  water: { name: "Water", price: 4.5, unit: "24pk" },
  soda: { name: "Soda", price: 6.5, unit: "12pk" },

  // Household
  "paper towel": { name: "Paper Towels", price: 8.0, unit: "6ct" },
  "toilet paper": { name: "Toilet Paper", price: 9.0, unit: "12ct" },
  "trash bag": { name: "Trash Bags", price: 8.0, unit: "40ct" },
  "dish soap": { name: "Dish Soap", price: 3.5, unit: "16oz" },
};

/**
 * Category-level average price estimates for when no specific item match is found.
 */
export const CATEGORY_PRICE_ESTIMATES: Record<string, number> = {
  produce: 2.5,
  dairy: 4.0,
  meat: 7.0,
  bakery: 3.5,
  frozen: 4.5,
  pantry: 3.5,
  snacks: 4.0,
  beverages: 4.5,
  household: 6.0,
  personal: 5.0,
  other: 3.5,
};

/**
 * Estimates the price for a given item name.
 * First checks exact/partial matches in DEFAULT_PRICES,
 * then falls back to category estimate, then to a global average.
 */
export function estimatePrice(itemName: string, categoryId?: string): number {
  const lower = itemName.toLowerCase().trim();

  // Check exact match
  if (DEFAULT_PRICES[lower]) {
    return DEFAULT_PRICES[lower].price;
  }

  // Check partial match (item name contains a known key or vice versa)
  for (const [key, entry] of Object.entries(DEFAULT_PRICES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return entry.price;
    }
  }

  // Fall back to category average
  if (categoryId && CATEGORY_PRICE_ESTIMATES[categoryId]) {
    return CATEGORY_PRICE_ESTIMATES[categoryId];
  }

  // Global fallback
  return 3.5;
}
