import type { PurchaseDecision } from "@/features/decisions/types";
import type { StorageAdapter } from "@/lib/storage";
import type { DecisionRepository } from "./DecisionRepository";

const key = "nudgefund:decisions";

export class LocalDecisionRepository implements DecisionRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async list() {
    const raw = await this.storage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PurchaseDecision[]) : [];
    } catch {
      return [];
    }
  }

  async create(input: PurchaseDecision) {
    const rows = await this.list();
    await this.storage.setItem(key, JSON.stringify([input, ...rows]));
    return input;
  }

  async remove(id: string) {
    const rows = await this.list();
    await this.storage.setItem(
      key,
      JSON.stringify(rows.filter((row) => row.id !== id)),
    );
  }
}
