import { create } from "zustand";
import type { User } from "../types";
import * as authService from "../services/firebase/auth";
import { updateUserProfile } from "../services/firebase/db";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => () => void; // Returns unsubscribe
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: () => {
    const unsubscribe = authService.subscribeAuth(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.loadUserProfile(
            firebaseUser.uid,
            firebaseUser
          );
          set({ user: profile, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error("Error loading user profile:", error);
          set({ user: null, isLoading: false, isInitialized: true });
        }
      } else {
        set({ user: null, isLoading: false, isInitialized: true });
      }
    });

    return unsubscribe;
  },

  signIn: async (email, password) => {
    const user = await authService.signIn(email, password);
    set({ user });
  },

  signUp: async (name, email, password) => {
    const user = await authService.signUp(name, email, password);
    set({ user });
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) throw new Error("Not authenticated");
    await updateUserProfile(user.uid, updates);
    set({ user: { ...user, ...updates } });
  },
}));
