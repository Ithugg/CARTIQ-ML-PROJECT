import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { BorderRadius, Colors, Spacing, Typography } from "../../constants/theme";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? Colors.danger[500]
    : focused
    ? Colors.primary[500]
    : Colors.neutral[200];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor }]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={Colors.neutral[400]} style={styles.leftIcon} />
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
          placeholderTextColor={Colors.neutral[400]}
          onFocus={(e) => {
            setFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            textInputProps.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} disabled={!onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.labelMd,
    color: Colors.neutral[700],
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[0],
    minHeight: 48,
  },
  leftIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.bodyLg,
    color: Colors.neutral[800],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    minHeight: 48,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.sm,
  },
  rightIcon: {
    padding: Spacing.md,
  },
  error: {
    ...Typography.bodySm,
    color: Colors.danger[500],
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.bodySm,
    color: Colors.neutral[400],
    marginTop: Spacing.xs,
  },
});
