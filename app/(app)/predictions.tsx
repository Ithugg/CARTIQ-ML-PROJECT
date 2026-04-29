import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { useListsStore } from "../../stores/listsStore";
import { usePredictionsStore } from "../../stores/predictionsStore";
import { usePurchaseStore } from "../../stores/purchaseStore";
import type { Prediction, Reminder, Discovery } from "../../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Tab = "predictions" | "reminders" | "discover";

const URGENCY_COLORS = {
  critical: {
    bg: Colors.danger[50],
    border: Colors.danger[200],
    text: Colors.danger[700],
    badge: Colors.danger[500],
    badgeText: Colors.neutral[0],
    bar: Colors.danger[500],
  },
  high: {
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
    badge: "#f97316",
    badgeText: Colors.neutral[0],
    bar: "#f97316",
  },
  medium: {
    bg: Colors.warning[50],
    border: Colors.warning[100],
    text: Colors.warning[600],
    badge: Colors.warning[500],
    badgeText: Colors.neutral[0],
    bar: Colors.warning[500],
  },
  low: {
    bg: Colors.primary[50],
    border: Colors.primary[200],
    text: Colors.primary[700],
    badge: Colors.primary[500],
    badgeText: Colors.neutral[0],
    bar: Colors.primary[500],
  },
} as const;

const CONFIDENCE_COLORS = {
  high: {
    bg: Colors.primary[50],
    text: Colors.primary[700],
    border: Colors.primary[200],
  },
  medium: {
    bg: Colors.warning[50],
    text: Colors.warning[600],
    border: Colors.warning[100],
  },
  low: {
    bg: Colors.neutral[100],
    text: Colors.neutral[600],
    border: Colors.neutral[200],
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SegmentTab({
  id,
  activeTab,
  onTabChange,
  icon,
  label,
  count,
}: {
  id: Tab;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  count?: number;
}) {
  const isActive = activeTab === id;
  return (
    <TouchableOpacity
      style={[styles.segmentTab, isActive && styles.segmentTabActive]}
      onPress={() => onTabChange(id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={14}
        color={isActive ? Colors.primary[400] : "rgba(255,255,255,0.5)"}
      />
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View
          style={[
            styles.segmentBadge,
            isActive ? styles.segmentBadgeActive : styles.segmentBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.segmentBadgeText,
              isActive ? styles.segmentBadgeTextActive : styles.segmentBadgeTextInactive,
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SegmentedControl({
  activeTab,
  onTabChange,
  predictionsCount,
  remindersCount,
  discoveriesCount,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  predictionsCount: number;
  remindersCount: number;
  discoveriesCount: number;
}) {
  return (
    <View style={styles.segmentedContainer}>
      <SegmentTab id="predictions" activeTab={activeTab} onTabChange={onTabChange}
        icon="sparkles" label="Predictions" count={predictionsCount} />
      <SegmentTab id="reminders" activeTab={activeTab} onTabChange={onTabChange}
        icon="notifications" label="Reminders" count={remindersCount} />
      <SegmentTab id="discover" activeTab={activeTab} onTabChange={onTabChange}
        icon="compass" label="Discover" count={discoveriesCount} />
    </View>
  );
}

function ProbabilityBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const barColor =
    pct >= 70
      ? Colors.primary[500]
      : pct >= 40
        ? Colors.warning[500]
        : Colors.neutral[400];

  return (
    <View style={styles.probabilityContainer}>
      <View style={styles.probabilityLabelRow}>
        <Text style={styles.probabilityLabel}>Likelihood</Text>
        <Text style={[styles.probabilityValue, { color: barColor }]}>
          {pct}%
        </Text>
      </View>
      <View style={styles.probabilityTrack}>
        <View
          style={[
            styles.probabilityFill,
            { width: `${pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: "high" | "medium" | "low";
}) {
  const colors = CONFIDENCE_COLORS[confidence];
  return (
    <View
      style={[
        styles.confidenceBadge,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <Ionicons
        name={
          confidence === "high"
            ? "shield-checkmark"
            : confidence === "medium"
              ? "shield-half"
              : "shield-outline"
        }
        size={12}
        color={colors.text}
      />
      <Text style={[styles.confidenceText, { color: colors.text }]}>
        {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
      </Text>
    </View>
  );
}

function UrgencyBadge({
  urgency,
}: {
  urgency: "critical" | "high" | "medium" | "low";
}) {
  const colors = URGENCY_COLORS[urgency];
  return (
    <View style={[styles.urgencyBadge, { backgroundColor: colors.badge }]}>
      <Text style={[styles.urgencyBadgeText, { color: colors.badgeText }]}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Text>
    </View>
  );
}

function ConsumptionBar({
  estimatedDaysLeft,
  avgConsumptionDays,
  urgency,
}: {
  estimatedDaysLeft: number;
  avgConsumptionDays: number;
  urgency: "critical" | "high" | "medium" | "low";
}) {
  const remaining = Math.max(0, Math.min(1, estimatedDaysLeft / avgConsumptionDays));
  const barColor = URGENCY_COLORS[urgency].bar;

  return (
    <View style={styles.consumptionContainer}>
      <View style={styles.consumptionLabelRow}>
        <Text style={styles.consumptionLabel}>Supply remaining</Text>
        <Text style={[styles.consumptionValue, { color: barColor }]}>
          {estimatedDaysLeft <= 0
            ? "Depleted"
            : `~${estimatedDaysLeft} day${estimatedDaysLeft !== 1 ? "s" : ""}`}
        </Text>
      </View>
      <View style={styles.consumptionTrack}>
        <View
          style={[
            styles.consumptionFill,
            { width: `${remaining * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

function ListPickerModal({
  visible,
  onClose,
  onSelect,
  lists,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (listId: string) => void;
  lists: { id: string; name: string; items: { length: number } }[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, Shadows.lg]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to List</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {lists.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Ionicons
                name="list-outline"
                size={36}
                color={Colors.neutral[300]}
              />
              <Text style={styles.modalEmptyText}>No lists available</Text>
              <Text style={styles.modalEmptySubtext}>
                Create a list first, then come back.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.modalListItem}
                  activeOpacity={0.7}
                  onPress={() => onSelect(list.id)}
                >
                  <View style={styles.modalListIcon}>
                    <Ionicons
                      name="list"
                      size={18}
                      color={Colors.primary[600]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalListName} numberOfLines={1}>
                      {list.name}
                    </Text>
                    <Text style={styles.modalListMeta}>
                      {list.items.length} item
                      {list.items.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={Colors.primary[500]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PredictionCard({
  prediction,
  onAddToList,
}: {
  prediction: Prediction;
  onAddToList: (itemName: string, estimatedPrice: number) => void;
}) {
  return (
    <View style={[styles.predictionCard, Shadows.md]}>
      <View style={styles.predictionTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.predictionName}>{prediction.itemName}</Text>
          <View style={styles.predictionMeta}>
            <View style={styles.categoryBadge}>
              <Ionicons
                name="pricetag-outline"
                size={11}
                color={Colors.accent[500]}
              />
              <Text style={styles.categoryText}>{prediction.category}</Text>
            </View>
            <ConfidenceBadge confidence={prediction.confidence} />
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceLabel}>Est.</Text>
          <Text style={styles.priceValue}>
            ${prediction.estimatedPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      <ProbabilityBar probability={prediction.probability} />

      <Text style={styles.reasonText} numberOfLines={2}>
        {prediction.reason}
      </Text>

      <View style={styles.predictionStats}>
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={14} color={Colors.neutral[500]} />
          <Text style={styles.statText}>
            {prediction.purchaseCount} purchase{prediction.purchaseCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={14} color={Colors.neutral[500]} />
          <Text style={styles.statText}>
            Every ~{prediction.avgDaysBetweenPurchases} days
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.neutral[500]} />
          <Text style={styles.statText}>
            {prediction.daysSinceLastPurchase}d ago
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addToListButton}
        activeOpacity={0.7}
        onPress={() => onAddToList(prediction.itemName, prediction.estimatedPrice)}
      >
        <Ionicons name="add-circle" size={18} color={Colors.primary[600]} />
        <Text style={styles.addToListText}>Add to List</Text>
      </TouchableOpacity>
    </View>
  );
}

function ReminderCard({
  reminder,
  onDismiss,
  onAddToList,
}: {
  reminder: Reminder;
  onDismiss: (id: string) => void;
  onAddToList: (itemName: string, estimatedPrice: number) => void;
}) {
  const colors = URGENCY_COLORS[reminder.urgency];
  const lastDate = new Date(reminder.lastPurchased);
  const formattedDate = `${lastDate.getMonth() + 1}/${lastDate.getDate()}/${lastDate.getFullYear()}`;

  return (
    <View
      style={[
        styles.reminderCard,
        Shadows.md,
        { borderLeftColor: colors.bar, backgroundColor: colors.bg },
      ]}
    >
      <View style={styles.reminderTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderName}>{reminder.itemName}</Text>
            <UrgencyBadge urgency={reminder.urgency} />
          </View>
          <Text style={styles.reminderCategory}>{reminder.category}</Text>
        </View>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss(reminder.id)}
          hitSlop={8}
          activeOpacity={0.6}
        >
          <Ionicons name="close-circle" size={22} color={Colors.neutral[400]} />
        </TouchableOpacity>
      </View>

      <Text style={styles.reminderMessage}>{reminder.message}</Text>

      <ConsumptionBar
        estimatedDaysLeft={reminder.estimatedDaysLeft}
        avgConsumptionDays={reminder.avgConsumptionDays}
        urgency={reminder.urgency}
      />

      <View style={styles.reminderFooter}>
        <View style={styles.reminderFooterInfo}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={13} color={Colors.neutral[500]} />
            <Text style={styles.statText}>Last: {formattedDate}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={13} color={Colors.neutral[500]} />
            <Text style={styles.statText}>~${reminder.estimatedPrice.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addToListButtonSmall}
          activeOpacity={0.7}
          onPress={() => onAddToList(reminder.itemName, reminder.estimatedPrice)}
        >
          <Ionicons name="add-circle" size={16} color={Colors.primary[600]} />
          <Text style={styles.addToListTextSmall}>Add to List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DiscoveryCard({
  discovery,
  onAddToList,
}: {
  discovery: Discovery;
  onAddToList: (itemName: string, estimatedPrice: number) => void;
}) {
  const scorePct = Math.round(discovery.score * 100);
  return (
    <View style={[styles.predictionCard, Shadows.md]}>
      <View style={styles.predictionTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.predictionName}>{discovery.itemName}</Text>
          <View style={styles.predictionMeta}>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={11} color={Colors.accent[500]} />
              <Text style={styles.categoryText}>{discovery.category}</Text>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: Colors.purple[50], borderColor: Colors.purple[200] }]}>
              <Ionicons name="compass" size={12} color={Colors.purple[600]} />
              <Text style={[styles.confidenceText, { color: Colors.purple[600] }]}>Discovery</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceLabel}>Est.</Text>
          <Text style={styles.priceValue}>${discovery.estimatedPrice.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.probabilityContainer}>
        <View style={styles.probabilityLabelRow}>
          <Text style={styles.probabilityLabel}>Similarity</Text>
          <Text style={[styles.probabilityValue, { color: Colors.purple[500] }]}>{scorePct}%</Text>
        </View>
        <View style={styles.probabilityTrack}>
          <View style={[styles.probabilityFill, { width: `${scorePct}%`, backgroundColor: Colors.purple[500] }]} />
        </View>
      </View>

      <Text style={styles.reasonText} numberOfLines={2}>
        AI-powered discovery based on your overall shopping patterns
      </Text>

      <TouchableOpacity
        style={styles.addToListButton}
        activeOpacity={0.7}
        onPress={() => onAddToList(discovery.itemName, discovery.estimatedPrice)}
      >
        <Ionicons name="add-circle" size={18} color={Colors.primary[600]} />
        <Text style={styles.addToListText}>Add to List</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ type }: { type: "no-data" | "no-predictions" | "no-reminders" | "no-discoveries" }) {
  const config = {
    "no-data": {
      icon: "cart-outline" as const,
      title: "Start shopping to get predictions!",
      subtitle: "Once you complete a few shopping trips, CartIQ will learn your habits and predict what you need next.",
    },
    "no-predictions": {
      icon: "sparkles-outline" as const,
      title: "No predictions yet",
      subtitle: "Keep shopping and CartIQ will learn your patterns to make accurate predictions.",
    },
    "no-reminders": {
      icon: "notifications-off-outline" as const,
      title: "All caught up!",
      subtitle: "No reminders right now. We will notify you when items are running low.",
    },
    "no-discoveries": {
      icon: "compass-outline" as const,
      title: "No discoveries yet",
      subtitle: "Keep shopping and our AI will suggest new products you might enjoy.",
    },
  };

  const { icon, title, subtitle } = config[type];

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={48} color={Colors.neutral[300]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PredictionsScreen() {
  const insets = useSafeAreaInsets();

  const predictions = usePredictionsStore((s) => s.predictions);
  const reminders = usePredictionsStore((s) => s.reminders);
  const discoveries = usePredictionsStore((s) => s.discoveries);
  const dismissReminder = usePredictionsStore((s) => s.dismissReminder);
  const isComputing = usePredictionsStore((s) => s.isComputing);
  const purchases = usePurchaseStore((s) => s.purchases);
  const lists = useListsStore((s) => s.lists);
  const addItem = useListsStore((s) => s.addItem);

  const [activeTab, setActiveTab] = useState<Tab>("predictions");
  const [listPickerVisible, setListPickerVisible] = useState(false);
  const [pendingItem, setPendingItem] = useState<{ name: string; price: number } | null>(null);

  const activeReminders = useMemo(
    () => reminders.filter((r) => !r.dismissed),
    [reminders]
  );

  const hasData = purchases.length > 0;

  const handleAddToList = useCallback(
    (itemName: string, estimatedPrice: number) => {
      setPendingItem({ name: itemName, price: estimatedPrice });
      setListPickerVisible(true);
    },
    []
  );

  const handleSelectList = useCallback(
    async (listId: string) => {
      if (!pendingItem) return;
      try {
        await addItem(listId, pendingItem.name, 1);
      } catch (err) {
        console.error("Failed to add item:", err);
      } finally {
        setListPickerVisible(false);
        setPendingItem(null);
      }
    },
    [addItem, pendingItem]
  );

  const handleCloseModal = useCallback(() => {
    setListPickerVisible(false);
    setPendingItem(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <View style={styles.headerGlowOrb} />

        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="sparkles" size={22} color={Colors.purple[300]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>AI Predictions</Text>
            <Text style={styles.headerSubtitle}>
              Smart insights powered by your shopping history
            </Text>
          </View>
          {isComputing && <ActivityIndicator size="small" color="#ffffff" />}
        </View>

        {hasData && (
          <SegmentedControl
            activeTab={activeTab}
            onTabChange={setActiveTab}
            predictionsCount={predictions.length}
            remindersCount={activeReminders.length}
            discoveriesCount={discoveries.length}
          />
        )}
      </LinearGradient>

      {!hasData ? (
        <View style={styles.emptyContainer}>
          <EmptyState type="no-data" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === "predictions" ? (
            predictions.length === 0 ? (
              <EmptyState type="no-predictions" />
            ) : (
              predictions.map((prediction, index) => (
                <Animated.View
                  key={prediction.id}
                  entering={FadeInDown.delay(index * 80).duration(500)}
                >
                  <PredictionCard
                    prediction={prediction}
                    onAddToList={handleAddToList}
                  />
                </Animated.View>
              ))
            )
          ) : activeTab === "reminders" ? (
            activeReminders.length === 0 ? (
              <EmptyState type="no-reminders" />
            ) : (
              activeReminders.map((reminder, index) => (
                <Animated.View
                  key={reminder.id}
                  entering={FadeInDown.delay(index * 80).duration(500)}
                >
                  <ReminderCard
                    reminder={reminder}
                    onDismiss={dismissReminder}
                    onAddToList={handleAddToList}
                  />
                </Animated.View>
              ))
            )
          ) : discoveries.length === 0 ? (
            <EmptyState type="no-discoveries" />
          ) : (
            discoveries.map((discovery, index) => (
              <Animated.View
                key={discovery.id}
                entering={FadeInDown.delay(index * 80).duration(500)}
              >
                <DiscoveryCard
                  discovery={discovery}
                  onAddToList={handleAddToList}
                />
              </Animated.View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <ListPickerModal
        visible={listPickerVisible}
        onClose={handleCloseModal}
        onSelect={handleSelectList}
        lists={lists}
      />
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerGlowOrb: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.purple[600],
    opacity: 0.12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: {
    ...Typography.h1,
    color: "#ffffff",
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  segmentTabActive: {
    backgroundColor: Colors.primary[500],
    ...Shadows.sm,
  },
  segmentText: {
    ...Typography.labelSm,
    color: "rgba(255,255,255,0.5)",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  segmentBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  segmentBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  segmentBadgeInactive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  segmentBadgeText: {
    ...Typography.caption,
    fontSize: 10,
  },
  segmentBadgeTextActive: {
    color: "#ffffff",
  },
  segmentBadgeTextInactive: {
    color: "rgba(255,255,255,0.6)",
  },

  // Prediction Card
  predictionCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  predictionTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  predictionName: {
    ...Typography.h3,
    color: Colors.neutral[900],
  },
  predictionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.accent[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.accent[600],
  },
  priceTag: {
    alignItems: "flex-end",
    marginLeft: Spacing.md,
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  priceValue: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },

  // Probability bar
  probabilityContainer: {
    marginBottom: Spacing.md,
  },
  probabilityLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  probabilityLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  probabilityValue: {
    ...Typography.labelSm,
  },
  probabilityTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral[100],
    overflow: "hidden",
  },
  probabilityFill: {
    height: 6,
    borderRadius: 3,
  },

  // Confidence badge
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  confidenceText: {
    ...Typography.caption,
  },

  reasonText: {
    ...Typography.bodySm,
    color: Colors.neutral[600],
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },

  predictionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },

  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  addToListText: {
    ...Typography.labelMd,
    color: Colors.primary[600],
  },
  addToListButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  addToListTextSmall: {
    ...Typography.labelSm,
    color: Colors.primary[600],
  },

  // Reminder Card
  reminderCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  reminderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reminderName: {
    ...Typography.h3,
    color: Colors.neutral[900],
  },
  reminderCategory: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    padding: 2,
  },
  reminderMessage: {
    ...Typography.bodyMd,
    color: Colors.neutral[700],
    marginBottom: Spacing.md,
  },

  urgencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  urgencyBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
  },

  consumptionContainer: {
    marginBottom: Spacing.md,
  },
  consumptionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  consumptionLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  consumptionValue: {
    ...Typography.labelSm,
  },
  consumptionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  consumptionFill: {
    height: 6,
    borderRadius: 3,
  },

  reminderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderFooterInfo: {
    flexDirection: "row",
    gap: Spacing.md,
    flex: 1,
    flexWrap: "wrap",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing["2xl"],
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.neutral[700],
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["3xl"],
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.neutral[900],
  },
  modalList: {
    paddingHorizontal: Spacing.xl,
  },
  modalListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    gap: Spacing.md,
  },
  modalListIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  modalListName: {
    ...Typography.labelMd,
    color: Colors.neutral[800],
  },
  modalListMeta: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  modalEmpty: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  modalEmptyText: {
    ...Typography.labelMd,
    color: Colors.neutral[600],
    marginTop: Spacing.md,
  },
  modalEmptySubtext: {
    ...Typography.bodySm,
    color: Colors.neutral[400],
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
