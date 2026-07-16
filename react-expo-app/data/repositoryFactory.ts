import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter } from "@/lib/storage";
import { LocalDecisionRepository } from "./LocalDecisionRepository";
import { LocalProfileRepository } from "./LocalProfileRepository";
import { SupabaseDecisionRepository } from "./SupabaseDecisionRepository";
import { SupabaseProfileRepository } from "./SupabaseProfileRepository";

export function createRepositories(input: {
  mode: "demo" | "connected";
  storage: StorageAdapter;
  supabase: SupabaseClient | null;
}) {
  if (input.mode === "demo") {
    return {
      decisions: new LocalDecisionRepository(input.storage),
      profiles: new LocalProfileRepository(input.storage),
    };
  }
  if (!input.supabase) {
    throw new Error("Connected mode requires Supabase.");
  }
  return {
    decisions: new SupabaseDecisionRepository(input.supabase),
    profiles: new SupabaseProfileRepository(input.supabase),
  };
}
