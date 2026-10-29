# UtsavFlow — Intelligent Celebration Architecture & Execution Workspace

> **Plan with clarity. Celebrate with confidence.**  
> An AI-powered celebration planning, budgeting, scheduling, and vendor quotation analysis web application for weddings, milestone birthdays, and community festivals. Built for the PromptWars Virtual Challenge 5.

---

## 1. Overview & Problem Statement

Planning large-scale celebrations (Indian weddings, milestone anniversaries, and community utsava) is notoriously chaotic:
- **Budget Volatility**: Hidden vendor fees, missing 18% GST terms, and unpredictable guest surge costs frequently blow past financial caps.
- **Cascading Milestones**: Venue booking delays directly endanger catering tastings, invitation mailings, and decor production.
- **Unstated Vendor Terms**: Quotations arrive in unstructured formats with omitted electricity/generator charges, fuel overtime, and non-refundable deposits.
- **Uncontrolled Replanning**: When budgets must be reduced or dates shifted, hosts lack transparent trade-off models that safeguard their non-negotiable priorities.

**UtsavFlow** addresses these challenges through a **deterministic financial & dependency engine** augmented by **grounded server-side Gemini 3.8 Flash** intelligence.

---

## 2. Core Features

### ✦ 4-Step Guided Event Setup Wizard
- Comprehensive capture of event style, date horizon, venue location, budget ceiling in INR (₹), and guest demographics (Adults, Children, Seniors).
- Prioritized preference ordering, must-have features, cultural nuances, accessibility requirements, and negative exclusions ("Things to Avoid").

### ✦ Dual-Engine Event Plan Synthesis
- Server-side Gemini 3.8 Flash generation producing structured multi-tier allocations, phased milestones, and vendor checklists.
- Deterministic local planner fallback ensuring 100% offline and network-resilient operation.

### ✦ Mathematical Budget Ledger
- Itemized tracking across categories (Venue, Catering, Decor, Media, Entertainment, Logistics).
- Multi-model pricing support: **Fixed**, **Per-Guest**, and **Fixed + Per-Guest**.
- Transparent **Cost Source Provenance**: `AI Estimate`, `User Estimate`, and `Vendor Quoted`.
- Real-time calculation of allocated envelopes, projected spend, recorded payments, and remaining buffer/deficit.

### ✦ Dependency-Aware Timeline Engine
- Milestone and phase grouping (Initial Planning, Venue & Vendor Bookings, Final Preparations, Event Day).
- Forward and backward dependency tracking: automatically detects cycle risks, overdue tasks, and identifies cascading downstream bottlenecks when a prerequisite task is delayed.

### ✦ Vendor Studio & Forensic Quotation Comparison
- Side-by-side comparative analysis of incoming vendor proposals.
- Automated extraction of base costs, per-guest rates, stated inclusions vs exclusions, and missing fee alerts (e.g., unstated 18% GST, fuel, overtime).
- Direct, explicit quote-to-budget application: locks the vendor quote to a budget item, updating projected spend while strictly safeguarding the host's allocated envelope.

### ✦ Constraint-Aware Replanning & Budget Shock Simulator
- Instant simulation of budget cuts, guest count surges, or shifted event dates.
- Generates 3 mathematically reconciled trade-off strategies:
  1. **Option A: Priority Shield** (protects #1 priority, trims discretionary decor)
  2. **Option B: Balanced Optimization** (spreads 10–15% scope refinements evenly)
  3. **Option C: Format & Schedule Restructuring** (optimizes timetables and eliminates venue overtime surcharges)
- Before/After interactive audit with one-click rollback/undo protection.

### ✦ Personalized Ideas & Guest Experience Studio
- Curated ideas across Decor, Food, Activities, and Guest Comfort grounded in event constraints and accessibility needs.
- Natural-language refinement engine ("Make an idea your own.") with quick prompt chips.
- Bookmarkable shortlist that survives browser refreshes without altering budget or timeline state.

### ✦ RFC 5545 Calendar Export & Print-Ready Event Brief
- Clean `.ics` calendar generation for Google Calendar, Apple Calendar, and Outlook with exclusive all-day event boundaries eliminating timezone shift bugs.
- Editorial 7-section printable Operations Brief with print-optimized CSS for browser-native "Save as PDF" exports.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React icons, Google Fonts (Fraunces, Plus Jakarta Sans, JetBrains Mono).
- **Backend / Dev Server**: Node.js v22, Express 4, Vite 8, `tsx`.
- **GenAI**: `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with server-side proxy routes and User-Agent telemetry.
- **Validation**: Zod schema validation on all API requests and model responses.
- **Testing**: Vitest test runner (136 unit and integration tests across 7 test suites).
- **Storage**: Client-side localStorage persistence with pure update semantics.

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Client                        │
│  React 19 SPA · Tailwind CSS v4 · HashRouter · Context API  │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Setup Wizard  │  │   Overview   │  │  Budget Ledger   │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│          │                 │                   │            │
│  ┌───────┴───────┐  ┌──────┴───────┐  ┌────────┴─────────┐  │
│  │ Timeline Flow │  │Vendor Studio │  │ Ideas Experience │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│          └─────────────────┼───────────────────┘            │
│                            ▼                                │
│                Local Storage Vault                          │
│        (Pure state updates · Non-destructive)               │
└────────────────────────────┬────────────────────────────────┘
                             │ API Calls (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Backend Server                   │
│   (server.ts · Port 3000 · Security Headers · No Key Leak)  │
│                                                             │
│   /api/plan/generate    /api/vendors/compare                │
│   /api/plan/rebalance   /api/ideas/generate & refine        │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │             Gemini 3.8 Flash SDK Client              │  │
│   │             (@google/genai via secure env)           │  │
│   └──────────────────────────┬───────────────────────────┘  │
│                              │ Fallback on error/offline    │
│                              ▼                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │           Deterministic Calculation Engine           │  │
│   │    (Math calculations · Dependency DAG · Schema)     │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js v20+ or v22+
- npm or bun

### Setup Instructions
1. Clone or open the repository:
   ```bash
   cd utsavflow
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (optional for live AI):
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY if desired:
   # GEMINI_API_KEY=your_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`.

---

## 6. Verification & Test Commands

Run the full automated test suite:
```bash
npm test
```

Run TypeScript static type checks:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

Run production server preview:
```bash
npm run preview
```

---

## 7. Security & Privacy Safeguards

- **Zero API Key Exposure**: All Gemini calls run exclusively server-side in `server.ts`. No `VITE_` API key prefixes exist.
- **Input Sanitization & Boundary Caps**: Payload sizes are capped at 2MB; string inputs, quotation texts, and array lengths are strictly bounded.
- **Anti-Prompt Injection**: GenAI prompts treat user inputs and quotation texts as untrusted raw strings.
- **Arithmetic Integrity**: GenAI suggestions are never trusted for authoritative calculations. All financial totals, allocations, and deadline offsets are computed deterministically.
- **Local Data Vault**: Celebration details, guest lists, and budgets are stored in the user's browser `localStorage` with zero unneeded third-party tracking.
