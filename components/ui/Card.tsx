import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { BorderRadius, Colors, Shadows, Spacing } from "../../constants/theme";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
}

export function Card({
  children,
  variant = "default",
  onPress,
  style,
  padding = Spacing.lg,
}: CardProps) {
  const cardStyle = [
    styles.base,
    { padding },
    variant === "elevated" && [styles.elevated, Shadows.md],
    variant === "outlined" && styles.outlined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
  },
  elevated: {
    backgroundColor: Colors.neutral[0],
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
});
