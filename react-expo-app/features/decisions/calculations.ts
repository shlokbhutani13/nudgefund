import type { MonthlySummary, PurchaseDecision, Verdict } from "./types";

export function amountRedirected(planned: number, final: number) {
  return Math.max(0, planned - final);
}

export function projectFutureValue(
  principal: number,
  annualRate: number,
  years: number,
) {
  return principal * Math.pow(1 + annualRate, years);
}

export function summarizeMonth(
  rows: PurchaseDecision[],
  now = new Date(),
): MonthlySummary {
  const monthRows = rows.filter((row) => {
    const createdAt = new Date(row.createdAt);
    return (
      createdAt.getUTCFullYear() === now.getUTCFullYear() &&
      createdAt.getUTCMonth() === now.getUTCMonth()
    );
  });
  const categoryTotals = new Map<string, number>();
  const verdictCounts: Record<Verdict, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  for (const row of monthRows) {
    categoryTotals.set(
      row.category,
      (categoryTotals.get(row.category) ?? 0) + row.finalAmount,
    );
    verdictCounts[row.verdict] += 1;
  }

  const topCategory =
    [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "None yet";

  return {
    totalSpent: monthRows.reduce((sum, row) => sum + row.finalAmount, 0),
    totalRedirected: monthRows.reduce(
      (sum, row) => sum + row.amountRedirected,
      0,
    ),
    topCategory,
    verdictCounts,
  };
}
