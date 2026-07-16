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
