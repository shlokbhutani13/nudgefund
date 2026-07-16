import type { UserProfile } from "@/features/profile/types";

export interface ProfileRepository {
  get(): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<UserProfile>;
}
