import fs from "node:fs";
import path from "node:path";

function migrationSql() {
  const directory = path.resolve(
    __dirname,
    "../../supabase/migrations",
  );
  const file = fs
    .readdirSync(directory)
    .find((name) =>
      name.endsWith("_initial_nudgefund_schema.sql"),
    );
  expect(file).toBeTruthy();
  return fs
    .readFileSync(path.join(directory, file!), "utf8")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

test("migration explicitly grants authenticated access behind RLS", () => {
  const sql = migrationSql();

  expect(sql).toContain(
    "alter table public.profiles enable row level security",
  );
  expect(sql).toContain(
    "alter table public.purchase_decisions enable row level security",
  );
  expect(sql).toContain("(select auth.uid()) = id");
  expect(sql).toContain("(select auth.uid()) = user_id");
  expect(sql).toContain(
    "revoke all on public.profiles from public, anon, authenticated",
  );
  expect(sql).toContain(
    "revoke all on public.purchase_decisions from public, anon, authenticated",
  );
  expect(sql).toContain(
    "grant select, insert, update, delete on public.profiles to authenticated",
  );
  expect(sql).toContain(
    "grant select, insert, update, delete on public.purchase_decisions to authenticated",
  );
  expect(sql).not.toContain(
    "grant select, insert, update, delete on public.profiles to anon",
  );
});

test("quota enforcement uses auth.uid and a private usage table", () => {
  const sql = migrationSql();

  expect(sql).toContain("create schema if not exists private");
  expect(sql).toContain(
    "alter table private.ai_usage_events enable row level security",
  );
  expect(sql).toContain(
    "create or replace function public.consume_ai_quota",
  );
  expect(sql).toContain("caller_user_id uuid := (select auth.uid())");
  expect(sql).toContain("pg_advisory_xact_lock");
  expect(sql).toContain("if recent_count >= 12");
  expect(sql).toContain(
    "revoke all on function public.consume_ai_quota(text) from public, anon",
  );
  expect(sql).toContain(
    "grant execute on function public.consume_ai_quota(text) to authenticated",
  );
});
