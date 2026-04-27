import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { BorderRadius, Colors, Gradients, Shadows, Spacing, Typography } from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

const { height } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "This email is already registered");
      } else {
        Alert.alert("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    field: string,
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    setter: (v: string) => void,
    options?: {
      secure?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      returnKeyType?: "next" | "done";
      onSubmitEditing?: () => void;
    }
  ) => (
    <View style={styles.inputGroup}>
      <View style={[
        styles.inputWrapper,
        focusedField === field && styles.inputWrapperFocused,
      ]}>
        <Ionicons
          name={icon}
          size={18}
          color={focusedField === field ? Colors.primary[500] : Colors.neutral[400]}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.neutral[400]}
          value={value}
          onChangeText={setter}
          secureTextEntry={options?.secure && !showPassword}
          keyboardType={options?.keyboardType}
          autoCapitalize={options?.autoCapitalize ?? "none"}
          editable={!loading}
          returnKeyType={options?.returnKeyType ?? "next"}
          onSubmitEditing={options?.onSubmitEditing}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
        />
        {options?.secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.premiumDark}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glow orbs */}
      <View style={[styles.glowOrb, styles.glowOrb1]} />
      <View style={[styles.glowOrb, styles.glowOrb2]} />

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
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={Gradients.emeraldVibrant}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="cart" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>Join CartIQ</Text>
            <Text style={styles.tagline}>Start shopping smarter with AI</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInUp.delay(300).duration(800)} style={styles.formCard}>
            {/* Steps indicator */}
            <View style={styles.stepsRow}>
              <View style={[styles.step, styles.stepActive]}>
                <Text style={[styles.stepText, styles.stepTextActive]}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.step}>
                <Text style={styles.stepText}>2</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.step}>
                <Text style={styles.stepText}>3</Text>
              </View>
            </View>
            <Text style={styles.stepLabel}>Create your account</Text>

            {renderInput("name", "person-outline", "Full name", name, setName, { autoCapitalize: "words" })}
            {renderInput("email", "mail-outline", "Email address", email, setEmail, { keyboardType: "email-address" })}
            {renderInput("password", "lock-closed-outline", "Password (min 6 chars)", password, setPassword, { secure: true })}
            {renderInput("confirm", "shield-checkmark-outline", "Confirm password", confirmPassword, setConfirmPassword, { secure: true, returnKeyType: "done", onSubmitEditing: handleRegister })}

            {/* Password strength hint */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={[
                  styles.strengthBar,
                  { backgroundColor: password.length >= 8 ? Colors.primary[500] : password.length >= 6 ? Colors.warning[500] : Colors.danger[500] },
                  { width: password.length >= 8 ? "100%" : password.length >= 6 ? "60%" : "30%" },
                ]} />
                <Text style={styles.strengthText}>
                  {password.length >= 8 ? "Strong" : password.length >= 6 ? "Good" : "Too short"}
                </Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
              onPress={handleRegister}
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
                    <Text style={styles.ctaText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Value props */}
          <Animated.View entering={FadeInUp.delay(500).duration(700)} style={styles.valueProps}>
            {[
              { icon: "time-outline" as const, text: "Set up in 30 seconds" },
              { icon: "card-outline" as const, text: "Free forever, no credit card" },
              { icon: "lock-closed-outline" as const, text: "Your data stays private" },
            ].map((v) => (
              <View key={v.text} style={styles.valueProp}>
                <Ionicons name={v.icon} size={16} color={Colors.primary[400]} />
                <Text style={styles.valuePropText}>{v.text}</Text>
              </View>
            ))}
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
    padding: Spacing.xl,
    paddingTop: height * 0.06,
    paddingBottom: Spacing["4xl"],
  },

  // Glow orbs
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrb1: {
    width: 280,
    height: 280,
    top: -50,
    left: -80,
    backgroundColor: Colors.primary[700],
    opacity: 0.12,
  },
  glowOrb2: {
    width: 200,
    height: 200,
    bottom: height * 0.2,
    right: -60,
    backgroundColor: Colors.purple[600],
    opacity: 0.08,
  },

  // Brand
  brandSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoContainer: {
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.primary[500]),
  },
  logoGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    ...Typography.displayMd,
    color: "#fff",
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
  },

  // Form card
  formCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius["3xl"],
    padding: Spacing["2xl"],
    ...Shadows.xl,
  },

  // Steps
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  stepActive: {
    backgroundColor: Colors.primary[600],
  },
  stepText: {
    ...Typography.labelSm,
    color: Colors.neutral[400],
  },
  stepTextActive: {
    color: "#fff",
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.neutral[200],
    marginHorizontal: Spacing.xs,
  },
  stepLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    textAlign: "center",
    marginBottom: Spacing.xl,
  },

  inputGroup: {
    marginBottom: Spacing.md,
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
    ...Typography.bodyMd,
    color: Colors.neutral[800],
    minHeight: 48,
  },
  eyeBtn: {
    padding: Spacing.md,
  },

  // Password strength
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.xs,
  },
  strengthBar: {
    height: 3,
    borderRadius: 2,
  },
  strengthText: {
    ...Typography.caption,
    color: Colors.neutral[500],
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
    marginTop: Spacing.xl,
  },
  footerText: {
    ...Typography.bodyMd,
    color: Colors.neutral[500],
  },
  linkText: {
    ...Typography.labelMd,
    color: Colors.primary[600],
  },

  // Value props
  valueProps: {
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  valueProp: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  valuePropText: {
    ...Typography.bodySm,
    color: Colors.neutral[400],
  },
});
