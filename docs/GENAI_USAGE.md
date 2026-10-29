# UtsavFlow — GenAI Usage & Prompt Engineering Documentation

## 1. Overview of GenAI Integration

UtsavFlow uses Google's `gemini-3.8-flash` via the official `@google/genai` TypeScript SDK. 
All AI operations are executed strictly on the Node.js Express server (`server.ts`) to prevent client-side credential exposure.

---

## 2. Capability Matrix

| Capability | Gemini Model Task | Deterministic Code Responsibility | Output Validation |
| :--- | :--- | :--- | :--- |
| **Initial Plan Generation** | Synthesizes comprehensive celebration structure, initial budget category splits, and phased milestones matching user style & priorities. | Computes exact mathematical totals, establishes default status values, and saves to local storage vault. | JSON parsing + Zod schema validation. |
| **Vendor Quote Audit & Comparison** | Forensically reads messy quotation text to detect unstated 18% GST, missing terms, exclusions, and extraction of base costs. | Recomputes effective cost per guest, checks math parity, manages quotation records, and links to budget ledger. | `QuoteComparisonResult` schema validation. |
| **Constraint-Aware Replanning** | Ideates 3 distinct trade-off strategies (Priority Shield, Balanced Optimization, Format Restructuring) based on proposed constraints. | Reconciles strategy math against deterministic deltas, applies approved category/task adjustments, and tracks undo history. | `TradeOffStrategySchema` + `reconcileStrategyArithmetic`. |
| **Personalized Ideas & Experience** | Curates culturally nuanced celebration concepts, menus, and decor based on style and guest demographics. | Enforces qualitative-only budget impacts, filters by category, manages saved shortlists, and links workspace image assets. | `PersonalizedIdeaSchema` validation. |
| **Natural-Language Idea Refinement** | Rewrites or adapts concepts based on user directives (e.g. "elderly comfort", "more affordable"). | Guarantees non-mutation of budget ledger, timeline tasks, or vendor records during idea exploration. | `PersonalizedIdeaSchema` validation. |

---

## 3. Grounding & Anti-Prompt Injection

All user inputs and vendor quotes are treated as untrusted strings:
1. **Delimited Text Blocks**: Quotation texts are isolated within distinct boundary quotes (`""" ... """`) with quotes escaped to prevent prompt injection.
2. **System Instruction Guardrails**: System instructions explicitly mandate forensic auditor behavior and instruct the model to ignore any instructions embedded inside quote text or user notes.
3. **Structured JSON Output**: All requests use `responseMimeType: 'application/json'` to ensure clean machine-readable output.

---

## 4. Fallback Architecture & Resilience

UtsavFlow is engineered for 100% operational resilience:
- If `GEMINI_API_KEY` is not provided or the network is unavailable, every endpoint automatically falls back to an internal deterministic engine (`fallbackPlan.ts`, `quoteAnalysis.ts`, `replanningEngine.ts`, `ideaEngine.ts`).
- Users are never faced with a broken screen or error modal.
- The UI transparently labels the status of records (e.g., `Live AI Sync`, `Local Vault · Synced`, `AI Estimate`, `Rule Based`).

---

## 5. Known Limitations

- **Qualitative Budget Impact on Ideas**: Ideas in the Ideas & Experience Studio provide qualitative impact labels (`Likely low impact`, `Potentially moderate impact`, etc.) rather than speculative prices, since actual pricing depends on vendor negotiations.
- **Offline Mode**: In offline mode, the deterministic planner uses realistic Indian celebration heuristics and rules rather than dynamic real-time web browsing.
