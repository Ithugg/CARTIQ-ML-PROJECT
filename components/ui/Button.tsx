import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary[600], text: Colors.neutral[0] },
  secondary: { bg: Colors.accent[500], text: Colors.neutral[0] },
  outline: { bg: "transparent", text: Colors.primary[600], border: Colors.primary[600] },
  ghost: { bg: "transparent", text: Colors.primary[600] },
  danger: { bg: Colors.danger[500], text: Colors.neutral[0] },
};

const sizeStyles: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number; iconSize: number }> = {
  sm: { paddingH: Spacing.md, paddingV: Spacing.sm, fontSize: 13, iconSize: 16 },
  md: { paddingH: Spacing.lg, paddingV: Spacing.md, fontSize: 15, iconSize: 20 },
  lg: { paddingH: Spacing.xl, paddingV: Spacing.lg, fontSize: 17, iconSize: 24 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderColor: v.border || "transparent",
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === "primary" && Shadows.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Ionicons name={icon} size={s.iconSize} color={v.text} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>{title}</Text>
          {icon && iconPosition === "right" && (
            <Ionicons name={icon} size={s.iconSize} color={v.text} style={styles.iconRight} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: 2,
  },
  iconRight: {
    marginLeft: 2,
  },
});
