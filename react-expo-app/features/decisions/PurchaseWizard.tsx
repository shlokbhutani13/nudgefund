import Ionicons from "@expo/vector-icons/Ionicons";
import { randomUUID } from "expo-crypto";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
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
import type {
  CoachingVerdict,
  FinancialCoach,
} from "@/features/coaching/contracts";
import {
  amountRedirected,
} from "./calculations";
import type {
  PurchaseDecision,
  PurchaseDraft,
} from "./types";
import { validatePurchaseDraft } from "./validation";

const categories = [
  "Shopping",
  "Technology",
  "Dining",
  "Travel",
  "Home",
  "Other",
];

type Step =
  | "details"
  | "questions"
  | "verdict"
  | "final";

const stepNumber: Record<Step, number> = {
  details: 1,
  questions: 2,
  verdict: 3,
  final: 4,
};

export function PurchaseWizard({
  coach,
  onCancel,
  onComplete,
}: {
  coach: FinancialCoach;
  onCancel(): void;
  onComplete(
    decision: PurchaseDecision,
  ): Promise<void>;
}) {
  const palette = useAppTheme();
  const [step, setStep] = useState<Step>("details");
  const [itemName, setItemName] = useState("");
  const [plannedAmount, setPlannedAmount] =
    useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState<
    string[]
  >([]);
  const [answers, setAnswers] = useState([
    "",
    "",
    "",
  ]);
  const [coaching, setCoaching] =
    useState<CoachingVerdict | null>(null);
  const [finalItemName, setFinalItemName] =
    useState("");
  const [finalAmount, setFinalAmount] =
    useState("");
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const draft: PurchaseDraft = {
    itemName: itemName.trim(),
    plannedAmount: Number(plannedAmount),
    category,
  };

  const continueToQuestions = async () => {
    const nextErrors = validatePurchaseDraft(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setError("");
    setLoading(true);
    try {
      const nextQuestions =
        await coach.questions(draft);
      setQuestions(nextQuestions);
      setAnswers(["", "", ""]);
      setStep("questions");
    } catch (questionError) {
      setError(
        questionError instanceof Error
          ? questionError.message
          : "Coaching questions could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reviewAnswers = async () => {
    if (
      answers.some((answer) => !answer.trim())
    ) {
      setError(
        "Answer all three questions before continuing.",
      );
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await coach.verdict({
        draft,
        questions,
        answers: answers.map((answer) =>
          answer.trim(),
        ),
      });
      setCoaching(result);
      setStep("verdict");
    } catch (verdictError) {
      setError(
        verdictError instanceof Error
          ? verdictError.message
          : "Your reflection could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  };

  const continueToFinal = () => {
    setFinalItemName(itemName.trim());
    setFinalAmount(String(draft.plannedAmount));
    setError("");
    setStep("final");
  };

  const save = async () => {
    if (!coaching) return;
    const normalizedItem = finalItemName.trim();
    const normalizedAmount = Number(finalAmount);
    if (!normalizedItem) {
      setError("Enter the final item or outcome.");
      return;
    }
    if (
      !Number.isFinite(normalizedAmount) ||
      normalizedAmount < 0 ||
      normalizedAmount > 100_000_000
    ) {
      setError(
        "Enter a final amount from 0 to 100,000,000.",
      );
      return;
    }

    const decision: PurchaseDecision = {
      id: randomUUID(),
      ...draft,
      questions,
      answers: answers.map((answer) =>
        answer.trim(),
      ),
      verdict: coaching.verdict,
      recommendation: coaching.recommendation,
      finalItemName: normalizedItem,
      finalAmount: normalizedAmount,
      amountRedirected: amountRedirected(
        draft.plannedAmount,
        normalizedAmount,
      ),
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    setError("");
    try {
      await onComplete(decision);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The decision could not be saved.",
      );
      setSaving(false);
    }
  };

  const goBack = () => {
    setError("");
    if (step === "details") {
      onCancel();
    } else if (step === "questions") {
      setStep("details");
    } else if (step === "verdict") {
      setStep("questions");
    } else {
      setStep("verdict");
    }
  };

  return (
    <AppScreen maxWidth={820}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={
            step === "details"
              ? "Cancel purchase check"
              : "Go to previous step"
          }
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            color={palette.ink}
            name={
              step === "details"
                ? "close-outline"
                : "arrow-back-outline"
            }
            size={23}
          />
        </Pressable>
        <View style={styles.progressCopy}>
          <Text
            style={[
              styles.step,
              { color: palette.mint },
            ]}
          >
            Step {stepNumber[step]} of 4
          </Text>
          <View style={styles.progressDots}>
            {([1, 2, 3, 4] as const).map(
              (number) => (
                <View
                  key={number}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        number <= stepNumber[step]
                          ? palette.mint
                          : palette.line,
                    },
                  ]}
                />
              ),
            )}
          </View>
        </View>
      </View>

      {step === "details" ? (
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text
              style={[
                styles.eyebrow,
                { color: palette.mint },
              ]}
            >
              Start with the purchase
            </Text>
            <Text
              style={[
                styles.title,
                { color: palette.ink },
              ]}
            >
              What are you thinking about buying?
            </Text>
            <Text
              style={[
                styles.intro,
                { color: palette.inkMuted },
              ]}
            >
              Capture the current plan. You will record
              the final outcome only after reflecting.
            </Text>
          </View>

          <AppCard style={styles.card}>
            <AppField
              error={errors.itemName}
              label="Item or purchase"
              maxLength={120}
              onChangeText={setItemName}
              placeholder="What are you considering?"
              value={itemName}
            />
            <AppField
              error={errors.plannedAmount}
              keyboardType="decimal-pad"
              label="Planned amount"
              onChangeText={setPlannedAmount}
              placeholder="0.00"
              value={plannedAmount}
            />
            <View style={styles.categoryField}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: palette.ink },
                ]}
              >
                Category
              </Text>
              <View style={styles.chips}>
                {categories.map((item) => {
                  const selected =
                    item === category;
                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected,
                      }}
                      onPress={() => setCategory(item)}
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
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.category ? (
                <Text
                  accessibilityRole="alert"
                  style={[
                    styles.fieldError,
                    { color: palette.risk },
                  ]}
                >
                  {errors.category}
                </Text>
              ) : null}
            </View>
            {error ? (
              <ErrorText message={error} />
            ) : null}
            <AppButton
              label="Continue"
              loading={loading}
              onPress={() =>
                void continueToQuestions()
              }
            />
          </AppCard>
        </View>
      ) : null}

      {step === "questions" ? (
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text
              style={[
                styles.eyebrow,
                { color: palette.mint },
              ]}
            >
              Pause and reflect
            </Text>
            <Text
              style={[
                styles.title,
                { color: palette.ink },
              ]}
            >
              Answer honestly. There is no “correct”
              purchase.
            </Text>
          </View>
          <View style={styles.questionList}>
            {questions.map((question, index) => (
              <AppCard
                key={question}
                style={styles.questionCard}
              >
                <Text
                  style={[
                    styles.questionNumber,
                    { color: palette.mint },
                  ]}
                >
                  Question {index + 1}
                </Text>
                <AppField
                  label={question}
                  maxLength={500}
                  multiline
                  onChangeText={(value) => {
                    setAnswers((current) =>
                      current.map((answer, answerIndex) =>
                        answerIndex === index
                          ? value
                          : answer,
                      ),
                    );
                  }}
                  placeholder="Write your answer"
                  value={answers[index]}
                />
              </AppCard>
            ))}
          </View>
          {error ? (
            <ErrorText message={error} />
          ) : null}
          <AppButton
            label="Review my answers"
            loading={loading}
            onPress={() => void reviewAnswers()}
          />
        </View>
      ) : null}

      {step === "verdict" && coaching ? (
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text
              style={[
                styles.eyebrow,
                { color: palette.mint },
              ]}
            >
              Your reflection
            </Text>
            <Text
              style={[
                styles.title,
                { color: palette.ink },
              ]}
            >
              A practical view of the tradeoff.
            </Text>
          </View>
          <AppCard
            style={styles.card}
            tone={
              coaching.verdict === "positive"
                ? "mint"
                : coaching.verdict === "negative"
                  ? "risk"
                  : "amber"
            }
          >
            <View style={styles.verdictHeading}>
              <View
                style={[
                  styles.verdictIcon,
                  {
                    backgroundColor:
                      palette.surface,
                  },
                ]}
              >
                <Ionicons
                  color={
                    coaching.verdict === "positive"
                      ? palette.mint
                      : coaching.verdict ===
                          "negative"
                        ? palette.risk
                        : palette.amber
                  }
                  name={
                    coaching.verdict === "positive"
                      ? "checkmark-outline"
                      : coaching.verdict ===
                          "negative"
                        ? "pause-outline"
                        : "scale-outline"
                  }
                  size={26}
                />
              </View>
              <View style={styles.verdictCopy}>
                <Text
                  style={[
                    styles.verdictLabel,
                    { color: palette.inkMuted },
                  ]}
                >
                  {coaching.mode === "live"
                    ? "AI-assisted reflection"
                    : "Demo reflection"}
                </Text>
                <Text
                  style={[
                    styles.verdictTitle,
                    { color: palette.ink },
                  ]}
                >
                  {coaching.verdict === "positive"
                    ? "The purchase has a clear case."
                    : coaching.verdict === "negative"
                      ? "A pause may serve you better."
                      : "The tradeoff deserves another look."}
                </Text>
              </View>
            </View>
            <View style={styles.reasonList}>
              {coaching.reasons.map((reason) => (
                <View
                  key={reason}
                  style={styles.reasonRow}
                >
                  <View
                    style={[
                      styles.reasonDot,
                      {
                        backgroundColor:
                          palette.ink,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      { color: palette.ink },
                    ]}
                  >
                    {reason}
                  </Text>
                </View>
              ))}
            </View>
            <View
              style={[
                styles.recommendation,
                {
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.recommendationLabel,
                  { color: palette.mint },
                ]}
              >
                Suggested next step
              </Text>
              <Text
                style={[
                  styles.recommendationText,
                  { color: palette.ink },
                ]}
              >
                {coaching.recommendation}
              </Text>
            </View>
          </AppCard>
          {error ? (
            <ErrorText message={error} />
          ) : null}
          <AppButton
            label="Record final decision"
            onPress={continueToFinal}
          />
        </View>
      ) : null}

      {step === "final" && coaching ? (
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text
              style={[
                styles.eyebrow,
                { color: palette.mint },
              ]}
            >
              Close the loop
            </Text>
            <Text
              style={[
                styles.title,
                { color: palette.ink },
              ]}
            >
              What did you finally decide?
            </Text>
            <Text
              style={[
                styles.intro,
                { color: palette.inkMuted },
              ]}
            >
              A zero amount is valid if you chose not
              to buy anything.
            </Text>
          </View>
          <AppCard style={styles.card}>
            <View
              style={[
                styles.planSummary,
                {
                  backgroundColor:
                    palette.surfaceMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.planLabel,
                  { color: palette.inkMuted },
                ]}
              >
                Original plan
              </Text>
              <Text
                style={[
                  styles.planValue,
                  { color: palette.ink },
                ]}
              >
                {itemName} · {plannedAmount}
              </Text>
            </View>
            <AppField
              accessibilityLabel="Final item"
              label="Final item or outcome"
              maxLength={120}
              onChangeText={setFinalItemName}
              placeholder="What did you choose?"
              value={finalItemName}
            />
            <AppField
              accessibilityLabel="Final amount"
              keyboardType="decimal-pad"
              label="Final amount"
              onChangeText={setFinalAmount}
              placeholder="0.00"
              value={finalAmount}
            />
            {error ? (
              <ErrorText message={error} />
            ) : null}
            <AppButton
              label="Save decision"
              loading={saving}
              onPress={() => void save()}
            />
          </AppCard>
        </View>
      ) : null}
    </AppScreen>
  );
}

function ErrorText({
  message,
}: {
  message: string;
}) {
  const palette = useAppTheme();
  return (
    <Text
      accessibilityRole="alert"
      style={[
        styles.error,
        { color: palette.risk },
      ]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  step: {
    ...type.caption,
    fontWeight: "800",
  },
  progressDots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  progressDot: {
    height: 5,
    borderRadius: radius.pill,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
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
  categoryField: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    ...type.caption,
    fontWeight: "700",
  },
  fieldError: {
    ...type.caption,
  },
  questionList: {
    gap: spacing.md,
  },
  questionCard: {
    gap: spacing.sm,
  },
  questionNumber: {
    ...type.eyebrow,
  },
  verdictHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  verdictIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  verdictCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  verdictLabel: {
    ...type.caption,
    fontWeight: "700",
  },
  verdictTitle: {
    ...type.heading,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  reasonText: {
    ...type.body,
    flex: 1,
  },
  recommendation: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recommendationLabel: {
    ...type.eyebrow,
  },
  recommendationText: {
    ...type.bodyStrong,
  },
  planSummary: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  planLabel: {
    ...type.caption,
  },
  planValue: {
    ...type.bodyStrong,
  },
  error: {
    ...type.caption,
  },
});
