import {
  createMemoryStorage,
  type StorageAdapter,
} from "./adapter";

const memory = createMemoryStorage();

export const persistentStorage: StorageAdapter = {
  async getItem(key) {
    return typeof window === "undefined"
      ? memory.getItem(key)
      : window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === "undefined") {
      return memory.setItem(key, value);
    }
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window === "undefined") {
      return memory.removeItem(key);
    }
    window.localStorage.removeItem(key);
  },
};

export type { StorageAdapter };
export { createMemoryStorage };
