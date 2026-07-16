import {
  amountRedirected,
  projectFutureValue,
  summarizeMonth,
} from "@/features/decisions/calculations";
import type { PurchaseDecision } from "@/features/decisions/types";

test("redirected amount never becomes negative", () => {
  expect(amountRedirected(120, 80)).toBe(40);
  expect(amountRedirected(80, 120)).toBe(0);
});

test("future value compounds a redirected amount", () => {
  expect(projectFutureValue(1000, 0.07, 10)).toBeCloseTo(1967.15, 2);
});

test("monthly summary only includes decisions from the selected month", () => {
  const rows = [
    {
      finalAmount: 70,
      amountRedirected: 30,
      category: "Shopping",
      verdict: "negative",
      createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
      finalAmount: 40,
      amountRedirected: 10,
      category: "Dining",
      verdict: "neutral",
      createdAt: "2026-06-30T00:00:00.000Z",
    },
  ] as PurchaseDecision[];

  expect(summarizeMonth(rows, new Date("2026-07-16T00:00:00.000Z"))).toMatchObject({
    totalSpent: 70,
    totalRedirected: 30,
    topCategory: "Shopping",
    verdictCounts: { positive: 0, neutral: 0, negative: 1 },
  });
});
