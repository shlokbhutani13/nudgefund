import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppButton } from "@/components/ui/AppButton";
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
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

function weeklyNudge(
  decisions: PurchaseDecision[],
  redirected: number,
) {
  if (!decisions.length) {
    return "Start with one purchase you are genuinely considering. The goal is clarity, not automatic restraint.";
  }
  if (redirected > 0) {
    return "You created breathing room this month. Decide where that redirected money should go before it quietly disappears.";
  }
  return "A positive verdict can still be intentional. Review whether recent purchases solved the problem you expected.";
}

export function DashboardView({
  currencyCode,
  decisions,
  isDemo,
  monthlyGoal,
  name,
  onEditProfile,
  onNewDecision,
  onOpenDecisions,
  onSignOut,
}: {
  currencyCode: string;
  decisions: PurchaseDecision[];
  isDemo: boolean;
  monthlyGoal: number;
  name: string;
  onEditProfile(): void;
  onNewDecision(): void;
  onOpenDecisions(): void;
  onSignOut(): void;
}) {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const summary = useMemo(
    () => summarizeMonth(decisions),
    [decisions],
  );
  const progress =
    monthlyGoal > 0
      ? Math.min(
          summary.totalRedirected / monthlyGoal,
          1,
        )
      : 0;
  const recent = decisions.slice(0, 3);

  return (
    <AppScreen>
      <View style={styles.topBar}>
        <View style={styles.greeting}>
          <Text
            style={[
              styles.eyebrow,
              { color: palette.mint },
            ]}
          >
            Your money, with more intention
          </Text>
          <Text
            style={[
              styles.title,
              { color: palette.ink },
            ]}
          >
            Good {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {name || "there"}.
          </Text>
        </View>
        <View style={styles.profileActions}>
          {isDemo ? (
            <View
              style={[
                styles.modeBadge,
                {
                  backgroundColor: palette.amberSoft,
                },
              ]}
            >
              <Ionicons
                color={palette.amber}
                name="phone-portrait-outline"
                size={16}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: palette.amber },
                ]}
              >
                Demo mode
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityHint="Edit profile and savings preferences"
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={onEditProfile}
            style={({ pressed }) => [
              styles.avatar,
              {
                backgroundColor: palette.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: palette.onPrimary },
              ]}
            >
              {(name || "N").slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.heroGrid,
          isWide ? styles.row : null,
        ]}
      >
        <AppCard
          style={styles.primaryMetric}
          tone="mint"
        >
          <View style={styles.cardHeading}>
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <Ionicons
                color={palette.mint}
                name="arrow-redo-outline"
                size={21}
              />
            </View>
            <Text
              style={[
                styles.metricLabel,
                { color: palette.ink },
              ]}
            >
              Money redirected
            </Text>
          </View>
          <Text
            style={[
              styles.metricValueLarge,
              { color: palette.ink },
            ]}
          >
            {formatMoney(
              summary.totalRedirected,
              currencyCode,
            )}
          </Text>
          <Text
            style={[
              styles.metricSupport,
              { color: palette.inkMuted },
            ]}
          >
            Money kept available after reconsidering
            purchases this month.
          </Text>
        </AppCard>

        <View
          style={[
            styles.secondaryMetrics,
            isWide ? styles.secondaryMetricsWide : null,
          ]}
        >
          <AppCard style={styles.secondaryMetric}>
            <Text
              style={[
                styles.metricLabel,
                { color: palette.inkMuted },
              ]}
            >
              This month’s spending
            </Text>
            <Text
              style={[
                styles.metricValue,
                { color: palette.ink },
              ]}
            >
              {formatMoney(
                summary.totalSpent,
                currencyCode,
              )}
            </Text>
            <Text
              style={[
                styles.metricSupport,
                { color: palette.inkMuted },
              ]}
            >
              Across {Object.values(
                summary.verdictCounts,
              ).reduce(
                (total, value) => total + value,
                0,
              )}{" "}
              completed checks.
            </Text>
          </AppCard>

          <AppCard style={styles.secondaryMetric}>
            <View style={styles.goalHeading}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: palette.inkMuted },
                ]}
              >
                Monthly redirect goal
              </Text>
              <Text
                style={[
                  styles.goalPercent,
                  { color: palette.mint },
                ]}
              >
                {monthlyGoal > 0
                  ? `${Math.round(progress * 100)}%`
                  : "Set goal"}
              </Text>
            </View>
            <Text
              style={[
                styles.metricValue,
                { color: palette.ink },
              ]}
            >
              {formatMoney(
                monthlyGoal,
                currencyCode,
              )}
            </Text>
            <View
              accessibilityLabel={`${Math.round(
                progress * 100,
              )} percent of monthly goal`}
              accessibilityRole="progressbar"
              style={[
                styles.progressTrack,
                {
                  backgroundColor:
                    palette.surfaceMuted,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor:
                      palette.mintBright,
                    width: `${progress * 100}%`,
                  },
                ]}
              />
            </View>
          </AppCard>
        </View>
      </View>

      <View
        style={[
          styles.contentGrid,
          isWide ? styles.row : null,
        ]}
      >
        <View style={styles.mainColumn}>
          <View style={styles.sectionHeading}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.ink },
                ]}
              >
                Recent decisions
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: palette.inkMuted },
                ]}
              >
                Your latest completed purchase checks.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenDecisions}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={[
                  styles.link,
                  { color: palette.mint },
                ]}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {recent.length ? (
            <View style={styles.decisionList}>
              {recent.map((decision) => {
                const redirected = formatMoney(
                  decision.amountRedirected,
                  currencyCode,
                );
                const badgeColor =
                  decision.verdict === "positive"
                    ? palette.mint
                    : decision.verdict === "negative"
                      ? palette.risk
                      : palette.amber;
                const badgeBackground =
                  decision.verdict === "positive"
                    ? palette.mintSoft
                    : decision.verdict === "negative"
                      ? palette.riskSoft
                      : palette.amberSoft;

                return (
                  <AppCard
                    key={decision.id}
                    style={styles.decisionCard}
                  >
                    <View style={styles.decisionTop}>
                      <View style={styles.decisionCopy}>
                        <Text
                          style={[
                            styles.decisionName,
                            { color: palette.ink },
                          ]}
                        >
                          {decision.itemName}
                        </Text>
                        <Text
                          style={[
                            styles.decisionMeta,
                            {
                              color:
                                palette.inkMuted,
                            },
                          ]}
                        >
                          {decision.category} ·{" "}
                          {new Date(
                            decision.createdAt,
                          ).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.verdictBadge,
                          {
                            backgroundColor:
                              badgeBackground,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.verdictText,
                            { color: badgeColor },
                          ]}
                        >
                          {decision.verdict}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.redirectedLine,
                        { color: palette.ink },
                      ]}
                    >
                      {decision.amountRedirected > 0
                        ? `${redirected} redirected`
                        : `${formatMoney(
                            decision.finalAmount,
                            currencyCode,
                          )} spent intentionally`}
                    </Text>
                  </AppCard>
                );
              })}
            </View>
          ) : (
            <AppCard style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor:
                      palette.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  color={palette.mint}
                  name="receipt-outline"
                  size={26}
                />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: palette.ink },
                ]}
              >
                No decisions yet
              </Text>
              <Text
                style={[
                  styles.emptyBody,
                  { color: palette.inkMuted },
                ]}
              >
                Your completed purchase checks will
                appear here with the final outcome.
              </Text>
            </AppCard>
          )}
        </View>

        <View style={styles.sideColumn}>
          <AppCard tone="amber">
            <View style={styles.nudgeHeading}>
              <Ionicons
                color={palette.amber}
                name="compass-outline"
                size={22}
              />
              <Text
                style={[
                  styles.nudgeLabel,
                  { color: palette.amber },
                ]}
              >
                Weekly nudge
              </Text>
            </View>
            <Text
              style={[
                styles.nudgeText,
                { color: palette.ink },
              ]}
            >
              {weeklyNudge(
                decisions,
                summary.totalRedirected,
              )}
            </Text>
          </AppCard>

          <AppCard style={styles.ctaCard}>
            <View
              style={[
                styles.ctaIcon,
                {
                  backgroundColor:
                    palette.brandSurface,
                },
              ]}
            >
              <Ionicons
                color={palette.mintBright}
                name="pause-outline"
                size={25}
              />
            </View>
            <Text
              style={[
                styles.ctaTitle,
                { color: palette.ink },
              ]}
            >
              Give the next purchase a deliberate pause.
            </Text>
            <Text
              style={[
                styles.ctaBody,
                { color: palette.inkMuted },
              ]}
            >
              Three questions. A practical reflection.
              Your final decision remains yours.
            </Text>
            <AppButton
              icon="arrow-forward-outline"
              label="Check a purchase"
              onPress={onNewDecision}
            />
          </AppCard>

          <AppButton
            label={
              isDemo ? "Exit demo" : "Sign out"
            }
            onPress={onSignOut}
            variant="ghost"
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  greeting: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...type.eyebrow,
  },
  title: {
    ...type.title,
  },
  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modeBadge: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  modeText: {
    ...type.caption,
    fontWeight: "700",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
  },
  heroGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  primaryMetric: {
    flex: 1.2,
    minHeight: 236,
    justifyContent: "space-between",
  },
  secondaryMetrics: {
    flex: 1,
    gap: spacing.md,
  },
  secondaryMetricsWide: {
    flexDirection: "row",
  },
  secondaryMetric: {
    flex: 1,
    minHeight: 236,
    justifyContent: "space-between",
  },
  cardHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  metricValueLarge: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "800",
    letterSpacing: -1.3,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  metricSupport: {
    ...type.caption,
  },
  goalHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  goalPercent: {
    ...type.caption,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  contentGrid: {
    gap: spacing.xl,
    alignItems: "flex-start",
  },
  mainColumn: {
    flex: 1.4,
    width: "100%",
  },
  sideColumn: {
    flex: 0.75,
    width: "100%",
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...type.heading,
  },
  sectionSubtitle: {
    ...type.caption,
    marginTop: spacing.xs,
  },
  link: {
    ...type.caption,
    fontWeight: "800",
    minHeight: 44,
    textAlignVertical: "center",
  },
  decisionList: {
    gap: spacing.sm,
  },
  decisionCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  decisionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  decisionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  decisionName: {
    ...type.bodyStrong,
  },
  decisionMeta: {
    ...type.caption,
  },
  verdictBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  verdictText: {
    ...type.caption,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  redirectedLine: {
    ...type.caption,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...type.heading,
  },
  emptyBody: {
    ...type.body,
    textAlign: "center",
    maxWidth: 420,
  },
  nudgeHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nudgeLabel: {
    ...type.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  nudgeText: {
    ...type.body,
  },
  ctaCard: {
    gap: spacing.md,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: {
    ...type.heading,
  },
  ctaBody: {
    ...type.body,
  },
});
