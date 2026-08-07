import type { ChangeEvent } from "react";
import {
  EVENT_CATEGORIES,
  type ProgrammeDay,
} from "../domain/festival";
import type { BrowseFilters } from "../planner/itinerary";
import { categoryLabel, programmeDayLabel } from "./EventCard";

const PROGRAMME_DAYS: ProgrammeDay[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type FiltersProps = {
  filters: BrowseFilters;
  venues: readonly string[];
  onChange: (filters: BrowseFilters) => void;
};

export function Filters({ filters, venues, onChange }: FiltersProps) {
  const updateFilter =
    (key: keyof BrowseFilters) =>
    (changeEvent: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...filters, [key]: changeEvent.currentTarget.value });
    };

  return (
    <form
      className="programme-filters"
      onSubmit={(submitEvent) => submitEvent.preventDefault()}
    >
      <label className="programme-search">
        <span>Search programme</span>
        <input
          type="search"
          value={filters.query}
          onChange={updateFilter("query")}
        />
      </label>
      <div className="programme-filters__selects">
        <label>
          <span>Programme Day</span>
          <select
            value={filters.programmeDay}
            onChange={updateFilter("programmeDay")}
          >
            <option value="all">All days</option>
            {PROGRAMME_DAYS.map((programmeDay) => (
              <option key={programmeDay} value={programmeDay}>
                {programmeDayLabel(programmeDay)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Venue</span>
          <select value={filters.venue} onChange={updateFilter("venue")}>
            <option value="all">All venues</option>
            {venues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select
            value={filters.category}
            onChange={updateFilter("category")}
          >
            <option value="all">All categories</option>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
