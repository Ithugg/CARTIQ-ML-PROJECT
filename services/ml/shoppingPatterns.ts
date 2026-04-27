/**
 * CartIQ Shopping Pattern Detector
 *
 * Analyzes purchase history to detect:
 * - Preferred shopping day of the week
 * - Shopping frequency (weekly, biweekly, monthly)
 * - Next expected shopping date
 * - Average spend per trip
 */

import type { PurchaseRecord, DayOfWeek, ShoppingPattern } from "../../types";

const DAY_NAMES: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ShoppingTrip {
  date: Date;
  dayOfWeek: DayOfWeek;
  itemCount: number;
  totalSpent: number;
  listId: string;
}

function groupPurchasesIntoTrips(purchases: PurchaseRecord[]): ShoppingTrip[] {
  // Group by listId + date (same day)
  const tripMap = new Map<string, { records: PurchaseRecord[]; date: Date }>();

  for (const p of purchases) {
    const d = new Date(p.purchasedAt);
    const dateKey = `${p.listId}_${d.toISOString().split("T")[0]}`;
    const existing = tripMap.get(dateKey);
    if (existing) {
      existing.records.push(p);
    } else {
      tripMap.set(dateKey, { records: [p], date: d });
    }
  }

  return Array.from(tripMap.values())
    .map(({ records, date }) => ({
      date,
      dayOfWeek: DAY_NAMES[date.getDay()],
      itemCount: records.length,
      totalSpent: records.reduce((sum, r) => sum + r.price * r.quantity, 0),
      listId: records[0].listId,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function detectPreferredDay(trips: ShoppingTrip[]): DayOfWeek {
  const dayCounts: Record<string, number> = {};
  for (const trip of trips) {
    dayCounts[trip.dayOfWeek] = (dayCounts[trip.dayOfWeek] || 0) + 1;
  }

  let bestDay: DayOfWeek = "Sat";
  let bestCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestDay = day as DayOfWeek;
    }
  }

  return bestDay;
}

function detectFrequency(trips: ShoppingTrip[]): ShoppingPattern["frequency"] {
  if (trips.length < 2) return "irregular";

  const intervals: number[] = [];
  for (let i = 1; i < trips.length; i++) {
    const days =
      (trips[i].date.getTime() - trips[i - 1].date.getTime()) /
      (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  const avgInterval = intervals.reduce((s, d) => s + d, 0) / intervals.length;

  if (avgInterval <= 9) return "weekly";
  if (avgInterval <= 18) return "biweekly";
  if (avgInterval <= 35) return "monthly";
  return "irregular";
}

export function analyzeShoppingPatterns(
  purchases: PurchaseRecord[]
): ShoppingPattern & { nextShoppingDate: string | null; isShoppingDay: boolean; daysUntilNext: number } {
  const trips = groupPurchasesIntoTrips(purchases);

  if (trips.length === 0) {
    return {
      preferredDay: "Sat",
      avgItemsPerTrip: 0,
      avgSpendPerTrip: 0,
      frequency: "irregular",
      nextShoppingDate: null,
      isShoppingDay: false,
      daysUntilNext: -1,
    };
  }

  const preferredDay = detectPreferredDay(trips);
  const frequency = detectFrequency(trips);

  const avgItemsPerTrip =
    Math.round(
      (trips.reduce((s, t) => s + t.itemCount, 0) / trips.length) * 10
    ) / 10;
  const avgSpendPerTrip =
    Math.round(
      (trips.reduce((s, t) => s + t.totalSpent, 0) / trips.length) * 100
    ) / 100;

  // Calculate next expected shopping date
  const lastTrip = trips[trips.length - 1];
  const avgIntervalDays =
    frequency === "weekly"
      ? 7
      : frequency === "biweekly"
      ? 14
      : frequency === "monthly"
      ? 30
      : 7; // default to weekly for irregular

  const nextDate = new Date(lastTrip.date);
  nextDate.setDate(nextDate.getDate() + avgIntervalDays);

  // Snap to preferred day of week
  const preferredDayIndex = DAY_NAMES.indexOf(preferredDay);
  const currentDayIndex = nextDate.getDay();
  const dayDiff = (preferredDayIndex - currentDayIndex + 7) % 7;
  if (dayDiff > 0 && dayDiff <= 3) {
    nextDate.setDate(nextDate.getDate() + dayDiff);
  } else if (dayDiff > 3) {
    nextDate.setDate(nextDate.getDate() - (7 - dayDiff));
  }

  const now = new Date();
  const today = DAY_NAMES[now.getDay()];
  const isShoppingDay = today === preferredDay;
  const daysUntilNext = Math.max(
    0,
    Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    preferredDay,
    avgItemsPerTrip,
    avgSpendPerTrip,
    frequency,
    nextShoppingDate: nextDate.toISOString(),
    isShoppingDay,
    daysUntilNext,
  };
}
