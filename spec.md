# Picker Performance Dashboard Sample Spec

## Purpose

Build a static web sample that turns the picker-board proposal image into an interactive live dashboard prototype. The sample should be credible enough to show someone the concept without needing backend systems, warehouse integrations, or a build step.

## Source Inspiration

- Proposal image: `picker-board-proposal.png`
- Existing concept: a warehouse picker performance board with real-time KPIs, current-hour rankings, shift-long rankings, top pickers, improvement callouts, and motivational messaging.

## Board Scope and Defaults

- Board title: **Thunderdome-Mez**.
- Warehouse day: current warehouse day only.
- Department shift: current department shift only.
- Warehouse section: specific warehouse section only.
- Shift start: **3:00 AM**.
- Shift end: **10:01 PM**.
- Shift duration: **22 hours**.
- Current hour definition: rolling last 60 minutes from the snapshot timestamp.
- Refresh cadence: every **30 seconds**.

## Target User

- Primary: warehouse leadership or supervisors evaluating whether the board is useful.
- Secondary: operations stakeholders who need to understand how the display changes over a shift.

## Experience Requirements

- The first screen should be the dashboard, not a landing page.
- The layout should resemble an operational wallboard: dense, readable, high contrast, and designed for quick scanning.
- The primary design should be a one-screen dashboard with no vertical scrolling.
- Target display size: **1920 x 1080**.
- The proposal image should be available as a reference panel, but the main web page should be a live recreation, not only the image.
- The sample should run as plain static HTML/CSS/JS by opening `index.html`.

## Data Requirements

Use realistic sample data bundled in `app.js`.

Each timeline snapshot should include:

- timestamp
- board title
- warehouse day indicator
- department shift indicator
- warehouse section indicator
- shift start time
- shift end time
- average pick rate
- goal pick rate
- top pick rate
- active picker count
- remaining shift time
- current-hour picker rankings
- full-shift picker rankings
- top three picker cards
- most improved picker list
- on-fire picker callout

Each picker record should include:

- picker name or display ID
- status, including whether the picker is `active`
- `currentHourLPH`, calculated from the rolling last 60 minutes
- `previousHourLPH`, used for most-improved comparison
- `shiftLPH`, used for full-shift performance ranking
- pick accuracy percentage
- safety flag count

## Timeline Controls

The sample should allow a presenter to:

- step backward one snapshot
- play or pause the timeline
- step forward one snapshot
- scrub with a range slider
- reset to the first snapshot

When the timeline is playing, the board should emulate the production refresh cadence by updating every **30 seconds**.

## KPI Rules

- Average pick rate = average `shiftLPH` across active pickers.
- Top pick rate = highest `currentHourLPH` among active pickers.
- Goal pick rate = fixed at **175 LPH**.
- Active picker count = count of pickers where `status = active`.
- Remaining shift time = shift end minus snapshot timestamp.
- Live Race should use current-hour lines/hour from `currentHourLPH`.
- Shift Race should use full-shift average lines/hour from `shiftLPH`.
- Current-hour ranking should be sorted by `currentHourLPH` descending.
- Shift ranking should be sorted by `shiftLPH` descending.
- Most improved should compare `currentHourLPH` to `previousHourLPH`.
- On-Fire picker should require `currentHourLPH >= 120%` of goal LPH, which is **210 LPH** when the goal is 175 LPH.
- Do not show a picker as On Fire if pick accuracy is below **98%** or safety flags are greater than **0**.

## Goal and Status Bands

- Goal LPH: **175**.
- Red/orange warning: under **120 LPH**.
- Yellow caution: **120-149 LPH**.
- Green/on target: **150-179 LPH**.
- Blue/hot: **180+ LPH**.
- On-Fire threshold: **210+ LPH**, pick accuracy **>= 98%**, and safety flags **= 0**.

## Guardrail Rules

- Quality guardrail: ignore for this board.
- Safety guardrail: ignore for this board.
- Quality and safety should not appear as general guardrail KPIs or separate dashboard modules.
- Pick accuracy and safety flags should still be included in picker data only to determine On-Fire eligibility.

## Visual Direction

- Dark operational display.
- White headline text.
- Yellow brand/accent color.
- Blue for current-hour bars and hot performance status.
- Green for shift-average bars and on-target performance status.
- Yellow for caution status.
- Red/orange for below-goal warning status.
- Orange may be used for urgent or On-Fire callouts.
- Compact KPI cards and bar rankings.

write Data Provider API Contract APIspec.md

## Non-Goals

- No backend integration.
- No authentication.
- No production data ingestion.
- No charting library dependency.
- No build tooling.
- No vertical scrolling in the primary 1920 x 1080 wallboard layout.
- No quality or safety guardrail modules for this board.

## Success Criteria

- Opening `index.html` shows a polished live dashboard titled **Thunderdome-Mez**.
- The dashboard fits in a **1920 x 1080** display without vertical scrolling.
- The controls visibly change the KPI values and rankings over time.
- The KPI values follow the fixed **175 LPH** goal and status-band rules.
- The sample makes it clear that `assets/picker-board-proposal.png` is the proposal image.
- The project can be shared as a folder without installing dependencies.
