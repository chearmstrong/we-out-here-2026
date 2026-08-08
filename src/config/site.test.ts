import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import {
  OFFICIAL_SET_TIMES_URL,
  PAGES_BASE,
  PROJECT_README_URL,
  PROJECT_REPOSITORY_URL,
} from "./site";

it("uses the repository Pages path", () => {
  expect(PAGES_BASE).toBe("/we-out-here-2026/");
});

it("publishes stable public resource destinations", () => {
  expect(PROJECT_REPOSITORY_URL).toBe(
    "https://github.com/chearmstrong/we-out-here-2026",
  );
  expect(PROJECT_README_URL).toBe(`${PROJECT_REPOSITORY_URL}#readme`);
  expect(OFFICIAL_SET_TIMES_URL).toBe(
    "https://weoutherefestival.com/set-times/",
  );
});

it("allows the app shell to use iPhone safe-area insets", () => {
  const indexHtml = readFileSync(resolve("index.html"), "utf8");
  const parsedIndex = new DOMParser().parseFromString(indexHtml, "text/html");

  const viewportContent = parsedIndex
    .querySelector('meta[name="viewport"]')
    ?.getAttribute("content");

  expect(viewportContent).toContain("viewport-fit=cover");
});
