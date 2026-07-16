import { GoogleGenAI } from "npm:@google/genai@2.11.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.5";
import {
  parseMonthlyReport,
  parseQuestions,
  parseVerdict,
} from "../_shared/contracts.ts";
import {
  buildPrompt,
  type RequestKind,
} from "../_shared/prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestKinds = new Set<RequestKind>([
  "questions",
  "verdict",
  "monthly_report",
]);

function jsonResponse(
  body: unknown,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function keyFromJsonSet(name: string) {
  const raw = Deno.env.get(name);
  if (!raw) return "";

  try {
    const values = JSON.parse(raw) as Record<
      string,
      unknown
    >;
    const preferred = values.default;
    if (typeof preferred === "string") {
      return preferred;
    }
    return (
      Object.values(values).find(
        (value) => typeof value === "string",
      ) as string | undefined
    ) ?? "";
  } catch {
    return "";
  }
}

function getPublishableKey() {
  return (
    keyFromJsonSet("SUPABASE_PUBLISHABLE_KEYS") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY") ||
    ""
  );
}

function parseRequestKind(
  value: unknown,
): RequestKind | null {
  return typeof value === "string" &&
      requestKinds.has(value as RequestKind)
    ? (value as RequestKind)
    : null;
}

function validateAuthorization(request: Request) {
  const authorization =
    request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }
  const accessToken = authorization.slice(7).trim();
  return accessToken
    ? { authorization, accessToken }
    : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "method_not_allowed" },
      405,
    );
  }

  const credentials = validateAuthorization(request);
  if (!credentials) {
    return jsonResponse(
      { error: "authentication_required" },
      401,
    );
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getPublishableKey();
  if (!url || !publishableKey) {
    return jsonResponse(
      { error: "service_misconfigured" },
      503,
    );
  }

  const userClient = createClient(
    url,
    publishableKey,
    {
      global: {
        headers: {
          Authorization: credentials.authorization,
        },
      },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser(
    credentials.accessToken,
  );
  if (authError || !user) {
    return jsonResponse(
      { error: "authentication_required" },
      401,
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("Invalid body");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse(
      { error: "invalid_json" },
      400,
    );
  }

  const kind = parseRequestKind(body.kind);
  if (!kind) {
    return jsonResponse(
      { error: "invalid_request_kind" },
      422,
    );
  }

  let prompt: string;
  try {
    prompt = buildPrompt(kind, body);
  } catch {
    return jsonResponse(
      { error: "invalid_request" },
      422,
    );
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse(
      { error: "ai_unavailable" },
      503,
    );
  }

  const { data: allowed, error: quotaError } =
    await userClient.rpc("consume_ai_quota", {
      p_request_kind: kind,
    });
  if (quotaError) {
    return jsonResponse(
      { error: "quota_check_failed" },
      500,
    );
  }
  if (!allowed) {
    return jsonResponse(
      { error: "rate_limit_exceeded" },
      429,
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model:
        Deno.env.get("GEMINI_MODEL") ??
        "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.25,
        maxOutputTokens: 800,
      },
    });

    const parsed = JSON.parse(result.text ?? "{}");
    const data =
      kind === "questions"
        ? { questions: parseQuestions(parsed) }
        : kind === "verdict"
          ? parseVerdict(parsed)
          : parseMonthlyReport(parsed);

    return jsonResponse({ data });
  } catch (error) {
    console.error(
      "Financial coach generation failed:",
      error instanceof Error
        ? error.message
        : "unknown error",
    );
    return jsonResponse(
      { error: "ai_unavailable" },
      503,
    );
  }
});
