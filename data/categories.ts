import { Colors } from "../constants/theme";

export interface Category {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "produce",
    name: "Produce",
    icon: "leaf-outline",
    color: Colors.primary[500],
    keywords: [
      "apple", "banana", "orange", "grape", "strawberry", "blueberry", "raspberry",
      "lemon", "lime", "avocado", "tomato", "potato", "onion", "garlic", "ginger",
      "carrot", "celery", "broccoli", "cauliflower", "spinach", "lettuce", "kale",
      "cucumber", "pepper", "zucchini", "squash", "corn", "mushroom", "pea",
      "bean", "asparagus", "artichoke", "cabbage", "radish", "beet", "turnip",
      "mango", "pineapple", "watermelon", "peach", "pear", "plum", "cherry",
      "coconut", "papaya", "kiwi", "fig", "pomegranate", "cilantro", "parsley",
      "basil", "mint", "dill", "rosemary", "thyme", "oregano", "chive",
    ],
  },
  {
    id: "dairy",
    name: "Dairy & Eggs",
    icon: "water-outline",
    color: Colors.accent[500],
    keywords: [
      "milk", "cheese", "yogurt", "butter", "cream", "egg", "sour cream",
      "cottage cheese", "cream cheese", "mozzarella", "cheddar", "parmesan",
      "swiss", "brie", "gouda", "feta", "ricotta", "half and half", "whipping cream",
      "almond milk", "oat milk", "soy milk", "coconut milk", "ghee",
    ],
  },
  {
    id: "meat",
    name: "Meat & Seafood",
    icon: "fish-outline",
    color: "#e11d48",
    keywords: [
      "chicken", "beef", "pork", "turkey", "lamb", "bacon", "sausage", "ham",
      "steak", "ground beef", "ground turkey", "salmon", "tuna", "shrimp",
      "cod", "tilapia", "crab", "lobster", "scallop", "mussel", "clam",
      "anchovy", "sardine", "hot dog", "deli meat", "prosciutto", "salami",
      "pepperoni", "veal", "duck", "bison", "venison",
    ],
  },
  {
    id: "bakery",
    name: "Bakery & Bread",
    icon: "cafe-outline",
    color: Colors.warning[500],
    keywords: [
      "bread", "bagel", "muffin", "croissant", "roll", "bun", "tortilla",
      "pita", "naan", "baguette", "sourdough", "rye", "whole wheat",
      "english muffin", "cake", "pie", "cookie", "donut", "pastry", "cracker",
    ],
  },
  {
    id: "frozen",
    name: "Frozen",
    icon: "snow-outline",
    color: "#0ea5e9",
    keywords: [
      "frozen pizza", "ice cream", "frozen vegetable", "frozen fruit",
      "frozen dinner", "frozen fries", "popsicle", "frozen waffle",
      "frozen burrito", "frozen chicken", "frozen fish", "sorbet", "gelato",
      "frozen pie", "frozen bread", "frozen meatball",
    ],
  },
  {
    id: "pantry",
    name: "Pantry & Dry Goods",
    icon: "file-tray-stacked-outline",
    color: Colors.warning[600],
    keywords: [
      "rice", "pasta", "flour", "sugar", "salt", "pepper", "oil", "vinegar",
      "soy sauce", "ketchup", "mustard", "mayonnaise", "hot sauce", "salsa",
      "canned tomato", "canned bean", "soup", "broth", "stock", "cereal",
      "oatmeal", "granola", "pancake mix", "baking powder", "baking soda",
      "vanilla", "chocolate chip", "cocoa", "honey", "maple syrup", "jam",
      "jelly", "peanut butter", "almond butter", "nutella", "breadcrumb",
      "cornstarch", "yeast", "gelatin", "canned tuna", "canned chicken",
      "dried bean", "lentil", "quinoa", "couscous", "noodle", "ramen",
    ],
  },
  {
    id: "snacks",
    name: "Snacks",
    icon: "fast-food-outline",
    color: Colors.purple[500],
    keywords: [
      "chip", "pretzel", "popcorn", "nut", "almond", "cashew", "walnut",
      "peanut", "pistachio", "trail mix", "granola bar", "protein bar",
      "candy", "chocolate", "gummy", "dried fruit", "fruit snack", "jerky",
      "rice cake", "cracker", "goldfish", "cheez-it",
    ],
  },
  {
    id: "beverages",
    name: "Beverages",
    icon: "beer-outline",
    color: "#06b6d4",
    keywords: [
      "water", "juice", "soda", "coffee", "tea", "beer", "wine", "sparkling water",
      "energy drink", "sports drink", "lemonade", "iced tea", "kombucha",
      "coconut water", "smoothie", "protein shake", "cider", "tonic",
    ],
  },
  {
    id: "household",
    name: "Household",
    icon: "home-outline",
    color: Colors.neutral[500],
    keywords: [
      "paper towel", "toilet paper", "trash bag", "foil", "plastic wrap",
      "ziplock", "sponge", "dish soap", "laundry detergent", "bleach",
      "cleaning spray", "disinfectant", "broom", "mop", "vacuum bag",
      "light bulb", "battery", "candle", "air freshener",
    ],
  },
  {
    id: "personal",
    name: "Personal Care",
    icon: "body-outline",
    color: "#ec4899",
    keywords: [
      "shampoo", "conditioner", "body wash", "soap", "toothpaste", "toothbrush",
      "floss", "mouthwash", "deodorant", "lotion", "sunscreen", "razor",
      "shaving cream", "cotton ball", "band-aid", "medicine", "vitamin",
      "ibuprofen", "acetaminophen", "tissue", "hand sanitizer",
    ],
  },
  {
    id: "other",
    name: "Other",
    icon: "ellipsis-horizontal-outline",
    color: Colors.neutral[400],
    keywords: [],
  },
];

/**
 * Maps an ingredient/item name to the best matching category.
 * Uses keyword matching with fallback to "Other".
 */
export function mapIngredientToCategory(name: string): Category {
  const lower = name.toLowerCase().trim();

  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        return category;
      }
    }
  }

  return CATEGORIES[CATEGORIES.length - 1]; // "Other"
}

/**
 * Returns all category names for use in pickers/selectors.
 */
export function getCategoryNames(): string[] {
  return CATEGORIES.map((c) => c.name);
}

/**
 * Finds a category by its ID.
 */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
