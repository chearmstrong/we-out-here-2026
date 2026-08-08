import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";

const CSS_STYLE_RULE = 1;
const CSS_MEDIA_RULE = 4;

afterEach(() => {
  document.head.querySelector("style[data-test-styles]")?.remove();
});

it("keeps the open phone detail sheet bottom-aligned inside every safe-area edge", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const phoneRules = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === "(max-width: 42rem)",
  );
  const openDialogRule = [...(phoneRules?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".dialog-backdrop[open]",
  );

  expect(phoneRules).toBeDefined();
  expect(openDialogRule).toBeDefined();
  expect(openDialogRule?.style.getPropertyValue("align-items")).toBe("end");
  expect(openDialogRule?.style.getPropertyValue("padding-top")).toContain(
    "safe-area-inset-top",
  );
  expect(openDialogRule?.style.getPropertyValue("padding-right")).toContain(
    "safe-area-inset-right",
  );
  expect(openDialogRule?.style.getPropertyValue("padding-bottom")).toContain(
    "safe-area-inset-bottom",
  );
  expect(openDialogRule?.style.getPropertyValue("padding-left")).toContain(
    "safe-area-inset-left",
  );
});
