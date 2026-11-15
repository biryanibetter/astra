import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const files = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
  .map((entry) => join(entry.parentPath, entry.name));

it("ships one Motion runtime rather than separate Framer/Motion engines", () => {
  const duplicateImports = files.filter((path) =>
    /from\s+["']framer-motion["']/.test(readFileSync(path, "utf8")),
  );
  expect(duplicateImports).toEqual([]);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  expect(pkg.dependencies["framer-motion"]).toBeUndefined();
});

it("mounts the page-wide reveal lifecycle only in the root layout", () => {
  const mounts = files.filter((path) =>
    /<ScrollReveals\s*\/>/.test(readFileSync(path, "utf8")),
  );
  expect(mounts).toEqual([join("src", "app", "layout.tsx")]);
  const installers = files.filter((path) =>
    /import.*installScrollReveals/.test(readFileSync(path, "utf8")),
  );
  expect(installers).toEqual([join("src", "components", "scroll-reveals.tsx")]);
});
