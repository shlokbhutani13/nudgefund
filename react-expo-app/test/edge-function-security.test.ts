import fs from "node:fs";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "../..");
const functionSource = fs
  .readFileSync(
    path.join(
      repositoryRoot,
      "supabase/functions/financial-coach/index.ts",
    ),
    "utf8",
  )
  .replace(/\s+/g, " ");
const supabaseConfig = fs.readFileSync(
  path.join(repositoryRoot, "supabase/config.toml"),
  "utf8",
);

test("financial coach requires JWT verification and user-scoped quota", () => {
  expect(supabaseConfig).toMatch(
    /\[functions\.financial-coach\][\s\S]*verify_jwt = true/,
  );
  expect(functionSource).toContain(
    'await userClient.rpc("consume_ai_quota"',
  );
  expect(functionSource).not.toContain("adminClient");
  expect(functionSource).not.toContain(
    "SUPABASE_SECRET_KEY",
  );
});

test("missing AI configuration does not consume quota", () => {
  const keyCheck = functionSource.indexOf(
    'Deno.env.get("GEMINI_API_KEY")',
  );
  const quotaCheck = functionSource.indexOf(
    'userClient.rpc("consume_ai_quota"',
  );

  expect(keyCheck).toBeGreaterThan(-1);
  expect(quotaCheck).toBeGreaterThan(keyCheck);
});
