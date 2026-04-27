import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Gradients, Spacing, BorderRadius, Typography, Shadows } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useListsStore } from "../../stores/listsStore";
import type { GroceryList } from "../../types";

export default function ListsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const lists = useListsStore((s) => s.lists);
  const isLoading = useListsStore((s) => s.isLoading);
  const createList = useListsStore((s) => s.createList);
  const deleteList = useListsStore((s) => s.deleteList);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("100");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Please enter a list name");
      return;
    }
    if (!user) return;

    setCreating(true);
    try {
      const id = await createList(user.uid, newName.trim(), Number(newBudget) || 100);
      setShowModal(false);
      setNewName("");
      setNewBudget("100");
      router.push({ pathname: "/(app)/listdetail", params: { listId: id } });
    } catch (error) {
      console.error("Error creating list:", error);
      Alert.alert("Error", "Failed to create list");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (list: GroceryList) => {
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${list.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteList(list.id),
        },
      ]
    );
  };

  const renderListCard = ({ item: list }: { item: GroceryList }) => {
    const itemCount = list.items.length;
    const checkedCount = list.items.filter((i) => i.checked).length;
    const progress = itemCount > 0 ? checkedCount / itemCount : 0;
    const createdDate = new Date(list.createdAt);
    const dayLabel = createdDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return (
      <TouchableOpacity
        style={[styles.listCard, Shadows.md]}
        activeOpacity={0.7}
        onPress={() =>
          router.push({ pathname: "/(app)/listdetail", params: { listId: list.id } })
        }
        onLongPress={() => handleDelete(list)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardIcon}>
            <Ionicons name="cart" size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.dateBadge}>{dayLabel}</Text>
          </View>
        </View>

        <Text style={styles.cardName} numberOfLines={1}>
          {list.name}
        </Text>

        <View style={styles.cardStats}>
          <Text style={styles.cardStatText}>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.cardDot}> · </Text>
          <Text style={styles.cardStatText}>
            {checkedCount}/{itemCount} done
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor:
                  progress === 1 ? Colors.primary[500] : Colors.primary[400],
              },
            ]}
          />
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardEstimate}>
            ${list.totalEstimate?.toFixed(2) || "0.00"}
          </Text>
          {list.budget > 0 && (
            <Text style={styles.cardBudget}>/ ${list.budget.toFixed(0)} budget</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Lists</Text>
          <Text style={styles.headerSubtitle}>
            {lists.length} list{lists.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color={Colors.neutral[0]} />
        </TouchableOpacity>
      </View>

      {lists.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="basket-outline" size={56} color={Colors.neutral[300]} />
          </View>
          <Text style={styles.emptyTitle}>No grocery lists yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first list to start tracking your groceries
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={20} color={Colors.neutral[0]} />
            <Text style={styles.emptyBtnText}>Create First List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.id}
          renderItem={renderListCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}

      {/* Create List Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New List</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>List Name</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g. Weekly Groceries"
                  placeholderTextColor={Colors.neutral[400]}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget ($)</Text>
                <TextInput
                  style={styles.input}
                  value={newBudget}
                  onChangeText={setNewBudget}
                  placeholder="100"
                  placeholderTextColor={Colors.neutral[400]}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.neutral[0]} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color={Colors.neutral[0]} />
                    <Text style={styles.createBtnText}>Create List</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.neutral[900],
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.glow(Colors.primary[500]),
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  cardMeta: {},
  dateBadge: {
    ...Typography.caption,
    color: Colors.neutral[500],
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  cardName: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.xs,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardStatText: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
  },
  cardDot: {
    color: Colors.neutral[300],
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.neutral[100],
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  cardEstimate: {
    ...Typography.labelLg,
    color: Colors.neutral[800],
  },
  cardBudget: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },

  // Empty
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  emptyBtnText: {
    ...Typography.labelMd,
    color: Colors.neutral[0],
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
  },
  modalBody: {
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.neutral[800],
    minHeight: 44,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary[600],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  createBtnDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  createBtnText: {
    ...Typography.labelMd,
    color: Colors.neutral[0],
  },
});
