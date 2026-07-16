import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreen } from "@/components/ui/AppScreen";
import {
  radius,
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";
import { projectFutureValue } from "@/features/decisions/calculations";
import type { PurchaseDecision } from "@/features/decisions/types";

function formatMoney(
  amount: number,
  currencyCode: string,
) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(0)}`;
  }
}

export function ProjectionView({
  currencyCode,
  decisions,
}: {
  currencyCode: string;
  decisions: PurchaseDecision[];
}) {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const [rate, setRate] = useState(0.07);
  const [years, setYears] = useState(10);
  const redirected = useMemo(
    () =>
      decisions.reduce(
        (total, decision) =>
          total + decision.amountRedirected,
        0,
      ),
    [decisions],
  );
  const projected = projectFutureValue(
    redirected,
    rate,
    years,
  );
  const growth = Math.max(projected - redirected, 0);

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text
          style={[
            styles.eyebrow,
            { color: palette.mint },
          ]}
        >
          Growth projection
        </Text>
        <Text
          style={[
            styles.title,
            { color: palette.ink },
          ]}
        >
          Give redirected money a possible future.
        </Text>
        <Text
          style={[
            styles.intro,
            { color: palette.inkMuted },
          ]}
        >
          Explore simple compound-growth scenarios.
          These assumptions are educational, not
          forecasts.
        </Text>
      </View>

      <View
        style={[
          styles.grid,
          isWide ? styles.gridWide : null,
        ]}
      >
        <AppCard
          style={styles.projectionCard}
          tone="mint"
        >
          <View style={styles.projectionTop}>
            <Text
              style={[
                styles.cardLabel,
                { color: palette.inkMuted },
              ]}
            >
              Redirected principal
            </Text>
            <Text
              style={[
                styles.principal,
                { color: palette.ink },
              ]}
            >
              {formatMoney(
                redirected,
                currencyCode,
              )}
            </Text>
          </View>
          <View
            style={[
              styles.futurePanel,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.futureLabel,
                { color: palette.mint },
              ]}
            >
              Hypothetical value in {years} years
            </Text>
            <Text
              style={[
                styles.futureValue,
                { color: palette.ink },
              ]}
            >
              {formatMoney(
                projected,
                currencyCode,
              )}
            </Text>
            <Text
              style={[
                styles.growthLine,
                { color: palette.inkMuted },
              ]}
            >
              {formatMoney(growth, currencyCode)} of
              modeled growth at {(rate * 100).toFixed(0)}
              % annually.
            </Text>
          </View>
          <View
            accessibilityLabel={`Redirected principal ${formatMoney(
              redirected,
              currencyCode,
            )}; modeled growth ${formatMoney(
              growth,
              currencyCode,
            )}`}
            style={styles.visual}
          >
            <View
              style={[
                styles.principalBar,
                {
                  backgroundColor: palette.mint,
                  flex:
                    projected > 0
                      ? redirected / projected
                      : 1,
                },
              ]}
            />
            <View
              style={[
                styles.growthBar,
                {
                  backgroundColor:
                    palette.mintBright,
                  flex:
                    projected > 0
                      ? growth / projected
                      : 0,
                },
              ]}
            />
          </View>
          <View style={styles.legend}>
            <LegendItem
              color={palette.mint}
              label="Redirected money"
            />
            <LegendItem
              color={palette.mintBright}
              label="Modeled growth"
            />
          </View>
        </AppCard>

        <AppCard style={styles.controls}>
          <View style={styles.controlGroup}>
            <Text
              style={[
                styles.controlLabel,
                { color: palette.ink },
              ]}
            >
              Annual return assumption
            </Text>
            <Text
              style={[
                styles.controlHelp,
                { color: palette.inkMuted },
              ]}
            >
              Choose a fixed educational scenario.
            </Text>
            <View style={styles.options}>
              {[0.04, 0.07, 0.1].map((value) => (
                <Option
                  key={value}
                  label={`${(value * 100).toFixed(0)}%`}
                  onPress={() => setRate(value)}
                  selected={rate === value}
                />
              ))}
            </View>
          </View>
          <View style={styles.controlGroup}>
            <Text
              style={[
                styles.controlLabel,
                { color: palette.ink },
              ]}
            >
              Time horizon
            </Text>
            <Text
              style={[
                styles.controlHelp,
                { color: palette.inkMuted },
              ]}
            >
              Longer periods amplify both assumptions
              and uncertainty.
            </Text>
            <View style={styles.options}>
              {[5, 10, 20].map((value) => (
                <Option
                  key={value}
                  label={`${value} years`}
                  onPress={() => setYears(value)}
                  selected={years === value}
                />
              ))}
            </View>
          </View>
          <View
            style={[
              styles.disclaimer,
              {
                backgroundColor:
                  palette.amberSoft,
              },
            ]}
          >
            <Ionicons
              color={palette.amber}
              name="information-circle-outline"
              size={21}
            />
            <Text
              style={[
                styles.disclaimerText,
                { color: palette.ink },
              ]}
            >
              Hypothetical projection. Returns are not
              guaranteed. Fees, taxes, inflation, and
              market losses are not modeled.
            </Text>
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}

function Option({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress(): void;
  selected: boolean;
}) {
  const palette = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected
            ? palette.mintSoft
            : palette.surface,
          borderColor: selected
            ? palette.mint
            : palette.line,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: selected
              ? palette.mint
              : palette.ink,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  const palette = useAppTheme();
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: color },
        ]}
      />
      <Text
        style={[
          styles.legendText,
          { color: palette.inkMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    maxWidth: 760,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...type.eyebrow,
  },
  title: {
    ...type.title,
  },
  intro: {
    ...type.body,
  },
  grid: {
    gap: spacing.md,
  },
  gridWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  projectionCard: {
    flex: 1.2,
    gap: spacing.lg,
  },
  projectionTop: {
    gap: spacing.xs,
  },
  cardLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  principal: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  futurePanel: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  futureLabel: {
    ...type.eyebrow,
  },
  futureValue: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  growthLine: {
    ...type.caption,
  },
  visual: {
    height: 18,
    borderRadius: radius.pill,
    flexDirection: "row",
    overflow: "hidden",
  },
  principalBar: {
    minWidth: 2,
  },
  growthBar: {
    minWidth: 0,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    ...type.caption,
  },
  controls: {
    flex: 0.8,
    gap: spacing.xl,
  },
  controlGroup: {
    gap: spacing.sm,
  },
  controlLabel: {
    ...type.bodyStrong,
  },
  controlHelp: {
    ...type.caption,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    ...type.caption,
    fontWeight: "800",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  disclaimerText: {
    ...type.caption,
    flex: 1,
  },
});
