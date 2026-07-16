import { LocalDecisionRepository } from "@/data/LocalDecisionRepository";
import { LocalProfileRepository } from "@/data/LocalProfileRepository";
import { createRepositories } from "@/data/repositoryFactory";
import { createMemoryStorage } from "@/lib/storage";

test("demo mode selects local repositories", () => {
  const repositories = createRepositories({
    mode: "demo",
    storage: createMemoryStorage(),
    supabase: null,
  });

  expect(repositories.decisions).toBeInstanceOf(LocalDecisionRepository);
  expect(repositories.profiles).toBeInstanceOf(LocalProfileRepository);
});

test("connected mode requires a Supabase client", () => {
  expect(() =>
    createRepositories({
      mode: "connected",
      storage: createMemoryStorage(),
      supabase: null,
    }),
  ).toThrow("Connected mode requires Supabase");
});
