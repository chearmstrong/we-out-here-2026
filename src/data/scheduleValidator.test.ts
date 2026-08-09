import { describe, expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { familyProgramme } from "./familyProgramme";
import { schedule } from "./schedule";
import { scheduleChanges } from "./scheduleChanges";
import { validateSchedule } from "./scheduleValidator";

const validEvent: FestivalEvent = {
  id: "thursday:main-stage:kotoa",
  title: "Kotoa",
  programmeDay: "thursday",
  venue: "Main Stage",
  startsAt: "2026-08-20T13:20:00+01:00",
  endsAt: "2026-08-20T14:00:00+01:00",
  category: "music",
  source: "music-programme",
};

const familyAreaEvent: FestivalEvent = {
  ...validEvent,
  id: "thursday:scorcha-skate-school:skateboarding-workshops",
  title: "SKATEBOARDING WORKSHOPS",
  venue: "Scorcha Skate School",
  category: "family",
  source: "family-programme",
  locationStatus: "check-on-site",
};

describe("validateSchedule", () => {
  it("accepts a complete valid event", () => {
    expect(validateSchedule([validEvent])).toEqual([]);
  });

  it("accepts a Family programme event with a check-on-site location", () => {
    expect(validateSchedule([familyAreaEvent])).toEqual([]);
  });

  it("rejects unknown programme sources and location statuses", () => {
    const invalidEvent = {
      ...familyAreaEvent,
      source: "family-feed",
      locationStatus: "confirmed",
    } as unknown as FestivalEvent;

    expect(validateSchedule([invalidEvent])).toEqual(
      expect.arrayContaining([
        "Unknown programme source: family-feed",
        "Unknown event location status: confirmed",
      ]),
    );
  });

  it("rejects duplicate IDs and end times before start times", () => {
    expect(
      validateSchedule([
        { ...validEvent },
        { ...validEvent, endsAt: "2026-08-20T12:00:00+01:00" },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/duplicate/i),
        expect.stringMatching(/end/i),
      ]),
    );
  });

  it("rejects blank required fields", () => {
    const blankEvent = {
      ...validEvent,
      id: " ",
      title: "",
      programmeDay: "",
      venue: "\t",
      startsAt: "",
      endsAt: "",
      category: "",
      source: "",
    } as unknown as FestivalEvent;

    expect(validateSchedule([blankEvent])).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/id.*blank/i),
        expect.stringMatching(/title.*blank/i),
        expect.stringMatching(/programmeDay.*blank/i),
        expect.stringMatching(/venue.*blank/i),
        expect.stringMatching(/startsAt.*blank/i),
        expect.stringMatching(/endsAt.*blank/i),
        expect.stringMatching(/category.*blank/i),
        expect.stringMatching(/source.*blank/i),
      ]),
    );
  });

  it("rejects unknown categories and Programme Days", () => {
    const invalidEvent = {
      ...validEvent,
      category: "screening",
      programmeDay: "monday",
    } as unknown as FestivalEvent;

    expect(validateSchedule([invalidEvent])).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/category/i),
        expect.stringMatching(/programme day/i),
      ]),
    );
  });

  it("rejects non-ISO timestamps", () => {
    expect(
      validateSchedule([
        {
          ...validEvent,
          startsAt: "20 August 2026 13:20",
          endsAt: "tomorrow",
        },
      ]),
    ).toEqual([
      expect.stringMatching(/start.*ISO/i),
      expect.stringMatching(/end.*ISO/i),
    ]);
  });

  it("rejects zero-duration events", () => {
    expect(
      validateSchedule([{ ...validEvent, endsAt: validEvent.startsAt }]),
    ).toEqual([expect.stringMatching(/positive duration/i)]);
  });

  it("rejects schedule-change targets absent from the new snapshot", () => {
    const scheduleChanges = new Map([
      ["thursday:old-stage:kotoa", "thursday:new-stage:kotoa"],
    ]);

    expect(validateSchedule([validEvent], scheduleChanges)).toEqual([
      expect.stringMatching(/change target.*does not exist/i),
    ]);
  });

  it("accepts schedule-change targets present in the new snapshot", () => {
    const scheduleChanges = new Map([
      ["thursday:old-stage:kotoa", validEvent.id],
    ]);

    expect(validateSchedule([validEvent], scheduleChanges)).toEqual([]);
  });

  it("ships a valid Family Programme source with only Family entries", () => {
    expect(familyProgramme).not.toHaveLength(0);
    expect(validateSchedule(familyProgramme)).toEqual([]);

    for (const event of familyProgramme) {
      expect(event.category, event.id).toBe("family");
      expect(event.source, event.id).toBe("family-programme");
    }

    expect(familyProgramme).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          programmeDay: "thursday",
          title: "PIZZA MAKING WITH RUTH'S KITCHEN",
          venue: "Discover",
          startsAt: "2026-08-20T14:00:00+01:00",
          endsAt: "2026-08-20T18:00:00+01:00",
          locationStatus: "check-on-site",
        }),
        expect.objectContaining({
          programmeDay: "saturday",
          title: "FAMILY ROLLERSKATING HOUR",
          venue: "Roller Rink",
          startsAt: "2026-08-22T11:00:00+01:00",
          endsAt: "2026-08-22T12:00:00+01:00",
        }),
        expect.objectContaining({
          programmeDay: "sunday",
          title: "KINETIKA BLOCO PARADE",
          venue: "Parade starts at Family Area",
          startsAt: "2026-08-23T16:00:00+01:00",
          endsAt: "2026-08-23T16:30:00+01:00",
          locationStatus: "check-on-site",
        }),
      ]),
    );
  });

  it("preserves the exact Family Programme snapshot cardinalities and mappings", () => {
    expect(familyProgramme).toHaveLength(187);
    expect(
      familyProgramme.filter(({ programmeDay }) => programmeDay === "thursday"),
    ).toHaveLength(14);
    expect(
      familyProgramme.filter(({ programmeDay }) => programmeDay === "friday"),
    ).toHaveLength(63);
    expect(
      familyProgramme.filter(({ programmeDay }) => programmeDay === "saturday"),
    ).toHaveLength(54);
    expect(
      familyProgramme.filter(({ programmeDay }) => programmeDay === "sunday"),
    ).toHaveLength(56);
    expect(
      familyProgramme.filter(
        ({ locationStatus }) => locationStatus === "check-on-site",
      ),
    ).toHaveLength(144);
    expect(
      familyProgramme.filter(({ locationStatus }) => locationStatus === undefined),
    ).toHaveLength(43);

    expect(schedule).toHaveLength(910);
    expect(
      schedule.filter(({ source }) => source === "music-programme"),
    ).toHaveLength(564);
    expect(
      schedule.filter(({ source }) => source === "wider-programme"),
    ).toHaveLength(159);
    expect(
      schedule.filter(({ source }) => source === "family-programme"),
    ).toHaveLength(187);
    expect(schedule.filter(({ category }) => category === "family")).toHaveLength(
      193,
    );

    expect(
      schedule.filter(
        ({ id }) =>
          id === "saturday:love-serve-bar:big-fish-little-fish-family-rave",
      ),
    ).toEqual([
      expect.objectContaining({
        category: "family",
        source: "music-programme",
      }),
    ]);

    expect(
      schedule.filter(
        ({ id }) => id === "sunday:love-serve-bar:activate-dj-competition-final",
      ),
    ).toEqual([
      expect.objectContaining({
        category: "family",
        source: "music-programme",
        title: "DJ COMPETITION FINAL WITH ACTIVATE PERFORMING ARTS",
        venue: "Love Serve Bar",
      }),
    ]);
    expect(
      familyProgramme.some(
        ({ id }) =>
          id ===
          "sunday:love-serve-bar:dj-competition-final-with-activate-performing-arts",
      ),
    ).toBe(false);
  });

  it("preserves the printed Friday Message for the Future punctuation", () => {
    const titlesById = new Map(
      familyProgramme.map(({ id, title }) => [id, title]),
    );
    const prefix =
      "A MESSAGE FOR THE FUTURE MULTI-SENSORY ART INSTALLATION & GIG THEATRE EXPERIENCE DESIGNED FOR EARLY YEARS (AGES 0-3) AND FAMILY AUDIENCES.";

    expect(titlesById.get("friday:build:a-message-for-the-future-session-1")).toBe(
      `${prefix} SESSION 1`,
    );
    expect(titlesById.get("friday:build:a-message-for-the-future-session-2")).toBe(
      `${prefix} SESSION 2`,
    );
    expect(titlesById.get("friday:build:a-message-for-the-future-session-3")).toBe(
      `${prefix} SESSION 3`,
    );
  });

  it("preserves the Sarabi Crochet Club spelling in the Sunday title and ID", () => {
    expect(familyProgramme).toContainEqual(
      expect.objectContaining({
        id: "sunday:people-dem-collective:upcycling-crochet-workshop-with-sarabi-crochet-club",
        title: "UPCYCLING CROCHET WORKSHOP WITH SARABI CROCHET CLUB",
      }),
    );
  });

  it("preserves the printed Saturday Flag Making Workshop title and ID", () => {
    expect(familyProgramme).toContainEqual(
      expect.objectContaining({
        id: "saturday:the-carousel:flag-making-workshop",
        title: "FLAG MAKING WORKSHOP",
        programmeDay: "saturday",
        venue: "The Carousel",
        startsAt: "2026-08-22T12:00:00+01:00",
        endsAt: "2026-08-22T17:00:00+01:00",
        locationStatus: "check-on-site",
      }),
    );
  });

  it("preserves the printed Saturday Family Area nanny-title punctuation", () => {
    const titlesById = new Map(
      familyProgramme.map(({ id, title }) => [id, title]),
    );
    const title = "BOOKABLE NANNY SERVICE: MULTIPLE SESSIONS ACROSS EACH DAY";

    expect(
      titlesById.get(
        "saturday:family-area:bookable-nanny-service-multiple-sessions-across-each-day-session-1",
      ),
    ).toBe(title);
    expect(
      titlesById.get(
        "saturday:family-area:bookable-nanny-service-multiple-sessions-across-each-day-session-2",
      ),
    ).toBe(title);
    expect(
      titlesById.get(
        "saturday:family-area:bookable-nanny-service-multiple-sessions-across-each-day-session-3",
      ),
    ).toBe(title);
  });

  it("preserves the printed Sunday Family Area nanny-title punctuation", () => {
    const titlesById = new Map(
      familyProgramme.map(({ id, title }) => [id, title]),
    );
    const title = "BOOKABLE NANNY SERVICE MULTIPLE SESSIONS:";

    expect(
      titlesById.get(
        "sunday:family-area:bookable-nanny-service-multiple-sessions-session-1",
      ),
    ).toBe(title);
    expect(
      titlesById.get(
        "sunday:family-area:bookable-nanny-service-multiple-sessions-session-2",
      ),
    ).toBe(title);
  });

  it("ships the complete valid schedule from all official programme sources", () => {
    expect(validateSchedule(schedule, scheduleChanges)).toEqual([]);
    expect(new Set(schedule.map(({ id }) => id))).toHaveLength(schedule.length);
    expect(schedule).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "music-programme" }),
        expect.objectContaining({ source: "wider-programme" }),
        expect.objectContaining({ source: "family-programme" }),
      ]),
    );
    const bigFishLittleFish = schedule.filter(
      ({ id }) =>
        id === "saturday:love-serve-bar:big-fish-little-fish-family-rave",
    );
    expect(bigFishLittleFish).toEqual([
      expect.objectContaining({ category: "family" }),
    ]);
    expect(
      schedule.some(({ title, venue }) =>
        /&(?:#\d+|[a-z]+);/i.test(`${title}${venue}`),
      ),
    ).toBe(false);
  });

  it("preserves official title spelling and punctuation", () => {
    const titlesById = new Map(schedule.map(({ id, title }) => [id, title]));
    const expectedTitles = new Map([
      ["friday:tomorrows-warriors-big-top:roge", "ROGÊ"],
      [
        "friday:love-dancin:mr-scruff-dj-spinna-and-vanessa-freeman",
        "Mr Scruff, DJ Spinna & Vanessa Freeman",
      ],
      ["friday:love-dancin:lena-c", "LÉNA C"],
      ["friday:beat-hotel-x-ilegal-mezcal:babyschon", "BABYSCHÖN"],
      [
        "saturday:beat-hotel-x-ilegal-mezcal:cami-laye-okun",
        "CAMI LAYÉ OKÚN",
      ],
      [
        "saturday:near-mint-record-store:cami-laye-okun",
        "CAMI LAYÉ OKÚN",
      ],
      ["sunday:main-stage:ana-frango-eletrico", "ANA FRANGO ELÉTRICO"],
      [
        "sunday:tomorrows-warriors-big-top:christ-stephane-boizi",
        "CHRIST-STÉPHANE BOIZI",
      ],
      ["sunday:carhartt-wip:baile-ijo", "BAILE IJÓ"],
    ]);

    for (const [id, expectedTitle] of expectedTitles) {
      expect(titlesById.get(id), id).toBe(expectedTitle);
    }
  });

  it("uses stable lower-kebab IDs without start times", () => {
    const stableId =
      /^(thursday|friday|saturday|sunday):[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

    for (const event of schedule) {
      const startTimeToken = event.startsAt.slice(11, 16).replace(":", "-");

      expect(event.id, event.title).toMatch(stableId);
      expect(event.id.split(":")[0], event.title).toBe(event.programmeDay);
      expect(event.id, event.title).not.toContain(startTimeToken);
    }
  });

  it("stores every Calendar Timestamp with the August BST offset", () => {
    for (const event of schedule) {
      expect(event.startsAt, event.title).toMatch(/\+01:00$/);
      expect(event.endsAt, event.title).toMatch(/\+01:00$/);
    }
  });

  it("keeps Calendar Timestamps within the Programme Day or following date", () => {
    const validCalendarDates = {
      thursday: ["2026-08-20", "2026-08-21"],
      friday: ["2026-08-21", "2026-08-22"],
      saturday: ["2026-08-22", "2026-08-23"],
      sunday: ["2026-08-23", "2026-08-24"],
    } as const;

    for (const event of schedule) {
      expect(validCalendarDates[event.programmeDay], event.title).toContain(
        event.startsAt.slice(0, 10),
      );
      expect(validCalendarDates[event.programmeDay], event.title).toContain(
        event.endsAt.slice(0, 10),
      );
    }
  });
});
