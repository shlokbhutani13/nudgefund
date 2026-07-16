import {
  parseMonthlyReport,
  parseQuestions,
  parseVerdict,
} from "../../supabase/functions/_shared/contracts";
import { buildPrompt } from "../../supabase/functions/_shared/prompt";

test("questions contract requires exactly three non-empty strings", () => {
  expect(
    parseQuestions({
      questions: ["One?", "Two?", "Three?"],
    }),
  ).toEqual(["One?", "Two?", "Three?"]);
  expect(() =>
    parseQuestions({ questions: ["Only one"] }),
  ).toThrow("three questions");
  expect(() =>
    parseQuestions({ questions: ["One?", " ", "Three?"] }),
  ).toThrow("three questions");
});

test("verdict contract rejects unknown verdicts and empty content", () => {
  expect(() =>
    parseVerdict({
      verdict: "maybe",
      reasons: [],
      recommendation: "Wait",
    }),
  ).toThrow("Invalid verdict");
  expect(() =>
    parseVerdict({
      verdict: "neutral",
      reasons: [" "],
      recommendation: "Wait",
    }),
  ).toThrow("Invalid reasons");
});

test("monthly report contract requires non-empty text", () => {
  expect(
    parseMonthlyReport({ text: "You redirected $120." }),
  ).toEqual({
    text: "You redirected $120.",
  });
  expect(() =>
    parseMonthlyReport({ text: " " }),
  ).toThrow("Invalid monthly report");
});

test("prompt validation rejects unsafe purchase inputs", () => {
  expect(() =>
    buildPrompt("questions", {
      draft: {
        itemName: "Laptop",
        plannedAmount: 0,
        category: "Technology",
      },
    }),
  ).toThrow("Invalid amount");

  expect(() =>
    buildPrompt("verdict", {
      draft: {
        itemName: "x".repeat(501),
        plannedAmount: 900,
        category: "Technology",
      },
      questions: ["One?", "Two?", "Three?"],
      answers: ["One", "Two", "Three"],
    }),
  ).toThrow("Invalid item name");
});

test("prompts require JSON and an educational disclaimer", () => {
  const prompt = buildPrompt("questions", {
    draft: {
      itemName: "Laptop",
      plannedAmount: 900,
      category: "Technology",
    },
  });

  expect(prompt).toContain("Return JSON only");
  expect(prompt).toContain("educational");
  expect(prompt).toContain('"questions"');
});
