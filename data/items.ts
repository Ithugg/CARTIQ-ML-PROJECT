/**
 * Common grocery items for autocomplete suggestions.
 * Organized by category for efficient lookup.
 */

export interface ItemSuggestion {
  name: string;
  category: string;
  defaultUnit?: string;
}

export const COMMON_ITEMS: ItemSuggestion[] = [
  // Produce - Fruits
  { name: "Apples", category: "Produce", defaultUnit: "lb" },
  { name: "Bananas", category: "Produce", defaultUnit: "bunch" },
  { name: "Oranges", category: "Produce", defaultUnit: "each" },
  { name: "Grapes", category: "Produce", defaultUnit: "lb" },
  { name: "Strawberries", category: "Produce", defaultUnit: "16oz" },
  { name: "Blueberries", category: "Produce", defaultUnit: "6oz" },
  { name: "Raspberries", category: "Produce", defaultUnit: "6oz" },
  { name: "Lemons", category: "Produce", defaultUnit: "each" },
  { name: "Limes", category: "Produce", defaultUnit: "each" },
  { name: "Avocados", category: "Produce", defaultUnit: "each" },
  { name: "Mangoes", category: "Produce", defaultUnit: "each" },
  { name: "Pineapple", category: "Produce", defaultUnit: "each" },
  { name: "Watermelon", category: "Produce", defaultUnit: "each" },
  { name: "Peaches", category: "Produce", defaultUnit: "lb" },
  { name: "Pears", category: "Produce", defaultUnit: "lb" },
  { name: "Cherries", category: "Produce", defaultUnit: "lb" },
  { name: "Kiwi", category: "Produce", defaultUnit: "each" },
  { name: "Coconut", category: "Produce", defaultUnit: "each" },
  // Produce - Vegetables
  { name: "Tomatoes", category: "Produce", defaultUnit: "lb" },
  { name: "Potatoes", category: "Produce", defaultUnit: "lb" },
  { name: "Sweet Potatoes", category: "Produce", defaultUnit: "lb" },
  { name: "Onions", category: "Produce", defaultUnit: "lb" },
  { name: "Red Onion", category: "Produce", defaultUnit: "each" },
  { name: "Garlic", category: "Produce", defaultUnit: "head" },
  { name: "Ginger", category: "Produce", defaultUnit: "piece" },
  { name: "Carrots", category: "Produce", defaultUnit: "lb" },
  { name: "Celery", category: "Produce", defaultUnit: "bunch" },
  { name: "Broccoli", category: "Produce", defaultUnit: "bunch" },
  { name: "Cauliflower", category: "Produce", defaultUnit: "head" },
  { name: "Spinach", category: "Produce", defaultUnit: "bag" },
  { name: "Lettuce", category: "Produce", defaultUnit: "head" },
  { name: "Romaine Lettuce", category: "Produce", defaultUnit: "heart" },
  { name: "Kale", category: "Produce", defaultUnit: "bunch" },
  { name: "Cucumber", category: "Produce", defaultUnit: "each" },
  { name: "Bell Peppers", category: "Produce", defaultUnit: "each" },
  { name: "Jalapenos", category: "Produce", defaultUnit: "each" },
  { name: "Zucchini", category: "Produce", defaultUnit: "each" },
  { name: "Squash", category: "Produce", defaultUnit: "lb" },
  { name: "Corn on the Cob", category: "Produce", defaultUnit: "ear" },
  { name: "Mushrooms", category: "Produce", defaultUnit: "8oz" },
  { name: "Green Beans", category: "Produce", defaultUnit: "lb" },
  { name: "Asparagus", category: "Produce", defaultUnit: "bunch" },
  { name: "Cabbage", category: "Produce", defaultUnit: "head" },
  { name: "Brussels Sprouts", category: "Produce", defaultUnit: "lb" },
  // Produce - Herbs
  { name: "Cilantro", category: "Produce", defaultUnit: "bunch" },
  { name: "Parsley", category: "Produce", defaultUnit: "bunch" },
  { name: "Basil", category: "Produce", defaultUnit: "bunch" },
  { name: "Mint", category: "Produce", defaultUnit: "bunch" },
  { name: "Rosemary", category: "Produce", defaultUnit: "sprig" },
  { name: "Thyme", category: "Produce", defaultUnit: "sprig" },

  // Dairy & Eggs
  { name: "Milk", category: "Dairy & Eggs", defaultUnit: "gallon" },
  { name: "2% Milk", category: "Dairy & Eggs", defaultUnit: "gallon" },
  { name: "Whole Milk", category: "Dairy & Eggs", defaultUnit: "gallon" },
  { name: "Oat Milk", category: "Dairy & Eggs", defaultUnit: "half gallon" },
  { name: "Almond Milk", category: "Dairy & Eggs", defaultUnit: "half gallon" },
  { name: "Eggs", category: "Dairy & Eggs", defaultUnit: "dozen" },
  { name: "Butter", category: "Dairy & Eggs", defaultUnit: "lb" },
  { name: "Cheddar Cheese", category: "Dairy & Eggs", defaultUnit: "8oz" },
  { name: "Mozzarella", category: "Dairy & Eggs", defaultUnit: "8oz" },
  { name: "Parmesan", category: "Dairy & Eggs", defaultUnit: "8oz" },
  { name: "Cream Cheese", category: "Dairy & Eggs", defaultUnit: "8oz" },
  { name: "Sour Cream", category: "Dairy & Eggs", defaultUnit: "16oz" },
  { name: "Greek Yogurt", category: "Dairy & Eggs", defaultUnit: "32oz" },
  { name: "Yogurt", category: "Dairy & Eggs", defaultUnit: "6oz" },
  { name: "Heavy Cream", category: "Dairy & Eggs", defaultUnit: "16oz" },
  { name: "Half and Half", category: "Dairy & Eggs", defaultUnit: "16oz" },
  { name: "Cottage Cheese", category: "Dairy & Eggs", defaultUnit: "16oz" },
  { name: "Feta Cheese", category: "Dairy & Eggs", defaultUnit: "6oz" },
  { name: "Ricotta", category: "Dairy & Eggs", defaultUnit: "15oz" },
  { name: "Shredded Cheese", category: "Dairy & Eggs", defaultUnit: "8oz" },

  // Meat & Seafood
  { name: "Chicken Breast", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Chicken Thighs", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Whole Chicken", category: "Meat & Seafood", defaultUnit: "each" },
  { name: "Ground Beef", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Ground Turkey", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Steak", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Pork Chops", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Bacon", category: "Meat & Seafood", defaultUnit: "12oz" },
  { name: "Sausage", category: "Meat & Seafood", defaultUnit: "14oz" },
  { name: "Ham", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Hot Dogs", category: "Meat & Seafood", defaultUnit: "8ct" },
  { name: "Salmon", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Shrimp", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Tuna Steaks", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Tilapia", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Cod", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Deli Turkey", category: "Meat & Seafood", defaultUnit: "lb" },
  { name: "Deli Ham", category: "Meat & Seafood", defaultUnit: "lb" },

  // Bakery
  { name: "Bread", category: "Bakery & Bread", defaultUnit: "loaf" },
  { name: "Whole Wheat Bread", category: "Bakery & Bread", defaultUnit: "loaf" },
  { name: "Bagels", category: "Bakery & Bread", defaultUnit: "6ct" },
  { name: "English Muffins", category: "Bakery & Bread", defaultUnit: "6ct" },
  { name: "Tortillas", category: "Bakery & Bread", defaultUnit: "10ct" },
  { name: "Pita Bread", category: "Bakery & Bread", defaultUnit: "6ct" },
  { name: "Hamburger Buns", category: "Bakery & Bread", defaultUnit: "8ct" },
  { name: "Hot Dog Buns", category: "Bakery & Bread", defaultUnit: "8ct" },
  { name: "Croissants", category: "Bakery & Bread", defaultUnit: "4ct" },
  { name: "Dinner Rolls", category: "Bakery & Bread", defaultUnit: "12ct" },

  // Pantry
  { name: "Rice", category: "Pantry & Dry Goods", defaultUnit: "2lb" },
  { name: "Brown Rice", category: "Pantry & Dry Goods", defaultUnit: "2lb" },
  { name: "Pasta", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Spaghetti", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Penne", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Macaroni", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Olive Oil", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Vegetable Oil", category: "Pantry & Dry Goods", defaultUnit: "48oz" },
  { name: "All-Purpose Flour", category: "Pantry & Dry Goods", defaultUnit: "5lb" },
  { name: "Sugar", category: "Pantry & Dry Goods", defaultUnit: "4lb" },
  { name: "Brown Sugar", category: "Pantry & Dry Goods", defaultUnit: "2lb" },
  { name: "Salt", category: "Pantry & Dry Goods", defaultUnit: "26oz" },
  { name: "Black Pepper", category: "Pantry & Dry Goods", defaultUnit: "3oz" },
  { name: "Canned Tomatoes", category: "Pantry & Dry Goods", defaultUnit: "28oz" },
  { name: "Tomato Sauce", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Tomato Paste", category: "Pantry & Dry Goods", defaultUnit: "6oz" },
  { name: "Chicken Broth", category: "Pantry & Dry Goods", defaultUnit: "32oz" },
  { name: "Soy Sauce", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Ketchup", category: "Pantry & Dry Goods", defaultUnit: "20oz" },
  { name: "Mustard", category: "Pantry & Dry Goods", defaultUnit: "8oz" },
  { name: "Mayonnaise", category: "Pantry & Dry Goods", defaultUnit: "30oz" },
  { name: "Hot Sauce", category: "Pantry & Dry Goods", defaultUnit: "5oz" },
  { name: "Salsa", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Peanut Butter", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Honey", category: "Pantry & Dry Goods", defaultUnit: "12oz" },
  { name: "Maple Syrup", category: "Pantry & Dry Goods", defaultUnit: "12oz" },
  { name: "Jam", category: "Pantry & Dry Goods", defaultUnit: "18oz" },
  { name: "Cereal", category: "Pantry & Dry Goods", defaultUnit: "box" },
  { name: "Oatmeal", category: "Pantry & Dry Goods", defaultUnit: "42oz" },
  { name: "Granola", category: "Pantry & Dry Goods", defaultUnit: "12oz" },
  { name: "Canned Beans", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Black Beans", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Chickpeas", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Lentils", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Quinoa", category: "Pantry & Dry Goods", defaultUnit: "12oz" },
  { name: "Canned Tuna", category: "Pantry & Dry Goods", defaultUnit: "5oz" },
  { name: "Baking Powder", category: "Pantry & Dry Goods", defaultUnit: "8oz" },
  { name: "Baking Soda", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Vanilla Extract", category: "Pantry & Dry Goods", defaultUnit: "2oz" },
  { name: "Chocolate Chips", category: "Pantry & Dry Goods", defaultUnit: "12oz" },
  { name: "Vinegar", category: "Pantry & Dry Goods", defaultUnit: "16oz" },
  { name: "Breadcrumbs", category: "Pantry & Dry Goods", defaultUnit: "15oz" },
  { name: "Cornstarch", category: "Pantry & Dry Goods", defaultUnit: "16oz" },

  // Snacks
  { name: "Potato Chips", category: "Snacks", defaultUnit: "bag" },
  { name: "Tortilla Chips", category: "Snacks", defaultUnit: "bag" },
  { name: "Pretzels", category: "Snacks", defaultUnit: "bag" },
  { name: "Popcorn", category: "Snacks", defaultUnit: "bag" },
  { name: "Mixed Nuts", category: "Snacks", defaultUnit: "8oz" },
  { name: "Almonds", category: "Snacks", defaultUnit: "8oz" },
  { name: "Trail Mix", category: "Snacks", defaultUnit: "8oz" },
  { name: "Granola Bars", category: "Snacks", defaultUnit: "6ct" },
  { name: "Protein Bars", category: "Snacks", defaultUnit: "4ct" },
  { name: "Crackers", category: "Snacks", defaultUnit: "box" },
  { name: "Dried Fruit", category: "Snacks", defaultUnit: "6oz" },
  { name: "Dark Chocolate", category: "Snacks", defaultUnit: "bar" },

  // Frozen
  { name: "Frozen Pizza", category: "Frozen", defaultUnit: "each" },
  { name: "Ice Cream", category: "Frozen", defaultUnit: "pint" },
  { name: "Frozen Vegetables", category: "Frozen", defaultUnit: "16oz" },
  { name: "Frozen Fruit", category: "Frozen", defaultUnit: "16oz" },
  { name: "Frozen Fries", category: "Frozen", defaultUnit: "32oz" },
  { name: "Frozen Waffles", category: "Frozen", defaultUnit: "10ct" },
  { name: "Frozen Burritos", category: "Frozen", defaultUnit: "each" },
  { name: "Frozen Chicken Nuggets", category: "Frozen", defaultUnit: "24oz" },

  // Beverages
  { name: "Coffee", category: "Beverages", defaultUnit: "12oz" },
  { name: "Tea Bags", category: "Beverages", defaultUnit: "20ct" },
  { name: "Orange Juice", category: "Beverages", defaultUnit: "64oz" },
  { name: "Apple Juice", category: "Beverages", defaultUnit: "64oz" },
  { name: "Sparkling Water", category: "Beverages", defaultUnit: "12pk" },
  { name: "Bottled Water", category: "Beverages", defaultUnit: "24pk" },
  { name: "Soda", category: "Beverages", defaultUnit: "12pk" },
  { name: "Lemonade", category: "Beverages", defaultUnit: "64oz" },

  // Household
  { name: "Paper Towels", category: "Household", defaultUnit: "6ct" },
  { name: "Toilet Paper", category: "Household", defaultUnit: "12ct" },
  { name: "Trash Bags", category: "Household", defaultUnit: "40ct" },
  { name: "Dish Soap", category: "Household", defaultUnit: "16oz" },
  { name: "Laundry Detergent", category: "Household", defaultUnit: "50oz" },
  { name: "Aluminum Foil", category: "Household", defaultUnit: "roll" },
  { name: "Plastic Wrap", category: "Household", defaultUnit: "roll" },
  { name: "Ziplock Bags", category: "Household", defaultUnit: "box" },
  { name: "Sponges", category: "Household", defaultUnit: "3ct" },
  { name: "All-Purpose Cleaner", category: "Household", defaultUnit: "32oz" },

  // Personal Care
  { name: "Shampoo", category: "Personal Care", defaultUnit: "12oz" },
  { name: "Conditioner", category: "Personal Care", defaultUnit: "12oz" },
  { name: "Body Wash", category: "Personal Care", defaultUnit: "16oz" },
  { name: "Toothpaste", category: "Personal Care", defaultUnit: "tube" },
  { name: "Toothbrush", category: "Personal Care", defaultUnit: "each" },
  { name: "Deodorant", category: "Personal Care", defaultUnit: "each" },
  { name: "Hand Soap", category: "Personal Care", defaultUnit: "8oz" },
  { name: "Lotion", category: "Personal Care", defaultUnit: "16oz" },
  { name: "Sunscreen", category: "Personal Care", defaultUnit: "6oz" },
  { name: "Band-Aids", category: "Personal Care", defaultUnit: "box" },
  { name: "Ibuprofen", category: "Personal Care", defaultUnit: "bottle" },
  { name: "Vitamins", category: "Personal Care", defaultUnit: "bottle" },
];

/**
 * Search items by name prefix for autocomplete.
 * Returns top N matches sorted by relevance.
 */
export function searchItems(query: string, limit = 10): ItemSuggestion[] {
  if (!query || query.length < 2) return [];

  const lower = query.toLowerCase().trim();
  const results: { item: ItemSuggestion; score: number }[] = [];

  for (const item of COMMON_ITEMS) {
    const name = item.name.toLowerCase();
    if (name.startsWith(lower)) {
      results.push({ item, score: 0 }); // exact prefix = highest priority
    } else if (name.includes(lower)) {
      results.push({ item, score: 1 }); // contains = second priority
    }
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, limit).map((r) => r.item);
}

/**
 * Get all items in a given category.
 */
export function getItemsByCategory(category: string): ItemSuggestion[] {
  return COMMON_ITEMS.filter((item) => item.category === category);
}
