import type { PurchaseDraft } from "./types";

export function validatePurchaseDraft(draft: PurchaseDraft) {
  return {
    ...(!draft.itemName.trim()
      ? { itemName: "Enter an item name." }
      : draft.itemName.trim().length > 120
        ? { itemName: "Keep the item name under 120 characters." }
        : {}),
    ...(!(draft.plannedAmount > 0)
      ? { plannedAmount: "Enter an amount greater than zero." }
      : draft.plannedAmount > 100_000_000
        ? {
            plannedAmount:
              "Enter an amount no greater than 100,000,000.",
          }
        : {}),
    ...(!draft.category ? { category: "Choose a category." } : {}),
  };
}
