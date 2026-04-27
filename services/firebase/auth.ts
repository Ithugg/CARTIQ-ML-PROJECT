import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import type { User } from "../../types";

export function subscribeAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await loadUserProfile(cred.user.uid, cred.user);
  return profile;
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const now = new Date().toISOString();
  const userData: Omit<User, "uid"> = {
    displayName: name,
    email,
    householdSize: 2,
    weeklyBudget: 150,
    priceSensitivity: "medium",
    dietaryPreferences: [],
    allergies: [],
    fitnessGoals: [],
    cookingFrequency: "few_times_week",
    favoriteCategories: [],
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, "users", cred.user.uid), userData);

  return { uid: cred.user.uid, ...userData };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function loadUserProfile(
  uid: string,
  firebaseUser: FirebaseUser
): Promise<User> {
  const snap = await getDoc(doc(db, "users", uid));
  const now = new Date().toISOString();

  if (snap.exists()) {
    const data = snap.data();
    return {
      uid,
      displayName: data.displayName || firebaseUser.displayName || "",
      email: data.email || firebaseUser.email || "",
      photoURL: data.photoURL || firebaseUser.photoURL || "",
      householdSize: data.householdSize ?? 2,
      weeklyBudget: data.weeklyBudget ?? 150,
      priceSensitivity: data.priceSensitivity || "medium",
      dietaryPreferences: data.dietaryPreferences || [],
      allergies: data.allergies || [],
      fitnessGoals: data.fitnessGoals || [],
      cookingFrequency: data.cookingFrequency || "few_times_week",
      favoriteCategories: data.favoriteCategories || [],
      onboardingComplete: data.onboardingComplete ?? false,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
  }

  // First-time user or missing profile — create defaults
  const defaults: Omit<User, "uid"> = {
    displayName: firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    householdSize: 2,
    weeklyBudget: 150,
    priceSensitivity: "medium",
    dietaryPreferences: [],
    allergies: [],
    fitnessGoals: [],
    cookingFrequency: "few_times_week",
    favoriteCategories: [],
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "users", uid), defaults);
  return { uid, ...defaults };
}
