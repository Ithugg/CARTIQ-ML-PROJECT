import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../config/firebase";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  checked: boolean;
  price?: number;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  budget: number;
  createdAt: Date;
  collaborators: string[];
  userId: string;
}

// ✅ FIXED: Consistent User interface
export interface User {
  uid: string;
  displayName: string;
  email: string;
  dietaryPreferences?: string[];
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  groceryLists: GroceryList[];
  addGroceryList: (list: Omit<GroceryList, "id">) => Promise<void>;
  updateGroceryList: (
    listId: string,
    updatedList: Partial<GroceryList>
  ) => Promise<void>;
  deleteGroceryList: (listId: string) => Promise<void>;
  addItemToList: (listId: string, item: GroceryItem) => Promise<void>;
  removeItemFromList: (listId: string, itemId: string) => Promise<void>;
  toggleItemCheck: (listId: string, itemId: string) => Promise<void>;
  updateItemInList: (
    listId: string,
    itemId: string,
    updates: Partial<GroceryItem>
  ) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.data();

          setUser({
            uid: firebaseUser.uid,
            displayName:
              userData?.displayName || firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            dietaryPreferences: userData?.dietaryPreferences || [],
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setGroceryLists([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for lists
  useEffect(() => {
    if (!user) {
      setGroceryLists([]);
      return;
    }

    const listsRef = collection(db, "lists");
    const q = query(listsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lists = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            items: data.items || [],
            budget: data.budget,
            createdAt: data.createdAt?.toDate() || new Date(),
            collaborators: data.collaborators || [],
            userId: data.userId,
          } as GroceryList;
        });

        setGroceryLists(lists);
      },
      (error) => {
        console.error("Error fetching lists:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addGroceryList = async (list: Omit<GroceryList, "id">) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await addDoc(collection(db, "lists"), {
        ...list,
        items: list.items || [],
        userId: user.uid,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error adding list:", error);
      throw error;
    }
  };

  const updateGroceryList = async (
    listId: string,
    updatedList: Partial<GroceryList>
  ) => {
    try {
      const listRef = doc(db, "lists", listId);
      await updateDoc(listRef, updatedList);
    } catch (error) {
      console.error("Error updating list:", error);
      throw error;
    }
  };

  const deleteGroceryList = async (listId: string) => {
    try {
      await deleteDoc(doc(db, "lists", listId));
    } catch (error) {
      console.error("Error deleting list:", error);
      throw error;
    }
  };

  const addItemToList = async (listId: string, item: GroceryItem) => {
    try {
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        const currentList = listSnap.data() as GroceryList;
        const updatedItems = [...(currentList.items || []), item];

        await updateDoc(listRef, {
          items: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  };

  const removeItemFromList = async (listId: string, itemId: string) => {
    try {
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        const currentList = listSnap.data() as GroceryList;
        const updatedItems = currentList.items.filter(
          (item) => item.id !== itemId
        );

        await updateDoc(listRef, {
          items: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      throw error;
    }
  };

  const toggleItemCheck = async (listId: string, itemId: string) => {
    try {
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        const currentList = listSnap.data() as GroceryList;
        const updatedItems = currentList.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );

        await updateDoc(listRef, {
          items: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error toggling item:", error);
      throw error;
    }
  };

  const updateItemInList = async (
    listId: string,
    itemId: string,
    updates: Partial<GroceryItem>
  ) => {
    try {
      const listRef = doc(db, "lists", listId);
      const listSnap = await getDoc(listRef);

      if (listSnap.exists()) {
        const currentList = listSnap.data() as GroceryList;
        const updatedItems = currentList.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );

        await updateDoc(listRef, {
          items: updatedItems,
        });
      }
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  };

  const value: AppContextType = {
    user,
    isLoading,
    setUser,
    groceryLists,
    addGroceryList,
    updateGroceryList,
    deleteGroceryList,
    addItemToList,
    removeItemFromList,
    toggleItemCheck,
    updateItemInList,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
