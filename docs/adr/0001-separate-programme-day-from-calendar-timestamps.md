# Separate programme day from calendar timestamps

**Status:** accepted

The planner will model an event’s official Programme Day separately from its timezone-aware `Europe/London` start and end timestamps, and will use a stable identity based on Programme Day, venue, and event identity rather than start time. The official Programme Day drives browsing and itinerary grouping; timestamps drive “now”, clashes, and calendar export. This avoids filing post-midnight Friday-night events under Saturday and preserves saved events when their set time changes.
