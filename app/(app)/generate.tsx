import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";
import { mapIngredientToCategory } from "../../data/categories";
import { estimatePrice } from "../../data/prices";
import { getHistoricalPrice } from "../../services/purchaseTracking";
import {
  searchRecipes,
  getRecipeDetails,
  type SpoonacularRecipe,
  type SpoonacularRecipeDetail,
} from "../../services/spoonacular";
import { useAuthStore } from "../../stores/authStore";
import { useListsStore } from "../../stores/listsStore";
import { usePantryStore } from "../../stores/pantryStore";
import { usePurchaseStore } from "../../stores/purchaseStore";

interface GenerateItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  checked: boolean;
  price: number;
}

type Screen = "search" | "results" | "detail" | "review";

export default function GenerateListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const createList = useListsStore((s) => s.createList);
  const updateList = useListsStore((s) => s.updateList);
  const pantryItems = usePantryStore((s) => s.items);
  const getFrequentItems = usePurchaseStore((s) => s.getFrequentItems);

  const [screen, setScreen] = useState<Screen>("search");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<SpoonacularRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<SpoonacularRecipeDetail | null>(null);
  const [listName, setListName] = useState("");
  const [groceryItems, setGroceryItems] = useState<GenerateItem[]>([]);

  const userProfile = {
    hasPurchaseHistory: true,
    dietaryPreferences: user?.dietaryPreferences || ["vegetarian", "gluten-free"],
    isProfileComplete: true,
  };

  const estimatePriceWithHistory = async (ingredient: string): Promise<number> => {
    const historicalPrice = await getHistoricalPrice(ingredient);
    if (historicalPrice) return historicalPrice;
    return estimatePrice(ingredient);
  };

  // ─── Search Recipes ───

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      const results = await searchRecipes(searchQuery.trim(), 8);
      if (results.length === 0) {
        Alert.alert("No Results", `No recipes found for "${searchQuery}". Try a different search term.`);
      } else {
        setRecipes(results);
        setScreen("results");
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search recipes. Check your API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Select Recipe → Fetch Details ───

  const handleSelectRecipe = async (recipe: SpoonacularRecipe) => {
    setIsLoading(true);
    try {
      const detail = await getRecipeDetails(recipe.id);
      setSelectedRecipe(detail);
      setScreen("detail");
    } catch (error) {
      console.error("Recipe detail error:", error);
      Alert.alert("Error", "Failed to load recipe details.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Convert Ingredients to Grocery List ───

  const handleGenerateFromRecipe = async () => {
    if (!selectedRecipe) return;
    setIsLoading(true);

    const items: GenerateItem[] = [];
    for (const ing of selectedRecipe.extendedIngredients) {
      const price = await estimatePriceWithHistory(ing.name);
      const cat = mapIngredientToCategory(ing.name);
      items.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: ing.name,
        quantity: Math.max(1, Math.round(ing.amount)),
        category: cat.name,
        checked: false,
        price,
      });
    }

    setGroceryItems(items);
    setListName(`${selectedRecipe.title} - Ingredients`);
    setIsLoading(false);
    setScreen("review");
  };

  // ─── Quick Generate (default list) ───

  const generateDefaultList = (): GenerateItem[] => [
    { id: "1", name: "Tomatoes", quantity: 4, category: "Produce", checked: false, price: 2.5 },
    { id: "2", name: "Spinach", quantity: 1, category: "Produce", checked: false, price: 3.5 },
    { id: "3", name: "Avocados", quantity: 3, category: "Produce", checked: false, price: 1.75 },
    { id: "4", name: "Bell Peppers", quantity: 3, category: "Produce", checked: false, price: 1.5 },
    { id: "5", name: "Onions", quantity: 2, category: "Produce", checked: false, price: 1.25 },
    { id: "6", name: "Chicken Breast", quantity: 2, category: "Meat & Seafood", checked: false, price: 4.5 },
    { id: "7", name: "Ground Beef", quantity: 1, category: "Meat & Seafood", checked: false, price: 6.0 },
    { id: "8", name: "Salmon", quantity: 1, category: "Meat & Seafood", checked: false, price: 10.0 },
    { id: "9", name: "Eggs", quantity: 1, category: "Dairy & Eggs", checked: false, price: 4.0 },
    { id: "10", name: "Milk", quantity: 1, category: "Dairy & Eggs", checked: false, price: 4.5 },
    { id: "11", name: "Cheddar Cheese", quantity: 1, category: "Dairy & Eggs", checked: false, price: 4.5 },
    { id: "12", name: "Greek Yogurt", quantity: 2, category: "Dairy & Eggs", checked: false, price: 1.25 },
    { id: "13", name: "Butter", quantity: 1, category: "Dairy & Eggs", checked: false, price: 5.0 },
    { id: "14", name: "Rice", quantity: 1, category: "Pantry & Dry Goods", checked: false, price: 3.5 },
    { id: "15", name: "Pasta", quantity: 2, category: "Pantry & Dry Goods", checked: false, price: 1.75 },
    { id: "16", name: "Bread", quantity: 1, category: "Bakery & Bread", checked: false, price: 3.5 },
    { id: "17", name: "Olive Oil", quantity: 1, category: "Pantry & Dry Goods", checked: false, price: 8.0 },
  ];

  const handleQuickGenerate = () => {
    setGroceryItems(generateDefaultList());
    setListName("AI Generated - Weekly Groceries");
    setScreen("review");
  };

  // ─── Review List Actions ───

  const handleToggleItem = (id: string) => {
    setGroceryItems(groceryItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleDeleteItem = (id: string) => {
    setGroceryItems(groceryItems.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    Alert.prompt("Add Item", "Enter item name:", (text) => {
      if (text) {
        const cat = mapIngredientToCategory(text);
        const price = estimatePrice(text, cat.id);
        setGroceryItems([
          ...groceryItems,
          {
            id: Date.now().toString(),
            name: text,
            quantity: 1,
            category: cat.name,
            checked: false,
            price,
          },
        ]);
      }
    });
  };

  const handleSaveList = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save lists");
      return;
    }

    try {
      const totalEstimate = groceryItems.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0
      );
      const budget = totalEstimate > 0 ? Math.ceil(totalEstimate * 1.1) : 100;
      const listId = await createList(user.uid, listName, budget);

      const now = new Date().toISOString();
      const items = groceryItems.map((gi) => {
        const cat = mapIngredientToCategory(gi.name);
        return {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: gi.name,
          quantity: gi.quantity,
          unit: "each",
          category: gi.category || cat.name,
          categoryId: cat.id,
          checked: false,
          price: gi.price || 0,
          note: "",
          addedAt: now,
        };
      });

      await updateList(listId, { items, totalEstimate } as any);

      Alert.alert("List Saved!", `"${listName}" has been saved to your grocery lists.`, [
        { text: "OK", onPress: () => router.push("/(app)/dashboard") },
      ]);
    } catch (error) {
      console.error("Error saving list:", error);
      Alert.alert("Error", "Failed to save list. Please try again.");
    }
  };

  // Check if an ingredient is already in the user's pantry
  const isInPantry = (ingredientName: string): boolean => {
    const lower = ingredientName.toLowerCase();
    return pantryItems.some(
      (p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
    );
  };

  // Get estimated price for an ingredient from purchase history or fallback
  const getIngredientPrice = (ingredientName: string): number => {
    const frequent = getFrequentItems(50);
    const match = frequent.find(
      (f) => f.name.toLowerCase() === ingredientName.toLowerCase() ||
             ingredientName.toLowerCase().includes(f.name.toLowerCase()) ||
             f.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
    if (match) return match.avgPrice;
    return estimatePrice(ingredientName);
  };

  // Recipe cost breakdown for detail screen
  const recipeCostBreakdown = selectedRecipe
    ? selectedRecipe.extendedIngredients.map((ing) => {
        const inPantry = isInPantry(ing.name);
        const price = getIngredientPrice(ing.name);
        return { ...ing, inPantry, estimatedPrice: price };
      })
    : [];

  const totalRecipeCost = recipeCostBreakdown.reduce((sum, ing) => sum + ing.estimatedPrice, 0);
  const needToBuyCost = recipeCostBreakdown
    .filter((ing) => !ing.inPantry)
    .reduce((sum, ing) => sum + ing.estimatedPrice, 0);
  const inPantryCount = recipeCostBreakdown.filter((ing) => ing.inPantry).length;

  const groupedItems = groceryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GenerateItem[]>);

  // ════════════════════════════════════════
  //  SCREEN 1: Search
  // ════════════════════════════════════════

  if (screen === "search") {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Gradient Hero */}
          <LinearGradient
            colors={Gradients.premiumDark}
            style={[styles.hero, { paddingTop: insets.top + Spacing.lg }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroGlow} />
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroContent}>
              <LinearGradient
                colors={Gradients.emeraldVibrant}
                style={styles.heroIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="sparkles" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.heroTitle}>AI Recipe Assistant</Text>
              <Text style={styles.heroText}>
                Find recipes with ingredients and estimated prices
              </Text>
            </Animated.View>
          </LinearGradient>

          <View style={styles.content}>
            {/* Quick Generate */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <Text style={styles.sectionTitle}>Quick Generate</Text>
              <TouchableOpacity
                style={[styles.smartListButton, Shadows.md]}
                onPress={handleQuickGenerate}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={Gradients.emeraldSoft}
                  style={styles.smartListIcon}
                >
                  <Ionicons name="sparkles" size={24} color={Colors.primary[600]} />
                </LinearGradient>
                <View style={styles.smartListInfo}>
                  <Text style={styles.smartListTitle}>Smart List</Text>
                  <Text style={styles.smartListDesc}>
                    Generated based on your preferences and history
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
              </TouchableOpacity>
            </Animated.View>

            {/* Recipe Search */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Text style={styles.orText}>Or search for a specific recipe</Text>

              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="e.g., Pasta Carbonara, Chicken Curry..."
                  placeholderTextColor={Colors.neutral[400]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  style={[styles.searchButton, !searchQuery && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={!searchQuery || isLoading}
                >
                  <LinearGradient
                    colors={searchQuery ? Gradients.ctaPrimary : [Colors.neutral[300], Colors.neutral[300]]}
                    style={styles.searchBtnGradient}
                  >
                    <Ionicons name="search" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Recipe Chips */}
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <Text style={styles.chipsLabel}>Try these:</Text>
              <View style={styles.chipsRow}>
                {["Pasta Carbonara", "Chicken Curry", "Beef Tacos", "Caesar Salad"].map((recipe, i) => (
                  <Animated.View key={recipe} entering={FadeInRight.delay(450 + i * 60).duration(400)}>
                    <TouchableOpacity
                      style={styles.chip}
                      onPress={() => {
                        setSearchQuery(recipe);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="restaurant-outline" size={14} color={Colors.primary[600]} />
                      <Text style={styles.chipText}>{recipe}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Loading */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary[600]} />
                <Text style={styles.loadingText}>Searching recipes...</Text>
              </View>
            )}

            {/* Dietary Preferences */}
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.dietaryCard, Shadows.sm]}>
              <View style={styles.dietaryHeader}>
                <Ionicons name="leaf-outline" size={18} color={Colors.primary[600]} />
                <Text style={styles.dietaryTitle}>Your Dietary Preferences</Text>
              </View>
              <View style={styles.dietaryTags}>
                {userProfile.dietaryPreferences.map((pref, index) => (
                  <View key={index} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{pref}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
      </TouchableWithoutFeedback>
    );
  }

  // ════════════════════════════════════════
  //  SCREEN 2: Recipe Results
  // ════════════════════════════════════════

  if (screen === "results") {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Gradients.premiumDark}
          style={[styles.reviewHeader, { paddingTop: insets.top + Spacing.sm }]}
        >
          <View style={styles.reviewHeaderRow}>
            <TouchableOpacity onPress={() => setScreen("search")} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.reviewHeaderTitle}>Recipes</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <View style={styles.resultsSubheader}>
          <Text style={styles.resultsCount}>
            {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} found for "{searchQuery}"
          </Text>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
            <Text style={styles.loadingText}>Loading recipe...</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.recipesGrid}>
            {recipes.map((recipe, index) => (
              <Animated.View
                key={recipe.id}
                entering={FadeInDown.delay(index * 80).duration(500)}
              >
                <TouchableOpacity
                  style={[styles.recipeCard, Shadows.md]}
                  onPress={() => handleSelectRecipe(recipe)}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recipeCardBody}>
                    <Text style={styles.recipeCardTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <View style={styles.recipeCardMeta}>
                      {recipe.readyInMinutes > 0 && (
                        <View style={styles.recipeMetaChip}>
                          <Ionicons name="time-outline" size={13} color={Colors.primary[600]} />
                          <Text style={styles.recipeMetaText}>{recipe.readyInMinutes} min</Text>
                        </View>
                      )}
                      {recipe.servings > 0 && (
                        <View style={styles.recipeMetaChip}>
                          <Ionicons name="people-outline" size={13} color={Colors.primary[600]} />
                          <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ════════════════════════════════════════
  //  SCREEN 3: Recipe Detail
  // ════════════════════════════════════════

  if (screen === "detail" && selectedRecipe) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>
          {/* Recipe Image Header */}
          <View>
            <Image
              source={{ uri: selectedRecipe.image }}
              style={styles.detailImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.detailImageOverlay}
            />
            <TouchableOpacity
              onPress={() => setScreen("results")}
              style={[styles.detailBackBtn, { top: insets.top + Spacing.sm }]}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.detailTitleWrap}>
              <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>
              <View style={styles.detailMeta}>
                {selectedRecipe.readyInMinutes > 0 && (
                  <View style={styles.detailMetaChip}>
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text style={styles.detailMetaText}>{selectedRecipe.readyInMinutes} min</Text>
                  </View>
                )}
                {selectedRecipe.servings > 0 && (
                  <View style={styles.detailMetaChip}>
                    <Ionicons name="people-outline" size={14} color="#fff" />
                    <Text style={styles.detailMetaText}>{selectedRecipe.servings} servings</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Cost Summary */}
          <View style={styles.detailContent}>
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <View style={[styles.costSummaryCard, Shadows.md]}>
                <View style={styles.costRow}>
                  <View style={styles.costItem}>
                    <Text style={styles.costValue}>${totalRecipeCost.toFixed(2)}</Text>
                    <Text style={styles.costLabel}>Total Cost</Text>
                  </View>
                  <View style={styles.costDivider} />
                  <View style={styles.costItem}>
                    <Text style={[styles.costValue, { color: Colors.primary[600] }]}>
                      ${needToBuyCost.toFixed(2)}
                    </Text>
                    <Text style={styles.costLabel}>Need to Buy</Text>
                  </View>
                  <View style={styles.costDivider} />
                  <View style={styles.costItem}>
                    <Text style={[styles.costValue, { color: Colors.teal[600] }]}>
                      {inPantryCount}
                    </Text>
                    <Text style={styles.costLabel}>In Pantry</Text>
                  </View>
                </View>
                {inPantryCount > 0 && (
                  <View style={styles.costSavings}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary[600]} />
                    <Text style={styles.costSavingsText}>
                      You save ${(totalRecipeCost - needToBuyCost).toFixed(2)} with items you already have!
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Ingredients */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <View style={styles.detailSectionHeader}>
                <Ionicons name="list-outline" size={20} color={Colors.primary[600]} />
                <Text style={styles.detailSectionTitle}>
                  Ingredients ({selectedRecipe.extendedIngredients.length})
                </Text>
              </View>

              {recipeCostBreakdown.map((ing, index) => (
                <Animated.View
                  key={`${ing.name}-${index}`}
                  entering={FadeInDown.delay(250 + index * 30).duration(400)}
                  style={[styles.ingredientRow, Shadows.sm, ing.inPantry && styles.ingredientRowInPantry]}
                >
                  <View style={[
                    styles.ingredientDot,
                    ing.inPantry && { backgroundColor: Colors.teal[500] }
                  ]} />
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <Text style={styles.ingredientAmount}>
                      {ing.amount > 0 ? `${ing.amount} ${ing.unit}` : "to taste"}
                    </Text>
                  </View>
                  <View style={styles.ingredientRight}>
                    <Text style={styles.ingredientPrice}>
                      ${ing.estimatedPrice.toFixed(2)}
                    </Text>
                    {ing.inPantry ? (
                      <View style={styles.inPantryBadge}>
                        <Ionicons name="checkmark" size={10} color={Colors.teal[600]} />
                        <Text style={styles.inPantryText}>In Pantry</Text>
                      </View>
                    ) : ing.aisle ? (
                      <View style={styles.aisleBadge}>
                        <Text style={styles.aisleText} numberOfLines={1}>{ing.aisle}</Text>
                      </View>
                    ) : null}
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.detailFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={handleGenerateFromRecipe}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <LinearGradient colors={Gradients.ctaPrimary} style={styles.generateBtnGradient}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart" size={22} color="#fff" />
                  <Text style={styles.generateBtnText}>Add to Grocery List</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ════════════════════════════════════════
  //  SCREEN 4: Review List
  // ════════════════════════════════════════

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.reviewHeader, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.reviewHeaderRow}>
          <TouchableOpacity onPress={() => setScreen(selectedRecipe ? "detail" : "search")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.reviewHeaderTitle}>Review List</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={styles.listHeader}>
          <TextInput
            style={styles.listNameInput}
            value={listName}
            onChangeText={setListName}
            placeholder="List Name"
            placeholderTextColor={Colors.neutral[400]}
          />
          <View style={styles.listMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="cart-outline" size={14} color={Colors.primary[600]} />
              <Text style={styles.metaChipText}>{groceryItems.length} items</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="cash-outline" size={14} color={Colors.primary[700]} />
              <Text style={[styles.metaChipText, { color: Colors.primary[700] }]}>
                Est. ${groceryItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {Object.keys(groupedItems).map((category, catIndex) => (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(catIndex * 80).duration(500)}
              style={styles.categorySection}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category}</Text>
                </View>
                <Text style={styles.categorySub}>
                  {groupedItems[category].length} item{groupedItems[category].length !== 1 ? "s" : ""}
                </Text>
              </View>
              {groupedItems[category].map((item) => (
                <View key={item.id} style={[styles.itemRow, Shadows.sm]}>
                  <TouchableOpacity onPress={() => handleToggleItem(item.id)} style={styles.itemLeft}>
                    <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                      {item.checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemDetails}>
                        Qty: {item.quantity} · ${(item.price || 0).toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={22} color={Colors.primary[600]} />
          <Text style={styles.addItemText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveList} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.ctaPrimary} style={styles.saveGradient}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Save List</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // Hero
  hero: {
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary[600],
    opacity: 0.12,
    top: -40,
    right: -50,
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  heroIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.primary[500]),
  },
  heroTitle: {
    ...Typography.h2,
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  heroText: {
    ...Typography.bodySm,
    color: Colors.neutral[400],
    textAlign: "center",
    lineHeight: 18,
  },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  smartListButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  smartListIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  smartListInfo: {
    flex: 1,
  },
  smartListTitle: {
    ...Typography.labelLg,
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  smartListDesc: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
  },
  orText: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMd,
    backgroundColor: Colors.neutral[0],
    color: Colors.neutral[800],
    height: 46,
  },
  searchButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchBtnGradient: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
  },
  chipsLabel: {
    ...Typography.labelSm,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.sm,
  },
  chipText: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: Spacing["3xl"],
  },
  loadingText: {
    marginTop: Spacing.lg,
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  dietaryCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  dietaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dietaryTitle: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
  },
  dietaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dietaryTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  dietaryTagText: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },

  // ─── Recipe Results ───

  resultsSubheader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultsCount: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  recipesGrid: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  recipeCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  recipeImage: {
    width: "100%",
    height: 180,
  },
  recipeCardBody: {
    padding: Spacing.lg,
  },
  recipeCardTitle: {
    ...Typography.labelLg,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  recipeCardMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  recipeMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  recipeMetaText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },

  // ─── Recipe Detail ───

  detailImage: {
    width: "100%",
    height: 280,
  },
  detailImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  detailBackBtn: {
    position: "absolute",
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTitleWrap: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  detailTitle: {
    ...Typography.h1,
    color: "#fff",
    marginBottom: Spacing.sm,
  },
  detailMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  detailMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  detailMetaText: {
    ...Typography.caption,
    color: "#fff",
  },
  detailContent: {
    padding: Spacing.lg,
  },
  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  detailSectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  // Cost Summary
  costSummaryCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  costItem: {
    flex: 1,
    alignItems: "center",
  },
  costValue: {
    ...Typography.h2,
    color: Colors.neutral[900],
  },
  costLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  costDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.neutral[200],
  },
  costSavings: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  costSavingsText: {
    ...Typography.caption,
    color: Colors.primary[700],
    fontWeight: "600",
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  ingredientRowInPantry: {
    backgroundColor: Colors.teal[50],
    borderWidth: 1,
    borderColor: Colors.teal[200],
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
    marginRight: Spacing.md,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    ...Typography.bodyLg,
    color: Colors.neutral[800],
    textTransform: "capitalize",
  },
  ingredientAmount: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  ingredientRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  ingredientPrice: {
    ...Typography.labelSm,
    color: Colors.neutral[700],
  },
  inPantryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.teal[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  inPantryText: {
    ...Typography.caption,
    color: Colors.teal[600],
    fontWeight: "600",
  },
  aisleBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: 120,
  },
  aisleText: {
    ...Typography.caption,
    color: Colors.primary[600],
  },
  detailFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral[0],
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  generateBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.glow(Colors.primary[600]),
  },
  generateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  generateBtnText: {
    ...Typography.labelLg,
    color: "#fff",
  },

  // ─── Review List ───

  reviewHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewHeaderTitle: {
    ...Typography.h2,
    color: "#fff",
  },
  listHeader: {
    backgroundColor: Colors.neutral[0],
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  listNameInput: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
  },
  listMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  metaChipText: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
  },
  itemsContainer: {
    flex: 1,
  },
  categorySection: {
    padding: Spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    ...Typography.labelSm,
    color: Colors.primary[700],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categorySub: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  itemInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  itemName: {
    ...Typography.bodyLg,
    color: Colors.neutral[800],
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: Colors.neutral[400],
  },
  itemDetails: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 0,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  addItemButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
  },
  addItemText: {
    ...Typography.labelLg,
    color: Colors.primary[600],
  },
  saveButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.glow(Colors.primary[600]),
  },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  saveButtonText: {
    ...Typography.labelLg,
    color: "#fff",
  },
});
