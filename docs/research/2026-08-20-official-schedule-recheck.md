# We Out Here 2026: official schedule recheck

**Checked:** 20 August 2026, 08:54 BST (Music and Wider Programme); 08:58 BST (Family)
**Scope:** live official timetable pages compared directly with Field Notes' committed `2026-08-18` snapshot (`f9f9d61`). This is a research record for the resulting snapshot update.

## Sources and method

- [Official Music Programme set times](https://weoutherefestival.com/set-times/)
- [Official Wider Programme set times](https://weoutherefestival.com/wider-programme-set-times/)
- [Official Family page](https://weoutherefestival.com/family/)

I retrieved the public HTML directly, read the rendered schedule columns and event rows for all four Programme Days, and compared each title, stage and displayed time with the committed local snapshot. The responses carried `Last-Modified` values of **19 August 2026 14:30:34 GMT** (Music), **14:34:26 GMT** (Wider), and **14:36:40 GMT** (Family). Those headers establish a recent page refresh, not the effective time of each individual alteration.

I treated case, punctuation, curly/straight apostrophes, and source spelling variants as incidental unless the displayed words or venue changed. Programme Day—not the calendar date after midnight—is used below.

## Result

The live Music page has **568 displayed rows** and the live Wider page has **185**. The `2026-08-18` snapshot had **564 Music** and **184 Wider Programme** events. Music still contains the pre-existing duplicated Friday **THE MIGHTY ZAF** row; Field Notes continues to represent it once.

### Music Programme

#### Additions

| Programme Day | Venue | Time | Official title |
| --- | --- | --- | --- |
| Friday | Carhartt WIP | 21:00–22:00 | 160U: SIMMS |
| Friday | Passenger Presents: Ground Tempo | 15:00–16:00 | Outside is a Vibe |

#### Removal

| Programme Day | Venue | Previous title/time |
| --- | --- | --- |
| Friday | Worldwide FM presents : WOH Radio | Luke Una: A Worldwide Breakfast, 11:00–13:00 |

No current matching row appears on the official Music page for this session.

#### Time changes

| Programme Day | Venue | Title | Previous | Official now |
| --- | --- | --- | --- | --- |
| Friday | Carhartt WIP | 160 UNITY: CRAIC DAVID, SOHOTSOSPICY & SEB | 21:00–22:30 | 22:00–23:30 |
| Friday | Carhartt WIP | 160 UNITY: DJ SPINN | 22:30–23:30 | 23:30–00:30 |
| Saturday | Rhythm Corner | ALIX PEREZ FT. SP:MC | 22:30–00:30 | 22:30–00:00 |
| Saturday | Rhythm Corner | CALIBRE FT. SP:MC | 00:30–02:30 | 00:00–02:00 |
| Saturday | Rhythm Corner | Ivy Lab | 02:30–04:00 | 02:00–04:00 |

#### Title or venue changes, with times unchanged

| Programme Day | Previous | Official now |
| --- | --- | --- |
| Saturday, Brawnswood, 21:00–22:30 | Marina & Yazmin Lacey | MARINA GB & Yazmin Lacey |
| Saturday, Brawnswood, 13:00–14:00 | Dave Okumu & Tom Skinner | OHS (Dave Okumu \| Tom Herbert \| Tom Skinner) |
| Sunday, 18:00–19:30 | Near Mint Record Signings — LA RUMBA | Near Mint Record Store — LA RUMBA |

### Wider Programme

#### Addition

| Programme Day | Venue | Time | Official title |
| --- | --- | --- | --- |
| Sunday | The Knowledge | 10:00–11:00 | Point Blank Music School: Electronic Orchestra |

#### Title changes, with venue and time unchanged

| Programme Day | Venue/time | Previous | Official now |
| --- | --- | --- | --- |
| Sunday | booklove, 10:00–11:00 | Seeing the Big Picture with Helen Sanson | Remembering Jason Arday and Pioneers: Honouring Lives, Legacies, Memories and Change Together |
| Sunday | The Knowledge, 16:00–17:00 | Qobuz Presents: Music from my Homeland Series 3 | Qobuz Presents: Homeland to Here ft Tara Lily |
| Sunday | The Knowledge, 12:00–13:00 | How To Make A Catalogue Contemporary with CAM Records and Bodie Cameron | CAM Sugar: A Journey Through the World’s Largest Cataloge of Italian Film Soundtracks |

No other Wider additions, removals, time changes or venue changes were found.

### Family Programme

The official Family page remains a general promotional/information page; it does not supply a 2026 event-level timetable that could replace or reconcile the 9 August official Facebook-card snapshot. No Family data change is proposed from this check.

## Snapshot decisions

1. Add the three new rows and remove the Friday Luke Una breakfast session.
2. Amend matching times, titles and venue while retaining their existing stable IDs where the event is clearly the same.
3. Map the immediately preceding LA RUMBA `near-mint-record-signings` ID to its restored `near-mint-record-store` ID; do not preserve the superseded 18 August target.
4. Retain one Mighty Zaf record.
5. Use existing controlled categories conservatively: the two Music additions are `music`; Point Blank Music School: Electronic Orchestra is `workshop` in line with other Point Blank sessions.
