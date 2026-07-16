import type { UserProfile } from "@/features/profile/types";
import type { StorageAdapter } from "@/lib/storage";
import type { ProfileRepository } from "./ProfileRepository";

const key = "nudgefund:profile";

export class LocalProfileRepository implements ProfileRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async get() {
    const raw = await this.storage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  async save(profile: UserProfile) {
    await this.storage.setItem(key, JSON.stringify(profile));
    return profile;
  }
}
