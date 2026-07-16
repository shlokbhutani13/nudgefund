const verdicts = new Set([
  "positive",
  "neutral",
  "negative",
]);

const MAX_RESPONSE_TEXT_LENGTH = 2_000;

function normalizeText(
  value: unknown,
  errorMessage: string,
) {
  if (typeof value !== "string") {
    throw new Error(errorMessage);
  }
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > MAX_RESPONSE_TEXT_LENGTH
  ) {
    throw new Error(errorMessage);
  }
  return normalized;
}

export function parseQuestions(value: unknown) {
  const questions = (
    value as { questions?: unknown } | null
  )?.questions;
  if (
    !Array.isArray(questions) ||
    questions.length !== 3
  ) {
    throw new Error(
      "Expected exactly three questions.",
    );
  }
  try {
    return questions.map((question) =>
      normalizeText(
        question,
        "Expected exactly three questions.",
      ),
    );
  } catch {
    throw new Error(
      "Expected exactly three questions.",
    );
  }
}

export function parseVerdict(value: unknown) {
  const result = value as {
    verdict?: unknown;
    reasons?: unknown;
    recommendation?: unknown;
  } | null;
  if (
    typeof result?.verdict !== "string" ||
    !verdicts.has(result.verdict)
  ) {
    throw new Error("Invalid verdict.");
  }
  if (
    !Array.isArray(result.reasons) ||
    result.reasons.length < 1 ||
    result.reasons.length > 5
  ) {
    throw new Error("Invalid reasons.");
  }

  let reasons: string[];
  try {
    reasons = result.reasons.map((reason) =>
      normalizeText(reason, "Invalid reasons."),
    );
  } catch {
    throw new Error("Invalid reasons.");
  }

  return {
    verdict: result.verdict as
      | "positive"
      | "neutral"
      | "negative",
    reasons,
    recommendation: normalizeText(
      result.recommendation,
      "Invalid recommendation.",
    ),
  };
}

export function parseMonthlyReport(value: unknown) {
  return {
    text: normalizeText(
      (value as { text?: unknown } | null)?.text,
      "Invalid monthly report.",
    ),
  };
}
