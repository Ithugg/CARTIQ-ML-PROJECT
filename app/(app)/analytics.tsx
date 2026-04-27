import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BorderRadius,
  Colors,
  Gradients,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import { usePurchaseStore } from "../../stores/purchaseStore";
import type { PriceAlert, SpendingInsight, FrequentItemWithTrend } from "../../stores/purchaseStore";
import { useAuthStore } from "../../stores/authStore";

const CHART_BAR_MAX_HEIGHT = 140;
const KPI_CARD_WIDTH = 150;

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.kpiCard, Shadows.md]}>
      <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Custom Bar Chart
// ---------------------------------------------------------------------------

function BarChart({ data }: { data: { label: string; amount: number }[] }) {
  const maxAmount = useMemo(
    () => Math.max(...data.map((d) => d.amount), 1),
    [data]
  );

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((item, index) => {
          const barHeight =
            maxAmount > 0
              ? (item.amount / maxAmount) * CHART_BAR_MAX_HEIGHT
              : 0;
          const displayAmount =
            item.amount >= 1000
              ? `$${(item.amount / 1000).toFixed(1)}k`
              : `$${item.amount.toFixed(0)}`;

          return (
            <View key={index} style={styles.chartBarColumn}>
              <Text style={styles.chartBarAmount}>
                {item.amount > 0 ? displayAmount : ""}
              </Text>
              <View style={styles.chartBarTrack}>
                <LinearGradient
                  colors={[...Gradients.emeraldVibrant]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[
                    styles.chartBar,
                    {
                      height: Math.max(barHeight, item.amount > 0 ? 4 : 0),
                      opacity: item.amount === maxAmount ? 1 : 0.7,
                    },
                  ]}
                />
              </View>
              <Text style={styles.chartBarLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  count,
  spent,
  rank,
}: {
  category: string;
  count: number;
  spent: number;
  rank: number;
}) {
  const bgColors = [
    Colors.primary[50],
    Colors.accent[50],
    Colors.warning[50],
    Colors.purple[50],
    Colors.danger[50],
    Colors.primary[100],
    Colors.accent[100],
    Colors.warning[100],
  ];
  const textColors = [
    Colors.primary[700],
    Colors.accent[600],
    Colors.warning[600],
    Colors.purple[600],
    Colors.danger[600],
    Colors.primary[800],
    Colors.accent[600],
    Colors.warning[600],
  ];
  const bg = bgColors[rank % bgColors.length];
  const textColor = textColors[rank % textColors.length];

  return (
    <View style={[styles.categoryCard, Shadows.sm, { backgroundColor: bg }]}>
      <Text style={[styles.categoryName, { color: textColor }]} numberOfLines={1}>
        {category}
      </Text>
      <Text style={[styles.categoryCount, { color: textColor }]}>
        {count} item{count !== 1 ? "s" : ""}
      </Text>
      <Text style={[styles.categorySpent, { color: textColor }]}>
        ${spent.toFixed(2)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Smart Insights Cards
// ---------------------------------------------------------------------------

function InsightsRow({ insights }: { insights: SpendingInsight }) {
  const trendUp = insights.weekOverWeekChange > 0;
  const trendColor = trendUp ? Colors.danger[500] : Colors.primary[600];
  const trendIcon = trendUp ? "trending-up" : "trending-down";
  const budgetColor =
    insights.budgetUsedPercent > 90
      ? Colors.danger[500]
      : insights.budgetUsedPercent > 70
      ? Colors.warning[500]
      : Colors.primary[600];

  return (
    <View style={styles.insightsRow}>
      {/* Week-over-week trend */}
      <View style={[styles.insightCard, Shadows.md]}>
        <View style={[styles.insightIconWrap, { backgroundColor: trendUp ? Colors.danger[50] : Colors.primary[50] }]}>
          <Ionicons name={trendIcon as any} size={20} color={trendColor} />
        </View>
        <Text style={styles.insightValue}>
          ${insights.thisWeekSpent.toFixed(2)}
        </Text>
        <Text style={styles.insightLabel}>This Week</Text>
        {insights.lastWeekSpent > 0 && (
          <View style={[styles.insightBadge, { backgroundColor: trendUp ? Colors.danger[50] : Colors.primary[50] }]}>
            <Ionicons name={trendIcon as any} size={10} color={trendColor} />
            <Text style={[styles.insightBadgeText, { color: trendColor }]}>
              {Math.abs(insights.weekOverWeekChange)}%
            </Text>
          </View>
        )}
      </View>

      {/* Budget utilization */}
      {insights.monthlyBudget > 0 && (
        <View style={[styles.insightCard, Shadows.md]}>
          <View style={[styles.insightIconWrap, { backgroundColor: Colors.purple[50] }]}>
            <Ionicons name="pie-chart-outline" size={20} color={Colors.purple[600]} />
          </View>
          <Text style={styles.insightValue}>
            {insights.budgetUsedPercent}%
          </Text>
          <Text style={styles.insightLabel}>Budget Used</Text>
          <View style={styles.budgetBar}>
            <View
              style={[
                styles.budgetBarFill,
                {
                  width: `${Math.min(insights.budgetUsedPercent, 100)}%`,
                  backgroundColor: budgetColor,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Projected monthly */}
      <View style={[styles.insightCard, Shadows.md]}>
        <View style={[styles.insightIconWrap, { backgroundColor: Colors.accent[50] }]}>
          <Ionicons name="calculator-outline" size={20} color={Colors.accent[600]} />
        </View>
        <Text style={styles.insightValue}>
          ${insights.projectedMonthlySpend.toFixed(0)}
        </Text>
        <Text style={styles.insightLabel}>Projected/mo</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Price Alert Row
// ---------------------------------------------------------------------------

function PriceAlertCard({ alert }: { alert: PriceAlert }) {
  return (
    <View style={[styles.alertCard, Shadows.sm]}>
      <View style={styles.alertLeft}>
        <View style={styles.alertIconWrap}>
          <Ionicons name="arrow-up-circle" size={20} color={Colors.danger[500]} />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertName} numberOfLines={1}>
            {alert.name.charAt(0).toUpperCase() + alert.name.slice(1)}
          </Text>
          <Text style={styles.alertMeta}>
            Avg ${alert.avgPrice.toFixed(2)} · {alert.purchaseCount} purchases
          </Text>
        </View>
      </View>
      <View style={styles.alertRight}>
        <Text style={styles.alertPrice}>${alert.latestPrice.toFixed(2)}</Text>
        <View style={styles.alertBadge}>
          <Ionicons name="caret-up" size={10} color={Colors.danger[600]} />
          <Text style={styles.alertBadgeText}>{alert.percentAbove}%</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Enhanced Frequent Item Row (with price trend)
// ---------------------------------------------------------------------------

function FrequentItemTrendRow({ item }: { item: FrequentItemWithTrend }) {
  const daysAgo = useMemo(() => {
    if (!item.lastPurchased) return null;
    const diff = Date.now() - new Date(item.lastPurchased).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }, [item.lastPurchased]);

  const trendColor =
    item.priceTrend === "up"
      ? Colors.danger[500]
      : item.priceTrend === "down"
      ? Colors.primary[600]
      : Colors.neutral[400];
  const trendIcon =
    item.priceTrend === "up"
      ? "caret-up"
      : item.priceTrend === "down"
      ? "caret-down"
      : "remove";

  return (
    <View style={[styles.frequentRow, Shadows.sm]}>
      <View style={styles.frequentIconWrap}>
        <Ionicons name="bag-handle-outline" size={18} color={Colors.primary[600]} />
      </View>
      <View style={styles.frequentInfo}>
        <Text style={styles.frequentName} numberOfLines={1}>
          {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        </Text>
        <Text style={styles.frequentMeta}>
          {item.count}x{daysAgo ? ` · Last ${daysAgo}` : ""}
        </Text>
      </View>
      <View style={styles.frequentPriceWrap}>
        <Text style={styles.frequentPrice}>${item.avgPrice.toFixed(2)}</Text>
        {item.priceTrend !== "stable" && (
          <View style={styles.trendBadge}>
            <Ionicons name={trendIcon as any} size={10} color={trendColor} />
            <Text style={[styles.trendBadgeText, { color: trendColor }]}>
              {item.trendPercent}%
            </Text>
          </View>
        )}
        {item.priceTrend === "stable" && (
          <Text style={styles.frequentPriceLabel}>avg</Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="analytics-outline" size={56} color={Colors.neutral[300]} />
      </View>
      <Text style={styles.emptyTitle}>No Analytics Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start shopping and checking off items to see your spending insights and
        purchase history here.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const stats = usePurchaseStore((s) => s.stats);
  const isLoading = usePurchaseStore((s) => s.isLoading);
  const getPriceAlerts = usePurchaseStore((s) => s.getPriceAlerts);
  const getSpendingInsights = usePurchaseStore((s) => s.getSpendingInsights);
  const getFrequentItemsWithTrends = usePurchaseStore((s) => s.getFrequentItemsWithTrends);
  const user = useAuthStore((s) => s.user);

  const priceAlerts = useMemo(() => getPriceAlerts(), [getPriceAlerts]);
  const insights = useMemo(
    () => getSpendingInsights(user?.weeklyBudget || 0),
    [getSpendingInsights, user?.weeklyBudget]
  );
  const frequentWithTrends = useMemo(
    () => getFrequentItemsWithTrends(10),
    [getFrequentItemsWithTrends]
  );

  const monthlyData = useMemo(() => {
    if (!stats?.monthlySpending) return [];
    return stats.monthlySpending.slice(-6).map((m) => ({
      label: m.month,
      amount: m.amount,
    }));
  }, [stats?.monthlySpending]);

  const sortedCategories = useMemo(() => {
    if (!stats?.topCategories) return [];
    return [...stats.topCategories].sort((a, b) => b.count - a.count);
  }, [stats?.topCategories]);

  const hasData =
    stats &&
    (stats.totalSpent > 0 || stats.totalItems > 0 || stats.totalLists > 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[...Gradients.premiumDark]}
          style={[styles.gradientHeader, { paddingTop: insets.top + Spacing.lg }]}
        >
          <View style={styles.glowOrb} />
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your shopping insights</Text>
        </LinearGradient>

        {!hasData ? (
          <EmptyState />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.kpiRow}
              >
                <KpiCard
                  icon="wallet-outline"
                  iconColor={Colors.primary[600]}
                  iconBg={Colors.primary[50]}
                  value={`$${stats.totalSpent.toFixed(2)}`}
                  label="Total Spent"
                />
                <KpiCard
                  icon="cart-outline"
                  iconColor={Colors.accent[500]}
                  iconBg={Colors.accent[50]}
                  value={`${stats.totalItems}`}
                  label="Total Items"
                />
                <KpiCard
                  icon="list-outline"
                  iconColor={Colors.warning[500]}
                  iconBg={Colors.warning[50]}
                  value={`${stats.totalLists}`}
                  label="Total Lists"
                />
                <KpiCard
                  icon="pricetag-outline"
                  iconColor={Colors.purple[500]}
                  iconBg={Colors.purple[50]}
                  value={`$${stats.avgListCost.toFixed(2)}`}
                  label="Avg List Cost"
                />
              </ScrollView>
            </Animated.View>

            {/* Spending Chart */}
            {monthlyData.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Monthly Spending</Text>
                </View>
                <View style={[styles.chartCard, Shadows.md]}>
                  <BarChart data={monthlyData} />
                </View>
              </>
            )}

            {/* Top Categories */}
            {sortedCategories.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Categories</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesRow}
                >
                  {sortedCategories.map((cat, index) => (
                    <CategoryCard
                      key={cat.category}
                      category={cat.category}
                      count={cat.count}
                      spent={cat.spent}
                      rank={index}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Smart Insights */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Insights</Text>
            </View>
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.insightsScrollContent}
              >
                <InsightsRow insights={insights} />
              </ScrollView>
            </Animated.View>

            {/* Price Alerts */}
            {priceAlerts.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(500)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Price Alerts</Text>
                  <View style={styles.alertCountBadge}>
                    <Text style={styles.alertCountText}>{priceAlerts.length}</Text>
                  </View>
                </View>
                <View style={styles.alertList}>
                  {priceAlerts.map((alert, index) => (
                    <PriceAlertCard key={`${alert.name}-${index}`} alert={alert} />
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Frequent Items with Trends */}
            {frequentWithTrends.length > 0 && (
              <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Frequent Items</Text>
                </View>
                <View style={styles.frequentList}>
                  {frequentWithTrends.map((item, index) => (
                    <FrequentItemTrendRow
                      key={`${item.name}-${index}`}
                      item={item}
                    />
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: Spacing["4xl"] }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingText: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    marginTop: Spacing.md,
  },

  // Gradient Header
  gradientHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.teal[600],
    opacity: 0.1,
  },
  headerTitle: {
    ...Typography.h1,
    color: "#ffffff",
  },
  headerSubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },

  // KPI Cards
  kpiRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  kpiCard: {
    width: KPI_CARD_WIDTH,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    ...Typography.h2,
    color: Colors.neutral[900],
  },
  kpiLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // Chart
  chartCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  chartContainer: {
    width: "100%",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: CHART_BAR_MAX_HEIGHT + 48,
  },
  chartBarColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  chartBarAmount: {
    ...Typography.caption,
    color: Colors.neutral[600],
    marginBottom: Spacing.xs,
  },
  chartBarTrack: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  chartBar: {
    width: "55%",
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    minWidth: 20,
    maxWidth: 48,
  },
  chartBarLabel: {
    ...Typography.labelSm,
    color: Colors.neutral[500],
    marginTop: Spacing.sm,
  },

  // Categories
  categoriesRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  categoryCard: {
    width: 140,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  categoryName: {
    ...Typography.labelMd,
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    ...Typography.bodySm,
  },
  categorySpent: {
    ...Typography.labelSm,
    marginTop: Spacing.xs,
  },

  // Frequent Items
  frequentList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  frequentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  frequentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  frequentInfo: {
    flex: 1,
  },
  frequentName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  frequentMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  frequentPriceWrap: {
    alignItems: "flex-end",
  },
  frequentPrice: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  frequentPriceLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },

  // Smart Insights
  insightsScrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  insightsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  insightCard: {
    width: 140,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  insightIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  insightValue: {
    ...Typography.h2,
    color: Colors.neutral[900],
  },
  insightLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  insightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  insightBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
  },
  budgetBar: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.neutral[100],
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  budgetBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Price Alerts
  alertCountBadge: {
    backgroundColor: Colors.danger[500],
    borderRadius: BorderRadius.full,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCountText: {
    ...Typography.caption,
    color: Colors.neutral[0],
    fontWeight: "700",
  },
  alertList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger[500],
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.danger[50],
    justifyContent: "center",
    alignItems: "center",
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  alertMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  alertRight: {
    alignItems: "flex-end",
  },
  alertPrice: {
    ...Typography.labelMd,
    color: Colors.danger[600],
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.danger[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  alertBadgeText: {
    ...Typography.caption,
    color: Colors.danger[600],
    fontWeight: "700",
  },

  // Price Trend Badge (for frequent items)
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginTop: 2,
  },
  trendBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Spacing["5xl"],
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    textAlign: "center",
    lineHeight: 22,
  },
});
