import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "../constants/theme";
import { useAuthStore } from "../stores/authStore";

const { width } = Dimensions.get("window");
const TOTAL_STEPS = 5;

// ─── Option Data ───

const DIETARY_OPTIONS = [
  { id: "none", label: "No restrictions", icon: "checkmark-circle" as const },
  { id: "vegetarian", label: "Vegetarian", icon: "leaf" as const },
  { id: "vegan", label: "Vegan", icon: "nutrition" as const },
  { id: "halal", label: "Halal", icon: "moon" as const },
  { id: "kosher", label: "Kosher", icon: "star" as const },
  { id: "gluten_free", label: "Gluten-Free", icon: "ban" as const },
  { id: "dairy_free", label: "Dairy-Free", icon: "water" as const },
  { id: "keto", label: "Keto", icon: "flame" as const },
  { id: "paleo", label: "Paleo", icon: "fitness" as const },
  { id: "pescatarian", label: "Pescatarian", icon: "fish" as const },
];

const ALLERGY_OPTIONS = [
  { id: "nuts", label: "Tree Nuts", icon: "alert-circle" as const },
  { id: "peanuts", label: "Peanuts", icon: "alert-circle" as const },
  { id: "shellfish", label: "Shellfish", icon: "alert-circle" as const },
  { id: "dairy", label: "Dairy", icon: "alert-circle" as const },
  { id: "eggs", label: "Eggs", icon: "alert-circle" as const },
  { id: "soy", label: "Soy", icon: "alert-circle" as const },
  { id: "wheat", label: "Wheat/Gluten", icon: "alert-circle" as const },
  { id: "fish", label: "Fish", icon: "alert-circle" as const },
  { id: "sesame", label: "Sesame", icon: "alert-circle" as const },
  { id: "none", label: "No allergies", icon: "checkmark-circle" as const },
];

const FITNESS_GOALS = [
  { id: "lose_weight", label: "Lose Weight", icon: "trending-down" as const, desc: "Low calorie, high protein" },
  { id: "build_muscle", label: "Build Muscle", icon: "barbell" as const, desc: "High protein, balanced carbs" },
  { id: "eat_healthy", label: "Eat Healthier", icon: "heart" as const, desc: "Balanced, whole foods" },
  { id: "save_money", label: "Save Money", icon: "wallet" as const, desc: "Budget-friendly meals" },
  { id: "meal_variety", label: "More Variety", icon: "restaurant" as const, desc: "Try new recipes" },
  { id: "no_goal", label: "No specific goal", icon: "happy" as const, desc: "Just grocery shopping" },
];

const COOKING_OPTIONS = [
  { id: "rarely" as const, label: "Rarely", desc: "Mostly pre-made or takeout", icon: "fast-food" as const },
  { id: "few_times_week" as const, label: "A Few Times/Week", desc: "Cook 2-4 times per week", icon: "cafe" as const },
  { id: "daily" as const, label: "Daily", desc: "Cook most meals at home", icon: "restaurant" as const },
  { id: "meal_prep" as const, label: "Meal Prep", desc: "Batch cooking for the week", icon: "layers" as const },
];

const BUDGET_OPTIONS = [
  { id: "tight", label: "Budget-Friendly", amount: "$50-80/week", sensitivity: "high" as const, icon: "cash" as const },
  { id: "moderate", label: "Moderate", amount: "$80-150/week", sensitivity: "medium" as const, icon: "card" as const },
  { id: "flexible", label: "Flexible", amount: "$150-250/week", sensitivity: "low" as const, icon: "diamond" as const },
  { id: "no_limit", label: "No Limit", amount: "$250+/week", sensitivity: "low" as const, icon: "star" as const },
];

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [step, setStep] = useState(0);
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || 2);
  const [dietary, setDietary] = useState<string[]>(user?.dietaryPreferences || []);
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [fitnessGoals, setFitnessGoals] = useState<string[]>(user?.fitnessGoals || []);
  const [cookingFreq, setCookingFreq] = useState(user?.cookingFrequency || "few_times_week");
  const [budget, setBudget] = useState<{ sensitivity: "low" | "medium" | "high"; weekly: number }>({
    sensitivity: user?.priceSensitivity || "medium",
    weekly: user?.weeklyBudget || 150,
  });
  const [saving, setSaving] = useState(false);

  const firstName = user?.displayName?.split(" ")[0] || "there";

  const toggleSelection = (
    list: string[],
    setList: (v: string[]) => void,
    id: string,
    noneId = "none"
  ) => {
    if (id === noneId) {
      setList(list.includes(noneId) ? [] : [noneId]);
      return;
    }
    const filtered = list.filter((i) => i !== noneId);
    if (filtered.includes(id)) {
      setList(filtered.filter((i) => i !== id));
    } else {
      setList([...filtered, id]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        householdSize,
        dietaryPreferences: dietary.filter((d) => d !== "none"),
        allergies: allergies.filter((a) => a !== "none"),
        fitnessGoals: fitnessGoals.filter((g) => g !== "no_goal"),
        cookingFrequency: cookingFreq,
        priceSensitivity: budget.sensitivity,
        weeklyBudget: budget.weekly,
        onboardingComplete: true,
      });
      router.replace("/(app)/dashboard");
    } catch (e) {
      console.error("Onboarding save error:", e);
      setSaving(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return true; // household size always has a default
      case 1: return dietary.length > 0;
      case 2: return allergies.length > 0;
      case 3: return fitnessGoals.length > 0;
      case 4: return true; // cooking + budget always have defaults
      default: return true;
    }
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleFinish();
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // ─── Step Renderers ───

  const renderHouseholdStep = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <LinearGradient colors={Gradients.emeraldVibrant} style={styles.stepIconGradient}>
          <Ionicons name="people" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.stepTitle}>How many people{"\n"}are in your household?</Text>
      <Text style={styles.stepSubtitle}>
        This helps us estimate quantities and budgets
      </Text>

      <View style={styles.householdRow}>
        {HOUSEHOLD_SIZES.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.householdBtn,
              householdSize === size && styles.householdBtnActive,
            ]}
            onPress={() => setHouseholdSize(size)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.householdBtnText,
                householdSize === size && styles.householdBtnTextActive,
              ]}
            >
              {size === 6 ? "6+" : size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.householdInfo}>
        <Ionicons name="information-circle" size={16} color={Colors.primary[500]} />
        <Text style={styles.householdInfoText}>
          {householdSize === 1
            ? "Shopping for one? We'll optimize for smaller portions."
            : householdSize <= 3
            ? "Perfect, we'll suggest family-sized portions."
            : "Large household! We'll prioritize bulk-friendly items."}
        </Text>
      </View>
    </Animated.View>
  );

  const renderDietaryStep = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <LinearGradient colors={["#059669", "#10b981"]} style={styles.stepIconGradient}>
          <Ionicons name="leaf" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.stepTitle}>Any dietary preferences?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>

      <View style={styles.chipGrid}>
        {DIETARY_OPTIONS.map((opt) => {
          const selected = dietary.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleSelection(dietary, setDietary, opt.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={selected ? "#fff" : Colors.neutral[500]}
              />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderAllergyStep = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <LinearGradient colors={[Colors.danger[500], Colors.rose[500]]} style={styles.stepIconGradient}>
          <Ionicons name="shield-checkmark" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.stepTitle}>Any food allergies?</Text>
      <Text style={styles.stepSubtitle}>
        We'll flag these items in recipes and lists
      </Text>

      <View style={styles.chipGrid}>
        {ALLERGY_OPTIONS.map((opt) => {
          const selected = allergies.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.chip,
                selected && (opt.id === "none" ? styles.chipSelected : styles.chipDanger),
              ]}
              onPress={() => toggleSelection(allergies, setAllergies, opt.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={
                  selected
                    ? "#fff"
                    : opt.id === "none"
                    ? Colors.neutral[500]
                    : Colors.danger[500]
                }
              />
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderGoalsStep = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <LinearGradient colors={Gradients.purpleGlow} style={styles.stepIconGradient}>
          <Ionicons name="trophy" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.stepTitle}>What are your goals?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply — helps AI personalize suggestions</Text>

      <View style={styles.goalGrid}>
        {FITNESS_GOALS.map((goal) => {
          const selected = fitnessGoals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, selected && styles.goalCardSelected]}
              onPress={() => toggleSelection(fitnessGoals, setFitnessGoals, goal.id, "no_goal")}
              activeOpacity={0.7}
            >
              <View style={[styles.goalIconWrap, selected && styles.goalIconWrapSelected]}>
                <Ionicons
                  name={goal.icon}
                  size={22}
                  color={selected ? "#fff" : Colors.neutral[500]}
                />
              </View>
              <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                {goal.label}
              </Text>
              <Text style={[styles.goalDesc, selected && styles.goalDescSelected]}>
                {goal.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderLifestyleStep = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.stepContent}>
      <View style={styles.stepIconWrap}>
        <LinearGradient colors={[Colors.accent[500], Colors.accent[600]]} style={styles.stepIconGradient}>
          <Ionicons name="settings" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.stepTitle}>Almost done!</Text>
      <Text style={styles.stepSubtitle}>Tell us about your cooking & budget</Text>

      <Text style={styles.miniSectionTitle}>How often do you cook?</Text>
      <View style={styles.cookingGrid}>
        {COOKING_OPTIONS.map((opt) => {
          const selected = cookingFreq === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.cookingCard, selected && styles.cookingCardSelected]}
              onPress={() => setCookingFreq(opt.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={20}
                color={selected ? Colors.primary[600] : Colors.neutral[400]}
              />
              <Text style={[styles.cookingLabel, selected && styles.cookingLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.cookingDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.miniSectionTitle, { marginTop: Spacing.xl }]}>Weekly grocery budget</Text>
      <View style={styles.budgetGrid}>
        {BUDGET_OPTIONS.map((opt) => {
          const selected = budget.sensitivity === opt.sensitivity && (
            (opt.id === "tight" && budget.weekly <= 80) ||
            (opt.id === "moderate" && budget.weekly > 80 && budget.weekly <= 150) ||
            (opt.id === "flexible" && budget.weekly > 150 && budget.weekly <= 250) ||
            (opt.id === "no_limit" && budget.weekly > 250)
          );
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.budgetCard, selected && styles.budgetCardSelected]}
              onPress={() => {
                const amounts: Record<string, number> = { tight: 65, moderate: 120, flexible: 200, no_limit: 300 };
                setBudget({ sensitivity: opt.sensitivity, weekly: amounts[opt.id] });
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={selected ? Colors.primary[600] : Colors.neutral[400]}
              />
              <Text style={[styles.budgetLabel, selected && styles.budgetLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.budgetAmount}>{opt.amount}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const steps = [
    renderHouseholdStep,
    renderDietaryStep,
    renderAllergyStep,
    renderGoalsStep,
    renderLifestyleStep,
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.premiumDark}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        {/* Progress bar */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
                i < step && styles.progressDotDone,
              ]}
            />
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.headerGreeting}>
            {step === 0 ? `Hey ${firstName}!` : `Step ${step + 1} of ${TOTAL_STEPS}`}
          </Text>
          <Text style={styles.headerSubtitle}>
            {step === 0
              ? "Let's personalize your CartIQ experience"
              : "Setting up your preferences"}
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {steps[step]()}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={Colors.neutral[600]} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleFinish}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
          onPress={goNext}
          disabled={!canAdvance() || saving}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={canAdvance() ? Gradients.ctaPrimary : [Colors.neutral[200], Colors.neutral[200]]}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.nextBtnText, !canAdvance() && styles.nextBtnTextDisabled]}>
              {saving ? "Saving..." : step === TOTAL_STEPS - 1 ? "Finish Setup" : "Continue"}
            </Text>
            {!saving && (
              <Ionicons
                name={step === TOTAL_STEPS - 1 ? "checkmark" : "chevron-forward"}
                size={18}
                color={canAdvance() ? "#fff" : Colors.neutral[400]}
              />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  progressRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressDotActive: {
    backgroundColor: Colors.primary[400],
  },
  progressDotDone: {
    backgroundColor: Colors.primary[500],
  },
  headerGreeting: {
    ...Typography.h1,
    color: "#fff",
  },
  headerSubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
    marginTop: 4,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["4xl"],
  },

  // Step content
  stepContent: {
    alignItems: "center",
  },
  stepIconWrap: {
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  stepIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTitle: {
    ...Typography.h1,
    color: Colors.neutral[800],
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },

  // Household
  householdRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  householdBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.neutral[0],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  householdBtnActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  householdBtnText: {
    ...Typography.h2,
    color: Colors.neutral[600],
  },
  householdBtnTextActive: {
    color: Colors.primary[700],
  },
  householdInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  householdInfoText: {
    ...Typography.bodySm,
    color: Colors.primary[700],
    flex: 1,
  },

  // Chips (dietary, allergies)
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  chipDanger: {
    backgroundColor: Colors.danger[500],
    borderColor: Colors.danger[500],
  },
  chipText: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
  },
  chipTextSelected: {
    color: "#fff",
  },

  // Goals
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "center",
    width: "100%",
  },
  goalCard: {
    width: (width - Spacing.xl * 2 - Spacing.md) / 2,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    ...Shadows.sm,
  },
  goalCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  goalIconWrapSelected: {
    backgroundColor: Colors.primary[500],
  },
  goalLabel: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
    textAlign: "center",
    marginBottom: 2,
  },
  goalLabelSelected: {
    color: Colors.primary[800],
  },
  goalDesc: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: "center",
  },
  goalDescSelected: {
    color: Colors.primary[600],
  },

  // Cooking frequency
  miniSectionTitle: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  cookingGrid: {
    width: "100%",
    gap: Spacing.sm,
  },
  cookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.neutral[0],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    ...Shadows.sm,
  },
  cookingCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  cookingLabel: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
  },
  cookingLabelSelected: {
    color: Colors.primary[800],
  },
  cookingDesc: {
    ...Typography.caption,
    color: Colors.neutral[400],
    flex: 1,
  },

  // Budget
  budgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    width: "100%",
  },
  budgetCard: {
    width: (width - Spacing.xl * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.neutral[0],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    ...Shadows.sm,
  },
  budgetCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  budgetLabel: {
    ...Typography.labelSm,
    color: Colors.neutral[700],
    marginTop: Spacing.xs,
  },
  budgetLabelSelected: {
    color: Colors.primary[800],
  },
  budgetAmount: {
    ...Typography.caption,
    color: Colors.neutral[400],
    marginTop: 2,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  backBtnText: {
    ...Typography.labelMd,
    color: Colors.neutral[600],
  },
  skipBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  skipBtnText: {
    ...Typography.labelSm,
    color: Colors.neutral[400],
  },
  nextBtn: {},
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  nextBtnText: {
    ...Typography.labelMd,
    color: "#fff",
  },
  nextBtnTextDisabled: {
    color: Colors.neutral[400],
  },
});
