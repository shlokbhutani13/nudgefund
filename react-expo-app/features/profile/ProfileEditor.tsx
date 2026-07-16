import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppField } from "@/components/ui/AppField";
import {
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";
import type { UserProfile } from "./types";

export function ProfileEditor({
  initialProfile,
  isDemo,
  onCancel,
  onSave,
}: {
  initialProfile: UserProfile;
  isDemo: boolean;
  onCancel?: () => void;
  onSave(
    profile: UserProfile,
  ): Promise<void>;
}) {
  const palette = useAppTheme();
  const [displayName, setDisplayName] = useState(
    initialProfile.displayName,
  );
  const [currencyCode, setCurrencyCode] = useState(
    initialProfile.currencyCode,
  );
  const [goal, setGoal] = useState(
    String(initialProfile.monthlySavingsGoal),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalizedName = displayName.trim();
    const normalizedCurrency = currencyCode
      .trim()
      .toUpperCase();
    const monthlySavingsGoal = Number(goal);

    if (
      !normalizedName ||
      normalizedName.length > 80
    ) {
      setError(
        "Enter a display name up to 80 characters.",
      );
      return;
    }
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError(
        "Use a three-letter currency code such as USD or INR.",
      );
      return;
    }
    if (
      !Number.isFinite(monthlySavingsGoal) ||
      monthlySavingsGoal < 0
    ) {
      setError(
        "Enter a monthly goal of zero or more.",
      );
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onSave({
        displayName: normalizedName,
        currencyCode: normalizedCurrency,
        monthlySavingsGoal,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profile could not be saved. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.shell}>
      <View style={styles.heading}>
        <Text
          style={[
            styles.eyebrow,
            { color: palette.mint },
          ]}
        >
          {isDemo
            ? "Set up your local demo"
            : "One quick setup"}
        </Text>
        <Text
          style={[
            styles.title,
            { color: palette.ink },
          ]}
        >
          Personalize your NudgeFund workspace.
        </Text>
        <Text
          style={[
            styles.intro,
            { color: palette.inkMuted },
          ]}
        >
          These preferences control greetings,
          currency formatting, and your monthly
          redirected-money goal.
        </Text>
      </View>

      <AppCard style={styles.card}>
        <AppField
          autoCapitalize="words"
          autoComplete="name"
          label="Display name"
          maxLength={80}
          onChangeText={setDisplayName}
          placeholder="What should we call you?"
          textContentType="name"
          value={displayName}
        />
        <AppField
          autoCapitalize="characters"
          autoCorrect={false}
          helper="Examples: USD, INR, GBP, EUR."
          label="Preferred currency"
          maxLength={3}
          onChangeText={(value) =>
            setCurrencyCode(value.toUpperCase())
          }
          placeholder="USD"
          value={currencyCode}
        />
        <AppField
          helper="How much would you like to redirect from reconsidered purchases each month?"
          keyboardType="decimal-pad"
          label="Monthly redirect goal"
          onChangeText={setGoal}
          placeholder="300"
          value={goal}
        />

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

        <View style={styles.actions}>
          <AppButton
            label="Save preferences"
            loading={loading}
            onPress={() => void submit()}
          />
          {onCancel ? (
            <AppButton
              label="Cancel"
              onPress={onCancel}
              variant="ghost"
            />
          ) : null}
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  heading: {
    gap: spacing.sm,
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
  card: {
    gap: spacing.lg,
  },
  error: {
    ...type.caption,
  },
  actions: {
    gap: spacing.sm,
  },
});
