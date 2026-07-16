type PublicEnvironment = Record<string, string | undefined>;

export function getPublicConfig(
  env: PublicEnvironment = process.env,
) {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabasePublishableKey =
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  return {
    supabaseUrl,
    supabasePublishableKey,
    connectedModeAvailable: Boolean(
      supabaseUrl && supabasePublishableKey,
    ),
  };
}
