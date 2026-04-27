import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { BorderRadius, Colors, Spacing, Typography } from "../../constants/theme";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: string;
  overColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = false,
  color = Colors.primary[500],
  overColor = Colors.danger[500],
  height = 8,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(progress, 100);
  const isOver = progress > 100;
  const fillColor = isOver ? overColor : color;

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, isOver && { color: overColor }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: fillColor,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySm,
    color: Colors.neutral[500],
  },
  percentage: {
    ...Typography.labelSm,
    color: Colors.neutral[600],
  },
  track: {
    backgroundColor: Colors.neutral[200],
    overflow: "hidden",
  },
  fill: {},
});
