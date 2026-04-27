import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { icon: "sparkles" as const, label: "AI Predictions", color: Colors.purple[500] },
  { icon: "list" as const, label: "Smart Lists", color: Colors.primary[500] },
  { icon: "analytics" as const, label: "Analytics", color: Colors.accent[500] },
  { icon: "notifications" as const, label: "Reminders", color: Colors.warning[500] },
];

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Animated glow pulse
  const glowScale = useSharedValue(1);
  useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.6,
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential") {
        Alert.alert("Error", "Invalid email or password");
      } else if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Incorrect password");
      } else {
        Alert.alert("Error", "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.premiumDark}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated glow orbs */}
      <Animated.View style={[styles.glowOrb, styles.glowOrb1, glowStyle]} />
      <Animated.View style={[styles.glowOrb, styles.glowOrb2, glowStyle]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={Gradients.emeraldVibrant}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="cart" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>CartIQ</Text>
            <Text style={styles.tagline}>Your AI-powered grocery companion</Text>
          </Animated.View>

          {/* Feature pills */}
          <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.featureRow}>
            {FEATURES.map((f, i) => (
              <View key={f.label} style={styles.featurePill}>
                <Ionicons name={f.icon} size={14} color={f.color} />
                <Text style={styles.featurePillText}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue shopping smarter</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === "email" && styles.inputWrapperFocused,
              ]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focusedField === "email" ? Colors.primary[500] : Colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.neutral[400]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === "password" && styles.inputWrapperFocused,
              ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focusedField === "password" ? Colors.primary[500] : Colors.neutral[400]}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.neutral[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={Colors.neutral[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? [Colors.neutral[300], Colors.neutral[400]] : Gradients.ctaPrimary}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Trust badges */}
          <Animated.View entering={FadeInUp.delay(600).duration(700)} style={styles.trustRow}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary[400]} />
              <Text style={styles.trustText}>Secure</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustBadge}>
              <Ionicons name="cloud-done" size={14} color={Colors.primary[400]} />
              <Text style={styles.trustText}>Cloud Sync</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustBadge}>
              <Ionicons name="flash" size={14} color={Colors.primary[400]} />
              <Text style={styles.trustText}>AI-Powered</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
    paddingTop: height * 0.08,
    paddingBottom: Spacing["4xl"],
  },

  // Glow orbs
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrb1: {
    width: 300,
    height: 300,
    top: -60,
    right: -80,
    backgroundColor: Colors.primary[700],
    opacity: 0.15,
  },
  glowOrb2: {
    width: 250,
    height: 250,
    bottom: height * 0.15,
    left: -100,
    backgroundColor: Colors.teal[600],
    opacity: 0.1,
  },

  // Brand
  brandSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoContainer: {
    marginBottom: Spacing.lg,
    ...Shadows.glow(Colors.primary[500]),
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    ...Typography.displayLg,
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
  },

  // Feature pills
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing["3xl"],
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  featurePillText: {
    ...Typography.caption,
    color: Colors.neutral[300],
  },

  // Form card
  formCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius["3xl"],
    padding: Spacing["2xl"],
    ...Shadows.xl,
  },
  formTitle: {
    ...Typography.h1,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
    marginBottom: Spacing["2xl"],
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  inputIcon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Typography.bodyLg,
    color: Colors.neutral[800],
    minHeight: 48,
  },
  eyeBtn: {
    padding: Spacing.md,
  },

  // CTA
  ctaButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.sm,
    ...Shadows.glow(Colors.primary[600]),
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  ctaText: {
    ...Typography.labelLg,
    color: "#fff",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
  },
  footerText: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  linkText: {
    ...Typography.labelMd,
    color: Colors.primary[600],
  },

  // Trust badges
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["3xl"],
    gap: Spacing.md,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustText: {
    ...Typography.caption,
    color: Colors.neutral[400],
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.neutral[600],
  },
});
