import { create } from "zustand";
import type { Prediction, Reminder, PurchaseRecord, User } from "../types";
import { generatePredictions, generateReminders } from "../services/ml/predictionEngine";
import { filterPredictions } from "../services/ml/personalization";
import { useAuthStore } from "./authStore";

interface PersonalizedSuggestionItem {
  itemName: string;
  category: string;
  categoryId: string;
  reason: string;
  score: number;
  estimatedPrice: number;
  tags: string[];
}

interface PredictionsState {
  predictions: Prediction[];
  reminders: Reminder[];
  suggestions: PersonalizedSuggestionItem[];
  isComputing: boolean;
  lastComputed: string | null;

  // Actions
  compute: (purchases: PurchaseRecord[]) => void;
  dismissReminder: (reminderId: string) => void;
  getTopPredictions: (n?: number) => Prediction[];
  getActiveReminders: () => Reminder[];
  getCriticalReminders: () => Reminder[];
}

export const usePredictionsStore = create<PredictionsState>((set, get) => ({
  predictions: [],
  reminders: [],
  suggestions: [],
  isComputing: false,
  lastComputed: null,

  compute: (purchases) => {
    set({ isComputing: true });

    // Run prediction engine
    let predictions = generatePredictions(purchases);
    const reminders = generateReminders(purchases);

    // Apply personalization filters based on user profile
    const user = useAuthStore.getState().user;
    if (user && (user.dietaryPreferences.length > 0 || user.allergies.length > 0)) {
      predictions = filterPredictions(predictions, user);
    }

    // Generate personalized suggestions
    let suggestions: PersonalizedSuggestionItem[] = [];
    if (user && user.onboardingComplete) {
      const { getPersonalizedSuggestions } = require("../services/ml/personalization");
      suggestions = getPersonalizedSuggestions(user, [], purchases);
    }

    set({
      predictions,
      reminders,
      suggestions,
      isComputing: false,
      lastComputed: new Date().toISOString(),
    });
  },

  dismissReminder: (reminderId) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === reminderId ? { ...r, dismissed: true } : r
      ),
    }));
  },

  getTopPredictions: (n = 10) => {
    return get().predictions.slice(0, n);
  },

  getActiveReminders: () => {
    return get().reminders.filter((r) => !r.dismissed);
  },

  getCriticalReminders: () => {
    return get()
      .reminders.filter((r) => !r.dismissed && (r.urgency === "critical" || r.urgency === "high"));
  },
}));
