import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { useAppTheme } from "@/constants/theme";

export default function AppLayout() {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const useSidebar = width >= 1100;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: palette.background,
        },
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarHideOnKeyboard: true,
        tabBarPosition: useSidebar
          ? "left"
          : "bottom",
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderColor: palette.line,
        },
        tabBarItemStyle: {
          minHeight: 52,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarAccessibilityLabel:
            "Overview dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              color={color}
              name="home-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Decisions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              color={color}
              name="list-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: "Growth",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              color={color}
              name="trending-up-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              color={color}
              name="bar-chart-outline"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budget/new"
        options={{
          href: null,
          headerShown: false,
          title: "Purchase check",
        }}
      />
    </Tabs>
  );
}
