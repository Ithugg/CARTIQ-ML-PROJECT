/**
 * Shopping Analytics Service
 *
 * Analyzes purchase history to provide insights on spending patterns,
 * budget optimization suggestions, and shopping behavior.
 * Uses rule-based heuristics, designed for future ML model integration.
 */

import { getPurchaseHistory, PurchaseRecord } from "../purchaseTracking";

export interface SpendingBreakdown {
  category: string;
  totalSpent: number;
  itemCount: number;
  percentage: number;
}

export interface ShoppingInsight {
  type: "tip" | "warning" | "achievement";
  title: string;
  message: string;
  icon: string; // Ionicons name
}

export interface BudgetAnalysis {
  averageListCost: number;
  totalSpent: number;
  totalTrips: number;
  mostExpensiveCategory: string;
  cheapestCategory: string;
  spendingByCategory: SpendingBreakdown[];
  insights: ShoppingInsight[];
}

/**
 * Analyze purchase history to generate spending breakdown and insights.
 */
export async function analyzeShopping(): Promise<BudgetAnalysis> {
  const history = await getPurchaseHistory();

  if (history.length === 0) {
    return {
      averageListCost: 0,
      totalSpent: 0,
      totalTrips: 0,
      mostExpensiveCategory: "N/A",
      cheapestCategory: "N/A",
      spendingByCategory: [],
      insights: [
        {
          type: "tip",
          title: "Start Shopping",
          message: "Complete your first shopping trip to see analytics and insights here.",
          icon: "cart-outline",
        },
      ],
    };
  }

  // Group by category
  const categoryMap: Record<string, { total: number; count: number }> = {};
  let totalSpent = 0;

  for (const item of history) {
    const cost = (item.price || 0) * (item.timesChecked || 1);
    totalSpent += cost;

    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { total: 0, count: 0 };
    }
    categoryMap[item.category].total += cost;
    categoryMap[item.category].count++;
  }

  // Build spending breakdown
  const spendingByCategory: SpendingBreakdown[] = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      totalSpent: data.total,
      itemCount: data.count,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // Estimate trips (group by date proximity)
  const tripDates = estimateTrips(history);
  const averageListCost = tripDates > 0 ? totalSpent / tripDates : totalSpent;

  const mostExpensive = spendingByCategory[0]?.category || "N/A";
  const cheapest = spendingByCategory[spendingByCategory.length - 1]?.category || "N/A";

  // Generate insights
  const insights = generateInsights(spendingByCategory, totalSpent, tripDates, history);

  return {
    averageListCost: Math.round(averageListCost * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalTrips: tripDates,
    mostExpensiveCategory: mostExpensive,
    cheapestCategory: cheapest,
    spendingByCategory,
    insights,
  };
}

/**
 * Estimate number of shopping trips from purchase history.
 * Groups purchases within 2 hours as the same trip.
 */
function estimateTrips(history: PurchaseRecord[]): number {
  if (history.length === 0) return 0;

  const sorted = [...history].sort(
    (a, b) => new Date(a.lastPurchased).getTime() - new Date(b.lastPurchased).getTime()
  );

  let trips = 1;
  let lastDate = new Date(sorted[0].lastPurchased).getTime();
  const TWO_HOURS = 2 * 60 * 60 * 1000;

  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i].lastPurchased).getTime();
    if (current - lastDate > TWO_HOURS) {
      trips++;
    }
    lastDate = current;
  }

  return trips;
}

/**
 * Generate actionable shopping insights.
 */
function generateInsights(
  spending: SpendingBreakdown[],
  totalSpent: number,
  trips: number,
  history: PurchaseRecord[]
): ShoppingInsight[] {
  const insights: ShoppingInsight[] = [];

  // High spending category warning
  for (const cat of spending) {
    if (cat.percentage > 40) {
      insights.push({
        type: "warning",
        title: "High Spending",
        message: `${cat.category} accounts for ${Math.round(cat.percentage)}% of your spending. Consider looking for sales or alternatives.`,
        icon: "alert-circle-outline",
      });
      break;
    }
  }

  // Trip frequency
  if (trips > 1) {
    const avgPerTrip = totalSpent / trips;
    insights.push({
      type: "tip",
      title: "Average Trip Cost",
      message: `You spend about $${avgPerTrip.toFixed(2)} per shopping trip. Buying in bulk could help reduce this.`,
      icon: "trending-down-outline",
    });
  }

  // Diversity check
  if (spending.length >= 4) {
    insights.push({
      type: "achievement",
      title: "Well-Rounded Shopping",
      message: `You shop across ${spending.length} categories. Great variety in your diet!`,
      icon: "trophy-outline",
    });
  }

  // Item count milestone
  if (history.length >= 50) {
    insights.push({
      type: "achievement",
      title: "Power Shopper",
      message: `You've tracked ${history.length} items. Your price estimates are getting more accurate!`,
      icon: "star-outline",
    });
  } else if (history.length >= 10) {
    insights.push({
      type: "tip",
      title: "Building History",
      message: `${history.length} items tracked. Keep going - more data means better price predictions.`,
      icon: "analytics-outline",
    });
  }

  // Budget saving tips
  const produceSpending = spending.find((s) => s.category === "Produce");
  if (produceSpending && produceSpending.percentage < 20) {
    insights.push({
      type: "tip",
      title: "Fresh Produce",
      message: "Consider adding more fruits and vegetables. They're often cheaper per serving than processed foods.",
      icon: "leaf-outline",
    });
  }

  return insights;
}

/**
 * Get price trend for a specific item (placeholder for ML model).
 * Returns average price from purchase history.
 */
export async function getItemPriceTrend(
  itemName: string
): Promise<{ average: number; min: number; max: number; dataPoints: number } | null> {
  const history = await getPurchaseHistory();
  const lower = itemName.toLowerCase();

  const matches = history.filter(
    (item) => item.name.toLowerCase().includes(lower) || lower.includes(item.name.toLowerCase())
  );

  if (matches.length === 0) return null;

  const prices = matches.map((m) => m.price || 0).filter((p) => p > 0);
  if (prices.length === 0) return null;

  return {
    average: prices.reduce((a, b) => a + b, 0) / prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    dataPoints: prices.length,
  };
}
