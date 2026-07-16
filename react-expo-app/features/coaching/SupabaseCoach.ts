import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseMonthlyReport,
  parseQuestions,
  parseVerdict,
} from "./responseValidation";
import type {
  FinancialCoach,
} from "./contracts";
import { createDeterministicCoach } from "./deterministicCoach";

type FunctionError = {
  name?: string;
  message?: string;
  context?: {
    clone?: () => {
      json: () => Promise<unknown>;
    };
    json?: () => Promise<unknown>;
  };
};

type FunctionEnvelope = {
  data?: unknown;
};

async function functionErrorCode(error: unknown) {
  const context = (error as FunctionError | null)
    ?.context;
  if (!context) return "";

  try {
    const payload = context.clone
      ? await context.clone().json()
      : context.json
        ? await context.json()
        : null;
    const code = (
      payload as { error?: unknown } | null
    )?.error;
    return typeof code === "string" ? code : "";
  } catch {
    return "";
  }
}

function isNetworkError(error: unknown) {
  const candidate = error as FunctionError | null;
  return (
    candidate?.name === "FunctionsFetchError" ||
    /network request failed|failed to fetch|failed to send request/i.test(
      candidate?.message ?? "",
    )
  );
}

function messageForCode(code: string) {
  if (code === "authentication_required") {
    return "Sign in to use live AI coaching.";
  }
  if (code === "rate_limit_exceeded") {
    return "AI request limit reached. Try again in an hour.";
  }
  if (
    code === "invalid_request" ||
    code === "invalid_request_kind" ||
    code === "invalid_json"
  ) {
    return "The coaching request was invalid.";
  }
  return "Live AI coaching could not complete this request.";
}

export class SupabaseCoach implements FinancialCoach {
  private readonly fallback: FinancialCoach;

  constructor(
    private readonly client: SupabaseClient,
    fallback: FinancialCoach =
      createDeterministicCoach(),
  ) {
    this.fallback = fallback;
  }

  private async invoke(
    kind: "questions" | "verdict" | "monthly_report",
    body: Record<string, unknown>,
  ) {
    let result;
    try {
      result = await this.client.functions.invoke(
        "financial-coach",
        {
          body: { kind, ...body },
        },
      );
    } catch (error) {
      if (isNetworkError(error)) {
        return null;
      }
      throw error;
    }

    const { data, error } = result;

    if (error) {
      if (isNetworkError(error)) {
        return null;
      }

      const code = await functionErrorCode(error);
      if (code === "ai_unavailable") {
        return null;
      }
      throw new Error(messageForCode(code));
    }

    const envelope = data as FunctionEnvelope | null;
    if (
      !envelope ||
      !("data" in envelope)
    ) {
      throw new Error(
        "Live AI coaching returned an invalid response.",
      );
    }
    return envelope.data;
  }

  async questions(
    draft: Parameters<
      FinancialCoach["questions"]
    >[0],
  ) {
    const data = await this.invoke("questions", {
      draft,
    });
    if (data === null) {
      return this.fallback.questions(draft);
    }
    return parseQuestions(data);
  }

  async verdict(
    input: Parameters<
      FinancialCoach["verdict"]
    >[0],
  ) {
    const data = await this.invoke("verdict", input);
    if (data === null) {
      return this.fallback.verdict(input);
    }
    return {
      ...parseVerdict(data),
      mode: "live" as const,
    };
  }

  async monthlyReport(
    input: Parameters<
      FinancialCoach["monthlyReport"]
    >[0],
  ) {
    const data = await this.invoke(
      "monthly_report",
      input,
    );
    if (data === null) {
      return this.fallback.monthlyReport(input);
    }
    return {
      ...parseMonthlyReport(data),
      mode: "live" as const,
    };
  }
}
