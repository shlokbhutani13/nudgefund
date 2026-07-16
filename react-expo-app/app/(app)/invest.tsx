import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { AppButton } from "@/components/ui/AppButton";
import { AppScreen } from "@/components/ui/AppScreen";
import {
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";
import type { PurchaseDecision } from "@/features/decisions/types";
import { ProjectionView } from "@/features/projections/ProjectionView";
import { useAppServices } from "@/lib/AppServicesContext";

export default function GrowthScreen() {
  const palette = useAppTheme();
  const services = useAppServices();
  const [decisions, setDecisions] = useState<
    PurchaseDecision[]
  >([]);
  const [currencyCode, setCurrencyCode] =
    useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([
      services.decisions.list(),
      services.profiles.get(),
    ])
      .then(([rows, profile]) => {
        if (!active) return;
        setDecisions(rows);
        setCurrencyCode(
          profile?.currencyCode ?? "USD",
        );
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Growth projection could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [services]);

  useFocusEffect(load);

  if (loading || error) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator
              color={palette.mint}
              size="large"
            />
          ) : (
            <>
              <Text
                accessibilityRole="alert"
                style={[
                  styles.message,
                  { color: palette.risk },
                ]}
              >
                {error}
              </Text>
              <AppButton
                label="Try again"
                onPress={() => {
                  load();
                }}
              />
            </>
          )}
        </View>
      </AppScreen>
    );
  }

  return (
    <ProjectionView
      currencyCode={currencyCode}
      decisions={decisions}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  message: {
    ...type.body,
    textAlign: "center",
  },
});
