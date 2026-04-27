import { create } from "zustand";
import type { GroceryList, GroceryItem } from "../types";
import * as dbService from "../services/firebase/db";
import { estimatePrice } from "../data/prices";
import { mapIngredientToCategory } from "../data/categories";

interface ListsState {
  lists: GroceryList[];
  isLoading: boolean;
  error: string | null;

  // Subscription
  subscribe: (userId: string) => () => void;

  // List CRUD
  createList: (userId: string, name: string, budget: number) => Promise<string>;
  deleteList: (listId: string) => Promise<void>;
  archiveList: (listId: string) => Promise<void>;
  updateList: (listId: string, updates: Partial<GroceryList>) => Promise<void>;

  // Item CRUD
  addItem: (listId: string, name: string, quantity: number, note?: string) => Promise<void>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  toggleItem: (listId: string, itemId: string) => Promise<void>;
  updateItem: (listId: string, itemId: string, updates: Partial<GroceryItem>) => Promise<void>;

  // Helpers
  getList: (listId: string) => GroceryList | undefined;
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  isLoading: true,
  error: null,

  subscribe: (userId: string) => {
    set({ isLoading: true, error: null });

    const unsubscribe = dbService.subscribeLists(
      userId,
      (lists) => set({ lists, isLoading: false, error: null }),
      (err) => {
        console.error("Lists subscription error:", err);
        set({ error: err.message, isLoading: false });
      }
    );

    return unsubscribe;
  },

  createList: async (userId, name, budget) => {
    const id = await dbService.createList(userId, name, budget);
    return id;
  },

  deleteList: async (listId) => {
    await dbService.deleteList(listId);
  },

  archiveList: async (listId) => {
    await dbService.archiveList(listId);
  },

  updateList: async (listId, updates) => {
    await dbService.updateList(listId, updates);
  },

  addItem: async (listId, name, quantity, note) => {
    const cat = mapIngredientToCategory(name);
    const price = estimatePrice(name, cat.id);

    const item: GroceryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      quantity,
      unit: "each",
      category: cat.name,
      categoryId: cat.id,
      checked: false,
      price,
      note: note || "",
      addedAt: new Date().toISOString(),
    };

    await dbService.addItemToList(listId, item);
  },

  removeItem: async (listId, itemId) => {
    await dbService.removeItemFromList(listId, itemId);
  },

  toggleItem: async (listId, itemId) => {
    await dbService.toggleItemCheck(listId, itemId);
  },

  updateItem: async (listId, itemId, updates) => {
    await dbService.updateItemInList(listId, itemId, updates);
  },

  getList: (listId) => {
    return get().lists.find((l) => l.id === listId);
  },
}));
