import { SupabaseCoach } from "@/features/coaching/SupabaseCoach";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientReturning(
  response: unknown,
): SupabaseClient {
  return {
    functions: {
      invoke: jest.fn().mockResolvedValue(response),
    },
  } as unknown as SupabaseClient;
}

function clientRejecting(
  error: unknown,
): SupabaseClient {
  return {
    functions: {
      invoke: jest.fn().mockRejectedValue(error),
    },
  } as unknown as SupabaseClient;
}

const draft = {
  itemName: "Laptop",
  plannedAmount: 900,
  category: "Technology",
};

test("connected coach returns validated live questions", async () => {
  const client = clientReturning({
    data: {
      data: {
        questions: ["One?", "Two?", "Three?"],
      },
    },
    error: null,
  });

  const coach = new SupabaseCoach(client);
  await expect(coach.questions(draft)).resolves.toEqual([
    "One?",
    "Two?",
    "Three?",
  ]);
  expect(client.functions.invoke).toHaveBeenCalledWith(
    "financial-coach",
    {
      body: { kind: "questions", draft },
    },
  );
});

test("connected coach falls back when AI is unavailable", async () => {
  const client = clientReturning({
    data: null,
    error: {
      context: {
        json: async () => ({
          error: "ai_unavailable",
        }),
      },
    },
  });

  const coach = new SupabaseCoach(client);
  const result = await coach.monthlyReport({
    totalSpent: 500,
    totalRedirected: 120,
    topCategory: "Dining",
  });

  expect(result.mode).toBe("demo");
  expect(result.text).toContain("500.00");
});

test("connected coach does not hide rate limits", async () => {
  const client = clientReturning({
    data: null,
    error: {
      context: {
        json: async () => ({
          error: "rate_limit_exceeded",
        }),
      },
    },
  });

  const coach = new SupabaseCoach(client);
  await expect(coach.questions(draft)).rejects.toThrow(
    "AI request limit reached",
  );
});

test("connected coach falls back after a network failure", async () => {
  const error = new Error("Failed to send request");
  error.name = "FunctionsFetchError";
  const client = clientRejecting(error);

  const coach = new SupabaseCoach(client);
  const result = await coach.verdict({
    draft,
    questions: ["One?", "Two?", "Three?"],
    answers: [
      "It is not urgent",
      "I already own one",
      "I would use savings",
    ],
  });

  expect(result.mode).toBe("demo");
  expect(result.verdict).toBe("negative");
});
