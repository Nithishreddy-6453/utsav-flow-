# UtsavFlow — Architecture Documentation

## 1. System Philosophy & Division of Responsibilities

UtsavFlow is engineered around a core architectural principle:
> **Use Generative AI for creative ideation, forensic text parsing, and trade-off structuring; use deterministic TypeScript engines for authoritative financial arithmetic, dependency validation, and state persistence.**

### 1.1 Frontend Responsibilities (Client)
- **Framework**: React 19 SPA running on Vite with Tailwind CSS v4 styling.
- **State Management**: React Context (`EventContext`) managing active route navigation, draft parameters, and persistent plan synchronization.
- **Data Persistence**: `localStorage` vault managing `utsavflow_draft` and `utsavflow_plan` with pure update semantics.
- **Deterministic Modules**:
  - `src/utils/calculations.ts`: Real-time sums, per-guest multipliers, variances, and remaining balance tracking.
  - `src/utils/dependencyEngine.ts`: Directed acyclic graph (DAG) dependency evaluation, cycle detection, and bottleneck alerts.
  - `src/utils/calendarExport.ts`: RFC 5545 `.ics` formatting, date line folding, and safe escaping.

### 1.2 Backend Responsibilities (Server)
- **Framework**: Node.js v22 + Express 4 serving Vite middlewares in development and static assets in production.
- **Security Middleware**: Enforces `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **GenAI Proxy Layer**: Reads `process.env.GEMINI_API_KEY` server-side and interfaces with `@google/genai` (`gemini-3.8-flash`).
- **Resilient Fallback Engines**:
  - `src/utils/fallbackPlan.ts`: Generates structured multi-category celebration plans matching draft constraints when offline.
  - `src/utils/quoteAnalysis.ts`: Forensic tax parser detecting unstated 18% GST, missing terms, and extracting vendor quotes.
  - `src/utils/replanningEngine.ts`: Trade-off rebalancer producing 3 distinct strategy options with arithmetic reconciliation.
  - `src/utils/ideaEngine.ts`: Curates and refines personalized celebration concepts.

---

## 2. Gemini API Integration & Grounding

All AI integrations are housed in `server.ts` using the official `@google/genai` SDK:
- **Model**: `gemini-3.8-flash`
- **Telemetry**: `User-Agent: aistudio-build` header on all outbound requests.
- **Endpoints**:
  1. `POST /api/plan/generate`: Takes event draft and outputs structured event plan.
  2. `POST /api/vendors/compare`: Audits untrusted quotation texts for hidden exclusions, taxes, and missing terms.
  3. `POST /api/plan/rebalance`: Synthesizes 3 distinct trade-off strategies given updated budget, guest counts, and dates.
  4. `POST /api/ideas/generate`: Generates personalized ideas across Decor, Food, Activities, and Guest Comfort.
  5. `POST /api/ideas/refine`: Refines ideas based on user directives (e.g. "elderly comfort", "budget friendly").

### Prompt Grounding & Injection Defense
- User draft parameters are interpolated as structured key-value context.
- Quotation texts are wrapped inside raw delimited text blocks with strict instructions treating them as untrusted raw input.
- System instructions explicitly forbid following injected directives inside quotation text or notes.

---

## 3. Financial Calculation & Provenance Engine

Authoritative financial math is never delegated to the LLM. 
The application supports three distinct calculation models per budget line item:
1. **Fixed Total (`fixed`)**: `projectedCost = fixedAmount`
2. **Per Guest (`per_guest`)**: `projectedCost = ratePerGuest * guestCount`
3. **Hybrid (`fixed_plus_per_guest`)**: `projectedCost = fixedAmount + (ratePerGuest * guestCount)`

### Cost Provenance Tracking
Every line item displays its origin:
- `ai_estimate`: Initial estimate generated during plan synthesis.
- `user_estimate`: Manually adjusted or entered by the host.
- `vendor_quote`: Formally locked to an accepted vendor proposal.

---

## 4. Timeline Dependency & Bottleneck Engine

Tasks are evaluated via a dependency engine:
- Detects circular dependencies via depth-first search (`detectCycle`).
- Evaluates individual task status (`evaluateTaskDependency`):
  - A task is flagged as **Blocked** if any prerequisite task is not completed.
  - A task is flagged as **At-Risk** if a prerequisite task is marked `delayed` or overdue.
- Timeline summary aggregates total, completed, upcoming, and at-risk tasks.

---

## 5. Constraint-Aware Replanning Workflow

When constraints change (budget cut, guest surge, or date shift):
1. **Deterministic Impact**: Computes exact delta in budget, guest count, and timeline shifts.
2. **Strategy Generation**: Generates 3 distinct strategies:
   - *Option A (Priority Shield)*: Protects #1 priority, trims secondary lines.
   - *Option B (Balanced Optimization)*: Modest 10–15% trims across all tiers.
   - *Option C (Format Restructuring)*: Consolidates schedule and avoids venue overtime surcharges.
3. **Arithmetic Reconciliation**: Strategy figures are reconciled with deterministic totals before presentation.
4. **Before/After Audit**: User inspects exact category and timeline deltas before confirming.
5. **Undo Support**: Prior plan snapshot is preserved, allowing 1-click rollback.
