# CartIQ - Project Context (Paste this into a new Claude chat)

You are helping me write an academic **status report** for my senior project called **CartIQ**. Below is everything about the project. Use this to help me write a 1-2 page status report.

---

## What is CartIQ?

CartIQ is a **smart grocery list mobile app** built with React Native (Expo). It uses **AI-powered predictions** to learn users' shopping habits and predict what they'll need to buy next. Think of it as a grocery assistant that gets smarter over time.

## The Problem We're Solving

Grocery shopping is inefficient and wasteful:
- People forget items and make extra trips
- They overspend because they don't track budgets per trip
- They buy items they already have because they don't track consumption patterns
- No existing app learns from your shopping history to predict future needs

## Project Goal

Build a production-ready mobile app that:
1. Manages grocery lists with budget tracking
2. Learns from purchase history using an ML-inspired prediction engine
3. Sends smart reminders when items are running low
4. Provides spending analytics and shopping insights
5. Recommends items based on frequency, complementary pairings, and seasonal availability

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (React Native) | SDK 54 |
| Language | TypeScript | 5.9 |
| UI Runtime | React | 19.1 |
| State Management | Zustand | 5.0.12 |
| Backend Auth | Firebase Authentication | 12.6.0 |
| Backend DB | Cloud Firestore | 12.6.0 |
| Local Storage | AsyncStorage | 2.2.0 |
| Animations | react-native-reanimated | ~4.1.1 |
| Gradients | expo-linear-gradient | 15.0.8 |
| Camera | expo-camera | 17.0.10 |
| Routing | Expo Router (file-based) | 6.0.23 |

## Architecture

```
app/                  # 10 screens using Expo Router (file-based routing)
  (auth)/             # Login, Register screens
  (app)/              # Dashboard, Lists, ListDetail, AddItem, Generate,
                      # Predictions, Analytics, Profile, ShareList
stores/               # 4 Zustand stores
  authStore.ts        # User auth state + Firebase Auth
  listsStore.ts       # Grocery lists CRUD + real-time Firestore sync
  purchaseStore.ts    # Purchase history + spending stats computation
  predictionsStore.ts # AI predictions + reminders
services/
  firebase/
    auth.ts           # Firebase Auth (sign in, sign up, sign out)
    db.ts             # Firestore CRUD (users, lists, purchases collections)
  ml/
    predictionEngine.ts  # ML-inspired prediction algorithm
    analytics.ts         # Spending analytics + insights generation
    recommendations.ts   # Item recommendations (frequency, complementary, seasonal)
  purchaseTracking.ts    # Historical price lookup
data/
  categories.ts       # 11 grocery categories with 250+ keyword mappings
  prices.ts           # 60+ item price estimates + category averages
  items.ts            # 350+ common grocery items for autocomplete
constants/
  theme.ts            # Design system (colors, gradients, typography, shadows)
config/
  firebase.ts         # Firebase initialization
types/
  index.ts            # All TypeScript interfaces
```

## Data Flow

```
User → Zustand Stores → Firebase Services → Firestore (Cloud)
                       → ML Services → Predictions/Analytics
```

All data syncs in real-time via Firestore `onSnapshot` listeners.

---

## Key Features (Implemented)

### 1. Authentication
- Email/password sign in and registration
- User profile with household size, weekly budget, dietary preferences
- Persistent auth via AsyncStorage

### 2. Grocery List Management
- Create/edit/delete lists with budget limits
- Add items with auto-categorization (keyword matching across 11 categories)
- Auto-price estimation (3-tier fallback: exact match → partial match → category average)
- Check off items while shopping
- Budget progress bar with over-budget warnings
- List archiving (soft delete)

### 3. AI Recipe Assistant (Generate Screen)
- Search TheMealDB API for recipes
- Auto-extracts ingredients with quantities and prices
- Quick generate from meal types (breakfast/lunch/dinner)
- Recipe chip suggestions

### 4. Barcode Scanning
- Camera-based barcode scanning using expo-camera
- Looks up products via Open Food Facts API
- Auto-fills item name, category, and estimated price

### 5. Purchase Tracking
- Records checked-off items as purchases (batch write to Firestore)
- Full purchase history per user (up to 500 records)
- Real-time sync

### 6. ML Prediction Engine
**Algorithm** (rule-based, designed to mirror ML approaches like GBDT/GRU):

Three weighted scoring components:
- **Frequency Score (25%)**: Based on purchase count with diminishing returns
  - Formula: `0.3 + 0.7 * min(count/10, 1)`
- **Recency Score (45%)**: How overdue an item is relative to its purchase cycle
  - 1.5x+ overdue → 0.95, due now → 0.85, almost due → 0.70, recently bought → 0.30
- **Pattern Score (30%)**: Consistency of purchase intervals using coefficient of variation
  - CV < 0.2 → 0.95 (very regular), CV < 0.4 → 0.80, CV < 0.6 → 0.65, CV >= 0.6 → 0.40

**Combined**: `probability = frequency×0.25 + recency×0.45 + pattern×0.30`

**Confidence Levels**:
- High: 5+ purchases AND probability >= 0.7
- Medium: 3+ purchases AND probability >= 0.5
- Low: Otherwise

### 7. Smart Reminders
Generated from predictions, filtered by urgency:
- **Critical**: Item is overdue (0+ days past expected purchase)
- **High**: 1-2 days until expected purchase
- **Medium**: 3-5 days until expected purchase
- **Low**: 6+ days until expected purchase

### 8. Analytics Dashboard
- Total spending, total items, total lists, avg list cost
- Monthly spending chart (last 6 months) with gradient bar chart
- Top categories with colored cards
- Frequent items list with avg prices
- Weekly spending breakdown

### 9. Recommendations Engine
Three sources:
- **Frequency-based**: Items bought often but not in current list
- **Complementary pairs**: Items that go with what's already listed (e.g., pasta → tomato sauce, parmesan)
- **Seasonal**: Month-appropriate produce suggestions

### 10. Premium UI/UX
- Dark gradient headers with glow orbs on every screen
- Animated card entrances (FadeInDown, FadeInRight with staggering)
- Glass-effect elements (rgba backgrounds)
- Gradient CTA buttons with colored shadows
- Focus-reactive form inputs
- Custom checkboxes
- Design system with 12 gradient presets, 7 color palettes

---

## Firestore Database Schema

### Collection: `users`
```
{uid, displayName, email, householdSize, weeklyBudget,
 priceSensitivity, dietaryPreferences[], favoriteCategories[],
 createdAt, updatedAt}
```

### Collection: `lists`
```
{userId, name, items[], budget, totalEstimate,
 isArchived, createdAt, updatedAt}
```

### Collection: `purchases`
```
{userId, itemName, category, categoryId, price, quantity,
 purchasedAt, listId, listName}
```

---

## Current Status

- All 10 screens fully implemented and styled with premium UI
- Firebase Auth + Firestore fully integrated with real-time sync
- 4 Zustand stores working (migrated from old React Context)
- ML prediction engine computing predictions from purchase history
- Analytics computing spending stats in real-time
- Barcode scanning and recipe API integration working
- TypeScript compiles with zero errors
- App runs on Expo SDK 54 with React 19

## Challenges Overcome

1. **Zustand 5 + React 19 compatibility**: `useSyncExternalStore` infinite loop when calling store functions inside selectors. Fixed by using `useMemo` for derived state.
2. **Firestore composite index requirements**: Queries with `where()` + `orderBy()` on different fields require pre-built indexes. Simplified queries to use client-side sorting.
3. **Firebase Auth persistence**: Switched from `getAuth()` to `initializeAuth()` with `getReactNativePersistence(AsyncStorage)` for session persistence.
4. **Expired Firestore security rules**: Replaced with proper auth-based rules.

## What's Remaining

- User testing and feedback collection
- Performance optimization for large purchase histories
- Push notifications for reminders (infrastructure exists, needs scheduling logic)
- Potential ML model upgrade from rule-based to actual trained model
- App Store / Play Store deployment preparation
