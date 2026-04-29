import type { PurchaseRecord } from "../../types";
import { estimatePrice } from "../../data/prices";
import { mapIngredientToCategory } from "../../data/categories";

const ML_API_URL = "http://localhost:5001";

export interface Discovery {
  id: string;
  itemName: string;
  category: string;
  categoryId: string;
  score: number;
  estimatedPrice: number;
  basedOn: string;
}

export interface NextBasketItem {
  id: string;
  itemName: string;
  category: string;
  categoryId: string;
  score: number;
  estimatedPrice: number;
}

function makeId(prefix: string, name: string): string {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

function cleanProductName(raw: string): string {
  let name = raw
    // Remove everything after a comma  ("Peanuts, Dry Roasted" → "Peanuts")
    .replace(/,.*$/, "")
    // Strip common marketing prefixes
    .replace(/^(organic|natural|premium|original|classic|traditional|simple|pure|real|fresh|whole|low[\s-]fat|fat[\s-]free|reduced[\s-]fat|no[\s-]sugar|sugar[\s-]free)\s+/i, "")
    .replace(/\s+(organic|natural)$/i, "")
    .trim();
  // Cap at 28 chars so cards don't overflow
  if (name.length > 28) {
    const words = name.split(" ");
    let result = "";
    for (const word of words) {
      if ((result + " " + word).trim().length > 25) break;
      result = (result + " " + word).trim();
    }
    name = result || name.slice(0, 25);
  }
  return name;
}

function buildItemList(purchases: PurchaseRecord[]): string[] {
  const seen = new Set<string>();
  const sorted = [...purchases].sort(
    (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
  );
  const names: string[] = [];
  for (const p of sorted) {
    const key = p.itemName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      names.push(p.itemName);
    }
  }
  return names;
}

export async function fetchDiscoveries(
  purchases: PurchaseRecord[]
): Promise<Discovery[]> {
  if (purchases.length === 0) return [];

  try {
    const items = buildItemList(purchases);
    const res = await fetch(`${ML_API_URL}/recommend/ncf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.discoveries)) return [];

    return data.discoveries.map((d: { productName: string; score: number; basedOn: string }) => {
      const displayName = cleanProductName(d.productName);
      const cat = mapIngredientToCategory(displayName);
      return {
        id: makeId("disc", displayName),
        itemName: displayName,
        category: cat.name,
        categoryId: cat.id,
        score: d.score,
        estimatedPrice: estimatePrice(displayName, cat.id),
        basedOn: d.basedOn,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchNextBasket(
  purchases: PurchaseRecord[]
): Promise<NextBasketItem[]> {
  if (purchases.length === 0) return [];

  try {
    const items = buildItemList(purchases);
    const res = await fetch(`${ML_API_URL}/recommend/gru`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.nextBasket)) return [];

    return data.nextBasket.map((item: { productName: string; score: number }) => {
      const displayName = cleanProductName(item.productName);
      const cat = mapIngredientToCategory(displayName);
      return {
        id: makeId("next", displayName),
        itemName: displayName,
        category: cat.name,
        categoryId: cat.id,
        score: item.score,
        estimatedPrice: estimatePrice(displayName, cat.id),
      };
    });
  } catch {
    return [];
  }
}
