import { Platform, useColorScheme } from "react-native";

export const colors = {
  background: "#F4F5F0",
  surface: "#FFFFFF",
  surfaceMuted: "#EAEDE7",
  primary: "#10251E",
  onPrimary: "#FFFFFF",
  brandSurface: "#10251E",
  onBrand: "#FFFFFF",
  onBrandMuted: "#DCE7E1",
  ink: "#10251E",
  inkMuted: "#52635C",
  line: "#D8DFD9",
  mint: "#237D5B",
  mintBright: "#35B983",
  mintSoft: "#DDF5EA",
  amber: "#8A5A00",
  amberSoft: "#F8EBCF",
  risk: "#A9433B",
  riskSoft: "#F6DEDC",
  focus: "#1C6C4E",
  white: "#FFFFFF",
  overlay: "rgba(16, 37, 30, 0.52)",
} as const;

export const darkColors = {
  background: "#0C1713",
  surface: "#13241D",
  surfaceMuted: "#1A2E26",
  primary: "#69D7AA",
  onPrimary: "#0C1713",
  brandSurface: "#10251E",
  onBrand: "#FFFFFF",
  onBrandMuted: "#DCE7E1",
  ink: "#F4F7F3",
  inkMuted: "#B5C2BC",
  line: "#2B453A",
  mint: "#69D7AA",
  mintBright: "#69D7AA",
  mintSoft: "#173A2D",
  amber: "#F0BE59",
  amberSoft: "#392B12",
  risk: "#EE8A80",
  riskSoft: "#3B201E",
  focus: "#7ADDB7",
  white: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.58)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  eyebrow: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.1,
    textTransform: "uppercase" as const,
  },
  display: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800" as const,
    letterSpacing: -1.2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as const,
    letterSpacing: -0.6,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700" as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500" as const,
  },
} as const;

export const fonts = Platform.select({
  ios: {
    regular: "System",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    regular: "sans-serif",
    rounded: "sans-serif-medium",
    mono: "monospace",
  },
  default: {
    regular:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    rounded:
      "ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
})!;

export type AppColors = typeof colors;

export function useAppTheme(): AppColors {
  return (useColorScheme() === "dark"
    ? darkColors
    : colors) as AppColors;
}

export const Colors = {
  light: {
    text: colors.ink,
    background: colors.background,
    tint: colors.mint,
    icon: colors.inkMuted,
    tabIconDefault: colors.inkMuted,
    tabIconSelected: colors.ink,
  },
  dark: {
    text: darkColors.ink,
    background: darkColors.background,
    tint: darkColors.mint,
    icon: darkColors.inkMuted,
    tabIconDefault: darkColors.inkMuted,
    tabIconSelected: darkColors.ink,
  },
};

export const Fonts = {
  sans: fonts.regular,
  serif: Platform.select({
    web: "Georgia, 'Times New Roman', serif",
    default: "serif",
  }),
  rounded: fonts.rounded,
  mono: fonts.mono,
};
