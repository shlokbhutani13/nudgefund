import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { PropsWithChildren } from "react";
import {
  radius,
  spacing,
  useAppTheme,
} from "@/constants/theme";

export function AppCard({
  children,
  style,
  tone = "surface",
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: "surface" | "mint" | "amber" | "risk";
}>) {
  const palette = useAppTheme();
  const backgroundColor =
    tone === "mint"
      ? palette.mintSoft
      : tone === "amber"
        ? palette.amberSoft
        : tone === "risk"
          ? palette.riskSoft
          : palette.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: palette.line,
          shadowColor: palette.ink,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
});
