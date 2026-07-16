import { validatePurchaseDraft } from "@/features/decisions/validation";

test("purchase drafts require a name, category, and positive amount", () => {
  expect(validatePurchaseDraft({ itemName: "", plannedAmount: 0, category: "" })).toEqual({
    itemName: "Enter an item name.",
    plannedAmount: "Enter an amount greater than zero.",
    category: "Choose a category.",
  });
});

test("purchase drafts reject unsafe lengths and amounts", () => {
  expect(
    validatePurchaseDraft({
      itemName: "x".repeat(121),
      plannedAmount: 100_000_001,
      category: "Shopping",
    }),
  ).toEqual({
    itemName: "Keep the item name under 120 characters.",
    plannedAmount: "Enter an amount no greater than 100,000,000.",
  });
});
