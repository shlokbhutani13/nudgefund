export type Verdict = "positive" | "neutral" | "negative";

export type PurchaseDraft = {
  itemName: string;
  plannedAmount: number;
  category: string;
};

export type PurchaseDecision = PurchaseDraft & {
  id: string;
  questions: string[];
  answers: string[];
  verdict: Verdict;
  recommendation: string;
  finalItemName: string;
  finalAmount: number;
  amountRedirected: number;
  createdAt: string;
};

export type MonthlySummary = {
  totalSpent: number;
  totalRedirected: number;
  topCategory: string;
  verdictCounts: Record<Verdict, number>;
};
