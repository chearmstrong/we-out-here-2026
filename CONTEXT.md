# Festival Planner

This context models the published programme and one browser-local itinerary for a four-day festival. It keeps the official schedule’s day-based mental model accurate while retaining the real instants needed during the festival.

## Programme

**Festival Event**:
A scheduled music or wider-programme item with an identity, Programme Day, venue, category, and real start and end timestamps.
_Avoid_: Act, set, listing

**Programme Day**:
The official Thursday, Friday, Saturday, or Sunday schedule grouping in which a Festival Event is published. It can differ from the calendar date after midnight.
_Avoid_: Calendar day, event date

**Calendar Timestamp**:
The real `Europe/London` start or end instant of a Festival Event, including an overnight end on the following calendar date.
_Avoid_: Programme time, display time

**Schedule Snapshot**:
A versioned local copy of the official music and wider programmes, manually verified for one deployment and labelled with the date it was last checked.
_Avoid_: Live feed, synced schedule

**Category**:
One of Music, Talk, Workshop, Family, or Other. Family is used only when the official programme clearly supports that classification; uncertain wider-programme items are Other.
_Avoid_: Tag, genre

## Planning

**Itinerary**:
The single shared set of Festival Events saved in one browser for the family’s intended plan.
_Avoid_: Account, profile, backup

**Event Note**:
One optional local-only note of at most 140 characters attached to a saved Festival Event. It is deleted with that saved event and included in its calendar export.
_Avoid_: Comment, message, task

**Clash**:
Two saved Festival Events whose Calendar Timestamp intervals overlap. Adjacent events with one ending exactly when the other starts do not clash.
_Avoid_: Conflict, overlap

**Schedule Change**:
A later Schedule Snapshot that changes a Festival Event’s presentation details or Calendar Timestamps while retaining its stable identity where the official programme still refers to the same event.
_Avoid_: New event, lost favourite

**Update Available**:
A newer verified Schedule Snapshot offered to a connected browser with an explicit update action while its current cached snapshot remains usable offline.
_Avoid_: Forced refresh, live sync

**Current Programme Day**:
The Programme Day foregrounded in My Plan: the day of the current saved event, otherwise the next saved event; before the festival the next saved event is shown alongside the complete Itinerary.
_Avoid_: Today, calendar day
