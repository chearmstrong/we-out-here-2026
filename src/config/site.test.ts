import { expect, it } from "vitest";
import { PAGES_BASE } from "./site";

it("uses the repository Pages path", () => {
  expect(PAGES_BASE).toBe("/we-out-here-2026/");
});
