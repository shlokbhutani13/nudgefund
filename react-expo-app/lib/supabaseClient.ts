import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import {
  createClient,
  processLock,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getPublicConfig } from "./config";
import { persistentStorage } from "./storage";

const config = getPublicConfig();

export const supabase: SupabaseClient | null =
  config.connectedModeAvailable
    ? createClient(
        config.supabaseUrl,
        config.supabasePublishableKey,
        {
          auth: {
            storage: persistentStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            lock: processLock,
          },
        },
      )
    : null;

if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
