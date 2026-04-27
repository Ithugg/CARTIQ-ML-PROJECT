import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Gradients,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { usePantryStore } from "../../stores/pantryStore";
import type { PantryItem } from "../../types";

const { width } = Dimensions.get("window");

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const items = usePantryStore((s) => s.items);
  const subscribe = usePantryStore((s) => s.subscribe);
  const addToPantry = usePantryStore((s) => s.addToPantry);
  const removeFromPantry = usePantryStore((s) => s.removeFromPantry);
  const updateQuantity = usePantryStore((s) => s.updateQuantity);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all");

  // Subscribe to pantry data
  useEffect(() => {
    if (!user) return;
    const unsub = subscribe(user.uid);
    return unsub;
  }, [user?.uid]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "expiring":
        return items.filter((i) => i.status === "expiring_soon");
      case "expired":
        return items.filter((i) => i.status === "expired");
      default:
        return items;
    }
  }, [items, filter]);

  const expiringCount = useMemo(
    () => items.filter((i) => i.status === "expiring_soon").length,
    [items]
  );
  const expiredCount = useMemo(
    () => items.filter((i) => i.status === "expired").length,
    [items]
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    for (const item of filteredItems) {
      const key = item.category || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filteredItems]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !user) return;
    const qty = parseInt(newItemQty) || 1;
    await addToPantry(user.uid, newItemName.trim(), qty, "pcs");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewItemName("");
    setNewItemQty("1");
    setShowAddForm(false);
  };

  const handleRemoveItem = (item: PantryItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Remove from Pantry", `Remove "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromPantry(item.id),
      },
    ]);
  };

  const getStatusColor = (status: PantryItem["status"]) => {
    switch (status) {
      case "expired":
        return Colors.danger[500];
      case "expiring_soon":
        return Colors.warning[500];
      default:
        return Colors.primary[500];
    }
  };

  const getStatusIcon = (status: PantryItem["status"]): "alert-circle" | "warning" | "checkmark-circle" => {
    switch (status) {
      case "expired":
        return "alert-circle";
      case "expiring_soon":
        return "warning";
      default:
        return "checkmark-circle";
    }
  };

  const getExpiryText = (item: PantryItem) => {
    if (item.daysUntilExpiry === null) return "No expiry";
    if (item.daysUntilExpiry <= 0)
      return `Expired ${Math.abs(item.daysUntilExpiry)} day${Math.abs(item.daysUntilExpiry) !== 1 ? "s" : ""} ago`;
    if (item.daysUntilExpiry === 1) return "Expires tomorrow";
    return `${item.daysUntilExpiry} days left`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Pantry</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addBtn}
          >
            <Ionicons name={showAddForm ? "close" : "add"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, expiringCount > 0 && { color: Colors.warning[400] }]}>
              {expiringCount}
            </Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, expiredCount > 0 && { color: Colors.danger[500] }]}>
              {expiredCount}
            </Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      {/* Add item form */}
      {showAddForm && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            placeholder="Item name..."
            placeholderTextColor={Colors.neutral[400]}
            value={newItemName}
            onChangeText={setNewItemName}
            autoFocus
          />
          <TextInput
            style={[styles.addInput, { width: 60 }]}
            placeholder="Qty"
            placeholderTextColor={Colors.neutral[400]}
            value={newItemQty}
            onChangeText={setNewItemQty}
            keyboardType="number-pad"
          />
          <TouchableOpacity onPress={handleAddItem} style={styles.addConfirmBtn}>
            <LinearGradient colors={Gradients.ctaPrimary} style={styles.addConfirmGradient}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(["all", "expiring", "expired"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === "all" ? "All" : f === "expiring" ? "Expiring Soon" : "Expired"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="cube-outline" size={48} color={Colors.neutral[300]} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "all" ? "Your pantry is empty" : `No ${filter.replace("_", " ")} items`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all"
                ? "Items are automatically added when you complete shopping"
                : "Great — nothing to worry about!"}
            </Text>
          </View>
        ) : (
          Object.entries(groupedItems).map(([category, catItems], catIdx) => (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(catIdx * 80).duration(400)}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category}</Text>
                <Text style={styles.categoryCount}>{catItems.length}</Text>
              </View>

              {catItems.map((item, idx) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInRight.delay(catIdx * 80 + idx * 40).duration(300)}
                >
                  <View style={styles.itemCard}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.itemMeta}>
                        <Ionicons
                          name={getStatusIcon(item.status)}
                          size={12}
                          color={getStatusColor(item.status)}
                        />
                        <Text
                          style={[
                            styles.itemExpiry,
                            { color: getStatusColor(item.status) },
                          ]}
                        >
                          {getExpiryText(item)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          updateQuantity(item.id, item.quantity - 1);
                        }}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={Colors.neutral[600]} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          updateQuantity(item.id, item.quantity + 1);
                        }}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={16} color={Colors.neutral[600]} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.neutral[300]} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
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
    ...Typography.h2,
    color: "#fff",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.h3,
    color: "#fff",
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Add form
  addForm: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  addInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.neutral[800],
    backgroundColor: Colors.neutral[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  addConfirmBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  addConfirmGradient: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Filter
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: Colors.primary[500],
  },
  filterTabText: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
  },
  filterTabTextActive: {
    color: "#fff",
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    textAlign: "center",
    maxWidth: 260,
  },

  // Category
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoryName: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
  },
  categoryCount: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },

  // Items
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  itemExpiry: {
    ...Typography.caption,
  },

  // Quantity controls
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
    minWidth: 20,
    textAlign: "center",
  },
});
