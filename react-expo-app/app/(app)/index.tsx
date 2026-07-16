import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
  useFocusEffect,
} from "expo-router";
import { AppButton } from "@/components/ui/AppButton";
import { AppScreen } from "@/components/ui/AppScreen";
import {
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";
import { DashboardView } from "@/features/dashboard/DashboardView";
import type { PurchaseDecision } from "@/features/decisions/types";
import { ProfileEditor } from "@/features/profile/ProfileEditor";
import type { UserProfile } from "@/features/profile/types";
import { useAppServices } from "@/lib/AppServicesContext";
import { useAuth } from "@/lib/AuthContext";

const demoProfile: UserProfile = {
  displayName: "Maya",
  currencyCode: "USD",
  monthlySavingsGoal: 300,
};

export default function OverviewScreen() {
  const palette = useAppTheme();
  const services = useAppServices();
  const { mode, signOut, user } = useAuth();
  const [profile, setProfile] =
    useState<UserProfile | null>(null);
  const [decisions, setDecisions] = useState<
    PurchaseDecision[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] =
    useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");

    void Promise.all([
      services.profiles.get(),
      services.decisions.list(),
    ])
      .then(([nextProfile, nextDecisions]) => {
        if (!active) return;
        setProfile(nextProfile);
        setDecisions(nextDecisions);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Your dashboard could not be loaded.",
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

  const saveProfile = async (
    nextProfile: UserProfile,
  ) => {
    const saved =
      await services.profiles.save(nextProfile);
    setProfile(saved);
    setEditingProfile(false);
  };

  if (loading) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator
            color={palette.mint}
            size="large"
          />
          <Text
            style={[
              styles.loadingText,
              { color: palette.inkMuted },
            ]}
          >
            Preparing your dashboard…
          </Text>
        </View>
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen scroll={false}>
        <View style={styles.centered}>
          <Text
            style={[
              styles.errorTitle,
              { color: palette.ink },
            ]}
          >
            Dashboard unavailable
          </Text>
          <Text
            accessibilityRole="alert"
            style={[
              styles.errorBody,
              { color: palette.risk },
            ]}
          >
            {error}
          </Text>
          <AppButton
            label="Try again"
            onPress={() => {
              const cleanup = load();
              return cleanup;
            }}
          />
        </View>
      </AppScreen>
    );
  }

  if (!profile || editingProfile) {
    const initialProfile =
      profile ??
      (mode === "demo"
        ? demoProfile
        : {
            displayName:
              user?.email?.split("@")[0] ?? "",
            currencyCode: "USD",
            monthlySavingsGoal: 300,
          });

    return (
      <AppScreen>
        <ProfileEditor
          initialProfile={initialProfile}
          isDemo={mode === "demo"}
          onCancel={
            profile
              ? () => setEditingProfile(false)
              : undefined
          }
          onSave={saveProfile}
        />
      </AppScreen>
    );
  }

  return (
    <DashboardView
      currencyCode={profile.currencyCode}
      decisions={decisions}
      isDemo={mode === "demo"}
      monthlyGoal={profile.monthlySavingsGoal}
      name={profile.displayName}
      onEditProfile={() =>
        setEditingProfile(true)
      }
      onNewDecision={() =>
        router.push("/(app)/budget/new")
      }
      onOpenDecisions={() =>
        router.push("/(app)/budget")
      }
      onSignOut={() => void signOut()}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  loadingText: {
    ...type.body,
  },
  errorTitle: {
    ...type.heading,
  },
  errorBody: {
    ...type.body,
    textAlign: "center",
  },
});
