import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { BorderRadius, Colors, Spacing, Typography } from "../../constants/theme";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.primary[100], text: Colors.primary[800] },
  warning: { bg: Colors.warning[100], text: Colors.warning[600] },
  danger: { bg: Colors.danger[100], text: Colors.danger[700] },
  info: { bg: Colors.accent[100], text: Colors.accent[600] },
  neutral: { bg: Colors.neutral[100], text: Colors.neutral[600] },
};

export function Badge({ text, variant = "neutral", size = "sm", style }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.bg },
        size === "md" && styles.md,
        style,
      ]}
    >
      <Text
        style={[
          size === "sm" ? styles.textSm : styles.textMd,
          { color: colors.text },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  textSm: {
    ...Typography.caption,
    fontWeight: "600",
  },
  textMd: {
    ...Typography.labelSm,
  },
});
