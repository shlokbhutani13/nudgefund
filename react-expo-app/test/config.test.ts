import { getPublicConfig } from "@/lib/config";

test("missing Supabase variables disables connected mode", () => {
  expect(getPublicConfig({})).toEqual({
    connectedModeAvailable: false,
    supabaseUrl: "",
    supabasePublishableKey: "",
  });
});

test("both public Supabase values enable connected mode", () => {
  expect(
    getPublicConfig({
      EXPO_PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " sb_publishable_example ",
    }),
  ).toEqual({
    connectedModeAvailable: true,
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "sb_publishable_example",
  });
});
