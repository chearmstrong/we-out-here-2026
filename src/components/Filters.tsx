import { useState, type ChangeEvent } from "react";
import {
  EVENT_CATEGORIES,
  type ProgrammeDay,
} from "../domain/festival";
import type { BrowseFilters } from "../planner/itinerary";
import type { VenueOption } from "../planner/venues";
import { categoryLabel, programmeDayLabel } from "./EventCard";

const PROGRAMME_DAYS: ProgrammeDay[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type FiltersProps = {
  filters: BrowseFilters;
  venues: readonly VenueOption[];
  onChange: (filters: BrowseFilters) => void;
  onClear: () => void;
};

const SECONDARY_FILTERS_ID = "programme-secondary-filters";

export function Filters({ filters, venues, onChange, onClear }: FiltersProps) {
  const [secondaryOpen, setSecondaryOpen] = useState(false);
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
      <div className="programme-filters__primary">
        <label className="programme-search">
          <span>Search programme</span>
          <input
            type="search"
            value={filters.query}
            onChange={updateFilter("query")}
          />
        </label>
        <div className="programme-filters__primary-controls">
          <button
            className="family-programme-filter"
            type="button"
            aria-pressed={filters.category === "family"}
            onClick={() =>
              onChange({
                ...filters,
                category: filters.category === "family" ? "all" : "family",
              })
            }
          >
            Family programme
          </button>
          <label className="programme-day-filter">
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
          <button
            aria-controls={SECONDARY_FILTERS_ID}
            aria-expanded={secondaryOpen}
            className="more-filters-button"
            onClick={() => setSecondaryOpen((open) => !open)}
            type="button"
          >
            More filters
          </button>
        </div>
      </div>

      {secondaryOpen ? (
        <div
          className="programme-filters__secondary"
          id={SECONDARY_FILTERS_ID}
        >
          <label>
            <span>Venue</span>
            <select value={filters.venue} onChange={updateFilter("venue")}>
              <option value="all">All venues</option>
              {venues.map((venue) => (
                <option key={venue.value} value={venue.value}>
                  {venue.label}
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
      ) : null}

      {filters.venue !== "all" || filters.category !== "all" ? (
        <div className="active-filter-summary" aria-label="Active filters">
          {filters.venue !== "all" ? (
            <span className="active-filter-chip">Venue: {filters.venue}</span>
          ) : null}
          {filters.category !== "all" ? (
            <span className="active-filter-chip">
              Category: {categoryLabel(filters.category)}
            </span>
          ) : null}
          <button className="clear-filters-button" onClick={onClear} type="button">
            Clear all filters
          </button>
        </div>
      ) : null}
    </form>
  );
}
