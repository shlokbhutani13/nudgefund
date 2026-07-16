import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/features/profile/types";
import type { ProfileRepository } from "./ProfileRepository";

type ProfileRow = {
  display_name: string;
  currency_code: string;
  monthly_savings_goal: number;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    displayName: row.display_name,
    currencyCode: row.currency_code,
    monthlySavingsGoal: Number(row.monthly_savings_goal),
  };
}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async requireUserId() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error("Authentication required.");
    return data.user.id;
  }

  async get() {
    const userId = await this.requireUserId();
    const { data } = await this.client
      .from("profiles")
      .select("display_name,currency_code,monthly_savings_goal")
      .eq("id", userId)
      .maybeSingle()
      .throwOnError();

    return data ? mapProfile(data as ProfileRow) : null;
  }

  async save(profile: UserProfile) {
    const userId = await this.requireUserId();
    const { data } = await this.client
      .from("profiles")
      .upsert({
        id: userId,
        display_name: profile.displayName,
        currency_code: profile.currencyCode,
        monthly_savings_goal: profile.monthlySavingsGoal,
        updated_at: new Date().toISOString(),
      })
      .select("display_name,currency_code,monthly_savings_goal")
      .single()
      .throwOnError();

    return mapProfile(data as ProfileRow);
  }
}
