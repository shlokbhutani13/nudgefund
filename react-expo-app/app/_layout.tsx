import {
  DarkTheme,
  DefaultTheme,
  SplashScreen,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  colors,
  darkColors,
} from "@/constants/theme";
import { AppServicesProvider } from "@/lib/AppServicesContext";
import {
  AuthProvider,
  useAuth,
} from "@/lib/AuthContext";

void SplashScreen.preventAutoHideAsync().catch(
  () => undefined,
);

function InitialLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoading, mode } = useAuth();
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync().catch(
        () => undefined,
      );
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    if (
      mode === "signed-out" &&
      !inAuthGroup
    ) {
      router.replace("/(auth)/login");
    } else if (
      mode !== "signed-out" &&
      inAuthGroup
    ) {
      router.replace("/(app)/overview");
    }
  }, [inAuthGroup, isLoading, mode, router]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

function AppTheme({
  children,
}: {
  children: React.ReactNode;
}) {
  const dark = useColorScheme() === "dark";
  const navigationTheme = dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: darkColors.background,
          card: darkColors.surface,
          border: darkColors.line,
          primary: darkColors.mint,
          text: darkColors.ink,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          border: colors.line,
          primary: colors.mint,
          text: colors.ink,
        },
      };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={dark ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppTheme>
      <AuthProvider>
        <AppServicesProvider>
          <InitialLayout />
        </AppServicesProvider>
      </AuthProvider>
    </AppTheme>
  );
}
