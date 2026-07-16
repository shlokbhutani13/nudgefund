import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  spacing,
  useAppTheme,
} from "@/constants/theme";

export function AppScreen({
  children,
  maxWidth = 1120,
  scroll = true,
}: PropsWithChildren<{
  maxWidth?: number;
  scroll?: boolean;
}>) {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const horizontalPadding =
    width >= 1024
      ? spacing.xxl
      : width >= 768
        ? spacing.xl
        : spacing.md;
  const contentStyle = [
    styles.content,
    {
      maxWidth,
      paddingHorizontal: horizontalPadding,
    },
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.safeArea,
        { backgroundColor: palette.background },
      ]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.fill}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentStyle, styles.fill]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
