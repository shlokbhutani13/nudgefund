import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppField } from "@/components/ui/AppField";
import { AppScreen } from "@/components/ui/AppScreen";
import {
  radius,
  spacing,
  type,
  useAppTheme,
} from "@/constants/theme";

type AuthResult = {
  error?: string;
};

export function LoginView({
  connectedModeAvailable,
  onDemo,
  onResetPassword,
  onSignIn,
  onSignUp,
}: {
  connectedModeAvailable: boolean;
  onDemo(): void;
  onResetPassword(
    email: string,
  ): Promise<AuthResult>;
  onSignIn(
    email: string,
    password: string,
  ): Promise<AuthResult>;
  onSignUp(): void;
}) {
  const palette = useAppTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError("");
    setMessage("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await onSignIn(email, password);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
  };

  const resetPassword = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError(
        "Enter your email first, then request a reset link.",
      );
      return;
    }

    setLoading(true);
    const result = await onResetPassword(email);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setMessage(
      "If an account exists, a reset link is on its way.",
    );
  };

  return (
    <AppScreen maxWidth={1180}>
      <View
        style={[
          styles.shell,
          isWide ? styles.shellWide : null,
        ]}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor:
                palette.brandSurface,
              borderColor: palette.line,
            },
          ]}
        >
          <View style={styles.wordmark}>
            <View
              style={[
                styles.mark,
                {
                  backgroundColor:
                    palette.mintBright,
                },
              ]}
            >
              <Ionicons
                color={palette.ink}
                name="leaf-outline"
                size={22}
              />
            </View>
            <Text
              style={[
                styles.brand,
                { color: palette.onBrand },
              ]}
            >
              NudgeFund
            </Text>
          </View>

          <View style={styles.heroCopy}>
            <Text
              style={[
                styles.eyebrow,
                { color: palette.mintBright },
              ]}
            >
              Behavioral finance, made practical
            </Text>
            <Text
              style={[
                isWide
                  ? styles.heroTitleWide
                  : styles.heroTitle,
                { color: palette.onBrand },
              ]}
            >
              Make spending decisions on purpose.
            </Text>
            <Text
              style={[
                styles.heroBody,
                { color: palette.onBrandMuted },
              ]}
            >
              Pause before a purchase, reflect on the
              tradeoff, and see what your redirected
              money could support over time.
            </Text>
          </View>

          <View style={styles.featureList}>
            {[
              "Three-question purchase checks",
              "Private demo mode with local storage",
              "Educational growth projections",
            ].map((item) => (
              <View
                key={item}
                style={styles.featureRow}
              >
                <Ionicons
                  color={palette.mintBright}
                  name="checkmark-circle-outline"
                  size={20}
                />
                <Text
                  style={[
                    styles.featureText,
                    { color: palette.onBrand },
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <AppCard style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text
              style={[
                styles.formTitle,
                { color: palette.ink },
              ]}
            >
              Welcome back
            </Text>
            <Text
              style={[
                styles.formIntro,
                { color: palette.inkMuted },
              ]}
            >
              Sign in to sync decisions across your
              devices, or explore the complete demo
              without an account.
            </Text>
          </View>

          {!connectedModeAvailable ? (
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: palette.amberSoft,
                },
              ]}
            >
              <Ionicons
                color={palette.amber}
                name="information-circle-outline"
                size={20}
              />
              <Text
                style={[
                  styles.noticeText,
                  { color: palette.ink },
                ]}
              >
                Cloud sign-in is not configured in this
                build. Demo mode remains fully available.
              </Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <AppField
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              textContentType="emailAddress"
              value={email}
            />
            <View>
              <AppField
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                label="Password"
                onChangeText={setPassword}
                onSubmitEditing={() => void signIn()}
                placeholder="Enter your password"
                returnKeyType="go"
                secureTextEntry={!showPassword}
                textContentType="password"
                value={password}
              />
              <Pressable
                accessibilityLabel={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                accessibilityRole="button"
                hitSlop={12}
                onPress={() =>
                  setShowPassword((value) => !value)
                }
                style={styles.passwordToggle}
              >
                <Ionicons
                  color={palette.inkMuted}
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                />
              </Pressable>
            </View>
          </View>

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
          ) : message ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.feedback,
                { color: palette.mint },
              ]}
            >
              {message}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              disabled={!connectedModeAvailable}
              label="Sign in"
              loading={loading}
              onPress={() => void signIn()}
            />
            <AppButton
              icon="sparkles-outline"
              label="Explore demo"
              onPress={onDemo}
              variant="secondary"
            />
          </View>

          <View style={styles.textActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void resetPassword()}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={[
                  styles.textAction,
                  { color: palette.mint },
                ]}
              >
                Forgot password?
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onSignUp}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={[
                  styles.textAction,
                  { color: palette.ink },
                ]}
              >
                Create an account
              </Text>
            </Pressable>
          </View>

          <Text
            style={[
              styles.privacy,
              { color: palette.inkMuted },
            ]}
          >
            Demo data stays on this browser or device.
            Clearing application storage can erase it.
          </Text>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: spacing.lg,
    justifyContent: "center",
    minHeight: Platform.OS === "web" ? 680 : undefined,
  },
  shellWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  hero: {
    flex: 1.15,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    minHeight: 430,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  heroCopy: {
    maxWidth: 590,
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  eyebrow: {
    ...type.eyebrow,
  },
  heroTitle: {
    ...type.title,
  },
  heroTitleWide: {
    ...type.display,
    fontSize: 48,
    lineHeight: 54,
  },
  heroBody: {
    ...type.body,
    maxWidth: 520,
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    ...type.caption,
    fontSize: 14,
  },
  formCard: {
    flex: 0.85,
    justifyContent: "center",
    gap: spacing.lg,
    minWidth: 0,
  },
  formHeader: {
    gap: spacing.sm,
  },
  formTitle: {
    ...type.title,
  },
  formIntro: {
    ...type.body,
  },
  fields: {
    gap: spacing.md,
  },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "flex-start",
  },
  noticeText: {
    ...type.caption,
    flex: 1,
  },
  passwordToggle: {
    position: "absolute",
    right: spacing.md,
    bottom: 5,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  feedback: {
    ...type.caption,
  },
  actions: {
    gap: spacing.sm,
  },
  textActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  textAction: {
    ...type.caption,
    fontWeight: "700",
    minHeight: 44,
    textAlignVertical: "center",
  },
  privacy: {
    ...type.caption,
    textAlign: "center",
  },
});
