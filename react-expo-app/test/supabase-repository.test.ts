import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDecisionRepository } from "@/data/SupabaseDecisionRepository";

test("cloud decisions are inserted with the authenticated user id", async () => {
  const insert = jest.fn(() => ({
    select: () => ({
      single: () => ({
        throwOnError: async () => ({
          data: {
            id: "decision-1",
            item_name: "Headphones",
            planned_amount: 250,
            category: "Shopping",
            questions: ["q1", "q2", "q3"],
            answers: ["a1", "a2", "a3"],
            verdict: "negative",
            recommendation: "Wait",
            final_item_name: "No purchase",
            final_amount: 0,
            amount_redirected: 250,
            created_at: "2026-07-16T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    }),
  }));
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: () => ({ insert }),
  } as unknown as SupabaseClient;

  const repository = new SupabaseDecisionRepository(client);
  await repository.create({
    id: "decision-1",
    itemName: "Headphones",
    plannedAmount: 250,
    category: "Shopping",
    questions: ["q1", "q2", "q3"],
    answers: ["a1", "a2", "a3"],
    verdict: "negative",
    recommendation: "Wait",
    finalItemName: "No purchase",
    finalAmount: 0,
    amountRedirected: 250,
    createdAt: "2026-07-16T00:00:00.000Z",
  });

  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "decision-1",
      user_id: "user-1",
    }),
  );
});
