import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon = "folder-open-outline",
  title,
  description,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={Colors.neutral[300]} />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionTitle && onAction && (
        <Button title={actionTitle} onPress={onAction} variant="primary" size="md" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["5xl"],
  },
  title: {
    ...Typography.h3,
    color: Colors.neutral[600],
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  description: {
    ...Typography.bodyMd,
    color: Colors.neutral[400],
    marginTop: Spacing.sm,
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.xl,
  },
});
