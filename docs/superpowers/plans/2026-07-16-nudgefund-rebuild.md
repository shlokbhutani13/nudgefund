# NudgeFund Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild NudgeFund as a secure, tested Expo application with a user-owned Supabase backend, protected Gemini coaching, and a credential-free portfolio demo.

**Architecture:** Expo Router screens consume feature services and repository interfaces instead of importing Supabase directly. Connected mode uses Supabase Auth, Postgres, RLS, and an authenticated Edge Function; demo mode uses platform-safe local persistence and deterministic coaching through the same interfaces.

**Tech Stack:** Expo 57, React Native and React versions selected by Expo 57, TypeScript 5.9+, Supabase Auth/Postgres/Edge Functions, Gemini 2.5 Flash Lite, Jest Expo, React Native Testing Library, ESLint, GitHub Actions, Vercel static export.

## Global Constraints

- Keep one Expo codebase for web, iOS, and Android.
- Do not modify Rahul's Supabase or Expo/EAS projects.
- Preserve Rahul Rajkumar's contributor credit.
- Use free tiers and limit Gemini to 12 authenticated requests per user per rolling hour.
- Keep Gemini and privileged Supabase keys out of client bundles and Git.
- Activate demo mode when Supabase public configuration is absent.
- Do not deploy the application, database migration, or Edge Function without a separate deployment approval.
- Do not rewrite Git history or force-push without separate approval.
- Keep financial and investment language educational and include a disclaimer.

---

### Task 1: Establish tests and remove current-source secrets

**Files:**
- Modify: `react-expo-app/package.json`
- Modify: `react-expo-app/package-lock.json`
- Modify: `react-expo-app/.gitignore`
- Create: `react-expo-app/.env.example`
- Create: `react-expo-app/test/security.test.ts`
- Create: `react-expo-app/test/setup.ts`
- Delete: direct credentials from `react-expo-app/lib/supabaseClient.ts`
- Delete: direct Gemini calls from `react-expo-app/app/(app)/budget/new.tsx`
- Delete: direct Gemini calls from `react-expo-app/app/(app)/report.tsx`

**Interfaces:**
- Produces: `npm test`, `npm run typecheck`, and `npm run export:web`.
- Produces: a source-tree test that fails on Gemini keys, JWT-like embedded keys, and service-role keys.

- [ ] **Step 1: Upgrade Expo and install the compatible test stack**

Run:

```bash
cd react-expo-app
npx expo install expo@57.0.6 --fix
npx expo install expo-crypto
npx expo install jest-expo @testing-library/react-native --dev
npm install --save-dev @types/jest
```

Run `npx expo-doctor`, then resolve each package mismatch with `npx expo install --fix`. Expo 57 selects the compatible React and React Native versions.

Add these scripts and Jest settings to `react-expo-app/package.json`:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "typecheck": "tsc --noEmit",
    "export:web": "expo export --platform web"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"],
    "testPathIgnorePatterns": ["/node_modules/", "/dist/"]
  }
}
```

Create `react-expo-app/test/setup.ts`:

```ts
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
```

- [ ] **Step 2: Write the failing source-secret test**

Create `react-expo-app/test/security.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const excluded = new Set(["node_modules", ".expo", "dist", "test"]);

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excluded.has(entry.name)) return [];
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(resolved);
    return /\.(ts|tsx|js|json)$/.test(entry.name) ? [resolved] : [];
  });
}

test("client source contains no private API credentials", () => {
  const source = sourceFiles(root)
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  expect(source).not.toMatch(/AIza[0-9A-Za-z_-]{30,}/);
  expect(source).not.toMatch(/service[_-]?role/i);
  expect(source).not.toMatch(/eyJhbGciOiJIUzI1Ni/);
});
```

- [ ] **Step 3: Run the test and verify the expected failure**

Run:

```bash
cd react-expo-app
npm test -- security.test.ts
```

Expected: FAIL because `supabaseClient.ts`, `budget/new.tsx`, and `report.tsx` contain embedded credentials.

- [ ] **Step 4: Replace embedded configuration with placeholders**

Create `react-expo-app/.env.example`:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Add to `react-expo-app/.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Replace `react-expo-app/lib/supabaseClient.ts` temporarily with:

```ts
export const supabase = null;
```

Remove `@google/genai` imports, `GEMINI_API_KEY`, `useGemini`, and model calls from both screens. Replace the question and report calls with errors that make the incomplete boundary explicit:

```ts
throw new Error("Financial coaching service is not configured.");
```

Remove unused `axios` and client-side `@google/genai`, then apply safe audit fixes:

```bash
cd react-expo-app
npm uninstall axios @google/genai
npm audit fix
npm audit --json > /tmp/nudgefund-audit.json || true
npm audit --omit=dev --audit-level=high
```

Expected: no high or critical production dependency vulnerabilities. Record any remaining development-only advisory in `SECURITY.md` with its dependency path and mitigation. If npm proposes a different Expo major, stop and inspect the dependency path instead of using `--force`.

- [ ] **Step 5: Verify the security test passes**

Run:

```bash
cd react-expo-app
npm test -- security.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the security baseline**

```bash
git add react-expo-app
git commit -m "security: remove client-side credentials"
```

---

### Task 2: Build the financial domain layer

**Files:**
- Create: `react-expo-app/features/decisions/types.ts`
- Create: `react-expo-app/features/decisions/calculations.ts`
- Create: `react-expo-app/features/decisions/validation.ts`
- Create: `react-expo-app/features/coaching/contracts.ts`
- Create: `react-expo-app/features/coaching/deterministicCoach.ts`
- Create: `react-expo-app/test/calculations.test.ts`
- Create: `react-expo-app/test/validation.test.ts`
- Create: `react-expo-app/test/deterministicCoach.test.ts`

**Interfaces:**
- Produces: `PurchaseDecision`, `PurchaseDraft`, `Verdict`, `MonthlySummary`.
- Produces: `amountRedirected()`, `projectFutureValue()`, `summarizeMonth()`.
- Produces: `validatePurchaseDraft()` and `createDeterministicCoach()`.

- [ ] **Step 1: Write failing calculation tests**

Create `react-expo-app/test/calculations.test.ts`:

```ts
import {
  amountRedirected,
  projectFutureValue,
  summarizeMonth,
} from "@/features/decisions/calculations";
import type { PurchaseDecision } from "@/features/decisions/types";

test("redirected amount never becomes negative", () => {
  expect(amountRedirected(120, 80)).toBe(40);
  expect(amountRedirected(80, 120)).toBe(0);
});

test("future value compounds a redirected amount", () => {
  expect(projectFutureValue(1000, 0.07, 10)).toBeCloseTo(1967.15, 2);
});

test("monthly summary totals final spending and redirected money", () => {
  const rows = [
    {
      finalAmount: 70,
      amountRedirected: 30,
      category: "Shopping",
      verdict: "negative",
      createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
      finalAmount: 40,
      amountRedirected: 10,
      category: "Dining",
      verdict: "neutral",
      createdAt: "2026-06-30T00:00:00.000Z",
    },
  ] as PurchaseDecision[];

  expect(summarizeMonth(rows, new Date("2026-07-16T00:00:00.000Z"))).toMatchObject({
    totalSpent: 70,
    totalRedirected: 30,
    topCategory: "Shopping",
    verdictCounts: { positive: 0, neutral: 0, negative: 1 },
  });
});
```

- [ ] **Step 2: Run the calculation tests**

Run:

```bash
cd react-expo-app
npm test -- calculations.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Implement domain types and calculations**

Create `react-expo-app/features/decisions/types.ts`:

```ts
export type Verdict = "positive" | "neutral" | "negative";

export type PurchaseDraft = {
  itemName: string;
  plannedAmount: number;
  category: string;
};

export type PurchaseDecision = PurchaseDraft & {
  id: string;
  questions: string[];
  answers: string[];
  verdict: Verdict;
  recommendation: string;
  finalItemName: string;
  finalAmount: number;
  amountRedirected: number;
  createdAt: string;
};

export type MonthlySummary = {
  totalSpent: number;
  totalRedirected: number;
  topCategory: string;
  verdictCounts: Record<Verdict, number>;
};
```

Create `react-expo-app/features/decisions/calculations.ts`:

```ts
import type { MonthlySummary, PurchaseDecision, Verdict } from "./types";

export function amountRedirected(planned: number, final: number) {
  return Math.max(0, planned - final);
}

export function projectFutureValue(principal: number, annualRate: number, years: number) {
  return principal * Math.pow(1 + annualRate, years);
}

export function summarizeMonth(rows: PurchaseDecision[], now = new Date()): MonthlySummary {
  const monthRows = rows.filter((row) => {
    const createdAt = new Date(row.createdAt);
    return createdAt.getUTCFullYear() === now.getUTCFullYear()
      && createdAt.getUTCMonth() === now.getUTCMonth();
  });
  const categoryTotals = new Map<string, number>();
  const verdictCounts: Record<Verdict, number> = { positive: 0, neutral: 0, negative: 0 };

  for (const row of monthRows) {
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + row.finalAmount);
    verdictCounts[row.verdict] += 1;
  }

  const topCategory = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

  return {
    totalSpent: monthRows.reduce((sum, row) => sum + row.finalAmount, 0),
    totalRedirected: monthRows.reduce((sum, row) => sum + row.amountRedirected, 0),
    topCategory,
    verdictCounts,
  };
}
```

- [ ] **Step 4: Write failing validation and deterministic-coaching tests**

Create `react-expo-app/test/validation.test.ts`:

```ts
import { validatePurchaseDraft } from "@/features/decisions/validation";

test("purchase drafts require a name, category, and positive amount", () => {
  expect(validatePurchaseDraft({ itemName: "", plannedAmount: 0, category: "" })).toEqual({
    itemName: "Enter an item name.",
    plannedAmount: "Enter an amount greater than zero.",
    category: "Choose a category.",
  });
});
```

Create `react-expo-app/test/deterministicCoach.test.ts`:

```ts
import { createDeterministicCoach } from "@/features/coaching/deterministicCoach";

test("demo coach returns three questions and a stable verdict", async () => {
  const coach = createDeterministicCoach();
  const questions = await coach.questions({
    itemName: "Headphones",
    plannedAmount: 250,
    category: "Shopping",
  });
  const verdict = await coach.verdict({
    draft: { itemName: "Headphones", plannedAmount: 250, category: "Shopping" },
    questions,
    answers: ["I already own a pair", "It is not urgent", "I would use savings"],
  });

  expect(questions).toHaveLength(3);
  expect(verdict.mode).toBe("demo");
  expect(verdict.verdict).toBe("negative");
});
```

- [ ] **Step 5: Implement validation and deterministic coaching**

Create `react-expo-app/features/decisions/validation.ts`:

```ts
import type { PurchaseDraft } from "./types";

export function validatePurchaseDraft(draft: PurchaseDraft) {
  return {
    ...(!draft.itemName.trim() ? { itemName: "Enter an item name." } : {}),
    ...(!(draft.plannedAmount > 0)
      ? { plannedAmount: "Enter an amount greater than zero." }
      : {}),
    ...(!draft.category ? { category: "Choose a category." } : {}),
  };
}
```

Create `react-expo-app/features/coaching/contracts.ts`:

```ts
import type { PurchaseDraft, Verdict } from "../decisions/types";

export type CoachingVerdict = {
  verdict: Verdict;
  reasons: string[];
  recommendation: string;
  mode: "live" | "demo";
};

export interface FinancialCoach {
  questions(draft: PurchaseDraft): Promise<string[]>;
  verdict(input: {
    draft: PurchaseDraft;
    questions: string[];
    answers: string[];
  }): Promise<CoachingVerdict>;
  monthlyReport(input: {
    totalSpent: number;
    totalRedirected: number;
    topCategory: string;
  }): Promise<{ text: string; mode: "live" | "demo" }>;
}
```

Create `react-expo-app/features/coaching/deterministicCoach.ts`:

```ts
import type { FinancialCoach } from "./contracts";

export function createDeterministicCoach(): FinancialCoach {
  return {
    async questions(draft) {
      return [
        `What problem would ${draft.itemName} solve this week?`,
        "What do you already own that could meet the same need?",
        `What goal would the ${draft.plannedAmount.toFixed(2)} support if you waited?`,
      ];
    },
    async verdict({ draft, answers }) {
      const cautionSignals = answers.filter((answer) =>
        /not urgent|already|savings|wait|don't need|do not need/i.test(answer),
      ).length;
      const verdict = cautionSignals >= 2 ? "negative" : cautionSignals === 1 ? "neutral" : "positive";
      return {
        verdict,
        reasons: [
          `The planned cost is ${draft.plannedAmount.toFixed(2)}.`,
          cautionSignals ? "Your answers include reasons to pause." : "Your answers describe a clear use.",
        ],
        recommendation:
          verdict === "positive"
            ? "Proceed only if the purchase fits your current budget."
            : "Wait 24 hours and compare one lower-cost alternative.",
        mode: "demo",
      };
    },
    async monthlyReport(input) {
      return {
        text: `You spent ${input.totalSpent.toFixed(2)} and redirected ${input.totalRedirected.toFixed(2)}. Review ${input.topCategory} first next month.`,
        mode: "demo",
      };
    },
  };
}
```

- [ ] **Step 6: Run domain tests and commit**

Run:

```bash
cd react-expo-app
npm test -- calculations.test.ts validation.test.ts deterministicCoach.test.ts
```

Expected: PASS.

```bash
git add react-expo-app/features react-expo-app/test
git commit -m "feat: add NudgeFund financial domain"
```

---

### Task 3: Add platform-safe configuration, storage, and authentication modes

**Files:**
- Create: `react-expo-app/lib/config.ts`
- Create: `react-expo-app/lib/storage/adapter.ts`
- Create: `react-expo-app/lib/storage/index.ts`
- Create: `react-expo-app/lib/storage/index.native.ts`
- Create: `react-expo-app/lib/storage/index.web.ts`
- Replace: `react-expo-app/lib/supabaseClient.ts`
- Replace: `react-expo-app/lib/AuthContext.tsx`
- Create: `react-expo-app/test/config.test.ts`
- Create: `react-expo-app/test/storage.test.ts`
- Create: `react-expo-app/test/auth-context.test.tsx`

**Interfaces:**
- Produces: `getPublicConfig()`, `connectedModeAvailable`.
- Produces: `persistentStorage`.
- Produces: `useAuth()` with `mode`, `enterDemo`, `exitDemo`, email auth, reset, and sign-out.

- [ ] **Step 1: Write failing config and storage tests**

Create `react-expo-app/test/config.test.ts`:

```ts
import { getPublicConfig } from "@/lib/config";

test("missing Supabase variables disables connected mode", () => {
  expect(getPublicConfig({})).toEqual({
    connectedModeAvailable: false,
    supabaseUrl: "",
    supabasePublishableKey: "",
  });
});
```

Create `react-expo-app/test/storage.test.ts`:

```ts
import { createMemoryStorage } from "@/lib/storage";

test("memory storage persists and removes values", async () => {
  const storage = createMemoryStorage();
  await storage.setItem("mode", "demo");
  expect(await storage.getItem("mode")).toBe("demo");
  await storage.removeItem("mode");
  expect(await storage.getItem("mode")).toBeNull();
});
```

- [ ] **Step 2: Verify the tests fail**

Run:

```bash
cd react-expo-app
npm test -- config.test.ts storage.test.ts
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement configuration and storage adapters**

Create `react-expo-app/lib/config.ts`:

```ts
type PublicEnvironment = Record<string, string | undefined>;

export function getPublicConfig(env: PublicEnvironment = process.env) {
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabasePublishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  return {
    supabaseUrl,
    supabasePublishableKey,
    connectedModeAvailable: Boolean(supabaseUrl && supabasePublishableKey),
  };
}
```

Create `react-expo-app/lib/storage/adapter.ts`:

```ts
export type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

```

Create `react-expo-app/lib/storage/index.ts`:

```ts
import { createMemoryStorage } from "./adapter";

export type { StorageAdapter } from "./adapter";
export { createMemoryStorage } from "./adapter";
export const persistentStorage = createMemoryStorage();
```

Create `react-expo-app/lib/storage/index.native.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type { StorageAdapter } from "./adapter";
export { createMemoryStorage } from "./adapter";
export const persistentStorage = AsyncStorage;
```

Create `react-expo-app/lib/storage/index.web.ts`:

```ts
import { createMemoryStorage, type StorageAdapter } from "./adapter";

const memory = createMemoryStorage();

export const persistentStorage = {
  async getItem(key: string) {
    return typeof window === "undefined" ? memory.getItem(key) : window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === "undefined") return memory.setItem(key, value);
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === "undefined") return memory.removeItem(key);
    window.localStorage.removeItem(key);
  },
};

export type { StorageAdapter };
export { createMemoryStorage };
```

- [ ] **Step 4: Implement a static-render-safe Supabase client**

Replace `react-expo-app/lib/supabaseClient.ts`:

```ts
import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicConfig } from "./config";
import { persistentStorage } from "./storage";

const config = getPublicConfig();

export const supabase: SupabaseClient | null = config.connectedModeAvailable
  ? createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: {
        storage: persistentStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
```

- [ ] **Step 5: Write the failing authentication-mode test**

Create `react-expo-app/test/auth-context.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

function Probe() {
  const auth = useAuth();
  return (
    <>
      <Text testID="mode">{auth.mode}</Text>
      <Text onPress={auth.enterDemo}>Enter demo</Text>
    </>
  );
}

test("users can enter demo mode without Supabase", () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  fireEvent.press(screen.getByText("Enter demo"));
  expect(screen.getByTestId("mode").props.children).toBe("demo");
});
```

- [ ] **Step 6: Replace the authentication context**

Replace `react-expo-app/lib/AuthContext.tsx` with a context that exposes this exact shape:

```ts
type AppMode = "signed-out" | "connected" | "demo";

type AuthContextType = {
  mode: AppMode;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  connectedModeAvailable: boolean;
  enterDemo(): void;
  exitDemo(): void;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUp(email: string, password: string): Promise<{ error?: string }>;
  resetPassword(email: string): Promise<{ error?: string }>;
  signOut(): Promise<void>;
};
```

Use `supabase?.auth.getSession()` and `onAuthStateChange()` only when `supabase` exists. Store demo mode under `nudgefund:mode` through `persistentStorage`. Return error strings instead of calling `alert()`. `exitDemo()` removes the stored mode.

- [ ] **Step 7: Verify auth, static export, and commit**

Run:

```bash
cd react-expo-app
npm test -- config.test.ts storage.test.ts auth-context.test.tsx
npm run typecheck
rm -rf /tmp/nudgefund-export
npx expo export --platform web --output-dir /tmp/nudgefund-export
```

Expected: tests pass, TypeScript exits zero, and the export completes without `window is not defined`.

```bash
git add react-expo-app
git commit -m "feat: add portable auth and storage modes"
```

---

### Task 4: Add local and Supabase repositories

**Files:**
- Create: `react-expo-app/data/DecisionRepository.ts`
- Create: `react-expo-app/data/LocalDecisionRepository.ts`
- Create: `react-expo-app/data/SupabaseDecisionRepository.ts`
- Create: `react-expo-app/data/ProfileRepository.ts`
- Create: `react-expo-app/data/LocalProfileRepository.ts`
- Create: `react-expo-app/data/SupabaseProfileRepository.ts`
- Create: `react-expo-app/data/repositoryFactory.ts`
- Create: `react-expo-app/features/profile/types.ts`
- Create: `react-expo-app/test/local-repository.test.ts`
- Create: `react-expo-app/test/repository-factory.test.ts`

**Interfaces:**
- Produces: `DecisionRepository.list/create/remove`.
- Produces: `ProfileRepository.get/save`.
- Produces: `createRepositories({ mode, supabase, storage })`.

- [ ] **Step 1: Write the failing local-repository test**

Create `react-expo-app/test/local-repository.test.ts`:

```ts
import { LocalDecisionRepository } from "@/data/LocalDecisionRepository";
import { LocalProfileRepository } from "@/data/LocalProfileRepository";
import { createMemoryStorage } from "@/lib/storage";

test("local repository persists completed decisions", async () => {
  const repository = new LocalDecisionRepository(createMemoryStorage());
  await repository.create({
    id: "decision-1",
    itemName: "Headphones",
    plannedAmount: 250,
    category: "Shopping",
    questions: ["q1", "q2", "q3"],
    answers: ["a1", "a2", "a3"],
    verdict: "negative",
    recommendation: "Wait",
    finalItemName: "No purchase",
    finalAmount: 0,
    amountRedirected: 250,
    createdAt: "2026-07-16T00:00:00.000Z",
  });

  expect(await repository.list()).toHaveLength(1);
});

test("local profile repository persists onboarding preferences", async () => {
  const repository = new LocalProfileRepository(createMemoryStorage());
  await repository.save({
    displayName: "Maya",
    currencyCode: "USD",
    monthlySavingsGoal: 300,
  });

  expect(await repository.get()).toEqual({
    displayName: "Maya",
    currencyCode: "USD",
    monthlySavingsGoal: 300,
  });
});
```

- [ ] **Step 2: Implement the repository interface and local adapter**

Create `react-expo-app/data/DecisionRepository.ts`:

```ts
import type { PurchaseDecision } from "@/features/decisions/types";

export interface DecisionRepository {
  list(): Promise<PurchaseDecision[]>;
  create(input: PurchaseDecision): Promise<PurchaseDecision>;
  remove(id: string): Promise<void>;
}
```

Create `react-expo-app/data/LocalDecisionRepository.ts`:

```ts
import type { DecisionRepository } from "./DecisionRepository";
import type { PurchaseDecision } from "@/features/decisions/types";
import type { StorageAdapter } from "@/lib/storage";

const key = "nudgefund:decisions";

export class LocalDecisionRepository implements DecisionRepository {
  constructor(private storage: StorageAdapter) {}

  async list() {
    const raw = await this.storage.getItem(key);
    return raw ? (JSON.parse(raw) as PurchaseDecision[]) : [];
  }

  async create(input: PurchaseDecision) {
    const rows = await this.list();
    await this.storage.setItem(key, JSON.stringify([input, ...rows]));
    return input;
  }

  async remove(id: string) {
    const rows = await this.list();
    await this.storage.setItem(key, JSON.stringify(rows.filter((row) => row.id !== id)));
  }
}
```

- [ ] **Step 3: Implement profile types and the local profile adapter**

Create `react-expo-app/features/profile/types.ts`:

```ts
export type UserProfile = {
  displayName: string;
  currencyCode: string;
  monthlySavingsGoal: number;
};
```

Create `react-expo-app/data/ProfileRepository.ts`:

```ts
import type { UserProfile } from "@/features/profile/types";

export interface ProfileRepository {
  get(): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<UserProfile>;
}
```

Create `react-expo-app/data/LocalProfileRepository.ts` using the `nudgefund:profile` key. `get()` returns `null` when no profile exists; `save()` serializes the profile and returns it.

- [ ] **Step 4: Implement the Supabase adapters**

Create `react-expo-app/data/SupabaseDecisionRepository.ts` with injected `SupabaseClient`. Map database snake_case fields to `PurchaseDecision`. Every method must call `.throwOnError()` and filter deletes by the row ID; RLS supplies the user boundary.

Before every insert, call `supabase.auth.getUser()`, throw `Authentication required.` when no user is returned, and include the authenticated ID in the insert payload:

```ts
{
  id: input.id,
  user_id: user.id,
  item_name: input.itemName,
  planned_amount: input.plannedAmount,
  category: input.category,
  questions: input.questions,
  answers: input.answers,
  verdict: input.verdict,
  recommendation: input.recommendation,
  final_item_name: input.finalItemName,
  final_amount: input.finalAmount,
  created_at: input.createdAt
}
```

Create `react-expo-app/data/SupabaseProfileRepository.ts`. `get()` authenticates the user, selects the row whose `id` equals `user.id`, and returns `null` for `PGRST116`. `save()` authenticates the user and upserts:

```ts
{
  id: user.id,
  display_name: profile.displayName,
  currency_code: profile.currencyCode,
  monthly_savings_goal: profile.monthlySavingsGoal,
  updated_at: new Date().toISOString()
}
```

- [ ] **Step 5: Write and implement repository selection**

Create `react-expo-app/test/repository-factory.test.ts` asserting demo mode returns local decision and profile repositories, while connected mode without a client throws `Connected mode requires Supabase`.

Create `react-expo-app/data/repositoryFactory.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter } from "@/lib/storage";
import { LocalDecisionRepository } from "./LocalDecisionRepository";
import { LocalProfileRepository } from "./LocalProfileRepository";
import { SupabaseDecisionRepository } from "./SupabaseDecisionRepository";
import { SupabaseProfileRepository } from "./SupabaseProfileRepository";

export function createRepositories(input: {
  mode: "demo" | "connected";
  storage: StorageAdapter;
  supabase: SupabaseClient | null;
}) {
  if (input.mode === "demo") {
    return {
      decisions: new LocalDecisionRepository(input.storage),
      profiles: new LocalProfileRepository(input.storage),
    };
  }
  if (!input.supabase) throw new Error("Connected mode requires Supabase.");
  return {
    decisions: new SupabaseDecisionRepository(input.supabase),
    profiles: new SupabaseProfileRepository(input.supabase),
  };
}
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
cd react-expo-app
npm test -- local-repository.test.ts repository-factory.test.ts
npm run typecheck
```

Expected: PASS.

```bash
git add react-expo-app/data react-expo-app/features/profile react-expo-app/test
git commit -m "feat: add local and cloud data adapters"
```

---

### Task 5: Define the Supabase schema and RLS policies

**Files:**
- Create through CLI: `supabase/migrations/*_initial_nudgefund_schema.sql`
- Create: `react-expo-app/test/supabase-schema.test.ts`
- Create: `supabase/config.toml`

**Interfaces:**
- Produces: `public.profiles`, `public.purchase_decisions`, and `private.ai_usage_events`.
- Produces: authenticated CRUD with row ownership and no anonymous table access.
- Produces: a service-role-only, concurrency-safe hourly quota function.

- [ ] **Step 1: Initialize Supabase and create the migration through the CLI**

Run:

```bash
npx supabase --help
npx supabase init
npx supabase migration new initial_nudgefund_schema
```

Expected: Supabase creates `supabase/config.toml` and one timestamped migration ending in `_initial_nudgefund_schema.sql`. Use that generated file for every following step in this task.

- [ ] **Step 2: Write the failing schema-policy test**

Create `react-expo-app/test/supabase-schema.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

test("migration enables RLS and scopes public rows to auth.uid", () => {
  const directory = path.resolve(__dirname, "../../supabase/migrations");
  const file = fs.readdirSync(directory).find((name) => name.endsWith("_initial_nudgefund_schema.sql"));
  expect(file).toBeTruthy();
  const sql = fs.readFileSync(path.join(directory, file!), "utf8").toLowerCase();

  expect(sql).toContain("alter table public.profiles enable row level security");
  expect(sql).toContain("alter table public.purchase_decisions enable row level security");
  expect(sql).toContain("(select auth.uid()) = id");
  expect(sql).toContain("(select auth.uid()) = user_id");
  expect(sql).not.toContain("to anon");
  expect(sql).toContain("create schema if not exists private");
  expect(sql).toContain("create or replace function public.consume_ai_quota");
  expect(sql).toContain("pg_advisory_xact_lock");
  expect(sql).toContain("if recent_count >= p_limit");
  expect(sql).toContain("grant execute on function public.consume_ai_quota(uuid, text, integer) to service_role");
});
```

- [ ] **Step 3: Run the schema test**

Run:

```bash
cd react-expo-app
npm test -- supabase-schema.test.ts
```

Expected: FAIL because the generated migration is empty.

- [ ] **Step 4: Fill the generated migration**

Write this SQL into the CLI-generated migration:

```sql
create extension if not exists pgcrypto;
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
  monthly_savings_goal numeric(12,2) not null default 0 check (monthly_savings_goal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null check (char_length(item_name) between 1 and 120),
  planned_amount numeric(12,2) not null check (planned_amount > 0),
  category text not null check (char_length(category) between 1 and 50),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 3),
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 3),
  verdict text not null check (verdict in ('positive', 'neutral', 'negative')),
  recommendation text not null check (char_length(recommendation) between 1 and 1000),
  final_item_name text not null check (char_length(final_item_name) between 1 and 120),
  final_amount numeric(12,2) not null check (final_amount >= 0),
  amount_redirected numeric(12,2)
    generated always as (greatest(planned_amount - final_amount, 0)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_decisions_user_created_idx
  on public.purchase_decisions(user_id, created_at desc);

create table private.ai_usage_events (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_kind text not null check (request_kind in ('questions', 'verdict', 'monthly_report')),
  created_at timestamptz not null default now()
);

create index ai_usage_events_user_created_idx
  on private.ai_usage_events(user_id, created_at desc);

create or replace function public.consume_ai_quota(
  p_user_id uuid,
  p_request_kind text,
  p_limit integer default 12
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  if p_request_kind not in ('questions', 'verdict', 'monthly_report') then
    raise exception 'invalid request kind';
  end if;
  if p_limit < 1 then
    raise exception 'invalid quota limit';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select count(*)
  into recent_count
  from private.ai_usage_events
  where user_id = p_user_id
    and created_at >= now() - interval '1 hour';

  if recent_count >= p_limit then
    return false;
  end if;

  insert into private.ai_usage_events(user_id, request_kind)
  values (p_user_id, p_request_kind);
  return true;
end;
$$;

alter table public.profiles enable row level security;
alter table public.purchase_decisions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.purchase_decisions to authenticated;
revoke all on schema private from public, anon, authenticated;
revoke all on function public.consume_ai_quota(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer) to service_role;

create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "decisions_select_own"
on public.purchase_decisions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "decisions_insert_own"
on public.purchase_decisions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "decisions_update_own"
on public.purchase_decisions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "decisions_delete_own"
on public.purchase_decisions for delete to authenticated
using ((select auth.uid()) = user_id);
```

- [ ] **Step 5: Verify the migration locally**

Run:

```bash
npx supabase start
npx supabase db reset
npx supabase migration list --local
cd react-expo-app
npm test -- supabase-schema.test.ts
```

Expected: local database reset succeeds, the migration is listed, and the test passes.

- [ ] **Step 6: Commit**

```bash
git add supabase react-expo-app/test/supabase-schema.test.ts
git commit -m "feat: add secure NudgeFund database schema"
```

---

### Task 6: Build the authenticated financial-coach Edge Function

**Files:**
- Create: `supabase/functions/_shared/contracts.ts`
- Create: `supabase/functions/financial-coach/index.ts`
- Create: `react-expo-app/features/coaching/SupabaseCoach.ts`
- Create: `react-expo-app/test/coach-contracts.test.ts`

**Interfaces:**
- Consumes: Supabase user JWT and `GEMINI_API_KEY`.
- Produces: stable JSON for `questions`, `verdict`, and `monthly_report`.
- Produces: `SupabaseCoach implements FinancialCoach`.

- [ ] **Step 1: Write failing response-contract tests**

Create `react-expo-app/test/coach-contracts.test.ts`:

```ts
import {
  parseMonthlyReport,
  parseQuestions,
  parseVerdict,
} from "../../supabase/functions/_shared/contracts";

test("questions contract requires exactly three strings", () => {
  expect(parseQuestions({ questions: ["One?", "Two?", "Three?"] })).toHaveLength(3);
  expect(() => parseQuestions({ questions: ["Only one"] })).toThrow("three questions");
});

test("verdict contract rejects unknown verdicts", () => {
  expect(() =>
    parseVerdict({ verdict: "maybe", reasons: [], recommendation: "Wait" }),
  ).toThrow("Invalid verdict");
});

test("monthly report contract requires non-empty text", () => {
  expect(parseMonthlyReport({ text: "You redirected $120." })).toEqual({
    text: "You redirected $120.",
  });
  expect(() => parseMonthlyReport({ text: " " })).toThrow("Invalid monthly report");
});
```

- [ ] **Step 2: Implement shared validation**

Create `supabase/functions/_shared/contracts.ts`:

```ts
const verdicts = new Set(["positive", "neutral", "negative"]);

export function parseQuestions(value: unknown): string[] {
  const questions = (value as { questions?: unknown })?.questions;
  if (!Array.isArray(questions) || questions.length !== 3 || questions.some((item) => typeof item !== "string")) {
    throw new Error("Expected exactly three questions.");
  }
  const normalized = questions.map((question) => question.trim());
  if (normalized.some((question) => !question)) throw new Error("Expected exactly three questions.");
  return normalized;
}

export function parseVerdict(value: unknown) {
  const result = value as {
    verdict?: string;
    reasons?: unknown;
    recommendation?: unknown;
  };
  if (!result.verdict || !verdicts.has(result.verdict)) throw new Error("Invalid verdict.");
  if (!Array.isArray(result.reasons) || result.reasons.some((item) => typeof item !== "string")) {
    throw new Error("Invalid reasons.");
  }
  if (typeof result.recommendation !== "string" || !result.recommendation.trim()) {
    throw new Error("Invalid recommendation.");
  }
  return {
    verdict: result.verdict as "positive" | "neutral" | "negative",
    reasons: result.reasons,
    recommendation: result.recommendation.trim(),
  };
}

export function parseMonthlyReport(value: unknown) {
  const text = (value as { text?: unknown })?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Invalid monthly report.");
  return { text: text.trim() };
}
```

- [ ] **Step 3: Run the shared tests**

Run:

```bash
cd react-expo-app
npm test -- coach-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 4: Implement the Edge Function**

Create `supabase/functions/financial-coach/index.ts` with:

```ts
import { createClient } from "npm:@supabase/supabase-js@2.110.6";
import { GoogleGenAI } from "npm:@google/genai@2.12.0";
import { parseMonthlyReport, parseQuestions, parseVerdict } from "../_shared/contracts.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });

  const authorization = request.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const publishableKey = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")!).default;
  const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!).default;
  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } } });
  const adminClient = createClient(url, secretKey);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return Response.json({ error: "authentication_required" }, { status: 401, headers: cors });

  const body = await request.json();
  const kind = body.kind as "questions" | "verdict" | "monthly_report";
  if (!["questions", "verdict", "monthly_report"].includes(kind)) {
    return Response.json({ error: "invalid_request_kind" }, { status: 422, headers: cors });
  }

  const prompt = buildPrompt(kind, body);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return Response.json({ error: "ai_unavailable" }, { status: 503, headers: cors });

  const { data: allowed, error: quotaError } = await adminClient.rpc("consume_ai_quota", {
    p_user_id: user.id,
    p_request_kind: kind,
    p_limit: 12,
  });
  if (quotaError) {
    return Response.json({ error: "quota_check_failed" }, { status: 500, headers: cors });
  }
  if (!allowed) {
    return Response.json({ error: "rate_limit_exceeded" }, { status: 429, headers: cors });
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash-lite";
  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const parsed = JSON.parse(result.text ?? "{}");
  const data = kind === "questions" ? { questions: parseQuestions(parsed) }
    : kind === "verdict" ? parseVerdict(parsed)
    : parseMonthlyReport(parsed);
  return Response.json({ data }, { headers: { ...cors, "Content-Type": "application/json" } });
});
```

In the same file, define `buildPrompt(kind, body)` before `Deno.serve`. It must cap item names and answers at 500 characters, reject amounts outside `0.01..100000000`, instruct Gemini to return JSON only, and state that the response is educational rather than financial advice.

- [ ] **Step 5: Implement the connected coach**

Create `react-expo-app/features/coaching/SupabaseCoach.ts` implementing `FinancialCoach`. It calls:

```ts
const { data, error } = await supabase.functions.invoke("financial-coach", {
  body: { kind: "questions", draft },
});
```

Use `createDeterministicCoach()` as a fallback when the function returns `ai_unavailable` or a network error. Preserve `mode: "demo"` for fallback responses.

- [ ] **Step 6: Verify and commit**

Run:

```bash
deno check supabase/functions/financial-coach/index.ts
cd react-expo-app
npm test -- coach-contracts.test.ts deterministicCoach.test.ts supabase-schema.test.ts
npm run typecheck
```

Expected: all commands exit zero.

```bash
git add supabase/functions react-expo-app/features/coaching react-expo-app/test
git commit -m "feat: add secure financial coaching function"
```

---

### Task 7: Rebuild the application shell, authentication, and dashboard

**Files:**
- Replace: `react-expo-app/constants/theme.ts`
- Create: `react-expo-app/components/ui/AppButton.tsx`
- Create: `react-expo-app/components/ui/AppCard.tsx`
- Create: `react-expo-app/components/ui/AppScreen.tsx`
- Create: `react-expo-app/features/auth/LoginView.tsx`
- Create: `react-expo-app/features/profile/ProfileEditor.tsx`
- Create: `react-expo-app/lib/AppServicesContext.tsx`
- Replace: `react-expo-app/app/(auth)/login.tsx`
- Replace: `react-expo-app/app/(auth)/signup.tsx`
- Replace: `react-expo-app/app/(app)/_layout.tsx`
- Replace: `react-expo-app/app/(app)/index.tsx`
- Modify: `react-expo-app/app/_layout.tsx`
- Create: `react-expo-app/test/login-screen.test.tsx`
- Create: `react-expo-app/test/dashboard-screen.test.tsx`

**Interfaces:**
- Produces: the shared visual system and accessible controls.
- Produces: login, signup, demo entry, dashboard, and responsive tabs.

- [ ] **Step 1: Write failing login and dashboard tests**

Create `react-expo-app/test/login-screen.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { LoginView } from "@/features/auth/LoginView";

test("login offers connected and demo entry", () => {
  render(
    <LoginView
      connectedModeAvailable
      onDemo={jest.fn()}
      onResetPassword={jest.fn()}
      onSignIn={jest.fn()}
      onSignUp={jest.fn()}
    />,
  );
  expect(screen.getByText("Make spending decisions on purpose.")).toBeTruthy();
  expect(screen.getByText("Sign in")).toBeTruthy();
  expect(screen.getByText("Explore demo")).toBeTruthy();
});
```

Create `react-expo-app/test/dashboard-screen.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { DashboardView } from "@/features/dashboard/DashboardView";

test("dashboard shows spending and redirected totals", () => {
  render(
    <DashboardView
      name="Maya"
      monthlyGoal={300}
      decisions={[]}
      onNewDecision={jest.fn()}
    />,
  );
  expect(screen.getByText("Money redirected")).toBeTruthy();
  expect(screen.getByText("Check a purchase")).toBeTruthy();
});
```

- [ ] **Step 2: Implement the visual system**

Replace `constants/theme.ts` with exported `colors`, `spacing`, `radius`, and `type` constants matching the approved palette. Implement:

```tsx
export function AppButton(props: {
  label: string;
  onPress(): void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  const variant = props.variant ?? "primary";
  const backgroundColor = variant === "primary"
    ? colors.ink
    : variant === "secondary"
      ? colors.surface
      : "transparent";
  const textColor = variant === "primary" ? colors.surface : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: radius.md,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: colors.line,
        opacity: props.disabled ? 0.45 : pressed ? 0.82 : 1,
      })}
    >
      <Text style={{ color: textColor, fontWeight: "700", fontSize: 15 }}>
        {props.label}
      </Text>
    </Pressable>
  );
}
```

```tsx
export function AppCard({ children }: PropsWithChildren) {
  return <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line }}>{children}</View>;
}
```

```tsx
export function AppScreen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View style={{ width: "100%", maxWidth: 1120, alignSelf: "center", padding: spacing.lg }}>{children}</View>;
  return scroll ? <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>{content}</ScrollView> : <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>;
}
```

- [ ] **Step 3: Replace authentication screens**

Implement `LoginView` as a service-boundary component and make the login route a thin wrapper around it. The view must:

- Show the NudgeFund wordmark and product statement.
- Keep email/password inputs in local state.
- Call `signIn` and display returned errors inline.
- Disable connected sign-in when `connectedModeAvailable` is false.
- Call `enterDemo()` from **Explore demo**.
- Link to signup and provide password reset.

The signup screen must call `signUp`, require six password characters, and explain email confirmation.

- [ ] **Step 4: Add application services and profile onboarding**

Create `react-expo-app/lib/AppServicesContext.tsx`. After auth mode resolves, call `createRepositories()` and select `SupabaseCoach` for connected mode or `createDeterministicCoach()` for demo mode. Expose:

```ts
type AppServices = {
  decisions: DecisionRepository;
  profiles: ProfileRepository;
  coach: FinancialCoach;
};
```

The provider must not create connected services until a Supabase client exists. Memoize the service set by mode and client.

Create `ProfileEditor` with display name, three-letter currency code, and non-negative monthly savings goal fields. On first connected login, show it when `profiles.get()` returns `null`. On first demo entry, prefill a local sample profile and allow the reviewer to edit it. Save through `ProfileRepository`; do not import Supabase in the component.

- [ ] **Step 5: Implement the dashboard feature**

Create `react-expo-app/features/dashboard/DashboardView.tsx`. Calculate monthly summary with `summarizeMonth()`. Render:

- Greeting
- Money redirected
- This month's spending
- Goal progress
- Weekly nudge
- Three recent decisions
- **Check a purchase** action

Keep data and navigation callbacks in props so the component test needs no Supabase mock.

- [ ] **Step 6: Replace navigation**

Update `(app)/_layout.tsx` to show four tabs: Overview, Decisions, Growth, Reports. Use icons `home-outline`, `list-outline`, `trending-up-outline`, and `bar-chart-outline`. Put sign-out in a profile/menu action rather than every header.

Update `app/_layout.tsx` to route:

- connected user to `(app)`
- demo mode to `(app)`
- signed-out user to `(auth)/login`

Include `router` and route state in effect dependency arrays and hide the splash screen after mode resolution.

- [ ] **Step 7: Verify and commit**

Run:

```bash
cd react-expo-app
npm test -- login-screen.test.tsx dashboard-screen.test.tsx
npm run lint
npm run typecheck
```

Expected: zero test failures, lint errors, or TypeScript errors.

```bash
git add react-expo-app
git commit -m "feat: rebuild NudgeFund shell and dashboard"
```

---

### Task 8: Rebuild purchase decisions, history, growth, and reports

**Files:**
- Replace: `react-expo-app/app/(app)/budget/new.tsx`
- Replace: `react-expo-app/app/(app)/budget.tsx`
- Replace: `react-expo-app/app/(app)/invest.tsx`
- Replace: `react-expo-app/app/(app)/report.tsx`
- Create: `react-expo-app/features/decisions/PurchaseWizard.tsx`
- Create: `react-expo-app/features/decisions/DecisionHistory.tsx`
- Create: `react-expo-app/features/projections/ProjectionView.tsx`
- Create: `react-expo-app/features/reports/MonthlyReportView.tsx`
- Create: `react-expo-app/test/purchase-wizard.test.tsx`
- Create: `react-expo-app/test/report-view.test.tsx`

**Interfaces:**
- Consumes: `DecisionRepository`, `FinancialCoach`, and domain calculations.
- Produces: completed decision persistence and manager-ready product screens.

- [ ] **Step 1: Write the failing purchase-wizard test**

Create `react-expo-app/test/purchase-wizard.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PurchaseWizard } from "@/features/decisions/PurchaseWizard";
import { createDeterministicCoach } from "@/features/coaching/deterministicCoach";

test("purchase wizard advances from purchase details to coaching questions", async () => {
  render(<PurchaseWizard coach={createDeterministicCoach()} onComplete={jest.fn()} />);
  fireEvent.changeText(screen.getByPlaceholderText("What are you considering?"), "Headphones");
  fireEvent.changeText(screen.getByPlaceholderText("0.00"), "250");
  fireEvent.press(screen.getByText("Shopping"));
  fireEvent.press(screen.getByText("Continue"));
  expect(await screen.findByText(/What problem would Headphones solve/)).toBeTruthy();
});
```

- [ ] **Step 2: Implement `PurchaseWizard`**

Use four internal steps: `details`, `questions`, `verdict`, `final`. Validate details with `validatePurchaseDraft()`. Request three questions from `coach.questions()`, then request the verdict after all answers contain text.

On final confirmation create:

```ts
import { randomUUID } from "expo-crypto";

const decision: PurchaseDecision = {
  id: randomUUID(),
  ...draft,
  questions,
  answers,
  verdict: coaching.verdict,
  recommendation: coaching.recommendation,
  finalItemName,
  finalAmount,
  amountRedirected: amountRedirected(draft.plannedAmount, finalAmount),
  createdAt: new Date().toISOString(),
};
```

Call `onComplete(decision)` once and disable the button while saving.

- [ ] **Step 3: Implement history and thin route screens**

`DecisionHistory` accepts decisions, category/verdict filters, and delete callback. It renders the original plan, final outcome, redirected amount, verdict badge, and date.

`app/(app)/budget/new.tsx` selects the repository and coach from application context, saves the completed decision, and returns to `/budget`.

`app/(app)/budget.tsx` loads rows on focus, handles retry and empty states, and renders `DecisionHistory`.

- [ ] **Step 4: Write the failing report test**

Create `react-expo-app/test/report-view.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { MonthlyReportView } from "@/features/reports/MonthlyReportView";

test("report explains that projections and coaching are educational", () => {
  render(<MonthlyReportView decisions={[]} insight={{ text: "Start with one purchase check.", mode: "demo" }} />);
  expect(screen.getByText(/educational information/i)).toBeTruthy();
  expect(screen.getByText("Start with one purchase check.")).toBeTruthy();
});
```

- [ ] **Step 5: Implement projections and reports**

`ProjectionView` must:

- Sum `amountRedirected`.
- Offer return assumptions of 4%, 7%, and 10%.
- Offer horizons of 5, 10, and 20 years.
- Use `projectFutureValue()`.
- Display “Hypothetical projection. Returns are not guaranteed.”

`MonthlyReportView` must:

- Use `summarizeMonth()`.
- Show spending, redirected money, verdict distribution, and top category.
- Render the provided insight and its live/demo label.
- Display the financial-information disclaimer.

Route screens load decisions through the repository and request the report through the selected coach.

- [ ] **Step 6: Verify and commit**

Run:

```bash
cd react-expo-app
npm test -- purchase-wizard.test.tsx report-view.test.tsx
npm run lint
npm run typecheck
```

Expected: PASS with zero lint errors.

```bash
git add react-expo-app
git commit -m "feat: rebuild purchase and reporting flows"
```

---

### Task 9: Add CI, static deployment configuration, and repository documentation

**Files:**
- Modify: `react-expo-app/app.json`
- Create: `react-expo-app/vercel.json`
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`
- Replace: `README.md`
- Create: `DEPLOYMENT.md`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/PRIVACY.md`

**Interfaces:**
- Produces: clean CI, static web output, truthful setup, and professional GitHub presentation.

- [ ] **Step 1: Detach Rahul's external Expo identifiers**

Remove these keys from `react-expo-app/app.json`:

- `expo.owner`
- `expo.extra.eas`
- `expo.updates`
- `expo.runtimeVersion`

Set:

```json
{
  "expo": {
    "name": "NudgeFund",
    "slug": "nudgefund",
    "version": "1.0.0",
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

Preserve the existing native icon paths and platform settings.

- [ ] **Step 2: Add Vercel configuration**

Create `react-expo-app/vercel.json`:

```json
{
  "buildCommand": "npm run export:web",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- [ ] **Step 3: Add GitHub Actions**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: react-expo-app
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: react-expo-app/package-lock.json
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: npm ci
      - run: npm audit --omit=dev --audit-level=high
      - run: npm test
      - run: npm run lint
      - run: npm run typecheck
      - run: deno check ../supabase/functions/financial-coach/index.ts
      - run: npm run export:web
```

Add monthly grouped Dependabot updates for `/react-expo-app` and GitHub Actions. Ignore semver-major updates.

- [ ] **Step 4: Write truthful public documentation**

The new README must include:

- Product statement
- Demo and connected modes
- Product screenshots
- Architecture diagram
- Engineering highlights
- Local setup
- Supabase migration and Edge Function setup
- Verification commands
- Security and financial disclaimers
- “Built by Rahul Rajkumar and Shlok Bhutani”

`SECURITY.md` must state that the old Gemini key was exposed and needs revocation by its owner. It must direct future reports to private vulnerability reporting.

`DEPLOYMENT.md` must separate:

- Supabase backend deployment
- Edge Function secret configuration
- Expo static export
- Vercel deployment
- Final credentialed smoke test

Do not claim the production URL works until it has been verified.

- [ ] **Step 5: Run the full local release gate**

Run:

```bash
cd react-expo-app
npm ci
npm audit --json > /tmp/nudgefund-audit.json || true
npm audit --omit=dev --audit-level=high
npm test
npm run lint
npm run typecheck
rm -rf dist
npm run export:web
```

Expected: the production audit and every build/test command exit zero. The full audit may report documented development-only advisories but must not contain an unreviewed high or critical issue.

- [ ] **Step 6: Run browser verification and capture screenshots**

Serve `react-expo-app/dist` locally. Verify:

- Login renders with no configuration.
- Demo entry reaches the dashboard.
- A purchase check completes.
- History shows the saved decision.
- Growth and report screens render.
- Desktop and 390-pixel mobile widths have no horizontal overflow.
- Browser console contains no errors.

Capture:

- `docs/assets/nudgefund-login.jpg`
- `docs/assets/nudgefund-dashboard.jpg`
- `docs/assets/nudgefund-purchase-check.jpg`

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "docs: prepare NudgeFund for public release"
```

---

### Task 10: Publish verified code and prepare the user-owned backend

**Files:**
- No new source files unless verification finds a defect.

**Interfaces:**
- Produces: updated GitHub `main`, passing remote CI, and a user-owned Supabase project reference.
- Keeps Supabase schema/function deployment and Vercel deployment behind separate approval gates.

- [ ] **Step 1: Verify local and GitHub scope**

Run:

```bash
git status -sb
git log --oneline -12
gh auth status
gh repo view shlokbhutani13/nudgefund --json defaultBranchRef,url,description
```

Expected: only intended commits exist and GitHub authentication is active.

- [ ] **Step 2: Push the locally verified branch to GitHub**

Run:

```bash
git fetch origin main
git rebase origin/main
git push origin HEAD:main
```

Update repository metadata:

```bash
gh repo edit shlokbhutani13/nudgefund \
  --description "Behavioral-finance app with Expo, Supabase Auth and RLS, secure Gemini coaching, and cross-platform demo mode." \
  --add-topic expo \
  --add-topic react-native \
  --add-topic supabase \
  --add-topic gemini \
  --add-topic fintech \
  --add-topic behavioral-finance
```

- [ ] **Step 3: Verify remote CI and public presentation**

Run:

```bash
gh run list --repo shlokbhutani13/nudgefund --branch main --limit 5
```

Watch the new CI run to completion. Confirm the README, screenshots, license, topics, and zero open pull requests. If CI fails, diagnose and fix it on the branch, rerun the full local gate, and push the corrective commit.

- [ ] **Step 4: Create the free Supabase project under Shlok's account**

Use the Supabase Dashboard logged into Shlok's account. Choose the free plan, a nearby region, and a generated database password stored in the user's password manager. Read the new project reference from the Dashboard and record it in the shell:

```bash
read -r "SUPABASE_PROJECT_REF?New Supabase project reference: "
export SUPABASE_PROJECT_REF
test -n "$SUPABASE_PROJECT_REF"
```

Do not reuse Rahul's project reference or data.

- [ ] **Step 5: Stop at the production-backend approval gate**

Record the project reference outside Git and present the clean local and remote verification evidence. Do not run any of these deployment commands under the current “deployment ready, but do not deploy” instruction:

```bash
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db push
npx supabase secrets set GEMINI_API_KEY="$NEW_GEMINI_API_KEY" GEMINI_MODEL="gemini-2.5-flash-lite"
npx supabase functions deploy financial-coach
```

- [ ] **Step 6: After a future explicit approval, deploy and verify the connected backend**

After deployment, run database advisors and a two-account isolation test:

```bash
npx supabase db advisors
npx supabase functions list
```

Create two synthetic accounts. Confirm account B cannot select, update, or delete account A's profile or purchase decisions. Confirm the thirteenth AI request in one hour returns 429.

- [ ] **Step 7: Configure local connected-mode values after backend deployment**

Read the new project's publishable key from the Dashboard, then create ignored `react-expo-app/.env.local`:

```bash
read -r "SUPABASE_PUBLISHABLE_KEY?New Supabase publishable key: "
printf 'EXPO_PUBLIC_SUPABASE_URL=https://%s.supabase.co\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=%s\n' \
  "$SUPABASE_PROJECT_REF" "$SUPABASE_PUBLISHABLE_KEY" \
  > react-expo-app/.env.local
```

Run the credentialed app locally. Verify signup, sign-in, password reset, decision persistence, cross-device refresh, and Gemini fallback behavior.

- [ ] **Step 8: Preserve the Vercel deployment gate**

Report that the Vercel URL still requires a separate deployment approval. Do not run `vercel deploy`, connect a production project, or alter the current Vercel deployment.
