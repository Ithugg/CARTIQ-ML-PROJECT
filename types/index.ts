// ─── CartIQ Production Types ───

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  householdSize: number;
  weeklyBudget: number;
  priceSensitivity: "low" | "medium" | "high";
  dietaryPreferences: string[];
  allergies: string[];
  fitnessGoals: string[];
  cookingFrequency: "rarely" | "few_times_week" | "daily" | "meal_prep";
  favoriteCategories: string[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  categoryId: string;
  checked: boolean;
  price: number;
  note?: string;
  addedAt: string;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  budget: number;
  totalEstimate: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isArchived: boolean;
}

export interface PurchaseRecord {
  id: string;
  itemName: string;
  category: string;
  categoryId: string;
  price: number;
  quantity: number;
  purchasedAt: string;
  listId: string;
  listName: string;
  userId: string;
}

export interface PurchaseStats {
  totalSpent: number;
  totalItems: number;
  totalLists: number;
  avgListCost: number;
  topCategories: { category: string; count: number; spent: number }[];
  weeklySpending: { week: string; amount: number }[];
  monthlySpending: { month: string; amount: number }[];
  frequentItems: { name: string; count: number; lastPurchased: string }[];
}

export interface Prediction {
  id: string;
  itemName: string;
  category: string;
  categoryId: string;
  probability: number;
  confidence: "high" | "medium" | "low";
  reason: string;
  estimatedPrice: number;
  avgDaysBetweenPurchases: number;
  daysSinceLastPurchase: number;
  purchaseCount: number;
  scores: {
    frequency: number;
    recency: number;
    pattern: number;
    combined: number;
  };
}

export interface Reminder {
  id: string;
  itemName: string;
  category: string;
  urgency: "critical" | "high" | "medium" | "low";
  message: string;
  estimatedDaysLeft: number;
  avgConsumptionDays: number;
  lastPurchased: string;
  estimatedPrice: number;
  dismissed: boolean;
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  quantity: number;
  unit: string;
  addedAt: string;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  status: "fresh" | "expiring_soon" | "expired";
}

export type DayOfWeek = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export interface ShoppingPattern {
  preferredDay: DayOfWeek;
  avgItemsPerTrip: number;
  avgSpendPerTrip: number;
  frequency: "weekly" | "biweekly" | "monthly" | "irregular";
}
