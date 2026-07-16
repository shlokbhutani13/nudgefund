import { createMemoryStorage } from "./adapter";

export type { StorageAdapter } from "./adapter";
export { createMemoryStorage } from "./adapter";
export const persistentStorage = createMemoryStorage();
