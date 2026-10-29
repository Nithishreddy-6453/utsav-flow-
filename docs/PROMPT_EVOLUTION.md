# UtsavFlow — Prompt Evolution & Development History

This document chronicles the real prompt iterations and engineering milestones across the development of UtsavFlow for PromptWars Virtual Challenge 5.

---

## Milestone 1: Event Setup Wizard & Draft Architecture (Phase 1)
- **Goal**: Establish a seamless 4-step setup wizard capturing event style, dates, budget in INR, guest demographics, priorities, and negative constraints ("Things to Avoid").
- **Engineering Highlights**:
  - Implemented `EventDraft` schema with Zod validation.
  - Built pre-populated celebration presets (Grand Indian Wedding, Milestone 50th Birthday, Community Cultural Utsav).
  - Designed `WizardShell` with progress indicators and local storage persistence.

---

## Milestone 2: Real GenAI Planning Engine & Overview Dashboard (Phase 2)
- **Goal**: Connect setup wizard to server-side Gemini planning engine producing personalized celebration plans.
- **Prompt Iterations**:
  - *Iteration 1*: Initial prompt requested raw plan markdown. Result was hard to parse reliably on client.
  - *Iteration 2*: Transitioned to `responseMimeType: 'application/json'` with strict JSON schema enforcing `budgetSummary`, `budgetItems`, `timelineTasks`, and `guestSummary`.
  - *Iteration 3*: Added resilient deterministic fallback planner (`generateFallbackPlan`) so application operates seamlessly offline.

---

## Milestone 3: Functional Budget Ledger & Add/Edit Modals (Phase 3)
- **Goal**: Replace static mockup with dynamic financial ledger supporting real-time calculations.
- **Engineering Highlights**:
  - Supported 3 pricing models: **Fixed Total**, **Per Guest**, and **Fixed + Per Guest**.
  - Enforced price provenance tracking (`ai_estimate`, `user_estimate`, `vendor_quote`).
  - Implemented `BudgetItemModal` with field validation, dirty state checking, and real-time variance calculations.

---

## Milestone 4: Event Timeline & Dependency Cascade Engine (Phase 4)
- **Goal**: Build an intelligent project scheduler with milestone phases and dependency tracking.
- **Engineering Highlights**:
  - Implemented directed graph validation (`validateTaskDependencies`) and cycle detection using DFS (`detectCycle`).
  - Added cascading bottleneck detection: marking a prerequisite task `delayed` immediately updates dependent tasks with visual warning badges.

---

## Milestone 5: Vendor Studio & Forensic Quotation Comparison (Phase 5)
- **Goal**: Assist hosts in evaluating messy vendor quotes and uncovering hidden costs.
- **Prompt Iterations**:
  - *Iteration 1*: Basic LLM quote summarization missed omitted tax terms.
  - *Iteration 2*: Forensic system instructions prompt Gemini to treat quote texts as untrusted raw strings and specifically verify whether 18% GST is included, excluded, or NOT_STATED.
  - *Iteration 3*: Explicit quote-to-budget application action that updates `projectedCost` to the accepted quote while strictly preserving the host's `allocatedAmount` envelope.

---

## Milestone 6: Constraint-Aware Replanning & Budget Shock Simulator (Phase 6)
- **Goal**: Enable hosts to simulate budget cuts or date changes without losing non-negotiable priorities.
- **Prompt & Architecture Iterations**:
  - *Iteration 1*: Pure LLM strategy generation generated mathematically conflicting numbers.
  - *Iteration 2*: Introduced `calculateDeterministicImpact` first, then prompted Gemini for 3 distinct strategic directions (Priority Shield, Balanced Optimization, Format Restructuring), and ran `reconcileStrategyArithmetic` to enforce exact mathematical consistency.
  - *Iteration 3*: Added Before/After review modal and 1-click rollback (`undoLastReplanInPlan`).

---

## Milestone 7: Calendar Export & Print-Ready Event Brief (Phase 7)
- **Goal**: Practical document generation and interoperability.
- **Engineering Highlights**:
  - Built RFC 5545 standard iCalendar generator (`calendarExport.ts`) with line folding, text escaping, and exclusive all-day boundaries.
  - Created editorial 7-section `EventBriefModal` with print-specific CSS (`print.css`) stripping browser chrome for clean "Save as PDF" output.

---

## Milestone 8: Personalized Ideas & Guest Experience Studio (Phase 8)
- **Goal**: Creative inspiration grounded in actual event constraints.
- **Prompt Iterations**:
  - *Iteration 1*: Ideas initially lacked clear budget grounding.
  - *Iteration 2*: Added qualitative budget impact schema (`Likely low impact`, `Potentially moderate impact`, etc.) preventing unverified price commitments.
  - *Iteration 3*: Added natural-language refinement endpoint (`/api/ideas/refine`) and isolated shortlist persistence.

---

## Milestone 9: Final Product Hardening & Competition Readiness (Phase 9)
- **Goal**: End-to-end verification, security hardening, accessibility optimization, and submission readiness.
- **Engineering Highlights**:
  - Audited all API routes, added security headers (`X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`) and `/api/health` endpoint.
  - Removed all `window.alert` calls in favor of non-blocking toast notifications.
  - Added responsive mobile navigation drawer with backdrop overlay in `WorkspaceLayout`.
  - Created end-to-end test suite (`endToEndWorkflow.test.ts`), bringing total passing tests to **136 across 7 test suites**.
  - Documented submission artifacts: `README.md`, `ARCHITECTURE.md`, `GENAI_USAGE.md`, `DEMO_STORYBOARD.md`, and updated `IMPLEMENTATION_STATUS.md`.
