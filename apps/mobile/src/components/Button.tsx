import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  style?: object;
  disabled?: boolean;
};

export const Button = ({
  label,
  onPress,
  variant = "secondary",
  icon,
  iconPosition = "left",
  style,
  disabled = false,
}: ButtonProps) => {
  const theme = useOrganicTheme();

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: theme.accent }
      : variant === "ghost"
        ? { backgroundColor: "transparent" }
        : { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.border };

  const textColor = variant === "primary" ? theme.accentText : variant === "ghost" ? theme.accent : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, variantStyle, disabled && styles.disabled, style]}
    >
      {icon && iconPosition === "left" && <View>{icon}</View>}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {icon && iconPosition === "right" && <View>{icon}</View>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: OrganicSpacing[4],
    paddingVertical: OrganicSpacing[2],
    borderRadius: OrganicRadius.pill,
  },
  label: {
    fontFamily: FontFamily.heading,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.45,
  },
});
