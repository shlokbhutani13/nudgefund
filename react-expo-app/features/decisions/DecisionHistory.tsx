import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
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
import type {
  PurchaseDecision,
  Verdict,
} from "./types";

function formatMoney(
  amount: number,
  currencyCode: string,
) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function DecisionHistory({
  currencyCode,
  decisions,
  onDelete,
  onNewDecision,
}: {
  currencyCode: string;
  decisions: PurchaseDecision[];
  onDelete(id: string): Promise<void>;
  onNewDecision(): void;
}) {
  const palette = useAppTheme();
  const [category, setCategory] = useState("All");
  const [verdict, setVerdict] = useState<
    Verdict | "all"
  >("all");
  const [pendingDelete, setPendingDelete] =
    useState<PurchaseDecision | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        decisions.map((decision) => decision.category),
      ),
    ],
    [decisions],
  );
  const filtered = decisions.filter(
    (decision) =>
      (category === "All" ||
        decision.category === category) &&
      (verdict === "all" ||
        decision.verdict === verdict),
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The decision could not be removed.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text
            style={[
              styles.eyebrow,
              { color: palette.mint },
            ]}
          >
            Decision history
          </Text>
          <Text
            style={[
              styles.title,
              { color: palette.ink },
            ]}
          >
            See the plan, the pause, and the outcome.
          </Text>
          <Text
            style={[
              styles.intro,
              { color: palette.inkMuted },
            ]}
          >
            Filter completed purchase checks without
            losing the context behind each decision.
          </Text>
        </View>
        <AppButton
          icon="add-outline"
          label="New purchase check"
          onPress={onNewDecision}
        />
      </View>

      <AppCard style={styles.filters}>
        <View style={styles.filterGroup}>
          <Text
            style={[
              styles.filterLabel,
              { color: palette.inkMuted },
            ]}
          >
            Category
          </Text>
          <View style={styles.chips}>
            {categories.map((item) => (
              <FilterChip
                key={item}
                label={item}
                onPress={() => setCategory(item)}
                selected={category === item}
              />
            ))}
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text
            style={[
              styles.filterLabel,
              { color: palette.inkMuted },
            ]}
          >
            Reflection
          </Text>
          <View style={styles.chips}>
            {(
              [
                ["all", "All"],
                ["positive", "Clear case"],
                ["neutral", "Reconsider"],
                ["negative", "Pause"],
              ] as const
            ).map(([value, label]) => (
              <FilterChip
                key={value}
                label={label}
                onPress={() => setVerdict(value)}
                selected={verdict === value}
              />
            ))}
          </View>
        </View>
      </AppCard>

      {error ? (
        <Text
          accessibilityRole="alert"
          style={[
            styles.error,
            { color: palette.risk },
          ]}
        >
          {error}
        </Text>
      ) : null}

      {pendingDelete ? (
        <AppCard style={styles.confirmation} tone="risk">
          <View style={styles.confirmationCopy}>
            <Text
              style={[
                styles.confirmationTitle,
                { color: palette.ink },
              ]}
            >
              Remove “{pendingDelete.itemName}”?
            </Text>
            <Text
              style={[
                styles.confirmationBody,
                { color: palette.inkMuted },
              ]}
            >
              This permanently removes the saved
              decision from this mode.
            </Text>
          </View>
          <View style={styles.confirmationActions}>
            <AppButton
              label="Cancel"
              onPress={() => setPendingDelete(null)}
              variant="secondary"
            />
            <AppButton
              label="Remove"
              loading={deleting}
              onPress={() => void confirmDelete()}
              variant="danger"
            />
          </View>
        </AppCard>
      ) : null}

      {filtered.length ? (
        <View style={styles.list}>
          {filtered.map((decision) => {
            const verdictColor =
              decision.verdict === "positive"
                ? palette.mint
                : decision.verdict === "negative"
                  ? palette.risk
                  : palette.amber;
            const verdictBackground =
              decision.verdict === "positive"
                ? palette.mintSoft
                : decision.verdict === "negative"
                  ? palette.riskSoft
                  : palette.amberSoft;

            return (
              <AppCard
                key={decision.id}
                style={styles.decision}
              >
                <View style={styles.decisionHeader}>
                  <View style={styles.decisionTitleWrap}>
                    <Text
                      style={[
                        styles.decisionTitle,
                        { color: palette.ink },
                      ]}
                    >
                      {decision.itemName}
                    </Text>
                    <Text
                      style={[
                        styles.decisionMeta,
                        { color: palette.inkMuted },
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
                          verdictBackground,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verdictText,
                        { color: verdictColor },
                      ]}
                    >
                      {decision.verdict}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountGrid}>
                  <AmountCell
                    label="Original plan"
                    value={formatMoney(
                      decision.plannedAmount,
                      currencyCode,
                    )}
                  />
                  <AmountCell
                    label="Final outcome"
                    value={formatMoney(
                      decision.finalAmount,
                      currencyCode,
                    )}
                  />
                  <AmountCell
                    label="Redirected"
                    positive={
                      decision.amountRedirected > 0
                    }
                    value={formatMoney(
                      decision.amountRedirected,
                      currencyCode,
                    )}
                  />
                </View>

                <View
                  style={[
                    styles.recommendation,
                    {
                      backgroundColor:
                        palette.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.recommendationLabel,
                      { color: palette.inkMuted },
                    ]}
                  >
                    Reflection
                  </Text>
                  <Text
                    style={[
                      styles.recommendationText,
                      { color: palette.ink },
                    ]}
                  >
                    {decision.recommendation}
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel={`Remove ${decision.itemName}`}
                  accessibilityRole="button"
                  onPress={() =>
                    setPendingDelete(decision)
                  }
                  style={({ pressed }) => [
                    styles.deleteAction,
                    {
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    color={palette.risk}
                    name="trash-outline"
                    size={18}
                  />
                  <Text
                    style={[
                      styles.deleteText,
                      { color: palette.risk },
                    ]}
                  >
                    Remove
                  </Text>
                </Pressable>
              </AppCard>
            );
          })}
        </View>
      ) : (
        <AppCard style={styles.empty}>
          <Ionicons
            color={palette.mint}
            name="funnel-outline"
            size={28}
          />
          <Text
            style={[
              styles.emptyTitle,
              { color: palette.ink },
            ]}
          >
            No matching decisions
          </Text>
          <Text
            style={[
              styles.emptyBody,
              { color: palette.inkMuted },
            ]}
          >
            Adjust the filters or complete a new
            purchase check.
          </Text>
        </AppCard>
      )}
    </AppScreen>
  );
}

function FilterChip({
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
        styles.chip,
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
          styles.chipText,
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

function AmountCell({
  label,
  positive = false,
  value,
}: {
  label: string;
  positive?: boolean;
  value: string;
}) {
  const palette = useAppTheme();
  return (
    <View style={styles.amountCell}>
      <Text
        style={[
          styles.amountLabel,
          { color: palette.inkMuted },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.amountValue,
          {
            color: positive
              ? palette.mint
              : palette.ink,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  heading: {
    gap: spacing.sm,
    maxWidth: 760,
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
  filters: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  filterLabel: {
    ...type.caption,
    fontWeight: "800",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    ...type.caption,
    fontWeight: "700",
  },
  error: {
    ...type.caption,
    marginBottom: spacing.md,
  },
  confirmation: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  confirmationCopy: {
    gap: spacing.xs,
  },
  confirmationTitle: {
    ...type.heading,
  },
  confirmationBody: {
    ...type.body,
  },
  confirmationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  decision: {
    gap: spacing.md,
  },
  decisionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  decisionTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  decisionTitle: {
    ...type.heading,
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
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  amountCell: {
    minWidth: 150,
    flex: 1,
    gap: spacing.xs,
  },
  amountLabel: {
    ...type.caption,
  },
  amountValue: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  recommendation: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recommendationLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  recommendationText: {
    ...type.body,
  },
  deleteAction: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deleteText: {
    ...type.caption,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...type.heading,
  },
  emptyBody: {
    ...type.body,
    textAlign: "center",
  },
});
