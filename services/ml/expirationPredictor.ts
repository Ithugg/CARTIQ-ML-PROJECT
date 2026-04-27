/**
 * Expiration Date Predictor
 *
 * Estimates shelf life for common grocery items based on category
 * and item type. Returns estimated expiration date and freshness status.
 */

// Average shelf life in days by category/item type
const SHELF_LIFE_DAYS: Record<string, number> = {
  // Produce - Fresh
  lettuce: 5,
  spinach: 5,
  kale: 5,
  arugula: 4,
  herbs: 5,
  cilantro: 5,
  parsley: 7,
  basil: 5,
  mint: 5,
  dill: 5,
  berries: 4,
  strawberry: 4,
  blueberry: 5,
  raspberry: 3,
  banana: 5,
  avocado: 4,
  tomato: 7,
  mushroom: 5,
  cucumber: 7,
  pepper: 7,
  zucchini: 5,
  broccoli: 5,
  cauliflower: 7,
  asparagus: 4,
  corn: 3,
  // Produce - Longer lasting
  apple: 21,
  orange: 21,
  lemon: 21,
  lime: 21,
  grapefruit: 21,
  potato: 30,
  onion: 30,
  garlic: 30,
  ginger: 21,
  carrot: 21,
  celery: 14,
  cabbage: 14,
  sweet_potato: 21,
  squash: 30,
  // Dairy
  milk: 7,
  yogurt: 14,
  cheese: 21,
  butter: 30,
  cream: 7,
  sour_cream: 14,
  eggs: 28,
  cream_cheese: 14,
  cottage_cheese: 7,
  // Meat & Seafood (raw)
  chicken: 2,
  beef: 3,
  pork: 3,
  turkey: 2,
  ground_beef: 2,
  fish: 2,
  salmon: 2,
  shrimp: 2,
  bacon: 7,
  sausage: 5,
  deli_meat: 5,
  // Bakery
  bread: 5,
  bagel: 5,
  muffin: 3,
  tortilla: 14,
  // Pantry (long shelf life)
  rice: 365,
  pasta: 365,
  canned: 730,
  flour: 180,
  sugar: 730,
  oil: 365,
  vinegar: 730,
  soy_sauce: 365,
  honey: 730,
  peanut_butter: 90,
  cereal: 180,
  oatmeal: 365,
  // Frozen
  frozen: 180,
  ice_cream: 60,
  // Beverages
  juice: 7,
  coffee: 30,
  tea: 365,
};

// Default shelf life by category
const CATEGORY_DEFAULTS: Record<string, number> = {
  produce: 7,
  dairy: 14,
  meat: 3,
  bakery: 5,
  frozen: 180,
  pantry: 365,
  snacks: 90,
  beverages: 30,
  household: 730,
  personal: 365,
  other: 30,
};

/**
 * Estimate expiration date for an item.
 */
export function estimateExpirationDays(
  itemName: string,
  categoryId: string
): number {
  const lower = itemName.toLowerCase();

  // Check specific item matches first
  for (const [keyword, days] of Object.entries(SHELF_LIFE_DAYS)) {
    if (lower.includes(keyword.replace("_", " ")) || lower.includes(keyword)) {
      return days;
    }
  }

  // Fall back to category default
  return CATEGORY_DEFAULTS[categoryId] || 30;
}

/**
 * Get freshness status based on days until expiry.
 */
export function getFreshnessStatus(
  daysUntilExpiry: number | null
): "fresh" | "expiring_soon" | "expired" {
  if (daysUntilExpiry === null) return "fresh";
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 3) return "expiring_soon";
  return "fresh";
}

/**
 * Calculate expiration date from purchase/add date.
 */
export function calculateExpirationDate(
  addedAt: string,
  shelfLifeDays: number
): string {
  const date = new Date(addedAt);
  date.setDate(date.getDate() + shelfLifeDays);
  return date.toISOString();
}

/**
 * Calculate days remaining until expiration.
 */
export function calculateDaysUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
