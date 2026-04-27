import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Gradients, Spacing, BorderRadius, Typography, Shadows } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useListsStore } from "../../stores/listsStore";
import { usePurchaseStore } from "../../stores/purchaseStore";
import { usePredictionsStore } from "../../stores/predictionsStore";
import { usePantryStore } from "../../stores/pantryStore";
import { analyzeShoppingPatterns } from "../../services/ml/shoppingPatterns";

const { width } = Dimensions.get("window");
const cardWidth = (width - Spacing.xl * 2 - Spacing.md) / 2;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const lists = useListsStore((s) => s.lists);
  const toggleItem = useListsStore((s) => s.toggleItem);
  const removeItem = useListsStore((s) => s.removeItem);
  const stats = usePurchaseStore((s) => s.stats);
  const predictions = usePredictionsStore((s) => s.predictions);
  const reminders = usePredictionsStore((s) => s.reminders);
  const suggestions = usePredictionsStore((s) => s.suggestions);
  const purchases = usePurchaseStore((s) => s.purchases);
  const expiringPantry = usePantryStore((s) => s.getExpiringItems);
  const expiredPantry = usePantryStore((s) => s.getExpiredItems);

  const firstName = user?.displayName?.split(" ")[0] || "there";

  const activeListCount = lists.length;
  const totalItems = useMemo(() => lists.reduce((sum, l) => sum + l.items.length, 0), [lists]);
  const checkedItems = useMemo(
    () => lists.reduce((sum, l) => sum + l.items.filter((i) => i.checked).length, 0),
    [lists]
  );
  const topPredictions = useMemo(() => predictions.slice(0, 5), [predictions]);
  const topSuggestions = useMemo(() => suggestions.slice(0, 6), [suggestions]);
  const criticalReminders = useMemo(
    () => reminders.filter((r) => !r.dismissed && (r.urgency === "critical" || r.urgency === "high")),
    [reminders]
  );

  const shoppingPattern = useMemo(
    () => analyzeShoppingPatterns(purchases),
    [purchases]
  );

  const expiringItems = useMemo(() => expiringPantry(), [expiringPantry]);
  const expiredItems = useMemo(() => expiredPantry(), [expiredPantry]);
  const pantryAlertCount = expiringItems.length + expiredItems.length;

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Gradient Hero ─── */}
        <LinearGradient
          colors={Gradients.premiumDark}
          style={[styles.heroGradient, { paddingTop: insets.top + Spacing.lg }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glow orb */}
          <View style={styles.heroGlow} />

          <Animated.View entering={FadeInDown.duration(600)} style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{getTimeGreeting()},</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => router.push("/(app)/profile")}
              >
                <LinearGradient
                  colors={Gradients.emeraldVibrant}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick stat bar */}
            <View style={styles.quickStatBar}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{activeListCount}</Text>
                <Text style={styles.quickStatLabel}>Lists</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{totalItems}</Text>
                <Text style={styles.quickStatLabel}>Items</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{checkedItems}</Text>
                <Text style={styles.quickStatLabel}>Done</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>${stats?.totalSpent?.toFixed(0) || "0"}</Text>
                <Text style={styles.quickStatLabel}>Spent</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ─── Critical Reminders ─── */}
        {criticalReminders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <TouchableOpacity
              style={styles.reminderBanner}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/predictions")}
            >
              <LinearGradient
                colors={[Colors.danger[50], Colors.warning[50]]}
                style={styles.reminderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.reminderIcon}>
                  <Ionicons name="alert-circle" size={18} color={Colors.danger[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>
                    {criticalReminders.length} item{criticalReminders.length > 1 ? "s" : ""} running low
                  </Text>
                  <Text style={styles.reminderSubtitle} numberOfLines={1}>
                    {criticalReminders.map((r) => r.itemName).join(", ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.neutral[400]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── Shopping Day Banner ─── */}
        {shoppingPattern.isShoppingDay && purchases.length >= 3 && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <TouchableOpacity
              style={styles.shoppingDayBanner}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/lists")}
            >
              <LinearGradient
                colors={[Colors.primary[50], Colors.teal[50]]}
                style={styles.shoppingDayGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.shoppingDayIcon}>
                  <Ionicons name="calendar" size={18} color={Colors.primary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shoppingDayTitle}>
                    It's your shopping day!
                  </Text>
                  <Text style={styles.shoppingDaySubtitle}>
                    You usually shop on {shoppingPattern.preferredDay}s · ~${shoppingPattern.avgSpendPerTrip.toFixed(0)} avg
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={Colors.primary[500]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── Pantry Expiring Alert ─── */}
        {pantryAlertCount > 0 && (
          <Animated.View entering={FadeInDown.delay(270).duration(500)}>
            <TouchableOpacity
              style={styles.pantryAlertBanner}
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/pantry")}
            >
              <LinearGradient
                colors={[Colors.warning[50], Colors.danger[50]]}
                style={styles.pantryAlertGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.pantryAlertIcon}>
                  <Ionicons name="timer-outline" size={18} color={Colors.warning[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pantryAlertTitle}>
                    {expiredItems.length > 0
                      ? `${expiredItems.length} expired`
                      : ""}
                    {expiredItems.length > 0 && expiringItems.length > 0 ? " + " : ""}
                    {expiringItems.length > 0
                      ? `${expiringItems.length} expiring soon`
                      : ""}
                  </Text>
                  <Text style={styles.pantryAlertSubtitle} numberOfLines={1}>
                    {[...expiredItems, ...expiringItems]
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(", ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.neutral[400]} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ─── Quick Actions ─── */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
          >
            {[
              { icon: "add-circle" as const, label: "New List", color: Colors.primary[600], bg: Colors.primary[50], route: "/(app)/lists" },
              { icon: "sparkles" as const, label: "AI Generate", color: Colors.purple[600], bg: Colors.purple[50], route: "/(app)/generate" },
              { icon: "analytics" as const, label: "Analytics", color: Colors.accent[600], bg: Colors.accent[50], route: "/(app)/analytics" },
              { icon: "cube" as const, label: "Pantry", color: Colors.teal[600], bg: Colors.teal[50], route: "/(app)/pantry" },
              { icon: "notifications" as const, label: "Reminders", color: Colors.warning[600], bg: Colors.warning[50], route: "/(app)/predictions" },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── Recent Lists ─── */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Lists</Text>
            {lists.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(app)/lists")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {lists.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/lists")}
            >
              <LinearGradient
                colors={Gradients.cardCool}
                style={styles.emptyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="basket-outline" size={36} color={Colors.primary[400]} />
                </View>
                <Text style={styles.emptyTitle}>Create your first list</Text>
                <Text style={styles.emptySubtitle}>
                  Tap here to start tracking your groceries
                </Text>
                <View style={styles.emptyCtaRow}>
                  <Ionicons name="add-circle" size={18} color={Colors.primary[600]} />
                  <Text style={styles.emptyCtaText}>Get Started</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              {/* Most recent list — inline items with check/delete */}
              {lists.length > 0 && (() => {
                const recentList = lists[0];
                const itemCount = recentList.items.length;
                const doneCount = recentList.items.filter((i) => i.checked).length;
                const prog = itemCount > 0 ? doneCount / itemCount : 0;

                return (
                  <Animated.View entering={FadeInRight.delay(400).duration(500)}>
                    <TouchableOpacity
                      style={styles.recentListHeader}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({ pathname: "/(app)/listdetail", params: { listId: recentList.id } })
                      }
                    >
                      <View style={styles.listCardLeft}>
                        <View style={[
                          styles.listDot,
                          { backgroundColor: prog === 1 ? Colors.primary[500] : Colors.accent[500] }
                        ]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listName} numberOfLines={1}>{recentList.name}</Text>
                          <Text style={styles.listMeta}>
                            {doneCount}/{itemCount} done · ${recentList.totalEstimate?.toFixed(0) || "0"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.miniProgress}>
                        <View style={[styles.miniProgressFill, { width: `${prog * 100}%` }]} />
                      </View>
                    </TouchableOpacity>

                    {/* Inline items — first 6 */}
                    {recentList.items.slice(0, 6).map((item, idx) => {
                      const isLast = idx === Math.min(recentList.items.length, 6) - 1;
                      const noViewAll = recentList.items.length <= 6;
                      return (
                      <View key={item.id} style={[
                        styles.inlineItemRow,
                        isLast && noViewAll && {
                          borderBottomLeftRadius: BorderRadius.xl,
                          borderBottomRightRadius: BorderRadius.xl,
                          marginBottom: Spacing.md,
                        },
                      ]}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleItem(recentList.id, item.id);
                          }}
                          style={styles.inlineItemLeft}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.inlineCheckbox,
                            item.checked && styles.inlineCheckboxChecked,
                          ]}>
                            {item.checked && (
                              <Ionicons name="checkmark" size={14} color="#fff" />
                            )}
                          </View>
                          <Text
                            style={[styles.inlineItemName, item.checked && styles.inlineItemNameChecked]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.inlineItemQty}>x{item.quantity}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert("Remove Item", `Remove "${item.name}"?`, [
                              { text: "Cancel", style: "cancel" },
                              { text: "Remove", style: "destructive", onPress: () => removeItem(recentList.id, item.id) },
                            ]);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={20} color={Colors.neutral[300]} />
                        </TouchableOpacity>
                      </View>
                      );
                    })}
                    {recentList.items.length > 6 && (
                      <TouchableOpacity
                        style={styles.viewAllBtn}
                        onPress={() =>
                          router.push({ pathname: "/(app)/listdetail", params: { listId: recentList.id } })
                        }
                      >
                        <Text style={styles.viewAllText}>
                          View all {recentList.items.length} items
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary[600]} />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                );
              })()}

              {/* Other lists as summary cards */}
              {lists.slice(1, 3).map((list, index) => {
                const itemCount = list.items.length;
                const checkedCount = list.items.filter((i) => i.checked).length;
                const progress = itemCount > 0 ? checkedCount / itemCount : 0;

                return (
                  <Animated.View
                    key={list.id}
                    entering={FadeInRight.delay(500 + index * 100).duration(500)}
                  >
                    <TouchableOpacity
                      style={styles.listCard}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({ pathname: "/(app)/listdetail", params: { listId: list.id } })
                      }
                    >
                      <View style={styles.listCardLeft}>
                        <View style={[
                          styles.listDot,
                          { backgroundColor: progress === 1 ? Colors.primary[500] : Colors.accent[500] }
                        ]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
                          <Text style={styles.listMeta}>
                            {itemCount} item{itemCount !== 1 ? "s" : ""} · {checkedCount}/{itemCount} done
                          </Text>
                        </View>
                      </View>
                      <View style={styles.listCardRight}>
                        <Text style={styles.listEstimate}>${list.totalEstimate?.toFixed(0) || "0"}</Text>
                        <View style={styles.miniProgress}>
                          <View style={[styles.miniProgressFill, { width: `${progress * 100}%` }]} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </>
          )}
        </Animated.View>

        {/* ─── AI Predictions ─── */}
        {topPredictions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(500)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={18} color={Colors.purple[500]} />
                <Text style={styles.sectionTitle}>AI Predictions</Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(app)/predictions")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
            >
              {topPredictions.map((pred) => {
                const confidence =
                  pred.probability >= 0.7 ? Colors.primary[500] :
                  pred.probability >= 0.4 ? Colors.warning[500] :
                  Colors.neutral[400];
                return (
                  <View key={pred.id} style={styles.predCard}>
                    <View style={[styles.predConfidenceBar, { backgroundColor: confidence }]}>
                      <Text style={styles.predConfidenceText}>
                        {(pred.probability * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <Text style={styles.predName} numberOfLines={1}>{pred.itemName}</Text>
                    <Text style={styles.predCategory}>{pred.category}</Text>
                    <View style={styles.predPriceRow}>
                      <Text style={styles.predPrice}>~${pred.estimatedPrice.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── Personalized Suggestions ─── */}
        {topSuggestions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700).duration(500)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bulb" size={18} color={Colors.accent[500]} />
                <Text style={styles.sectionTitle}>For You</Text>
              </View>
            </View>
            <View style={styles.suggestionsGrid}>
              {topSuggestions.map((sug) => (
                <View key={sug.itemName} style={styles.sugCard}>
                  <Text style={styles.sugName} numberOfLines={1}>{sug.itemName}</Text>
                  <Text style={styles.sugReason} numberOfLines={1}>{sug.reason}</Text>
                  <View style={styles.sugBottom}>
                    <Text style={styles.sugPrice}>~${sug.estimatedPrice.toFixed(2)}</Text>
                    {sug.tags.length > 0 && (
                      <View style={styles.sugTag}>
                        <Text style={styles.sugTagText}>{sug.tags[0]}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero
  heroGradient: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["3xl"],
    borderBottomLeftRadius: BorderRadius["3xl"],
    borderBottomRightRadius: BorderRadius["3xl"],
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  heroGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary[600],
    opacity: 0.1,
    top: -40,
    right: -40,
  },
  heroContent: {},
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.bodyLg,
    color: Colors.neutral[400],
  },
  userName: {
    ...Typography.displayMd,
    color: "#fff",
    marginTop: 2,
  },
  avatarBtn: {
    ...Shadows.glow(Colors.primary[500]),
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    ...Typography.h2,
    color: "#fff",
  },

  // Quick stat bar
  quickStatBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  quickStat: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    ...Typography.h3,
    color: "#fff",
  },
  quickStatLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Reminders
  reminderBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  reminderGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger[200],
    borderRadius: BorderRadius.xl,
  },
  reminderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.danger[100],
    justifyContent: "center",
    alignItems: "center",
  },
  reminderTitle: {
    ...Typography.labelSm,
    color: Colors.danger[700],
  },
  reminderSubtitle: {
    ...Typography.caption,
    color: Colors.danger[600],
    marginTop: 1,
  },

  // Shopping Day Banner
  shoppingDayBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  shoppingDayGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    borderRadius: BorderRadius.xl,
  },
  shoppingDayIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  shoppingDayTitle: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },
  shoppingDaySubtitle: {
    ...Typography.caption,
    color: Colors.primary[600],
    marginTop: 1,
  },

  // Pantry Alert Banner
  pantryAlertBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  pantryAlertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning[200],
    borderRadius: BorderRadius.xl,
  },
  pantryAlertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.warning[100],
    justifyContent: "center",
    alignItems: "center",
  },
  pantryAlertTitle: {
    ...Typography.labelSm,
    color: Colors.warning[700],
  },
  pantryAlertSubtitle: {
    ...Typography.caption,
    color: Colors.warning[600],
    marginTop: 1,
  },

  // Actions
  actionsRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: 80,
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.neutral[600],
    textAlign: "center",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  seeAll: {
    ...Typography.labelSm,
    color: Colors.primary[600],
  },

  // List cards
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  listCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  listMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  listCardRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  listEstimate: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
  },
  miniProgress: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.neutral[100],
    overflow: "hidden",
  },
  miniProgressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary[500],
  },

  // Empty state
  emptyCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.sm,
  },
  emptyGradient: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    borderStyle: "dashed",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary[50],
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
    marginBottom: Spacing.xl,
  },
  emptyCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyCtaText: {
    ...Typography.labelMd,
    color: Colors.primary[600],
  },

  // Inline items (recent list)
  recentListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing.xl,
    marginBottom: 1,
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  inlineItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  inlineItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  inlineCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  inlineCheckboxChecked: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  inlineItemName: {
    ...Typography.bodyMd,
    color: Colors.neutral[800],
    flex: 1,
  },
  inlineItemNameChecked: {
    color: Colors.neutral[400],
    textDecorationLine: "line-through",
  },
  inlineItemQty: {
    ...Typography.caption,
    color: Colors.neutral[500],
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  viewAllText: {
    ...Typography.labelSm,
    color: Colors.primary[600],
  },

  // Prediction cards
  predCard: {
    width: 140,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  predConfidenceBar: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  predConfidenceText: {
    ...Typography.caption,
    color: "#fff",
    fontWeight: "700",
  },
  predName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  predCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  predPriceRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  predPrice: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },

  // Personalized suggestions
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  sugCard: {
    width: (width - Spacing.xl * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  sugName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
    marginBottom: 2,
  },
  sugReason: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
  },
  sugBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sugPrice: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },
  sugTag: {
    backgroundColor: Colors.accent[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sugTagText: {
    ...Typography.caption,
    color: Colors.accent[600],
  },
});
