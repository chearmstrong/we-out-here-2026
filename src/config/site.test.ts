import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { PAGES_BASE } from "./site";

it("uses the repository Pages path", () => {
  expect(PAGES_BASE).toBe("/we-out-here-2026/");
});

it("allows the app shell to use iPhone safe-area insets", () => {
  const indexHtml = readFileSync(resolve("index.html"), "utf8");
  const parsedIndex = new DOMParser().parseFromString(indexHtml, "text/html");

  const viewportContent = parsedIndex
    .querySelector('meta[name="viewport"]')
    ?.getAttribute("content");

  expect(viewportContent).toContain("viewport-fit=cover");
});
