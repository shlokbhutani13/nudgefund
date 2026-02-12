import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ✅ Web-safe storage:
 * - Web: window.localStorage
 * - iOS/Android: AsyncStorage
 *
 * Prevents: ReferenceError: window is not defined (during expo export / SSR)
 */
const isWeb = typeof window !== "undefined";

const supabaseUrl = "https://rupapbncwfhbhemuzzab.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGFwYm5jd2ZoYmhlbXV6emFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTAxMDAsImV4cCI6MjA3NTc2NjEwMH0.VFBpXI2IboYmDK4KYuHbnB6Ke2_CVjGDR6j3VaVw9cw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Web uses localStorage, native uses AsyncStorage
    storage: isWeb ? window.localStorage : AsyncStorage,

    autoRefreshToken: true,
    persistSession: true,

    // Web should detect session in URL (magic links / OAuth redirects)
    // Native should not.
    detectSessionInUrl: isWeb,
  },
});