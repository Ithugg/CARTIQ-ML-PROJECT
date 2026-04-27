import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import type { GroceryList, GroceryItem, PurchaseRecord, User } from "../../types";
import { cleanForFirestore } from "./utils";

// ─── User Profile ───

export async function getUserProfile(uid: string): Promise<Partial<User> | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as Partial<User>;
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", uid), cleanForFirestore({ ...data, updatedAt: new Date().toISOString() }));
}

// ─── Grocery Lists ───

export function subscribeLists(
  userId: string,
  onData: (lists: GroceryList[]) => void,
  onError: (err: Error) => void
) {
  // Simple query - only filter by userId, sort & filter client-side (no composite index needed)
  const q = query(
    collection(db, "lists"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lists: GroceryList[] = snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "Untitled",
            items: data.items || [],
            budget: data.budget || 0,
            totalEstimate: data.totalEstimate || 0,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            userId: data.userId,
            isArchived: data.isArchived || false,
          };
        })
        .filter((l) => !l.isArchived)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(lists);
    },
    (error) => onError(error as Error)
  );
}

export async function createList(userId: string, name: string, budget: number): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "lists"), {
    name,
    items: [],
    budget,
    totalEstimate: 0,
    createdAt: now,
    updatedAt: now,
    userId,
    isArchived: false,
  });
  return ref.id;
}

export async function updateList(listId: string, updates: Partial<GroceryList>): Promise<void> {
  const ref = doc(db, "lists", listId);
  await updateDoc(ref, cleanForFirestore({ ...updates, updatedAt: new Date().toISOString() }));
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, "lists", listId));
}

export async function archiveList(listId: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), {
    isArchived: true,
    updatedAt: new Date().toISOString(),
  });
}

// ─── List Items ───

async function getListData(listId: string) {
  const snap = await getDoc(doc(db, "lists", listId));
  if (!snap.exists()) throw new Error("List not found");
  return snap.data();
}

export async function addItemToList(listId: string, item: GroceryItem): Promise<void> {
  const data = await getListData(listId);
  const items = [...(data.items || []), item];
  const totalEstimate = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  await updateDoc(doc(db, "lists", listId), cleanForFirestore({
    items,
    totalEstimate,
    updatedAt: new Date().toISOString(),
  }));
}

export async function removeItemFromList(listId: string, itemId: string): Promise<void> {
  const data = await getListData(listId);
  const items = (data.items || []).filter((i: GroceryItem) => i.id !== itemId);
  const totalEstimate = items.reduce((sum: number, i: GroceryItem) => sum + (i.price || 0) * (i.quantity || 1), 0);
  await updateDoc(doc(db, "lists", listId), cleanForFirestore({
    items,
    totalEstimate,
    updatedAt: new Date().toISOString(),
  }));
}

export async function updateItemInList(
  listId: string,
  itemId: string,
  updates: Partial<GroceryItem>
): Promise<void> {
  const data = await getListData(listId);
  const items = (data.items || []).map((i: GroceryItem) =>
    i.id === itemId ? { ...i, ...updates } : i
  );
  const totalEstimate = items.reduce((sum: number, i: GroceryItem) => sum + (i.price || 0) * (i.quantity || 1), 0);
  await updateDoc(doc(db, "lists", listId), cleanForFirestore({
    items,
    totalEstimate,
    updatedAt: new Date().toISOString(),
  }));
}

export async function toggleItemCheck(listId: string, itemId: string): Promise<void> {
  const data = await getListData(listId);
  const items = (data.items || []).map((i: GroceryItem) =>
    i.id === itemId ? { ...i, checked: !i.checked } : i
  );
  await updateDoc(doc(db, "lists", listId), cleanForFirestore({
    items,
    updatedAt: new Date().toISOString(),
  }));
}

// ─── Purchase History ───

export async function recordPurchases(
  userId: string,
  listId: string,
  listName: string,
  items: GroceryItem[]
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const item of items) {
    if (!item.checked) continue; // Only record checked-off items
    const ref = doc(collection(db, "purchases"));
    batch.set(ref, cleanForFirestore({
      itemName: item.name,
      category: item.category,
      categoryId: item.categoryId,
      price: item.price || 0,
      quantity: item.quantity || 1,
      purchasedAt: now,
      listId,
      listName,
      userId,
    }));
  }

  await batch.commit();
}

export function subscribePurchases(
  userId: string,
  onData: (purchases: PurchaseRecord[]) => void,
  onError: (err: Error) => void,
  maxRecords: number = 500
) {
  // Simple query - only filter by userId, sort client-side (no composite index needed)
  const q = query(
    collection(db, "purchases"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const purchases: PurchaseRecord[] = (
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PurchaseRecord[]
      )
        .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
        .slice(0, maxRecords);
      onData(purchases);
    },
    (error) => onError(error as Error)
  );
}

export async function getPurchaseHistory(
  userId: string,
  maxRecords: number = 500
): Promise<PurchaseRecord[]> {
  const q = query(
    collection(db, "purchases"),
    where("userId", "==", userId)
  );

  const snap = await getDocs(q);
  return (snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PurchaseRecord[])
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
    .slice(0, maxRecords);
}
