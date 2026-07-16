import { createDeterministicCoach } from "@/features/coaching/deterministicCoach";

test("demo coach returns three questions and a stable verdict", async () => {
  const coach = createDeterministicCoach();
  const questions = await coach.questions({
    itemName: "Headphones",
    plannedAmount: 250,
    category: "Shopping",
  });
  const verdict = await coach.verdict({
    draft: { itemName: "Headphones", plannedAmount: 250, category: "Shopping" },
    questions,
    answers: ["I already own a pair", "It is not urgent", "I would use savings"],
  });

  expect(questions).toHaveLength(3);
  expect(verdict.mode).toBe("demo");
  expect(verdict.verdict).toBe("negative");
});

test("demo monthly report is deterministic", async () => {
  const coach = createDeterministicCoach();
  await expect(
    coach.monthlyReport({
      totalSpent: 150,
      totalRedirected: 75,
      topCategory: "Dining",
    }),
  ).resolves.toEqual({
    text: "You spent 150.00 and redirected 75.00. Review Dining first next month.",
    mode: "demo",
  });
});
