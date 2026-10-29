# UtsavFlow — PromptWars Demonstration Storyboard (2–3 Minutes)

This reproducible walkthrough storyboard is designed for competition evaluation and video capture. It covers the complete end-to-end celebration planning lifecycle without requiring external audio voiceover.

---

## Pre-Recording Setup
1. Open the application in browser at `http://localhost:3000` (or the deployed preview URL).
2. Ensure browser window is sized to standard 1080p (1920x1080) or 720p resolution.
3. If existing test data is present, click **"Restart Setup Wizard"** from the sidebar or click **"Grand Indian Wedding"** preset on the landing page.

---

## Scene-by-Scene Walkthrough

| Scene | Duration | Action / Interaction | Expected Visible Result | Feature Highlight |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1: Landing Page & Fast Start** | 0:00 – 0:15 | On `/`, view value proposition and click the **"Grand Indian Wedding"** preset card (or click "Create an event"). | Step 1 wizard opens pre-populated with "Sharma & Verma Grand Wedding", Jaipur location, and Royal Heritage style. | Preset loader, Setup Wizard initialization. |
| **Scene 2: Setup Review & Plan Generation** | 0:15 – 0:30 | Navigate through Step 2 (Budget ₹8,00,000, 200 guests) and Step 3 (Food #1 priority, accessibility requirements), then on Step 4 click **"Generate My Event Plan ✦"**. | 3-second synthesis modal progresses through budget allocation, vendor audit, and timeline cascade, transitioning to `/workspace/overview`. | Server-side Gemini 3.8 Flash synthesis & deterministic fallback. |
| **Scene 3: Master Overview Dashboard** | 0:30 – 0:45 | Explore Overview dashboard: KPI summary cards, budget breakdown, active milestone countdown, and next actions. | Highlights ₹8,00,000 total budget, countdown timer, priority categories, and quick links. | Master Plan Dashboard, real-time metrics. |
| **Scene 4: Budget Ledger & Add/Edit** | 0:45 – 1:05 | Click **"Budget Ledger"** in the sidebar. Click **"Add Budget Item"**, select "Catering & Food", add "Live Jalebi Counter", ₹250/guest for 200 guests. Click **"Save Expense"**. | Line item immediately appears; projected spend and forecast balance recompute instantly. Cost source shows `User Estimate`. | Multi-model pricing (per-guest), arithmetic integrity, cost provenance. |
| **Scene 5: Timeline Dependencies & Bottlenecks** | 1:05 – 1:25 | Click **"Timeline Flow"** in sidebar. Locate "Book Wedding Venue", click status and change to **"Delayed"**. | Immediately, dependent task "Finalize Catering Menu" displays a prominent red/amber **"Blocked / At-Risk"** alert badge. | Directed dependency DAG, bottleneck detection, cascade alerts. |
| **Scene 6: Vendor Studio & Forensic Quote Comparison** | 1:25 – 1:50 | Click **"Vendor Studio"** in sidebar. Review "Royal Mewar Catering" quotes. Click **"Compare Quotes"**. | Forensic comparison workspace opens. Identifies unstated 18% GST in Quote #1 and warns about missing transport terms. Recommends Quote #2. | Forensic tax audit, hidden fee detection, unstated GST warnings. |
| **Scene 7: Budget Shock & Constraint-Aware Replanning** | 1:50 – 2:15 | Click **"Replan / Rebalance"** (or top bar "Simulate Shock"). Enter revised budget: ₹7,50,000 (cut of ₹50k), guests: 250 (+50 guests), date: 2 weeks earlier. Click **"Generate Rebalance Strategies"**. | Instant deterministic impact panel displays -₹50k budget, +50 guests, -14 days. 3 distinct strategies generated (Priority Shield, Balanced, Format). | Multi-strategy replanning, arithmetic reconciliation. |
| **Scene 8: Before/After Review & 1-Click Rollback** | 2:15 – 2:35 | Select **"Option A: Priority Shield"**. Click **"Before/After Review"**. Review protected catering lines vs trimmed decor. Click **"Apply This Strategy"**. | Budget ceiling updates to ₹7,50,000. Replan history records entry. Completed tasks and booked quotes remain safely intact. | Before/After audit, non-destructive state update, undo capability. |
| **Scene 9: Ideas & Experience Shortlist** | 2:35 – 2:50 | Click **"Ideas & Experience"** in sidebar. Filter by "Food" or "Guest Comfort". Open "Explore Idea" modal, bookmark the idea. Type prompt: *"Prioritize elder comfort"* and click **"Generate Alternatives"**. | Tailored ideas generated without altering budget or timeline. Bookmarked idea appears in "Saved" tab. | Qualitative budget impact, natural-language refinement, isolated shortlist. |
| **Scene 10: Print-Ready Brief & Calendar Export** | 2:50 – 3:00 | From Timeline or Overview, click **"Export Calendar"** to download `.ics` file. Click **"Event Brief"** to open 7-section operations document. | Standard RFC 5545 `.ics` downloads. Brief displays editorial layout ready for browser native "Save as PDF". | RFC 5545 calendar export, print-ready operations brief. |

---

## Captions Summary for Screen Recording
1. *0:00* — "UtsavFlow: AI-Powered Celebration Architecture"
2. *0:20* — "Synthesizing full event plan with Gemini 3.8 Flash & deterministic constraints"
3. *0:45* — "Budget Ledger: Multi-model calculations (fixed, per-guest) with cost provenance"
4. *1:10* — "Dependency Cascade: Delayed venue booking automatically flags downstream milestones"
5. *1:35* — "Vendor Studio: Forensic audit exposes hidden fees & unstated 18% GST"
6. *2:00* — "Constraint-Aware Replanning: Instant trade-offs when budget cuts or guest surges strike"
7. *2:20* — "Before/After Audit: Safeguarding #1 priorities before committing plan updates"
8. *2:45* — "Ideas Studio: Culturally grounded inspiration that never touches financial records"
9. *2:55* — "Export: RFC 5545 iCalendar and print-ready operations brief"
