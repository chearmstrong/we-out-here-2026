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

it("keeps timetable axes and venue labels sticky in one contained scroller", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const scrollRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".timetable-scroll",
  );
  const axisRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".timetable-scroll__axis",
  );
  const timeScaleRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".timetable-axis",
  );
  const lanesRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".timetable-scroll__lanes",
  );
  const venueLabelRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".timetable-axis-label,\n.timetable-venue > h4",
  );
  const phoneRules = rules.find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === PHONE_LAYOUT_QUERY,
  );
  const phoneTimetableRules = [...(phoneRules?.cssRules ?? [])].filter(
    (rule) =>
      rule.type === CSS_STYLE_RULE &&
      /\.timetable(?:-scroll|__axis|-axis|-chart)?\b/.test(
        (rule as CSSStyleRule).selectorText,
      ),
  );

  expect(scrollRule?.style.getPropertyValue("position")).toBe("relative");
  expect(scrollRule?.style.getPropertyValue("overflow-x")).toBe("auto");
  expect(scrollRule?.style.getPropertyValue("overflow-y")).toBe("auto");
  expect(scrollRule?.style.getPropertyValue("max-block-size")).not.toBe("");
  expect(lanesRule?.style.getPropertyValue("overflow-y")).toBe("");
  expect(axisRule?.style.getPropertyValue("position")).toBe("sticky");
  expect(axisRule?.style.getPropertyValue("top")).toBe("0");
  expect(axisRule?.style.getPropertyValue("z-index")).not.toBe("");
  expect(timeScaleRule?.style.getPropertyValue("background")).not.toBe("");
  expect(venueLabelRule?.style.getPropertyValue("position")).toBe("sticky");
  expect(venueLabelRule?.style.getPropertyValue("left")).toBe("0");
  expect(phoneTimetableRules).toHaveLength(0);
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

it("keeps progressive filter controls and active summaries wrapping within the surface", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const primaryControlsRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".programme-filters__primary-controls",
  );
  const moreFiltersRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".more-filters-button",
  );
  const summaryRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".active-filter-summary",
  );
  const secondaryRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".programme-filters__secondary",
  );

  expect(primaryControlsRule?.style.getPropertyValue("display")).toBe("flex");
  expect(primaryControlsRule?.style.getPropertyValue("flex-wrap")).toBe(
    "wrap",
  );
  expect(moreFiltersRule?.style.getPropertyValue("min-height")).toBe(
    "2.75rem",
  );
  expect(moreFiltersRule?.style.getPropertyValue("max-width")).toBe("100%");
  expect(summaryRule?.style.getPropertyValue("display")).toBe("flex");
  expect(summaryRule?.style.getPropertyValue("flex-wrap")).toBe("wrap");
  expect(summaryRule?.style.getPropertyValue("min-width")).toBe("0");
  expect(secondaryRule?.style.getPropertyValue("min-width")).toBe("0");
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
  const eventRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__event",
  );
  const saveRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__save",
  );
  const saveFocusRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".phone-day-schedule__save:focus-visible",
  );
  const narrowRules = rules.find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === "(max-width: 24rem)",
  );
  const narrowEventRule = [...(narrowRules?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__event",
  );
  const narrowSaveRule = [...(narrowRules?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".phone-day-schedule__save",
  );

  expect(scheduleRule?.style.getPropertyValue("min-width")).toBe("0");
  expect(eventRule?.style.getPropertyValue("display")).toBe("grid");
  expect(eventRule?.style.getPropertyValue("min-width")).toBe("0");
  expect(eventRule?.style.getPropertyValue("grid-template-columns")).toContain(
    "minmax(0, 1fr)",
  );
  expect(rowRule?.style.getPropertyValue("display")).toBe("grid");
  expect(rowRule?.style.getPropertyValue("width")).toBe("100%");
  expect(rowRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(rowRule?.style.getPropertyValue("grid-template-columns")).toContain(
    "5.4rem",
  );
  expect(rowRule?.style.getPropertyValue("overflow-x")).toBe("");
  expect(saveRule?.style.getPropertyValue("min-width")).toBe("2.75rem");
  expect(saveRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(saveFocusRule?.style.getPropertyValue("outline")).not.toBe("");
  expect(narrowEventRule?.style.getPropertyValue("grid-template-columns")).toBe(
    "minmax(0, 1fr)",
  );
  expect(narrowSaveRule?.style.getPropertyValue("width")).toBe("100%");
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

it("keeps planner feedback secondary, wrapping, and keyboard accessible", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const feedbackRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".planner-feedback",
  );
  const undoRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".planner-feedback__undo",
  );
  const undoFocusRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        ".planner-feedback__undo:focus-visible",
  );

  expect(feedbackRule?.style.getPropertyValue("display")).toBe("flex");
  expect(feedbackRule?.style.getPropertyValue("flex-wrap")).toBe("wrap");
  expect(feedbackRule?.style.getPropertyValue("overflow-wrap")).toBe(
    "anywhere",
  );
  expect(undoRule?.style.getPropertyValue("min-height")).toBe("2.75rem");
  expect(undoRule?.style.getPropertyValue("min-width")).toBe("2.75rem");
  expect(undoFocusRule?.style.getPropertyValue("outline")).not.toBe("");
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

it("keeps offline readiness as a compact, contrasted planner-shell panel", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const readinessRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".offline-readiness",
  );
  const readinessIndex = rules.indexOf(readinessRule as CSSRule);
  const footerIndex = rules.findIndex(
    (rule) =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".app-footer",
  );

  expect(readinessRule).toBeDefined();
  expect(readinessRule?.style.getPropertyValue("background")).not.toBe("");
  expect(readinessRule?.style.getPropertyValue("border")).not.toBe("");
  expect(readinessRule?.style.getPropertyValue("min-height")).toBe("44px");
  expect(readinessIndex).toBeGreaterThanOrEqual(0);
  expect(readinessIndex).toBeLessThan(footerIndex);
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

it("compacts the phone header only for operational planner states", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const phoneRules = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === PHONE_LAYOUT_QUERY,
  );
  const compactHeaderRules = [...(phoneRules?.cssRules ?? [])].filter(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      [
        '.app-shell[data-planner-view="browse"] .app-header',
        '.app-shell[data-plan-empty="false"] .app-header',
      ].includes((rule as CSSStyleRule).selectorText),
  );
  const hiddenIntroRules = [...(phoneRules?.cssRules ?? [])].filter(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      [
        '.app-shell[data-planner-view="browse"] .app-header__intro',
        '.app-shell[data-plan-empty="false"] .app-header__intro',
      ].includes((rule as CSSStyleRule).selectorText),
  );
  const hiddenPlaylistRules = [...(phoneRules?.cssRules ?? [])].filter(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      [
        '.app-shell[data-planner-view="browse"] .header-playlist-link',
        '.app-shell[data-plan-empty="false"] .header-playlist-link',
      ].includes((rule as CSSStyleRule).selectorText),
  );

  expect(compactHeaderRules).toHaveLength(2);
  for (const rule of compactHeaderRules) {
    expect(rule.style.getPropertyValue("max-block-size")).not.toBe("");
  }
  expect(hiddenIntroRules).toHaveLength(2);
  for (const rule of hiddenIntroRules) {
    expect(rule.style.getPropertyValue("display")).toBe("none");
  }
  expect(hiddenPlaylistRules).toHaveLength(2);
  for (const rule of hiddenPlaylistRules) {
    expect(rule.style.getPropertyValue("display")).toBe("none");
  }

  const globalIntroRule = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".app-header__intro",
  );
  const globalPlaylistRule = [...(style.sheet?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".header-playlist-link",
  );

  expect(globalIntroRule?.style.getPropertyValue("display")).toBe("");
  expect(globalPlaylistRule?.style.getPropertyValue("display")).not.toBe(
    "none",
  );
});

it("keeps compact Browse content in normal flow after the bounded phone header", () => {
  const style = document.createElement("style");
  style.dataset.testStyles = "true";
  style.textContent = readFileSync(resolve("src/styles.css"), "utf8");
  document.head.append(style);

  const rules = [...(style.sheet?.cssRules ?? [])];
  const phoneRules = rules.find(
    (rule): rule is CSSMediaRule =>
      rule.type === CSS_MEDIA_RULE &&
      (rule as CSSMediaRule).conditionText === PHONE_LAYOUT_QUERY,
  );
  const compactBrowseHeaderRule = [...(phoneRules?.cssRules ?? [])].find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText ===
        '.app-shell[data-planner-view="browse"] .app-header',
  );
  const shellRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".app-shell",
  );
  const filtersRule = rules.find(
    (rule): rule is CSSStyleRule =>
      rule.type === CSS_STYLE_RULE &&
      (rule as CSSStyleRule).selectorText === ".programme-filters",
  );

  expect(compactBrowseHeaderRule?.style.getPropertyValue("max-block-size")).not.toBe(
    "",
  );
  expect(shellRule?.style.getPropertyValue("display")).toBe("grid");
  expect(shellRule?.style.getPropertyValue("gap")).not.toBe("");
  expect(filtersRule?.style.getPropertyValue("position")).toBe("");
  expect(filtersRule?.style.getPropertyValue("margin-top")).toBe("");
});
