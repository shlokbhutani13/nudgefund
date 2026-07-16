import type { SupabaseClient } from "@supabase/supabase-js";
import type { PurchaseDecision } from "@/features/decisions/types";
import type { DecisionRepository } from "./DecisionRepository";

const columns =
  "id,item_name,planned_amount,category,questions,answers,verdict,recommendation,final_item_name,final_amount,amount_redirected,created_at";

type DecisionRow = {
  id: string;
  item_name: string;
  planned_amount: number;
  category: string;
  questions: string[];
  answers: string[];
  verdict: PurchaseDecision["verdict"];
  recommendation: string;
  final_item_name: string;
  final_amount: number;
  amount_redirected: number;
  created_at: string;
};

function mapDecision(row: DecisionRow): PurchaseDecision {
  return {
    id: row.id,
    itemName: row.item_name,
    plannedAmount: Number(row.planned_amount),
    category: row.category,
    questions: row.questions,
    answers: row.answers,
    verdict: row.verdict,
    recommendation: row.recommendation,
    finalItemName: row.final_item_name,
    finalAmount: Number(row.final_amount),
    amountRedirected: Number(row.amount_redirected),
    createdAt: row.created_at,
  };
}

export class SupabaseDecisionRepository implements DecisionRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async requireUserId() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error("Authentication required.");
    return data.user.id;
  }

  async list() {
    const { data } = await this.client
      .from("purchase_decisions")
      .select(columns)
      .order("created_at", { ascending: false })
      .throwOnError();

    return ((data ?? []) as DecisionRow[]).map(mapDecision);
  }

  async create(input: PurchaseDecision) {
    const userId = await this.requireUserId();
    const { data } = await this.client
      .from("purchase_decisions")
      .insert({
        id: input.id,
        user_id: userId,
        item_name: input.itemName,
        planned_amount: input.plannedAmount,
        category: input.category,
        questions: input.questions,
        answers: input.answers,
        verdict: input.verdict,
        recommendation: input.recommendation,
        final_item_name: input.finalItemName,
        final_amount: input.finalAmount,
        created_at: input.createdAt,
      })
      .select(columns)
      .single()
      .throwOnError();

    return mapDecision(data as DecisionRow);
  }

  async remove(id: string) {
    await this.client
      .from("purchase_decisions")
      .delete()
      .eq("id", id)
      .throwOnError();
  }
}
