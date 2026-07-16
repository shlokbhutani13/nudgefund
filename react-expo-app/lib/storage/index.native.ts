import AsyncStorage from "@react-native-async-storage/async-storage";

export type { StorageAdapter } from "./adapter";
export { createMemoryStorage } from "./adapter";
export const persistentStorage = AsyncStorage;
