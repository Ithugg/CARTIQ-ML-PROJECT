import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeInDown, FadeInRight, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useListsStore } from "../../stores/listsStore";
import { usePantryStore } from "../../stores/pantryStore";
import { usePurchaseStore } from "../../stores/purchaseStore";
import type { GroceryItem } from "../../types";

export default function ListDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const user = useAuthStore((s) => s.user);
  const getList = useListsStore((s) => s.getList);
  const toggleItem = useListsStore((s) => s.toggleItem);
  const removeItem = useListsStore((s) => s.removeItem);
  const deleteList = useListsStore((s) => s.deleteList);
  const recordPurchases = usePurchaseStore((s) => s.recordPurchases);
  const addToPantry = usePantryStore((s) => s.addFromPurchases);

  const list = getList(listId || "");

  if (!list) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={Gradients.premiumDark} style={styles.notFoundHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.notFoundHeaderTitle}>List Not Found</Text>
          <View style={{ width: 28 }} />
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={56} color={Colors.neutral[300]} />
          </View>
          <Text style={styles.emptyText}>This list could not be found</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <LinearGradient colors={Gradients.ctaPrimary} style={styles.goBackGradient}>
              <Text style={styles.goBackBtnText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const groupedItems = list.items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalEstimatedCost = list.items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
  const checkedCount = list.items.filter((i) => i.checked).length;
  const checkedItemsCost = list.items
    .filter((i) => i.checked)
    .reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  const budgetRemaining = list.budget - totalEstimatedCost;
  const budgetPct = list.budget > 0 ? Math.min((totalEstimatedCost / list.budget) * 100, 100) : 0;
  const progress = list.items.length > 0 ? checkedCount / list.items.length : 0;

  const handleToggleItem = useCallback(async (itemId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleItem(list.id, itemId);
  }, [list.id, toggleItem]);

  const handleDeleteItem = (itemId: string, itemName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Delete Item", `Remove "${itemName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          removeItem(list.id, itemId);
        },
      },
    ]);
  };

  const handleSwipeDelete = useCallback((itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeItem(list.id, itemId);
  }, [list.id, removeItem]);

  const renderSwipeRight = (_progress: any, _dragX: any) => (
    <View style={styles.swipeDeleteBg}>
      <Ionicons name="trash" size={22} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </View>
  );

  const handleCompleteShopping = async () => {
    const checkedItems = list.items.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("No Items Checked", "Check off items as you shop to track them.");
      return;
    }

    try {
      if (user) {
        await recordPurchases(user.uid, list.id, list.name, checkedItems);
        // Auto-add purchased items to pantry with expiration tracking
        const purchaseRecords = checkedItems.map((item) => ({
          id: item.id,
          itemName: item.name,
          category: item.category,
          categoryId: item.categoryId,
          price: item.price,
          quantity: item.quantity,
          purchasedAt: new Date().toISOString(),
          listId: list.id,
          listName: list.name,
          userId: user.uid,
        }));
        await addToPantry(user.uid, purchaseRecords);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Shopping Complete!",
        `Saved ${checkedItems.length} items to your purchase history and pantry. This improves future predictions!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving purchases:", error);
      Alert.alert("Error", "Failed to save purchase data.");
    }
  };

  const handleDeleteList = () => {
    Alert.alert("Delete List", `Delete "${list.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteList(list.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Glow orb */}
        <View style={styles.glowOrb} />

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {list.name}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleDeleteList} style={styles.headerAction}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger[500]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(app)/additem", params: { listId: list.id } })}
              style={styles.headerActionAdd}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress ring section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.progressSection}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.progressLabel}>done</Text>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{list.items.length}</Text>
              <Text style={styles.headerStatLabel}>Items</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{checkedCount}</Text>
              <Text style={styles.headerStatLabel}>Checked</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatValue, { color: Colors.primary[400] }]}>
                ${checkedItemsCost.toFixed(0)}
              </Text>
              <Text style={styles.headerStatLabel}>In Cart</Text>
            </View>
          </View>
        </Animated.View>

        {/* Full-width progress bar */}
        <View style={styles.headerProgressBg}>
          <Animated.View
            entering={FadeInRight.delay(300).duration(600)}
            style={[
              styles.headerProgressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: progress === 1 ? Colors.primary[400] : Colors.primary[500],
              },
            ]}
          />
        </View>
      </LinearGradient>

      {/* Budget Card */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.budgetCard}>
        <View style={styles.budgetInfo}>
          <View>
            <Text style={styles.budgetLabel}>Estimated Total</Text>
            <Text style={styles.budgetValue}>${totalEstimatedCost.toFixed(2)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.budgetLabel}>
              {budgetRemaining >= 0 ? "Remaining" : "Over Budget"}
            </Text>
            <Text
              style={[
                styles.budgetValue,
                { color: budgetRemaining >= 0 ? Colors.primary[600] : Colors.danger[600] },
              ]}
            >
              ${Math.abs(budgetRemaining).toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.budgetProgressBg}>
          <View
            style={[
              styles.budgetProgressFill,
              {
                width: `${budgetPct}%`,
                backgroundColor: budgetPct > 90 ? Colors.danger[500] : budgetPct > 70 ? Colors.warning[500] : Colors.primary[500],
              },
            ]}
          />
        </View>
        <Text style={styles.budgetPctText}>
          {budgetPct.toFixed(0)}% of ${list.budget.toFixed(0)} budget
        </Text>
      </Animated.View>

      {/* Items */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {list.items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cart-outline" size={56} color={Colors.neutral[300]} />
            </View>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySubtext}>Add items to start shopping</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/(app)/additem", params: { listId: list.id } })
              }
            >
              <LinearGradient colors={Gradients.ctaPrimary} style={styles.addFirstBtn}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addFirstBtnText}>Add First Item</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedItems).map(([category, items], catIndex) => (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(300 + catIndex * 80).duration(500)}
              style={styles.categorySection}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{category}</Text>
                </View>
                <Text style={styles.categorySub}>
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </Text>
              </View>
              {items.map((item, itemIndex) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInRight.delay(350 + catIndex * 80 + itemIndex * 50).duration(400)}
                  exiting={FadeOut.duration(200)}
                >
                  <Swipeable
                    renderRightActions={renderSwipeRight}
                    onSwipeableOpen={() => handleSwipeDelete(item.id)}
                    overshootRight={false}
                  >
                    <View style={[styles.itemRow, Shadows.sm]}>
                      <TouchableOpacity
                        onPress={() => handleToggleItem(item.id)}
                        style={styles.itemLeft}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          item.checked && styles.checkboxChecked,
                        ]}>
                          {item.checked && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                        <View style={styles.itemInfo}>
                          <Text
                            style={[styles.itemName, item.checked && styles.itemNameChecked]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemDetailText}>
                              Qty: {item.quantity}
                            </Text>
                            {item.price > 0 && (
                              <>
                                <Text style={styles.itemDot}> · </Text>
                                <Text style={styles.itemDetailText}>
                                  ${item.price.toFixed(2)} ea
                                </Text>
                                <Text style={styles.itemDot}> · </Text>
                                <Text style={styles.itemTotalText}>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id, item.name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.danger[500]} />
                      </TouchableOpacity>
                    </View>
                  </Swipeable>
                </Animated.View>
              ))}
            </Animated.View>
          ))
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom actions */}
      {list.items.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleCompleteShopping}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.ctaPrimary} style={styles.completeBtnGradient}>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.completeBtnText}>Complete Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addItemBtn}
            onPress={() =>
              router.push({ pathname: "/(app)/additem", params: { listId: list.id } })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={Colors.primary[600]} />
            <Text style={styles.addItemBtnText}>Add Item</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // Gradient Header
  header: {
    paddingBottom: 0,
    position: "relative",
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary[600],
    opacity: 0.1,
    top: -60,
    right: -40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    ...Typography.h2,
    color: "#fff",
    marginHorizontal: Spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionAdd: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.xl,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  progressPct: {
    ...Typography.labelLg,
    color: Colors.primary[400],
    marginBottom: -2,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  headerStats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  headerStat: {
    alignItems: "center",
  },
  headerStatValue: {
    ...Typography.h3,
    color: "#fff",
  },
  headerStatLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerProgressBg: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerProgressFill: {
    height: 3,
  },

  // Not Found Header
  notFoundHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
  },
  notFoundHeaderTitle: {
    ...Typography.h2,
    color: "#fff",
  },

  // Budget Card
  budgetCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  budgetLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  budgetValue: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  budgetProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral[100],
    overflow: "hidden",
  },
  budgetProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  budgetPctText: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textAlign: "center",
    marginTop: Spacing.sm,
  },

  // Content
  content: {
    flex: 1,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    marginBottom: Spacing.xl,
  },
  addFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addFirstBtnText: {
    ...Typography.labelMd,
    color: "#fff",
  },
  goBackBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  goBackGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  goBackBtnText: {
    ...Typography.labelMd,
    color: "#fff",
  },

  // Categories & Items
  categorySection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  itemDetailText: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
  },
  itemDot: {
    color: Colors.neutral[300],
  },
  itemTotalText: {
    ...Typography.labelSm,
    color: Colors.primary[600],
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.danger[50],
    justifyContent: "center",
    alignItems: "center",
  },
  swipeDeleteBg: {
    backgroundColor: Colors.danger[500],
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: 2,
  },
  swipeDeleteText: {
    ...Typography.caption,
    color: "#fff",
    fontWeight: "700",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 0,
    flexDirection: "row",
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  completeBtn: {
    flex: 2,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.glow(Colors.primary[600]),
  },
  completeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  completeBtnText: {
    ...Typography.labelMd,
    color: "#fff",
  },
  addItemBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
  },
  addItemBtnText: {
    ...Typography.labelMd,
    color: Colors.primary[600],
  },
});
