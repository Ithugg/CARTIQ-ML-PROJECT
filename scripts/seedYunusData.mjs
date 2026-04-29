/**
 * CartIQ — Yunus Kounkourou Data Seeder (v2 — 32 weeks, 80+ items)
 *
 * Usage:
 *   node scripts/seedYunusData.mjs <email> <password>
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, collection, addDoc, writeBatch,
  doc, setDoc, getDocs, query, where, deleteDoc,
} from "firebase/firestore";

// ─── Firebase Config ──────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCdnqyt3B2yru2i6tswPGvBJZt3o9ubcAs",
  authDomain: "cartiq-82fa9.firebaseapp.com",
  projectId: "cartiq-82fa9",
  storageBucket: "cartiq-82fa9.firebasestorage.app",
  messagingSenderId: "756180458030",
  appId: "1:756180458030:web:a6a2e59a571934a42c1dbf",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "produce",   name: "Produce",           keywords: ["apple","banana","orange","grape","strawberry","blueberry","lemon","lime","avocado","tomato","potato","sweet potato","onion","garlic","ginger","carrot","celery","broccoli","cauliflower","spinach","lettuce","kale","cucumber","pepper","bell pepper","zucchini","squash","corn","mushroom","asparagus","cabbage","mango","pineapple","watermelon","peach","pear","cherry","cilantro","parsley","basil","mint","arugula","beet","radish"] },
  { id: "dairy",     name: "Dairy & Eggs",      keywords: ["milk","whole milk","2% milk","skim milk","almond milk","oat milk","coconut milk","cheese","cheddar","mozzarella","parmesan","yogurt","greek yogurt","butter","cream","egg","eggs","sour cream","cream cheese","cottage cheese","half and half","ghee","ricotta","provolone","swiss cheese"] },
  { id: "meat",      name: "Meat & Seafood",    keywords: ["chicken","chicken breast","chicken thigh","chicken wing","chicken drumstick","beef","ground beef","pork","turkey","ground turkey","lamb","bacon","sausage","ham","steak","ribeye","sirloin","salmon","tuna","shrimp","cod","tilapia","crab","scallop","anchovy","halibut","sea bass"] },
  { id: "bakery",    name: "Bakery & Bread",    keywords: ["bread","bagel","muffin","croissant","roll","bun","tortilla","pita","naan","sourdough","english muffin","whole wheat bread","rye bread","brioche","focaccia","pretzel roll"] },
  { id: "frozen",    name: "Frozen",            keywords: ["frozen pizza","ice cream","frozen vegetable","frozen fruit","frozen dinner","frozen fries","popsicle","frozen waffle","sorbet","gelato","frozen burrito","edamame"] },
  { id: "pantry",    name: "Pantry & Dry Goods",keywords: ["rice","pasta","flour","sugar","salt","pepper","oil","olive oil","vinegar","soy sauce","ketchup","mustard","mayonnaise","hot sauce","salsa","canned tomato","tomato sauce","soup","broth","chicken broth","vegetable broth","cereal","oatmeal","granola","honey","maple syrup","jam","peanut butter","almond butter","tahini","coffee","tea","green tea","baking powder","baking soda","vanilla","cornstarch","noodle","ramen","quinoa","lentil","chickpea","black bean","kidney bean","coconut oil","sesame oil","panko","breadcrumb","nutritional yeast"] },
  { id: "snacks",    name: "Snacks",            keywords: ["chip","chips","pretzel","popcorn","nut","almond","cashew","walnut","peanut","trail mix","granola bar","protein bar","candy","chocolate","dark chocolate","dried fruit","jerky","crackers","rice cake","hummus","guacamole"] },
  { id: "beverages", name: "Beverages",         keywords: ["water","juice","orange juice","apple juice","soda","sparkling water","energy drink","lemonade","iced tea","kombucha","coconut water","smoothie","protein shake","sports drink","cold brew"] },
  { id: "household", name: "Household",         keywords: ["paper towel","toilet paper","trash bag","foil","plastic wrap","sponge","dish soap","laundry detergent","bleach","cleaning spray","fabric softener","dishwasher pod","dryer sheet","hand soap","windex"] },
  { id: "personal",  name: "Personal Care",     keywords: ["shampoo","conditioner","body wash","soap","toothpaste","toothbrush","deodorant","lotion","sunscreen","razor","vitamin","band-aid","floss","mouthwash","face wash","moisturizer"] },
  { id: "other",     name: "Other",             keywords: [] },
];

function getCategory(name) {
  const lower = name.toLowerCase().trim();
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw) || kw.includes(lower)) return { id: cat.id, name: cat.name };
    }
  }
  return { id: "other", name: "Other" };
}

// ─── Shelf Life ───────────────────────────────────────────────────────────────

const SHELF_LIFE = { produce: 7, dairy: 10, meat: 4, bakery: 5, frozen: 90, pantry: 180, snacks: 60, beverages: 30, household: 365, personal: 365, other: 30 };
const ITEM_SHELF_OVERRIDES = {
  "banana": 5, "avocado": 4, "spinach": 5, "baby spinach": 5, "arugula": 5,
  "tomato": 6, "cherry tomato": 5, "bread": 5, "sourdough bread": 5,
  "whole milk": 8, "milk": 8, "2% milk": 8, "oat milk": 14, "almond milk": 14,
  "eggs": 21, "yogurt": 14, "greek yogurt": 14, "cottage cheese": 14,
  "chicken breast": 3, "chicken thigh": 3, "ground beef": 3, "ground turkey": 3,
  "salmon": 2, "shrimp": 3, "bacon": 7, "turkey breast": 5,
  "butter": 30, "cheddar cheese": 28, "cream cheese": 21, "mozzarella": 14,
  "rice": 365, "pasta": 365, "flour": 180, "sugar": 730, "coffee": 60,
  "olive oil": 180, "honey": 730, "soy sauce": 365, "peanut butter": 90,
  "paper towel": 730, "dish soap": 365, "toothpaste": 365,
  "sweet potato": 14, "carrot": 14, "potato": 21,
};

function getShelfLife(name, catId) {
  return ITEM_SHELF_OVERRIDES[name.toLowerCase()] ?? SHELF_LIFE[catId] ?? 30;
}

function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jitter(base, variance) {
  return Math.round(base * (1 + (Math.random() * 2 - 1) * variance) * 100) / 100;
}
function randomId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
function clean(obj) { return JSON.parse(JSON.stringify(obj)); }

// ─── Item Templates ───────────────────────────────────────────────────────────

// Every single trip (32 purchases)
const WEEKLY_STAPLES = [
  { name: "Eggs",           basePrice: 4.49,  variance: 0.12, unit: "dozen",   qty: 2 },
  { name: "Whole Milk",     basePrice: 4.29,  variance: 0.06, unit: "gal",     qty: 1 },
  { name: "Chicken Breast", basePrice: 9.49,  variance: 0.10, unit: "lb",      qty: 2 },
  { name: "Baby Spinach",   basePrice: 3.49,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Banana",         basePrice: 1.49,  variance: 0.10, unit: "bunch",   qty: 1 },
  { name: "Sourdough Bread",basePrice: 4.49,  variance: 0.05, unit: "loaf",    qty: 1 },
  { name: "Greek Yogurt",   basePrice: 5.99,  variance: 0.07, unit: "pack",    qty: 2 },
  { name: "Garlic",         basePrice: 0.99,  variance: 0.10, unit: "head",    qty: 3 },
  { name: "Cherry Tomato",  basePrice: 3.49,  variance: 0.12, unit: "pint",    qty: 1 },
  { name: "Oat Milk",       basePrice: 4.49,  variance: 0.06, unit: "carton",  qty: 2 },
  { name: "Cucumber",       basePrice: 0.99,  variance: 0.10, unit: "each",    qty: 2 },
  { name: "Lemon",          basePrice: 0.79,  variance: 0.10, unit: "each",    qty: 4 },
];

// Every 2 weeks — even weeks (0,2,4,…) → 16 purchases
const BIWEEKLY_EVEN = [
  { name: "Avocado",          basePrice: 1.79,  variance: 0.20, unit: "each",    qty: 4 },
  { name: "Broccoli",         basePrice: 2.49,  variance: 0.10, unit: "head",    qty: 2 },
  { name: "Cheddar Cheese",   basePrice: 4.99,  variance: 0.08, unit: "block",   qty: 1 },
  { name: "Pasta",            basePrice: 1.99,  variance: 0.05, unit: "box",     qty: 3 },
  { name: "Ground Beef",      basePrice: 7.49,  variance: 0.10, unit: "lb",      qty: 1 },
  { name: "Orange Juice",     basePrice: 4.99,  variance: 0.07, unit: "carton",  qty: 1 },
  { name: "Butter",           basePrice: 5.49,  variance: 0.06, unit: "pack",    qty: 1 },
  { name: "Bell Pepper",      basePrice: 1.49,  variance: 0.12, unit: "each",    qty: 3 },
  { name: "Mushroom",         basePrice: 2.99,  variance: 0.10, unit: "pack",    qty: 2 },
  { name: "Sweet Potato",     basePrice: 3.49,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Ground Turkey",    basePrice: 6.99,  variance: 0.08, unit: "lb",      qty: 1 },
  { name: "Cottage Cheese",   basePrice: 3.99,  variance: 0.07, unit: "tub",     qty: 1 },
  { name: "Quinoa",           basePrice: 6.99,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Arugula",          basePrice: 2.99,  variance: 0.10, unit: "bag",     qty: 1 },
  { name: "Sparkling Water",  basePrice: 5.49,  variance: 0.06, unit: "pack",    qty: 2 },
  { name: "Almonds",          basePrice: 8.99,  variance: 0.07, unit: "bag",     qty: 1 },
];

// Every 2 weeks — odd weeks (1,3,5,…) → 16 purchases
const BIWEEKLY_ODD = [
  { name: "Salmon",           basePrice: 12.99, variance: 0.12, unit: "fillet",  qty: 2 },
  { name: "Olive Oil",        basePrice: 8.49,  variance: 0.06, unit: "bottle",  qty: 1 },
  { name: "Carrot",           basePrice: 1.99,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Onion",            basePrice: 2.29,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Tomato",           basePrice: 2.99,  variance: 0.12, unit: "lb",      qty: 1 },
  { name: "Mozzarella",       basePrice: 4.49,  variance: 0.08, unit: "block",   qty: 1 },
  { name: "Chicken Thigh",    basePrice: 7.99,  variance: 0.10, unit: "lb",      qty: 2 },
  { name: "Apple",            basePrice: 3.99,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Strawberry",       basePrice: 4.49,  variance: 0.15, unit: "pint",    qty: 1 },
  { name: "Blueberry",        basePrice: 3.99,  variance: 0.15, unit: "pint",    qty: 1 },
  { name: "Kale",             basePrice: 2.99,  variance: 0.10, unit: "bunch",   qty: 1 },
  { name: "Black Bean",       basePrice: 1.29,  variance: 0.05, unit: "can",     qty: 3 },
  { name: "Chickpea",         basePrice: 1.29,  variance: 0.05, unit: "can",     qty: 2 },
  { name: "Hummus",           basePrice: 3.99,  variance: 0.08, unit: "tub",     qty: 1 },
];

// Every 3 weeks → ~10 purchases
const TRIWEEKLY = [
  { name: "Shrimp",           basePrice: 10.99, variance: 0.10, unit: "bag",     qty: 1 },
  { name: "Parmesan",         basePrice: 5.99,  variance: 0.07, unit: "wedge",   qty: 1 },
  { name: "Cream Cheese",     basePrice: 3.49,  variance: 0.07, unit: "block",   qty: 2 },
  { name: "Turkey Breast",    basePrice: 8.99,  variance: 0.08, unit: "lb",      qty: 1 },
  { name: "Tortilla",         basePrice: 3.49,  variance: 0.06, unit: "pack",    qty: 2 },
  { name: "Sour Cream",       basePrice: 2.49,  variance: 0.08, unit: "tub",     qty: 1 },
  { name: "Mango",            basePrice: 1.49,  variance: 0.15, unit: "each",    qty: 3 },
  { name: "Granola",          basePrice: 5.99,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Protein Bar",      basePrice: 14.99, variance: 0.06, unit: "box",     qty: 1 },
  { name: "Kombucha",         basePrice: 3.99,  variance: 0.08, unit: "bottle",  qty: 4 },
];

// Every 4 weeks → 8 purchases
const MONTHLY = [
  { name: "Rice",             basePrice: 5.99,  variance: 0.05, unit: "bag",     qty: 1 },
  { name: "Coffee",           basePrice: 12.99, variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Peanut Butter",    basePrice: 4.99,  variance: 0.05, unit: "jar",     qty: 1 },
  { name: "Honey",            basePrice: 7.49,  variance: 0.05, unit: "jar",     qty: 1 },
  { name: "Oatmeal",          basePrice: 4.49,  variance: 0.05, unit: "canister",qty: 1 },
  { name: "Soy Sauce",        basePrice: 3.49,  variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Olive Oil",        basePrice: 8.49,  variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Paper Towel",      basePrice: 9.99,  variance: 0.05, unit: "pack",    qty: 1 },
  { name: "Dish Soap",        basePrice: 3.99,  variance: 0.05, unit: "bottle",  qty: 2 },
  { name: "Laundry Detergent",basePrice: 12.99, variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Maple Syrup",      basePrice: 9.99,  variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Tahini",           basePrice: 7.99,  variance: 0.05, unit: "jar",     qty: 1 },
  { name: "Lentil",           basePrice: 2.49,  variance: 0.05, unit: "bag",     qty: 1 },
  { name: "Coconut Oil",      basePrice: 7.99,  variance: 0.05, unit: "jar",     qty: 1 },
  { name: "Nutritional Yeast",basePrice: 8.99,  variance: 0.05, unit: "bag",     qty: 1 },
  { name: "Almond Butter",    basePrice: 9.99,  variance: 0.06, unit: "jar",     qty: 1 },
];

// Random ~35% per trip — adds variety and noise
const OCCASIONAL = [
  { name: "Potato",          basePrice: 4.49,  variance: 0.08, unit: "bag",     qty: 1 },
  { name: "Cereal",          basePrice: 4.99,  variance: 0.08, unit: "box",     qty: 1 },
  { name: "Bagel",           basePrice: 4.49,  variance: 0.06, unit: "pack",    qty: 1 },
  { name: "Bacon",           basePrice: 7.49,  variance: 0.10, unit: "pack",    qty: 1 },
  { name: "Ice Cream",       basePrice: 5.99,  variance: 0.08, unit: "tub",     qty: 1 },
  { name: "Peach",           basePrice: 3.49,  variance: 0.15, unit: "lb",      qty: 1 },
  { name: "Pear",            basePrice: 2.99,  variance: 0.10, unit: "lb",      qty: 1 },
  { name: "Grape",           basePrice: 4.99,  variance: 0.12, unit: "bag",     qty: 1 },
  { name: "Broccoli",        basePrice: 2.49,  variance: 0.10, unit: "head",    qty: 1 },
  { name: "Asparagus",       basePrice: 3.99,  variance: 0.12, unit: "bunch",   qty: 1 },
  { name: "Cauliflower",     basePrice: 3.49,  variance: 0.10, unit: "head",    qty: 1 },
  { name: "Zucchini",        basePrice: 1.99,  variance: 0.12, unit: "each",    qty: 2 },
  { name: "Corn",            basePrice: 0.79,  variance: 0.10, unit: "each",    qty: 4 },
  { name: "Ginger",          basePrice: 0.99,  variance: 0.10, unit: "root",    qty: 1 },
  { name: "2% Milk",         basePrice: 3.99,  variance: 0.06, unit: "gal",     qty: 1 },
  { name: "Swiss Cheese",    basePrice: 4.49,  variance: 0.07, unit: "pack",    qty: 1 },
  { name: "Provolone",       basePrice: 4.49,  variance: 0.07, unit: "pack",    qty: 1 },
  { name: "Sausage",         basePrice: 5.99,  variance: 0.08, unit: "pack",    qty: 1 },
  { name: "Tuna",            basePrice: 1.49,  variance: 0.05, unit: "can",     qty: 3 },
  { name: "Chicken Broth",   basePrice: 3.49,  variance: 0.06, unit: "carton",  qty: 2 },
  { name: "Tomato Sauce",    basePrice: 2.49,  variance: 0.06, unit: "jar",     qty: 2 },
  { name: "Salsa",           basePrice: 3.99,  variance: 0.07, unit: "jar",     qty: 1 },
  { name: "Hot Sauce",       basePrice: 3.49,  variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Edamame",         basePrice: 3.49,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Frozen Fruit",    basePrice: 4.99,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Rice Cake",       basePrice: 3.99,  variance: 0.06, unit: "pack",    qty: 1 },
  { name: "Dark Chocolate",  basePrice: 3.99,  variance: 0.06, unit: "bar",     qty: 2 },
  { name: "Trail Mix",       basePrice: 6.99,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Cashew",          basePrice: 9.99,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Green Tea",       basePrice: 5.99,  variance: 0.05, unit: "box",     qty: 1 },
  { name: "Apple Juice",     basePrice: 3.99,  variance: 0.06, unit: "bottle",  qty: 1 },
  { name: "Coconut Water",   basePrice: 4.99,  variance: 0.07, unit: "pack",    qty: 1 },
  { name: "Ricotta",         basePrice: 4.49,  variance: 0.07, unit: "tub",     qty: 1 },
  { name: "Walnuts",         basePrice: 8.99,  variance: 0.07, unit: "bag",     qty: 1 },
  { name: "Pineapple",       basePrice: 2.99,  variance: 0.10, unit: "each",    qty: 1 },
  { name: "Beet",            basePrice: 2.49,  variance: 0.10, unit: "bunch",   qty: 1 },
  { name: "Celery",          basePrice: 1.99,  variance: 0.08, unit: "bunch",   qty: 1 },
  { name: "Toothpaste",      basePrice: 4.99,  variance: 0.05, unit: "tube",    qty: 1 },
  { name: "Body Wash",       basePrice: 5.99,  variance: 0.05, unit: "bottle",  qty: 1 },
  { name: "Vitamin D",       basePrice: 12.99, variance: 0.05, unit: "bottle",  qty: 1 },
];

const PRICE_TRENDS = {
  "Eggs": 0.030, "Chicken Breast": 0.020, "Chicken Thigh": 0.018,
  "Salmon": 0.025, "Avocado": 0.015, "Olive Oil": 0.010,
  "Whole Milk": 0.008, "Greek Yogurt": 0.008, "Oat Milk": 0.005,
  "Ground Beef": 0.022, "Butter": 0.012,
};

// ─── Shopping Date Generator ──────────────────────────────────────────────────

function getShoppingDates(weeksBack) {
  const dates = [];
  const now   = new Date();
  // Last trip was 9 days ago so weekly items are OVERDUE → highest prediction scores
  const lastTripOffset = 9;

  for (let w = weeksBack; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(d.getDate() - lastTripOffset - w * 7);
    // Snap to nearest Sunday
    d.setDate(d.getDate() - d.getDay());
    // Random time 10 am–2 pm
    d.setHours(10 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
    if (d <= now) dates.push(new Date(d));
  }
  return dates;
}

const LIST_NAMES = [
  "Sunday Grocery Run","Weekly Meal Prep","Weekly Essentials","Sunday Shopping",
  "Grocery Haul","Kitchen Restock","Weekly Groceries","Meal Prep Sunday",
  "Sunday Haul","Grocery Run","Weekly Restock","Sunday Essentials",
  "Meal Prep Haul","Weekly Shop","Sunday Groceries","Weekly Run",
  "Big Grocery Haul","Sunday Essentials","Protein & Produce","Healthy Restock",
  "Bulk Shop","Weekend Groceries","Monthly Stock-Up","Pantry Refill",
  "Fresh Produce Run","Lean & Clean Haul","Meal Kit Restock","Sunday Batch Cook",
  "Macro-Friendly Shop","Fridge Refresh","Healthy Weekly Shop","Clean Eating Haul",
];

// ═══════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════

async function main() {
  const email    = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node scripts/seedYunusData.mjs <email> <password>");
    process.exit(1);
  }

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  CartIQ — Yunus Kounkourou Data Seeder v2     ║");
  console.log("║  32 weeks · 80+ items · NCF/GRU ready         ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // 1. Sign in
  console.log(`Signing in as ${email}...`);
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✓ Signed in\n");
  } catch (err) {
    console.error("✗ Auth error:", err.message);
    process.exit(1);
  }

  const uid = userCredential.user.uid;
  console.log(`  UID: ${uid}\n`);

  // 2. Clear existing data
  console.log("Clearing existing data...");
  for (const col of ["purchases", "lists", "pantry"]) {
    const q    = query(collection(db, col), where("userId", "==", uid));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(doc(db, col, d.id));
    console.log(`  ✓ Cleared ${snap.size} ${col} docs`);
  }

  // 3. Update user profile
  console.log("\nUpdating user profile...");
  await setDoc(doc(db, "users", uid), clean({
    uid,
    displayName:         "Yunus Kounkourou",
    email,
    householdSize:       2,
    weeklyBudget:        200,
    priceSensitivity:    "medium",
    dietaryPreferences:  ["halal"],
    allergies:           [],
    fitnessGoals:        ["eat-healthy", "build_muscle", "meal_prep"],
    cookingFrequency:    "daily",
    favoriteCategories:  ["Produce", "Meat & Seafood", "Dairy & Eggs", "Pantry & Dry Goods"],
    onboardingComplete:  true,
    createdAt:           new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt:           new Date().toISOString(),
  }));
  console.log("✓ Profile updated\n");

  // 4. Generate 32 weeks of shopping trips
  const WEEKS = 31; // index 0..31 = 32 trips
  const shoppingDates = getShoppingDates(WEEKS);
  let totalPurchases = 0;
  let totalLists     = 0;

  console.log(`Seeding ${shoppingDates.length} shopping trips...\n`);

  for (let wIdx = 0; wIdx < shoppingDates.length; wIdx++) {
    const shopDate = shoppingDates[wIdx];
    const tripItems = [];

    // Weekly staples: every trip
    for (const t of WEEKLY_STAPLES) tripItems.push({ ...t });

    // Biweekly even: weeks 0,2,4,…
    if (wIdx % 2 === 0) {
      for (const t of BIWEEKLY_EVEN) tripItems.push({ ...t });
    }

    // Biweekly odd: weeks 1,3,5,…
    if (wIdx % 2 === 1) {
      for (const t of BIWEEKLY_ODD) tripItems.push({ ...t });
    }

    // Tri-weekly: weeks 0,3,6,9,…
    if (wIdx % 3 === 0) {
      for (const t of TRIWEEKLY) tripItems.push({ ...t });
    }

    // Monthly: every 4 weeks
    if (wIdx % 4 === 0) {
      for (const t of MONTHLY) tripItems.push({ ...t });
    }

    // Occasional: ~35% each
    for (const t of OCCASIONAL) {
      if (Math.random() < 0.35) tripItems.push({ ...t });
    }

    if (tripItems.length === 0) continue;

    const listId   = randomId();
    const listName = LIST_NAMES[wIdx % LIST_NAMES.length];

    const groceryItems = tripItems.map((t) => {
      const trend      = PRICE_TRENDS[t.name] || 0;
      const trendBase  = t.basePrice * (1 + trend * wIdx);
      const price      = jitter(trendBase, t.variance);
      const cat        = getCategory(t.name);
      return {
        id:         randomId(),
        name:       t.name,
        quantity:   t.qty,
        unit:       t.unit,
        category:   cat.name,
        categoryId: cat.id,
        checked:    true,
        price,
        addedAt:    shopDate.toISOString(),
      };
    });

    const totalEstimate = groceryItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Write list
    await addDoc(collection(db, "lists"), clean({
      name:          listName,
      items:         groceryItems,
      budget:        Math.ceil(totalEstimate / 10) * 10 + 20,
      totalEstimate: Math.round(totalEstimate * 100) / 100,
      createdAt:     shopDate.toISOString(),
      updatedAt:     shopDate.toISOString(),
      userId:        uid,
      isArchived:    wIdx < shoppingDates.length - 1,
    }));
    totalLists++;

    // Write purchase records
    let batch = writeBatch(db);
    let batchCount = 0;
    for (const item of groceryItems) {
      const ref = doc(collection(db, "purchases"));
      batch.set(ref, clean({
        itemName:    item.name,
        category:    item.category,
        categoryId:  item.categoryId,
        price:       item.price,
        quantity:    item.quantity,
        purchasedAt: shopDate.toISOString(),
        listId,
        listName,
        userId:      uid,
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
    const marker  = wIdx === shoppingDates.length - 1 ? " ← LAST TRIP (9 days ago, items OVERDUE)" : "";
    console.log(`  Week ${String(wIdx + 1).padStart(2)}: ${dateStr} — ${groceryItems.length} items  $${Math.round(totalEstimate)}${marker}`);
  }

  console.log(`\n✓ ${totalLists} shopping lists, ${totalPurchases} purchase records\n`);

  // 5. Pantry — current inventory after last trip
  console.log("Seeding pantry...");
  const pantrySeeds = [
    { name: "Eggs",           qty: 10, unit: "pcs",      daysAgo: 9  },
    { name: "Whole Milk",     qty: 1,  unit: "gal",      daysAgo: 9  },
    { name: "Chicken Breast", qty: 1,  unit: "lb",       daysAgo: 9  },
    { name: "Baby Spinach",   qty: 1,  unit: "bag",      daysAgo: 9  },
    { name: "Greek Yogurt",   qty: 3,  unit: "cups",     daysAgo: 9  },
    { name: "Sourdough Bread",qty: 1,  unit: "loaf",     daysAgo: 9  },
    { name: "Oat Milk",       qty: 1,  unit: "carton",   daysAgo: 9  },
    { name: "Banana",         qty: 3,  unit: "pcs",      daysAgo: 9  },
    { name: "Cherry Tomato",  qty: 1,  unit: "pint",     daysAgo: 9  },
    { name: "Cheddar Cheese", qty: 1,  unit: "block",    daysAgo: 2  },
    { name: "Butter",         qty: 2,  unit: "sticks",   daysAgo: 2  },
    { name: "Bell Pepper",    qty: 2,  unit: "each",     daysAgo: 4  },
    { name: "Avocado",        qty: 2,  unit: "each",     daysAgo: 4  },
    { name: "Sweet Potato",   qty: 3,  unit: "each",     daysAgo: 4  },
    { name: "Orange Juice",   qty: 1,  unit: "carton",   daysAgo: 6  },
    { name: "Olive Oil",      qty: 1,  unit: "bottle",   daysAgo: 7  },
    { name: "Garlic",         qty: 2,  unit: "heads",    daysAgo: 7  },
    { name: "Pasta",          qty: 2,  unit: "boxes",    daysAgo: 7  },
    { name: "Quinoa",         qty: 1,  unit: "bag",      daysAgo: 5  },
    { name: "Rice",           qty: 1,  unit: "bag",      daysAgo: 14 },
    { name: "Coffee",         qty: 1,  unit: "bag",      daysAgo: 10 },
    { name: "Peanut Butter",  qty: 1,  unit: "jar",      daysAgo: 28 },
    { name: "Honey",          qty: 1,  unit: "jar",      daysAgo: 20 },
    { name: "Oatmeal",        qty: 1,  unit: "canister", daysAgo: 14 },
    { name: "Soy Sauce",      qty: 1,  unit: "bottle",   daysAgo: 30 },
    { name: "Protein Bar",    qty: 4,  unit: "bars",     daysAgo: 7  },
    { name: "Almonds",        qty: 1,  unit: "bag",      daysAgo: 5  },
    { name: "Black Bean",     qty: 2,  unit: "cans",     daysAgo: 5  },
    { name: "Chicken Broth",  qty: 1,  unit: "carton",   daysAgo: 3  },
  ];

  let totalPantry = 0;
  for (const seed of pantrySeeds) {
    const cat       = getCategory(seed.name);
    const baseDate  = new Date();
    baseDate.setDate(baseDate.getDate() - seed.daysAgo);
    const addedAtStr = baseDate.toISOString();
    const shelfDays  = getShelfLife(seed.name, cat.id);
    const expiresAt  = addDays(addedAtStr, shelfDays);

    await addDoc(collection(db, "pantry"), clean({
      userId:     uid,
      name:       seed.name,
      category:   cat.name,
      categoryId: cat.id,
      quantity:   seed.qty,
      unit:       seed.unit,
      addedAt:    addedAtStr,
      expiresAt,
    }));
    totalPantry++;
  }

  console.log(`✓ ${totalPantry} pantry items\n`);

  // 6. Summary
  const uniqueItems = new Set([
    ...WEEKLY_STAPLES, ...BIWEEKLY_EVEN, ...BIWEEKLY_ODD,
    ...TRIWEEKLY, ...MONTHLY, ...OCCASIONAL,
  ].map((t) => t.name)).size;

  console.log("═══════════════════════════════════════════════");
  console.log("  SEED COMPLETE");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Email          : ${email}`);
  console.log(`  UID            : ${uid}`);
  console.log(`  Shopping trips : ${totalLists} (32 weeks)`);
  console.log(`  Purchase records: ${totalPurchases}`);
  console.log(`  Unique items   : ${uniqueItems}+`);
  console.log(`  Pantry items   : ${totalPantry}`);
  console.log("");
  console.log("  Expected predictions:");
  console.log("  • Eggs, Whole Milk, Chicken Breast  → HIGH (32×, 9d overdue)");
  console.log("  • Baby Spinach, Oat Milk, Garlic    → HIGH (32×, 9d overdue)");
  console.log("  • Avocado, Cheddar, Quinoa          → MED-HIGH (16×, even weeks)");
  console.log("  • Salmon, Blueberry, Mozzarella     → MED-HIGH (16×, odd weeks)");
  console.log("  • Shrimp, Granola, Protein Bar      → MEDIUM (~10×, tri-weekly)");
  console.log("  • Rice, Coffee, Peanut Butter       → MEDIUM (8×, monthly)");
  console.log("");
  console.log("  NCF/GRU: start ml/api/start.bat then open app.");
  console.log("═══════════════════════════════════════════════\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
