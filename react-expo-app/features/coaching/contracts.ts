import type { PurchaseDraft, Verdict } from "../decisions/types";

export type CoachingVerdict = {
  verdict: Verdict;
  reasons: string[];
  recommendation: string;
  mode: "live" | "demo";
};

export interface FinancialCoach {
  questions(draft: PurchaseDraft): Promise<string[]>;
  verdict(input: {
    draft: PurchaseDraft;
    questions: string[];
    answers: string[];
  }): Promise<CoachingVerdict>;
  monthlyReport(input: {
    totalSpent: number;
    totalRedirected: number;
    topCategory: string;
  }): Promise<{ text: string; mode: "live" | "demo" }>;
}
