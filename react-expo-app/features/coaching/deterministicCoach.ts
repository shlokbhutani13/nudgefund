import type { FinancialCoach } from "./contracts";

export function createDeterministicCoach(): FinancialCoach {
  return {
    async questions(draft) {
      return [
        `What problem would ${draft.itemName} solve this week?`,
        "What do you already own that could meet the same need?",
        `What goal would the ${draft.plannedAmount.toFixed(2)} support if you waited?`,
      ];
    },
    async verdict({ draft, answers }) {
      const cautionSignals = answers.filter((answer) =>
        /not urgent|already|savings|wait|don't need|do not need/i.test(answer),
      ).length;
      const verdict =
        cautionSignals >= 2
          ? "negative"
          : cautionSignals === 1
            ? "neutral"
            : "positive";

      return {
        verdict,
        reasons: [
          `The planned cost is ${draft.plannedAmount.toFixed(2)}.`,
          cautionSignals
            ? "Your answers include reasons to pause."
            : "Your answers describe a clear use.",
        ],
        recommendation:
          verdict === "positive"
            ? "Proceed only if the purchase fits your current budget."
            : "Wait 24 hours and compare one lower-cost alternative.",
        mode: "demo",
      };
    },
    async monthlyReport(input) {
      return {
        text: `You spent ${input.totalSpent.toFixed(2)} and redirected ${input.totalRedirected.toFixed(2)}. Review ${input.topCategory} first next month.`,
        mode: "demo",
      };
    },
  };
}
