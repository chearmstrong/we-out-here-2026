import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { PHONE_LAYOUT_QUERY } from "./components/BrowseView";

const CSS_STYLE_RULE = 1;
const CSS_MEDIA_RULE = 4;

afterEach(() => {
  document.head.querySelector("style[data-test-styles]")?.remove();
});

it("keeps phone CSS on the same size-only schedule policy as React", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  expect(PHONE_LAYOUT_QUERY).toBe(
    "(max-width: 48rem), (max-width: 60rem) and (max-height: 32rem)",
  );

  const phoneRules = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === PHONE_LAYOUT_QUERY,
  );
  const plannerNavRule = [...(phoneRules?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".planner-nav",
  );

  expect(phoneRules).toBeDefined();
  expect(plannerNavRule).toBeDefined();
  expect(plannerNavRule?.style.getPropertyValue("position")).toBe("sticky");
});

it("keeps the Family programme quick filter compact, accessible, and able to wrap", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const filterRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".family-programme-filter",
  );
  const selectedRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        '.family-programme-filter[aria-pressed="true"]',
  );
  const focusRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".family-programme-filter:focus-visible",
  );

  expect(filterRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(filterRule?.style.getPropertyValue("width")).toBe("fit-content");
  expect(filterRule?.style.getPropertyValue("max-width")).toBe("100%");
  expect(filterRule?.style.getPropertyValue("white-space")).toBe("normal");
  expect(selectedRule?.style.getPropertyValue("background")).not.toBe("");
  expect(focusRule?.style.getPropertyValue("outline")).not.toBe("");
});

it("keeps phone day schedule rows compact and free of horizontal scrolling", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const scheduleRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule",
  );
  const rowRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__row",
  );

  expect(scheduleRule?.style.getPropertyValue("min-width")).toBe("0");
  expect(rowRule?.style.getPropertyValue("display")).toBe("grid");
  expect(rowRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(rowRule?.style.getPropertyValue("grid-template-columns")).toContain(
    "5.4rem",
  );
  expect(rowRule?.style.getPropertyValue("overflow-x")).toBe("");
});

it("keeps phone day schedule controls and time groups distinct with 44px targets", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const controlRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__control",
  );
  const inactiveControlHoverRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        '.phone-day-schedule__control[aria-pressed="false"]:hover',
  );
  const groupRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__group",
  );
  const earlierRowRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".phone-day-schedule__groups--earlier .phone-day-schedule__row",
  );

  expect(controlRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(controlRule?.style.getPropertyValue("width")).toBe("fit-content");
  expect(inactiveControlHoverRule?.style.getPropertyValue("background")).toBe(
    "#fff1ba",
  );
  expect(groupRule?.style.getPropertyValue("min-width")).toBe("0");
  expect(groupRule?.style.getPropertyValue("border-top")).not.toBe("");
  expect(earlierRowRule?.style.getPropertyValue("background")).toBe(
    "#f5f0e4",
  );
  expect(earlierRowRule?.style.getPropertyValue("border-left-color")).toBe(
    "#8f8a7d",
  );
});

it("keeps the open phone detail sheet bottom-aligned inside every safe-area edge", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const phoneRules = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === PHONE_LAYOUT_QUERY,
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

it("keeps footer resource links visibly separated and able to wrap on phones", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const footerResourcesRule = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".app-footer__resources",
  );

  expect(footerResourcesRule).toBeDefined();
  expect(footerResourcesRule?.style.getPropertyValue("display")).toBe("flex");
  expect(footerResourcesRule?.style.getPropertyValue("flex-wrap")).toBe(
    "wrap",
  );
  expect(footerResourcesRule?.style.getPropertyValue("gap")).not.toBe("");
});

it("keeps Home Screen guidance inside the safe area with wrapping actions", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const guidanceRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".home-screen-guidance",
  );
  const actionsRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".home-screen-guidance__actions",
  );

  expect(guidanceRule).toBeDefined();
  expect(guidanceRule?.style.getPropertyValue("padding-bottom")).toContain(
    "safe-area-inset-bottom",
  );
  expect(actionsRule?.style.getPropertyValue("display")).toBe("flex");
  expect(actionsRule?.style.getPropertyValue("flex-wrap")).toBe("wrap");
  expect(actionsRule?.style.getPropertyValue("gap")).not.toBe("");
});

it("keeps the header source control above decoration with a 44px target", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const appHeaderRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".app-header",
  );
  const sourceLinkRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".header-source-link",
  );

  expect(appHeaderRule?.style.getPropertyValue("position")).toBe("relative");
  expect(sourceLinkRule).toBeDefined();
  expect(sourceLinkRule?.style.getPropertyValue("position")).toBe("absolute");
  expect(sourceLinkRule?.style.getPropertyValue("min-width")).toBe("2.75rem");
  expect(sourceLinkRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(sourceLinkRule?.style.getPropertyValue("z-index")).toBe("2");
});
