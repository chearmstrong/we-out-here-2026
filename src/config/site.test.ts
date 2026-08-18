import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import {
  FESTIVAL_PLAYLIST_URL,
  OFFICIAL_FESTIVAL_MAP_URL,
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
  expect(OFFICIAL_FESTIVAL_MAP_URL).toBe(
    "https://weoutherefestival.com/2026/08/explore-the-woh26-festival-map/",
  );
  expect(FESTIVAL_PLAYLIST_URL).toBe(
    "https://open.spotify.com/playlist/7Am6bwWRhhwy4yjcMo3ASA",
  );
});

it("licenses the original project work under MIT terms", () => {
  const packageJson = JSON.parse(
    readFileSync(resolve("package.json"), "utf8"),
  );
  const license = readFileSync(resolve("LICENSE"), "utf8");

  expect(packageJson.license).toBe("MIT");
  expect(license).toContain("MIT License");
  expect(license).toContain("Copyright (c) 2026 Ché Armstrong");
});

it("allows the app shell to use iPhone safe-area insets", () => {
  const indexHtml = readFileSync(resolve("index.html"), "utf8");
  const parsedIndex = new DOMParser().parseFromString(indexHtml, "text/html");

  const viewportContent = parsedIndex
    .querySelector('meta[name="viewport"]')
    ?.getAttribute("content");

  expect(viewportContent).toContain("viewport-fit=cover");
});
