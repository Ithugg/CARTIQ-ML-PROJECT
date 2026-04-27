import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { updatePassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";
import { useAuthStore } from "../../stores/authStore";
import { usePurchaseStore } from "../../stores/purchaseStore";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian", icon: "leaf" },
  { id: "vegan", label: "Vegan", icon: "leaf-outline" },
  { id: "gluten-free", label: "Gluten-Free", icon: "nutrition" },
  { id: "dairy-free", label: "Dairy-Free", icon: "water-outline" },
  { id: "halal", label: "Halal", icon: "moon" },
  { id: "kosher", label: "Kosher", icon: "star" },
  { id: "keto", label: "Keto", icon: "fitness" },
  { id: "paleo", label: "Paleo", icon: "bonfire" },
  { id: "low-carb", label: "Low Carb", icon: "speedometer-outline" },
  { id: "low-sodium", label: "Low Sodium", icon: "water" },
  { id: "diabetic", label: "Diabetic-Friendly", icon: "medical" },
  { id: "nut-free", label: "Nut-Free", icon: "close-circle-outline" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const stats = usePurchaseStore((s) => s.stats);

  const [name, setName] = useState(user?.displayName || "");
  const [email] = useState(user?.email || "");
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || 2);
  const [weeklyBudget, setWeeklyBudget] = useState(String(user?.weeklyBudget || 150));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(
    user?.dietaryPreferences || []
  );

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    try {
      await updateProfile({
        displayName: name,
        householdSize,
        weeklyBudget: Number(weeklyBudget) || 150,
      });
      Alert.alert("Success", "Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      await updatePassword(currentUser, newPassword);
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        Alert.alert("Error", "Please log out and log back in before changing your password");
      } else {
        Alert.alert("Error", "Failed to update password");
      }
    }
  };

  const toggleDietaryPreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSaveDietaryPreferences = async () => {
    try {
      await updateProfile({ dietaryPreferences: selectedPreferences });
      setShowDietaryModal(false);
      Alert.alert("Success", "Dietary preferences updated");
    } catch {
      Alert.alert("Error", "Failed to update preferences");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Profile Hero */}
        <LinearGradient
          colors={Gradients.premiumDark}
          style={styles.profileSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatar}>
            <LinearGradient
              colors={Gradients.emeraldVibrant}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>
                {(user?.displayName || "U").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{user?.displayName || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Mini stats */}
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{stats?.totalLists || 0}</Text>
              <Text style={styles.miniStatLabel}>Lists</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>{stats?.totalItems || 0}</Text>
              <Text style={styles.miniStatLabel}>Items</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatValue}>${stats?.totalSpent?.toFixed(0) || "0"}</Text>
              <Text style={styles.miniStatLabel}>Spent</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Household Size</Text>
              <View style={styles.sizeRow}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.sizeBtn,
                      householdSize === n && styles.sizeBtnActive,
                    ]}
                    onPress={() => setHouseholdSize(n)}
                  >
                    <Text
                      style={[
                        styles.sizeBtnText,
                        householdSize === n && styles.sizeBtnTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weekly Budget ($)</Text>
            <TextInput
              style={styles.input}
              value={weeklyBudget}
              onChangeText={setWeeklyBudget}
              keyboardType="numeric"
              placeholder="150"
              placeholderTextColor={Colors.neutral[400]}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
            <Ionicons name="checkmark" size={18} color={Colors.neutral[0]} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <TouchableOpacity onPress={() => setShowDietaryModal(true)}>
              <Ionicons name="create-outline" size={22} color={Colors.primary[600]} />
            </TouchableOpacity>
          </View>
          {selectedPreferences.length > 0 ? (
            <View style={styles.tagContainer}>
              {selectedPreferences.map((pref) => (
                <View key={pref} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {dietaryOptions.find((o) => o.id === pref)?.label || pref}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No dietary preferences set</Text>
          )}
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          {(user?.allergies?.length || 0) > 0 ? (
            <View style={styles.tagContainer}>
              {user!.allergies.map((a) => (
                <View key={a} style={[styles.tag, { backgroundColor: Colors.danger[50], borderColor: Colors.danger[200] }]}>
                  <Text style={[styles.tagText, { color: Colors.danger[700] }]}>
                    {a.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergies set</Text>
          )}
        </View>

        {/* Goals & Lifestyle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals & Lifestyle</Text>
          {(user?.fitnessGoals?.length || 0) > 0 && (
            <View style={[styles.tagContainer, { marginBottom: Spacing.lg }]}>
              {user!.fitnessGoals.map((g) => (
                <View key={g} style={[styles.tag, { backgroundColor: Colors.purple[50], borderColor: Colors.purple[200] }]}>
                  <Text style={[styles.tagText, { color: Colors.purple[700] }]}>
                    {g.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.lifestyleRow}>
            <View style={styles.lifestyleItem}>
              <Ionicons name="restaurant-outline" size={18} color={Colors.neutral[500]} />
              <Text style={styles.lifestyleLabel}>Cooking</Text>
              <Text style={styles.lifestyleValue}>
                {(user?.cookingFrequency || "few_times_week").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Ionicons name="people-outline" size={18} color={Colors.neutral[500]} />
              <Text style={styles.lifestyleLabel}>Household</Text>
              <Text style={styles.lifestyleValue}>{user?.householdSize || 2} people</Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Ionicons name="wallet-outline" size={18} color={Colors.neutral[500]} />
              <Text style={styles.lifestyleLabel}>Budget</Text>
              <Text style={styles.lifestyleValue}>${user?.weeklyBudget || 150}/wk</Text>
            </View>
          </View>
        </View>

        {/* Redo Onboarding */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              Alert.alert("Redo Setup", "This will take you through the onboarding again to update your preferences.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Continue",
                  onPress: async () => {
                    await updateProfile({ onboardingComplete: false });
                    router.replace("/onboarding");
                  },
                },
              ]);
            }}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="refresh-outline" size={22} color={Colors.primary[600]} />
              <Text style={[styles.optionText, { color: Colors.primary[600] }]}>Redo Setup Wizard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary[400]} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.optionButton} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.optionLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={Colors.neutral[600]} />
              <Text style={styles.optionText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.danger[500]} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.version}>CartIQ v1.0.0</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={Colors.neutral[400]} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm password" placeholderTextColor={Colors.neutral[400]} />
              </View>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleUpdatePassword}>
                <Text style={styles.modalSaveButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dietary Preferences Modal */}
      <Modal visible={showDietaryModal} animationType="slide" transparent onRequestClose={() => setShowDietaryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dietary Preferences</Text>
              <TouchableOpacity onPress={() => setShowDietaryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Select all that apply to personalize your lists
              </Text>
              <View style={styles.preferencesGrid}>
                {dietaryOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.preferenceCard,
                      selectedPreferences.includes(opt.id) && styles.preferenceCardActive,
                    ]}
                    onPress={() => toggleDietaryPreference(opt.id)}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={28}
                      color={selectedPreferences.includes(opt.id) ? Colors.primary[600] : Colors.neutral[400]}
                    />
                    <Text
                      style={[
                        styles.preferenceLabel,
                        selectedPreferences.includes(opt.id) && styles.preferenceLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {selectedPreferences.includes(opt.id) && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark" size={14} color={Colors.neutral[0]} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveDietaryPreferences}>
                <Text style={styles.modalSaveButtonText}>
                  Save Preferences ({selectedPreferences.length})
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  profileSection: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["3xl"],
    borderBottomLeftRadius: BorderRadius["3xl"],
    borderBottomRightRadius: BorderRadius["3xl"],
  },
  avatar: {
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.primary[500]),
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarInitial: {
    ...Typography.displayMd,
    color: "#fff",
  },
  userName: {
    ...Typography.h1,
    color: "#fff",
    marginBottom: 2,
  },
  userEmail: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
  },
  miniStats: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  miniStat: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  miniStatValue: {
    ...Typography.h3,
    color: "#fff",
  },
  miniStatLabel: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  section: {
    backgroundColor: Colors.neutral[0],
    padding: Spacing.xl,
    marginTop: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[800],
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
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
    padding: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.neutral[800],
  },
  inputDisabled: {
    backgroundColor: Colors.neutral[100],
    color: Colors.neutral[400],
  },
  sizeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sizeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  sizeBtnActive: {
    backgroundColor: Colors.primary[600],
  },
  sizeBtnText: {
    ...Typography.labelMd,
    color: Colors.neutral[600],
  },
  sizeBtnTextActive: {
    color: Colors.neutral[0],
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary[600],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  saveButtonText: {
    color: Colors.neutral[0],
    ...Typography.labelMd,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  tagText: {
    ...Typography.labelSm,
    color: Colors.primary[700],
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
    fontStyle: "italic",
  },
  lifestyleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  lifestyleItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  lifestyleLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  lifestyleValue: {
    ...Typography.labelSm,
    color: Colors.neutral[800],
    textAlign: "center",
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  optionText: {
    ...Typography.bodyMd,
    color: Colors.neutral[700],
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.danger[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger[200],
    gap: Spacing.sm,
  },
  logoutButtonText: {
    ...Typography.labelMd,
    color: Colors.danger[500],
  },
  version: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral[0],
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "80%",
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
  },
  modalDescription: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    marginBottom: Spacing.lg,
  },
  preferencesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  preferenceCard: {
    width: "47%",
    backgroundColor: Colors.neutral[50],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  preferenceCardActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  preferenceLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  preferenceLabelActive: {
    color: Colors.primary[700],
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveButton: {
    backgroundColor: Colors.primary[600],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...Shadows.sm,
  },
  modalSaveButtonText: {
    color: Colors.neutral[0],
    ...Typography.labelMd,
  },
});
