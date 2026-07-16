import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  radius,
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

export function AppButton({
  accessibilityHint,
  disabled = false,
  icon,
  label,
  loading = false,
  onPress,
  style,
  variant = "primary",
}: {
  accessibilityHint?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  loading?: boolean;
  onPress(): void;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
}) {
  const palette = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary"
      ? palette.primary
      : variant === "danger"
        ? palette.risk
        : variant === "secondary"
          ? palette.surface
          : "transparent";
  const textColor =
    variant === "primary" ||
    variant === "danger"
      ? variant === "primary"
        ? palette.onPrimary
        : palette.white
      : palette.ink;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor:
            focused
              ? palette.focus
              : variant === "secondary"
                ? palette.line
                : "transparent",
          borderWidth: 2,
          opacity: isDisabled
            ? 0.45
            : pressed
              ? 0.78
              : hovered
                ? 0.9
                : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
        />
      ) : (
        <>
          {icon ? (
            <Ionicons
              color={textColor}
              name={icon}
              size={19}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: textColor },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  label: {
    ...type.bodyStrong,
  },
});
