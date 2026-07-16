import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppField } from "@/components/ui/AppField";
import { AppScreen } from "@/components/ui/AppScreen";
import {
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";

type AuthResult = { error?: string };

export function SignupView({
  connectedModeAvailable,
  onBack,
  onSignUp,
}: {
  connectedModeAvailable: boolean;
  onBack(): void;
  onSignUp(
    email: string,
    password: string,
  ): Promise<AuthResult>;
}) {
  const palette = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError(
        "Use a password with at least six characters.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await onSignUp(email, password);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(
      "Account created. Check your inbox if email confirmation is enabled, then return to sign in.",
    );
  };

  return (
    <AppScreen maxWidth={560}>
      <View style={styles.header}>
        <View
          style={[
            styles.mark,
            {
              backgroundColor: palette.mintSoft,
            },
          ]}
        >
          <Ionicons
            color={palette.mint}
            name="leaf-outline"
            size={24}
          />
        </View>
        <Text
          style={[
            styles.title,
            { color: palette.ink },
          ]}
        >
          Create your NudgeFund account
        </Text>
        <Text
          style={[
            styles.intro,
            { color: palette.inkMuted },
          ]}
        >
          Your purchase decisions and preferences will
          sync securely through your own Supabase
          account.
        </Text>
      </View>

      <AppCard style={styles.card}>
        <AppField
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          textContentType="emailAddress"
          value={email}
        />
        <AppField
          autoCapitalize="none"
          autoComplete="new-password"
          helper="Use at least six characters."
          label="Password"
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <AppField
          autoCapitalize="none"
          autoComplete="new-password"
          label="Confirm password"
          onChangeText={setConfirmPassword}
          onSubmitEditing={() => void submit()}
          placeholder="Repeat your password"
          returnKeyType="go"
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
        />

        {error ? (
          <Text
            accessibilityRole="alert"
            style={[
              styles.feedback,
              { color: palette.risk },
            ]}
          >
            {error}
          </Text>
        ) : success ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              { color: palette.mint },
            ]}
          >
            {success}
          </Text>
        ) : null}

        <AppButton
          disabled={!connectedModeAvailable}
          label="Create account"
          loading={loading}
          onPress={() => void submit()}
        />
        <AppButton
          label="Back to sign in"
          onPress={onBack}
          variant="ghost"
        />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...type.title,
    textAlign: "center",
  },
  intro: {
    ...type.body,
    textAlign: "center",
    maxWidth: 500,
  },
  card: {
    gap: spacing.lg,
  },
  feedback: {
    ...type.caption,
  },
});
