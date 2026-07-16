import { LocalDecisionRepository } from "@/data/LocalDecisionRepository";
import { LocalProfileRepository } from "@/data/LocalProfileRepository";
import { createMemoryStorage } from "@/lib/storage";

test("local repository persists completed decisions", async () => {
  const repository = new LocalDecisionRepository(createMemoryStorage());
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

  expect(await repository.list()).toHaveLength(1);
  await repository.remove("decision-1");
  expect(await repository.list()).toEqual([]);
});

test("local profile repository persists onboarding preferences", async () => {
  const repository = new LocalProfileRepository(createMemoryStorage());
  await repository.save({
    displayName: "Maya",
    currencyCode: "USD",
    monthlySavingsGoal: 300,
  });

  expect(await repository.get()).toEqual({
    displayName: "Maya",
    currencyCode: "USD",
    monthlySavingsGoal: 300,
  });
});
