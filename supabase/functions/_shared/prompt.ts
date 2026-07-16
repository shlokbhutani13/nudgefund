export type RequestKind =
  | "questions"
  | "verdict"
  | "monthly_report";

type UnknownRecord = Record<string, unknown>;

const MAX_AMOUNT = 100_000_000;
const MAX_TEXT_LENGTH = 500;

function asRecord(
  value: unknown,
  message = "Invalid request body.",
): UnknownRecord {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(message);
  }
  return value as UnknownRecord;
}

function boundedText(
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
) {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}.`);
  }

  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > maxLength
  ) {
    throw new Error(`Invalid ${field}.`);
  }
  return normalized;
}

function boundedAmount(
  value: unknown,
  field = "amount",
  allowZero = false,
) {
  const minimum = allowZero ? 0 : 0.01;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > MAX_AMOUNT
  ) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

function purchaseDraft(value: unknown) {
  const draft = asRecord(
    value,
    "Invalid purchase draft.",
  );
  return {
    itemName: boundedText(
      draft.itemName,
      "item name",
    ),
    plannedAmount: boundedAmount(
      draft.plannedAmount,
    ),
    category: boundedText(
      draft.category,
      "category",
      100,
    ),
  };
}

function threeTexts(
  value: unknown,
  field: string,
) {
  if (
    !Array.isArray(value) ||
    value.length !== 3
  ) {
    throw new Error(`Invalid ${field}.`);
  }

  return value.map((item) =>
    boundedText(item, field),
  );
}

function baseInstructions(schema: string) {
  return [
    "You are NudgeFund, a concise behavioral-finance coach.",
    "Return JSON only. Do not use markdown or code fences.",
    `The exact response shape is ${schema}.`,
    "Keep the response practical, specific, and non-judgmental.",
    "This response is educational and is not financial advice.",
  ].join("\n");
}

export function buildPrompt(
  kind: RequestKind,
  value: unknown,
) {
  const body = asRecord(value);

  if (kind === "questions") {
    const draft = purchaseDraft(body.draft);
    return [
      baseInstructions(
        '{"questions":["question 1","question 2","question 3"]}',
      ),
      "Ask exactly three short questions that help the user pause before buying.",
      `Purchase: ${JSON.stringify(draft)}`,
    ].join("\n");
  }

  if (kind === "verdict") {
    const input = {
      draft: purchaseDraft(body.draft),
      questions: threeTexts(
        body.questions,
        "questions",
      ),
      answers: threeTexts(
        body.answers,
        "answers",
      ),
    };
    return [
      baseInstructions(
        '{"verdict":"positive|neutral|negative","reasons":["reason"],"recommendation":"next step"}',
      ),
      "Evaluate whether the purchase supports the user's stated needs and tradeoffs.",
      "Use one to five short reasons and one concrete recommendation.",
      `Decision context: ${JSON.stringify(input)}`,
    ].join("\n");
  }

  if (kind === "monthly_report") {
    const input = {
      totalSpent: boundedAmount(
        body.totalSpent,
        "total spent",
        true,
      ),
      totalRedirected: boundedAmount(
        body.totalRedirected,
        "total redirected",
        true,
      ),
      topCategory: boundedText(
        body.topCategory,
        "top category",
        100,
      ),
    };
    return [
      baseInstructions('{"text":"monthly insight"}'),
      "Write a short monthly reflection with one useful next action.",
      `Monthly summary: ${JSON.stringify(input)}`,
    ].join("\n");
  }

  throw new Error("Invalid request kind.");
}
