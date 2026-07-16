import type { PurchaseDecision } from "@/features/decisions/types";

export interface DecisionRepository {
  list(): Promise<PurchaseDecision[]>;
  create(input: PurchaseDecision): Promise<PurchaseDecision>;
  remove(id: string): Promise<void>;
}
