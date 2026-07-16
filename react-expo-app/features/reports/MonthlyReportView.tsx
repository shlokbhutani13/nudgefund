import Ionicons from "@expo/vector-icons/Ionicons";
import {
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
import { summarizeMonth } from "@/features/decisions/calculations";
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

export function MonthlyReportView({
  currencyCode,
  decisions,
  insight,
}: {
  currencyCode: string;
  decisions: PurchaseDecision[];
  insight: {
    text: string;
    mode: "live" | "demo";
  };
}) {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const summary = summarizeMonth(decisions);
  const totalDecisions = Object.values(
    summary.verdictCounts,
  ).reduce((total, value) => total + value, 0);

  return (
    <AppScreen>
      <View style={styles.heading}>
        <Text
          style={[
            styles.eyebrow,
            { color: palette.mint },
          ]}
        >
          Monthly report
        </Text>
        <Text
          style={[
            styles.title,
            { color: palette.ink },
          ]}
        >
          A clear view of this month’s tradeoffs.
        </Text>
        <Text
          style={[
            styles.intro,
            { color: palette.inkMuted },
          ]}
        >
          Review outcomes, not just spending. A useful
          month can include both purchases made and
          purchases reconsidered.
        </Text>
      </View>

      <View
        style={[
          styles.metrics,
          isWide ? styles.row : null,
        ]}
      >
        <Metric
          icon="card-outline"
          label="Final spending"
          value={formatMoney(
            summary.totalSpent,
            currencyCode,
          )}
        />
        <Metric
          icon="arrow-redo-outline"
          label="Money redirected"
          positive
          value={formatMoney(
            summary.totalRedirected,
            currencyCode,
          )}
        />
        <Metric
          icon="pricetag-outline"
          label="Top category"
          value={summary.topCategory}
        />
      </View>

      <View
        style={[
          styles.reportGrid,
          isWide ? styles.row : null,
        ]}
      >
        <AppCard style={styles.distribution}>
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: palette.ink },
              ]}
            >
              Decision mix
            </Text>
            <Text
              style={[
                styles.cardSupport,
                { color: palette.inkMuted },
              ]}
            >
              {totalDecisions} completed{" "}
              {totalDecisions === 1
                ? "check"
                : "checks"}
            </Text>
          </View>
          <DistributionRow
            color={palette.mint}
            count={summary.verdictCounts.positive}
            label="Clear case"
            total={totalDecisions}
          />
          <DistributionRow
            color={palette.amber}
            count={summary.verdictCounts.neutral}
            label="Reconsider"
            total={totalDecisions}
          />
          <DistributionRow
            color={palette.risk}
            count={summary.verdictCounts.negative}
            label="Pause"
            total={totalDecisions}
          />
        </AppCard>

        <AppCard
          style={styles.insight}
          tone="mint"
        >
          <View style={styles.insightHeader}>
            <View
              style={[
                styles.insightIcon,
                {
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <Ionicons
                color={palette.mint}
                name="sparkles-outline"
                size={23}
              />
            </View>
            <View style={styles.insightHeading}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: palette.ink },
                ]}
              >
                Monthly reflection
              </Text>
              <View
                style={[
                  styles.modeBadge,
                  {
                    backgroundColor:
                      palette.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: palette.mint },
                  ]}
                >
                  {insight.mode === "live"
                    ? "Live AI insight"
                    : "Demo insight"}
                </Text>
              </View>
            </View>
          </View>
          <Text
            style={[
              styles.insightText,
              { color: palette.ink },
            ]}
          >
            {insight.text}
          </Text>
        </AppCard>
      </View>

      <View
        style={[
          styles.disclaimer,
          {
            backgroundColor: palette.amberSoft,
          },
        ]}
      >
        <Ionicons
          color={palette.amber}
          name="information-circle-outline"
          size={22}
        />
        <Text
          style={[
            styles.disclaimerText,
            { color: palette.ink },
          ]}
        >
          NudgeFund provides educational information
          and behavioral prompts. It does not provide
          individualized investment, tax, legal, or
          financial advice.
        </Text>
      </View>
    </AppScreen>
  );
}

function Metric({
  icon,
  label,
  positive = false,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  positive?: boolean;
  value: string;
}) {
  const palette = useAppTheme();
  return (
    <AppCard style={styles.metric}>
      <Ionicons
        color={
          positive ? palette.mint : palette.inkMuted
        }
        name={icon}
        size={21}
      />
      <Text
        style={[
          styles.metricLabel,
          { color: palette.inkMuted },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metricValue,
          {
            color: positive
              ? palette.mint
              : palette.ink,
          },
        ]}
      >
        {value}
      </Text>
    </AppCard>
  );
}

function DistributionRow({
  color,
  count,
  label,
  total,
}: {
  color: string;
  count: number;
  label: string;
  total: number;
}) {
  const palette = useAppTheme();
  const percent =
    total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.distributionRow}>
      <View style={styles.distributionLabels}>
        <View style={styles.distributionName}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: color },
            ]}
          />
          <Text
            style={[
              styles.distributionLabel,
              { color: palette.ink },
            ]}
          >
            {label}
          </Text>
        </View>
        <Text
          style={[
            styles.distributionCount,
            { color: palette.inkMuted },
          ]}
        >
          {count} · {percent}%
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: palette.surfaceMuted,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              width: `${percent}%`,
            },
          ]}
        />
      </View>
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
  row: {
    flexDirection: "row",
  },
  metrics: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metric: {
    flex: 1,
    gap: spacing.sm,
    minHeight: 160,
    justifyContent: "space-between",
  },
  metricLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  reportGrid: {
    gap: spacing.md,
    alignItems: "stretch",
  },
  distribution: {
    flex: 1,
    gap: spacing.lg,
  },
  cardHeader: {
    gap: spacing.xs,
  },
  cardTitle: {
    ...type.heading,
  },
  cardSupport: {
    ...type.caption,
  },
  distributionRow: {
    gap: spacing.sm,
  },
  distributionLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  distributionName: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  distributionCount: {
    ...type.caption,
  },
  track: {
    height: 9,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  insight: {
    flex: 1,
    gap: spacing.lg,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  insightHeading: {
    flex: 1,
    gap: spacing.sm,
  },
  modeBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modeText: {
    ...type.caption,
    fontWeight: "800",
  },
  insightText: {
    ...type.body,
    fontSize: 18,
    lineHeight: 28,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  disclaimerText: {
    ...type.caption,
    flex: 1,
  },
});
