import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { useAppTheme } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";

export default function IndexRoute() {
  const palette = useAppTheme();
  const { isLoading, mode } = useAuth();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loading,
          {
            backgroundColor: palette.background,
          },
        ]}
      >
        <ActivityIndicator
          color={palette.mint}
          size="large"
        />
      </View>
    );
  }

  return (
    <Redirect
      href={
        mode === "signed-out"
          ? "/(auth)/login"
          : "/(app)/overview"
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
