import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  rightElement,
  style,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.neutral[800]} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {rightElement}
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            <Ionicons name={rightIcon} size={24} color={Colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  left: {
    width: 40,
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    ...Typography.h2,
    color: Colors.neutral[800],
    textAlign: "center",
  },
  right: {
    width: 40,
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backButton: {
    padding: Spacing.xs,
  },
  rightButton: {
    padding: Spacing.xs,
  },
});
