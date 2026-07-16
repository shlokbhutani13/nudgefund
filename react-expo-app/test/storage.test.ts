import { createMemoryStorage } from "@/lib/storage";

test("memory storage persists and removes values", async () => {
  const storage = createMemoryStorage();
  await storage.setItem("mode", "demo");
  expect(await storage.getItem("mode")).toBe("demo");
  await storage.removeItem("mode");
  expect(await storage.getItem("mode")).toBeNull();
});
