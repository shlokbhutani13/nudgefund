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
import { summarizeMonth } from "@/features/decisions/calculations";
import type { PurchaseDecision } from "@/features/decisions/types";
import { MonthlyReportView } from "@/features/reports/MonthlyReportView";
import { useAppServices } from "@/lib/AppServicesContext";

type Insight = {
  text: string;
  mode: "live" | "demo";
};

export default function ReportsScreen() {
  const palette = useAppTheme();
  const services = useAppServices();
  const [decisions, setDecisions] = useState<
    PurchaseDecision[]
  >([]);
  const [currencyCode, setCurrencyCode] =
    useState("USD");
  const [insight, setInsight] =
    useState<Insight | null>(null);
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
      .then(async ([rows, profile]) => {
        const summary = summarizeMonth(rows);
        const nextInsight =
          await services.coach.monthlyReport({
            totalSpent: summary.totalSpent,
            totalRedirected:
              summary.totalRedirected,
            topCategory: summary.topCategory,
          });
        if (!active) return;
        setDecisions(rows);
        setCurrencyCode(
          profile?.currencyCode ?? "USD",
        );
        setInsight(nextInsight);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The monthly report could not be prepared.",
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

  if (loading || error || !insight) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.centered}>
          {loading ? (
            <>
              <ActivityIndicator
                color={palette.mint}
                size="large"
              />
              <Text
                style={[
                  styles.message,
                  { color: palette.inkMuted },
                ]}
              >
                Preparing your monthly report…
              </Text>
            </>
          ) : (
            <>
              <Text
                accessibilityRole="alert"
                style={[
                  styles.message,
                  { color: palette.risk },
                ]}
              >
                {error ||
                  "The report is unavailable."}
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
    <MonthlyReportView
      currencyCode={currencyCode}
      decisions={decisions}
      insight={insight}
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
