# UtsavFlow Screen Map

This document inventories all screens, views, and routes in the UtsavFlow application, mapping imported Stitch designs to our React application routes.

## Route Inventory

| Route | Screen Name | Description & Status |
| :--- | :--- | :--- |
| `/` | Landing / Start & Resume Workspace | Landing page with value proposition, returning user saved drafts ("Continue Planning"), and example presets ("Grand Indian Wedding", "Milestone 50th Birthday", "Community Cultural Utsav"). **[Implemented - Phase 1]** |
| `/events/new/basic` | Step 1: Basic Details | Event type selector (Wedding, Birthday, Community, Other), Event Name, Event Date, Event Location/City, and Atmosphere & Style selector. **[Implemented - Phase 1]** |
| `/events/new/budget` | Step 2: Budget & Guests | Total budget envelope in INR with quick selection chips, budget governance mode (Strict vs Flexible), total guest count, and optional cohort breakdown (Adults, Children, Seniors) with live mathematical validation. **[Implemented - Phase 1]** |
| `/events/new/preferences` | Step 3: Priorities & Preferences | Reorderable priority list (Food & Catering, Guest Comfort, Photography, Venue, Decoration), must-have feature toggles, custom tags, cultural/ritual nuances, senior comfort needs, and negative rules ("Things to Avoid"). **[Implemented - Phase 1]** |
| `/events/new/review` | Step 4: Review & Generate Plan | Pre-flight audit summary of Steps 1-3 with direct Edit links back to individual steps, deliverables breakdown, and **"Generate My Event Plan"** action with interactive simulation modal. **[Implemented - Phase 1]** |
| `/events/generating` | Event Generation Synthesis | Honest real-time generation simulation workspace showing 4-stage synthesis checklist before entering the active event workspace. **[Implemented - Phase 1]** |
| `/workspace/overview` | Event Workspace Overview | Master dashboard showing KPI metrics, active tasks, blockers, and budget glance for the active event. **[Imported / Reusable Foundation]** |
| `/workspace/budget` | Budget Ledger | Detailed itemized budget tracker with price sources, variance indicators, and Add/Edit item modal. **[Imported / Reusable Foundation]** |
| `/workspace/timeline` | Timeline Flow & Cascade | Milestone-grouped task manager with dependency alert banners and cascade bottleneck warnings. **[Imported / Reusable Foundation]** |
| `/workspace/vendors` | Vendor Studio | Vendor quotation comparisons, forensic tax audit, and requirement briefs. **[Implemented - Phase 5]** |
| `/workspace/themes` | Experience & Themes | AI-curated concepts, decor scenography, and guest comfort idea gallery. **[Imported / Reusable Foundation]** |
