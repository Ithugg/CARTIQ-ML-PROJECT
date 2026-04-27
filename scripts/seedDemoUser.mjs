/**
 * CartIQ Demo User Seeder
 *
 * Run once:  node scripts/seedDemoUser.mjs
 *
 * Creates a demo user and populates 2.5 months of realistic grocery data.
 * The app code is NOT modified — this only writes to Firestore.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  writeBatch,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

// ─── Config (same as app) ───

const firebaseConfig = {
  apiKey: "AIzaSyCdnqyt3B2yru2i6tswPGvBJZt3o9ubcAs",
  authDomain: "cartiq-82fa9.firebaseapp.com",
  projectId: "cartiq-82fa9",
  storageBucket: "cartiq-82fa9.firebasestorage.app",
  messagingSenderId: "756180458030",
  appId: "1:756180458030:web:a6a2e59a571934a42c1dbf",
};

const DEMO_EMAIL = "demo@cartiq.app";
const DEMO_PASSWORD = "Demo2026!";
const DEMO_NAME = "Sarah Mitchell";

// ─── Initialize Firebase ───

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Category Mapper (standalone — no RN imports) ───

const CATEGORIES = [
  { id: "produce", name: "Produce", keywords: ["apple","banana","orange","grape","strawberry","blueberry","lemon","lime","avocado","tomato","potato","onion","garlic","ginger","carrot","celery","broccoli","cauliflower","spinach","lettuce","kale","cucumber","pepper","bell pepper","zucchini","squash","corn","mushroom","asparagus","cabbage","mango","pineapple","watermelon","peach","pear","cilantro","parsley","basil","mint"] },
  { id: "dairy", name: "Dairy & Eggs", keywords: ["milk","whole milk","almond milk","oat milk","cheese","cheddar cheese","mozzarella","parmesan","yogurt","greek yogurt","butter","cream","egg","eggs","sour cream","cream cheese","cottage cheese","half and half","ghee"] },
  { id: "meat", name: "Meat & Seafood", keywords: ["chicken","chicken breast","chicken thigh","beef","ground beef","pork","turkey","ground turkey","lamb","bacon","sausage","ham","steak","salmon","tuna","shrimp","cod","tilapia"] },
  { id: "bakery", name: "Bakery & Bread", keywords: ["bread","bagel","muffin","croissant","roll","bun","tortilla","pita","naan","sourdough","english muffin","whole wheat bread"] },
  { id: "frozen", name: "Frozen", keywords: ["frozen pizza","ice cream","frozen vegetable","frozen fruit","frozen dinner","frozen fries","popsicle","frozen waffle","sorbet","gelato"] },
  { id: "pantry", name: "Pantry & Dry Goods", keywords: ["rice","pasta","flour","sugar","salt","pepper","oil","olive oil","vinegar","soy sauce","ketchup","mustard","mayonnaise","hot sauce","salsa","canned tomato","soup","broth","cereal","oatmeal","granola","honey","maple syrup","jam","peanut butter","almond butter","coffee","tea","baking powder","baking soda","vanilla","cornstarch","noodle","ramen","quinoa","lentil"] },
  { id: "snacks", name: "Snacks", keywords: ["chip","chips","pretzel","popcorn","nut","almond","cashew","walnut","peanut","trail mix","granola bar","protein bar","candy","chocolate","dried fruit","jerky","crackers"] },
  { id: "beverages", name: "Beverages", keywords: ["water","juice","orange juice","soda","sparkling water","energy drink","lemonade","iced tea","kombucha","coconut water","smoothie"] },
  { id: "household", name: "Household", keywords: ["paper towel","toilet paper","trash bag","foil","plastic wrap","sponge","dish soap","laundry detergent","bleach","cleaning spray"] },
  { id: "personal", name: "Personal Care", keywords: ["shampoo","conditioner","body wash","soap","toothpaste","toothbrush","deodorant","lotion","sunscreen","razor","vitamin","band-aid"] },
  { id: "other", name: "Other", keywords: [] },
];

function getCategory(name) {
  const lower = name.toLowerCase().trim();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw) || kw.includes(lower)) {
        return { id: cat.id, name: cat.name };
      }
    }
  }
  return { id: "other", name: "Other" };
}

// ─── Expiration Estimator (standalone) ───

const SHELF_LIFE = {
  produce: 7, dairy: 10, meat: 4, bakery: 5, frozen: 90,
  pantry: 180, snacks: 60, beverages: 30, household: 365, personal: 365, other: 30,
};

const ITEM_SHELF_OVERRIDES = {
  "banana": 5, "avocado": 4, "spinach": 5, "tomato": 6, "bread": 5,
  "whole milk": 8, "milk": 8, "eggs": 21, "yogurt": 14, "greek yogurt": 14,
  "chicken breast": 3, "ground beef": 3, "salmon": 2, "shrimp": 3, "bacon": 7,
  "butter": 30, "cheddar cheese": 28, "cream cheese": 21,
  "rice": 365, "pasta": 365, "flour": 180, "sugar": 730, "coffee": 60,
  "olive oil": 180, "honey": 730, "soy sauce": 365, "peanut butter": 90,
  "ice cream": 60, "paper towel": 730, "dish soap": 365, "toothpaste": 365,
};

function getShelfLifeDays(name, catId) {
  const lower = name.toLowerCase();
  if (ITEM_SHELF_OVERRIDES[lower]) return ITEM_SHELF_OVERRIDES[lower];
  return SHELF_LIFE[catId] || 30;
}

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Helpers ───

function randomVariance(base, variance) {
  const factor = 1 + (Math.random() * 2 - 1) * variance;
  return Math.round(base * factor * 100) / 100;
}

function randomId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function clean(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Item Templates ───

const WEEKLY_STAPLES = [
  { name: "Whole Milk", basePrice: 4.29, variance: 0.08, unit: "gal", qty: 1 },
  { name: "Eggs", basePrice: 3.99, variance: 0.15, unit: "dozen", qty: 1 },
  { name: "Bread", basePrice: 3.49, variance: 0.05, unit: "loaf", qty: 1 },
  { name: "Banana", basePrice: 1.29, variance: 0.10, unit: "bunch", qty: 1 },
  { name: "Chicken Breast", basePrice: 8.99, variance: 0.12, unit: "lb", qty: 2 },
  { name: "Rice", basePrice: 5.49, variance: 0.05, unit: "bag", qty: 1 },
];

const BIWEEKLY_ITEMS = [
  { name: "Olive Oil", basePrice: 7.99, variance: 0.06, unit: "bottle", qty: 1 },
  { name: "Cheddar Cheese", basePrice: 4.49, variance: 0.10, unit: "block", qty: 1 },
  { name: "Greek Yogurt", basePrice: 5.29, variance: 0.08, unit: "pack", qty: 1 },
  { name: "Onion", basePrice: 1.99, variance: 0.12, unit: "bag", qty: 1 },
  { name: "Garlic", basePrice: 0.79, variance: 0.10, unit: "head", qty: 2 },
  { name: "Tomato", basePrice: 2.49, variance: 0.15, unit: "lb", qty: 1 },
  { name: "Pasta", basePrice: 1.89, variance: 0.05, unit: "box", qty: 2 },
  { name: "Butter", basePrice: 4.99, variance: 0.08, unit: "stick", qty: 1 },
  { name: "Ground Beef", basePrice: 6.99, variance: 0.10, unit: "lb", qty: 1 },
  { name: "Salmon", basePrice: 11.99, variance: 0.12, unit: "fillet", qty: 1 },
];

const MONTHLY_ITEMS = [
  { name: "Flour", basePrice: 3.99, variance: 0.05, unit: "bag", qty: 1 },
  { name: "Sugar", basePrice: 3.49, variance: 0.05, unit: "bag", qty: 1 },
  { name: "Coffee", basePrice: 9.99, variance: 0.08, unit: "bag", qty: 1 },
  { name: "Soy Sauce", basePrice: 3.29, variance: 0.05, unit: "bottle", qty: 1 },
  { name: "Honey", basePrice: 6.49, variance: 0.05, unit: "jar", qty: 1 },
  { name: "Paper Towel", basePrice: 8.99, variance: 0.06, unit: "pack", qty: 1 },
  { name: "Dish Soap", basePrice: 3.49, variance: 0.05, unit: "bottle", qty: 1 },
  { name: "Toothpaste", basePrice: 4.29, variance: 0.05, unit: "tube", qty: 1 },
];

const OCCASIONAL_ITEMS = [
  { name: "Avocado", basePrice: 1.49, variance: 0.20, unit: "each", qty: 3 },
  { name: "Spinach", basePrice: 3.49, variance: 0.10, unit: "bag", qty: 1 },
  { name: "Broccoli", basePrice: 2.29, variance: 0.10, unit: "head", qty: 1 },
  { name: "Bell Pepper", basePrice: 1.29, variance: 0.15, unit: "each", qty: 3 },
  { name: "Lemon", basePrice: 0.69, variance: 0.10, unit: "each", qty: 4 },
  { name: "Potato", basePrice: 3.99, variance: 0.08, unit: "bag", qty: 1 },
  { name: "Carrot", basePrice: 1.99, variance: 0.08, unit: "bag", qty: 1 },
  { name: "Cucumber", basePrice: 0.99, variance: 0.10, unit: "each", qty: 2 },
  { name: "Shrimp", basePrice: 9.99, variance: 0.12, unit: "bag", qty: 1 },
  { name: "Ice Cream", basePrice: 5.49, variance: 0.08, unit: "tub", qty: 1 },
  { name: "Peanut Butter", basePrice: 4.29, variance: 0.05, unit: "jar", qty: 1 },
  { name: "Almond Milk", basePrice: 3.99, variance: 0.08, unit: "carton", qty: 1 },
  { name: "Granola", basePrice: 4.99, variance: 0.06, unit: "bag", qty: 1 },
  { name: "Cereal", basePrice: 4.49, variance: 0.08, unit: "box", qty: 1 },
  { name: "Bacon", basePrice: 6.99, variance: 0.10, unit: "pack", qty: 1 },
  { name: "Orange Juice", basePrice: 4.49, variance: 0.08, unit: "carton", qty: 1 },
  { name: "Tortilla", basePrice: 3.29, variance: 0.06, unit: "pack", qty: 1 },
  { name: "Mushroom", basePrice: 2.99, variance: 0.10, unit: "pack", qty: 1 },
  { name: "Sour Cream", basePrice: 2.49, variance: 0.08, unit: "tub", qty: 1 },
];

// Items whose price trends upward over the weeks (for price alerts)
const PRICE_TRENDS = {
  "Eggs": 0.035,
  "Chicken Breast": 0.02,
  "Salmon": 0.025,
  "Avocado": 0.03,
  "Olive Oil": 0.015,
};

// ─── Shopping Date Generator (Saturdays, going back ~11 weeks) ───

function getShoppingDates(weeksBack) {
  const dates = [];
  const now = new Date();
  for (let w = weeksBack; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(d.getDate() - w * 7);
    // Move to Saturday
    const dow = d.getDay();
    d.setDate(d.getDate() - dow + 6);
    // Random time between 9am–3pm
    d.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
    if (d <= now) dates.push(new Date(d));
  }
  return dates;
}

function shouldInclude(freq, weekIdx) {
  if (freq === "weekly") return true;
  if (freq === "biweekly") return weekIdx % 2 === 0;
  if (freq === "monthly") return weekIdx % 4 === 0;
  return Math.random() < 0.30;
}

const LIST_NAMES = [
  "Weekly Groceries", "Saturday Shopping", "Grocery Run",
  "Weekly Essentials", "Kitchen Restock", "Meal Prep Haul",
  "Family Groceries", "Weekend Shopping", "Pantry Restock",
  "Weekly Haul", "Grocery Trip", "Food Shopping",
];

// ═══════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════

async function main() {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║     CartIQ Demo User Seeder           ║");
  console.log("╚═══════════════════════════════════════╝\n");

  // 1. Create or sign in demo user
  let userCredential;
  try {
    console.log(`Creating user ${DEMO_EMAIL}...`);
    userCredential = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
    await updateProfile(userCredential.user, { displayName: DEMO_NAME });
    console.log("✓ User created");
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("User already exists, signing in...");
      userCredential = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      console.log("✓ Signed in");
    } else {
      console.error("✗ Auth error:", err.message);
      process.exit(1);
    }
  }

  const uid = userCredential.user.uid;
  console.log(`  UID: ${uid}\n`);

  // 2. Clear any existing data for this user
  console.log("Clearing existing data...");
  for (const col of ["purchases", "lists", "pantry"]) {
    const q = query(collection(db, col), where("userId", "==", uid));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, col, d.id));
    }
    console.log(`  ✓ Cleared ${snap.size} ${col} docs`);
  }

  // 3. Write user profile
  console.log("\nWriting user profile...");
  await setDoc(doc(db, "users", uid), clean({
    uid,
    displayName: DEMO_NAME,
    email: DEMO_EMAIL,
    householdSize: 3,
    weeklyBudget: 150,
    priceSensitivity: "medium",
    dietaryPreferences: ["gluten-free"],
    allergies: [],
    fitnessGoals: ["eat-healthy", "meal-prep"],
    cookingFrequency: "few_times_week",
    favoriteCategories: ["Produce", "Dairy & Eggs", "Meat & Seafood"],
    onboardingComplete: true,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  console.log("✓ Profile written\n");

  // 4. Generate shopping trips
  const allTemplates = [
    ...WEEKLY_STAPLES.map((i) => ({ ...i, freq: "weekly" })),
    ...BIWEEKLY_ITEMS.map((i) => ({ ...i, freq: "biweekly" })),
    ...MONTHLY_ITEMS.map((i) => ({ ...i, freq: "monthly" })),
    ...OCCASIONAL_ITEMS.map((i) => ({ ...i, freq: "occasional" })),
  ];

  const shoppingDates = getShoppingDates(11); // ~2.5 months
  let totalPurchases = 0;
  let totalLists = 0;

  console.log(`Seeding ${shoppingDates.length} shopping trips...\n`);

  for (let wIdx = 0; wIdx < shoppingDates.length; wIdx++) {
    const shopDate = shoppingDates[wIdx];
    const listId = randomId();
    const listName = LIST_NAMES[wIdx % LIST_NAMES.length];

    // Pick items for this trip
    const tripItems = allTemplates.filter((t) => shouldInclude(t.freq, wIdx));
    if (tripItems.length === 0) continue;

    const groceryItems = tripItems.map((t) => {
      const trend = PRICE_TRENDS[t.name] || 0;
      const trendedBase = t.basePrice * (1 + trend * wIdx);
      const price = randomVariance(trendedBase, t.variance);
      const cat = getCategory(t.name);
      return {
        id: randomId(),
        name: t.name,
        quantity: t.qty,
        unit: t.unit,
        category: cat.name,
        categoryId: cat.id,
        checked: true,
        price,
        addedAt: shopDate.toISOString(),
      };
    });

    const totalEstimate = groceryItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Write list
    await addDoc(collection(db, "lists"), clean({
      name: listName,
      items: groceryItems,
      budget: Math.ceil(totalEstimate / 10) * 10 + 20,
      totalEstimate: Math.round(totalEstimate * 100) / 100,
      createdAt: shopDate.toISOString(),
      updatedAt: shopDate.toISOString(),
      userId: uid,
      isArchived: wIdx < shoppingDates.length - 1,
    }));
    totalLists++;

    // Write purchase records (batched, max 500 per batch)
    let batch = writeBatch(db);
    let batchCount = 0;
    for (const item of groceryItems) {
      const ref = doc(collection(db, "purchases"));
      batch.set(ref, clean({
        itemName: item.name,
        category: item.category,
        categoryId: item.categoryId,
        price: item.price,
        quantity: item.quantity,
        purchasedAt: shopDate.toISOString(),
        listId,
        listName,
        userId: uid,
      }));
      batchCount++;
      totalPurchases++;
      if (batchCount >= 490) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    if (batchCount > 0) await batch.commit();

    const dateStr = shopDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    console.log(`  ${dateStr} — ${listName} (${groceryItems.length} items, $${Math.round(totalEstimate)})`);
  }

  console.log(`\n✓ ${totalLists} lists, ${totalPurchases} purchase records\n`);

  // 5. Seed pantry items
  console.log("Seeding pantry items...");
  const recentDate = shoppingDates[shoppingDates.length - 1] || new Date();

  const pantrySeeds = [
    // Fresh from last shopping trip
    { name: "Whole Milk", qty: 1, unit: "gal", daysAgo: 2 },
    { name: "Eggs", qty: 8, unit: "pcs", daysAgo: 2 },
    { name: "Bread", qty: 1, unit: "loaf", daysAgo: 2 },
    { name: "Chicken Breast", qty: 1, unit: "lb", daysAgo: 2 },
    { name: "Banana", qty: 4, unit: "pcs", daysAgo: 3 },
    { name: "Greek Yogurt", qty: 3, unit: "cups", daysAgo: 2 },
    { name: "Cheddar Cheese", qty: 1, unit: "block", daysAgo: 5 },
    // Older items — some expiring soon
    { name: "Spinach", qty: 1, unit: "bag", daysAgo: 4 },
    { name: "Tomato", qty: 2, unit: "pcs", daysAgo: 5 },
    { name: "Avocado", qty: 1, unit: "each", daysAgo: 3 },
    { name: "Ground Beef", qty: 1, unit: "lb", daysAgo: 2 },
    // Pantry staples
    { name: "Rice", qty: 1, unit: "bag", daysAgo: 14 },
    { name: "Pasta", qty: 2, unit: "boxes", daysAgo: 20 },
    { name: "Olive Oil", qty: 1, unit: "bottle", daysAgo: 25 },
    { name: "Flour", qty: 1, unit: "bag", daysAgo: 30 },
    { name: "Honey", qty: 1, unit: "jar", daysAgo: 45 },
    { name: "Soy Sauce", qty: 1, unit: "bottle", daysAgo: 40 },
    { name: "Coffee", qty: 1, unit: "bag", daysAgo: 10 },
    { name: "Peanut Butter", qty: 1, unit: "jar", daysAgo: 18 },
    { name: "Butter", qty: 1, unit: "stick", daysAgo: 8 },
  ];

  let totalPantry = 0;
  for (const seed of pantrySeeds) {
    const cat = getCategory(seed.name);
    const addedDate = new Date(recentDate);
    addedDate.setDate(addedDate.getDate() - seed.daysAgo);
    const addedAt = addedDate.toISOString();
    const shelfDays = getShelfLifeDays(seed.name, cat.id);
    const expiresAt = addDays(addedAt, shelfDays);

    await addDoc(collection(db, "pantry"), clean({
      userId: uid,
      name: seed.name,
      category: cat.name,
      categoryId: cat.id,
      quantity: seed.qty,
      unit: seed.unit,
      addedAt,
      expiresAt,
    }));
    totalPantry++;
  }

  console.log(`✓ ${totalPantry} pantry items\n`);

  // 6. Summary
  console.log("═══════════════════════════════════════");
  console.log("  DEMO USER READY");
  console.log("═══════════════════════════════════════");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Name:     ${DEMO_NAME}`);
  console.log(`  UID:      ${uid}`);
  console.log("");
  console.log(`  ${totalLists} shopping lists`);
  console.log(`  ${totalPurchases} purchase records`);
  console.log(`  ${totalPantry} pantry items`);
  console.log(`  Spanning ~${shoppingDates.length} weeks of data`);
  console.log("═══════════════════════════════════════\n");
  console.log("Log into the app with the credentials above.");
  console.log("All screens (Dashboard, Analytics, Predictions) will be populated.\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
