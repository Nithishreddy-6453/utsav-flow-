/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateFallbackPlan } from '../utils/fallbackPlan';
import { 
  getSavedDraft, 
  saveDraft, 
  getSavedPlan, 
  savePlan, 
  persistBudgetItem, 
  removeBudgetItem,
  persistTimelineTask,
  updateTaskStatus,
  persistVendor,
  persistQuote,
  applyQuoteToBudget,
  applyReplanToPlan,
  undoLastReplanInPlan,
  saveIdeaToPlan,
  removeIdeaFromPlan,
  toggleSaveIdea
} from '../utils/storage';
import { 
  calculateTotalAllocated, 
  calculateTotalProjected, 
  calculateTotalPaid, 
  calculateForecastRemaining, 
  calculateProjectedCost 
} from '../utils/calculations';
import { 
  evaluateTaskDependency, 
  calculateTimelineSummary 
} from '../utils/dependencyEngine';
import { 
  analyzeQuoteDeterministically, 
  compareQuotesFallback 
} from '../utils/quoteAnalysis';
import { 
  calculateDeterministicImpact, 
  generateDeterministicAlternatives, 
  applyReplanningStrategy, 
  undoLastReplan 
} from '../utils/replanningEngine';
import { generateDeterministicIdeas, refineIdeaDeterministically } from '../utils/ideaEngine';
import { generateICSContent, escapeICSText } from '../utils/calendarExport';
import { EventDraft } from '../types';
import { 
  EventPlan, 
  BudgetItem, 
  TimelineTask, 
  Vendor, 
  VendorQuote, 
  ConstraintChangeRequest, 
  TradeOffStrategy 
} from '../types/plan';
import { DEFAULT_DRAFT } from '../data/presets';

// Node localStorage Mock
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, val: string) => { storageMap[key] = val; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};
// @ts-ignore
globalThis.localStorage = localStorageMock;

describe('Phase 9: Comprehensive End-to-End Workflow Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // WORKFLOW A: CREATE AND GENERATE AN EVENT
  // ==========================================
  describe('Workflow A: Create and generate an event', () => {
    it('creates draft, generates plan reflecting constraints, and survives browser reload', () => {
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        id: 'draft_e2e_a',
        eventName: 'Meera & Kabir Winter Wedding',
        occasionType: 'wedding',
        eventDate: '2026-12-18',
        eventLocation: 'Taj Umaid Bhawan, Jodhpur',
        eventStyle: ['Royal Heritage', 'Traditional'],
        maxBudget: 1500000,
        budgetFlexibility: 'strict',
        totalGuests: 200,
        adultGuests: 150,
        childGuests: 25,
        seniorGuests: 25,
        priorities: ['Catering & Food Quality', 'Guest Experience', 'Photography & Film'],
        mustHaves: ['Jain and satvik counters', 'Ramp to stage'],
        accessibilityRequirements: 'Wheelchair ramp for seniors',
        thingsToAvoid: 'Single-use plastic bottles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveDraft(draft);

      // Verify draft saved to storage
      const loadedDraft = getSavedDraft();
      expect(loadedDraft.eventName).toBe('Meera & Kabir Winter Wedding');
      expect(loadedDraft.maxBudget).toBe(1500000);
      expect(loadedDraft.totalGuests).toBe(200);

      // Generate Plan
      const plan = generateFallbackPlan(draft);
      savePlan(plan);

      // Verify plan reflects constraints
      expect(plan.eventName).toBe('Meera & Kabir Winter Wedding');
      expect(plan.budgetSummary.totalBudget).toBe(1500000);
      expect(plan.guestSummary.totalGuests).toBe(200);
      expect(plan.budgetItems.length).toBeGreaterThan(0);
      expect(plan.timelineTasks.length).toBeGreaterThan(0);

      // Simulate browser refresh
      const refreshedPlan = getSavedPlan(loadedDraft);
      expect(refreshedPlan.eventName).toBe('Meera & Kabir Winter Wedding');
      expect(refreshedPlan.budgetSummary.totalBudget).toBe(1500000);
    });
  });

  // ==========================================
  // WORKFLOW B: MANAGE THE BUDGET
  // ==========================================
  describe('Workflow B: Manage the budget', () => {
    it('supports adding, editing, and calculating fixed, per_guest, and hybrid budget items', () => {
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        maxBudget: 1000000,
        totalGuests: 200
      };
      saveDraft(draft);
      const initialPlan = generateFallbackPlan(draft);
      savePlan(initialPlan);

      // 1. Add fixed item
      const fixedItem: BudgetItem = {
        id: 'item_venue_rental',
        categoryId: 'cat_venue',
        categoryName: 'Venue',
        itemName: 'Palace Courtyard Booking',
        calculationModel: 'fixed',
        fixedAmount: 250000,
        ratePerGuest: 0,
        guestCount: 200,
        allocatedAmount: 300000,
        projectedCost: 250000,
        paidAmount: 50000,
        costSource: 'user_estimate',
        sourceNotes: '50% advance due on booking',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistBudgetItem(fixedItem, draft);

      // 2. Add per-guest item
      const perGuestCost = calculateProjectedCost('per_guest', 0, 1200, 200);
      expect(perGuestCost).toBe(240000);

      const perGuestItem: BudgetItem = {
        id: 'item_banquet_dinner',
        categoryId: 'cat_food',
        categoryName: 'Food & Catering',
        itemName: 'Royal Rajasthani Thali Buffet',
        calculationModel: 'per_guest',
        fixedAmount: 0,
        ratePerGuest: 1200,
        guestCount: 200,
        allocatedAmount: 250000,
        projectedCost: perGuestCost,
        paidAmount: 0,
        costSource: 'ai_estimate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistBudgetItem(perGuestItem, draft);

      // 3. Edit item without creating duplicates
      const updatedFixedItem: BudgetItem = {
        ...fixedItem,
        allocatedAmount: 320000,
        paidAmount: 100000
      };
      const planAfterEdit = persistBudgetItem(updatedFixedItem, draft);

      // Verify no duplicate IDs
      const venueItems = planAfterEdit.budgetItems.filter(i => i.id === 'item_venue_rental');
      expect(venueItems.length).toBe(1);
      expect(venueItems[0].allocatedAmount).toBe(320000);
      expect(venueItems[0].paidAmount).toBe(100000);

      // Verify financial metrics
      const totalAllocated = calculateTotalAllocated(planAfterEdit.budgetItems);
      const totalProjected = calculateTotalProjected(planAfterEdit.budgetItems);
      const totalPaid = calculateTotalPaid(planAfterEdit.budgetItems);
      const remaining = calculateForecastRemaining(1000000, totalProjected);

      expect(totalAllocated).toBeGreaterThan(0);
      expect(totalProjected).toBeGreaterThan(0);
      expect(totalPaid).toBeGreaterThanOrEqual(100000);
      expect(remaining).toBe(1000000 - totalProjected);
    });
  });

  // ==========================================
  // WORKFLOW C: MANAGE TIMELINE TASKS
  // ==========================================
  describe('Workflow C: Manage timeline tasks', () => {
    it('manages task states, delays, cascading dependencies, and reopening correctly', () => {
      const task1: TimelineTask = {
        id: 'task_venue',
        title: 'Book Royal Palace Venue',
        description: 'Confirm courtyard contract',
        phase: 'Venue & Vendor Bookings',
        dueDate: '2026-11-15',
        priority: 'high',
        status: 'pending',
        dependencyIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const task2: TimelineTask = {
        id: 'task_catering',
        title: 'Finalize Catering Menu',
        description: 'Select dessert and chaat counters',
        phase: 'Venue & Vendor Bookings',
        dueDate: '2026-11-25',
        priority: 'high',
        status: 'pending',
        dependencyIds: ['task_venue'], // Depends on Venue
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const tasks = [task1, task2];

      // Initial state: task2 is blocked because task1 is pending
      const eval1 = evaluateTaskDependency(task2, tasks);
      expect(eval1.isBlocked).toBe(true);

      // Mark task1 completed
      task1.status = 'completed';
      const eval2 = evaluateTaskDependency(task2, tasks);
      expect(eval2.isBlocked).toBe(false);

      // Mark task1 delayed
      task1.status = 'delayed';
      const eval3 = evaluateTaskDependency(task2, tasks);
      expect(eval3.isBlocked).toBe(true);
      expect(eval3.isPrerequisiteDelayed).toBe(true);
      expect(eval3.delayedPrerequisites.length).toBeGreaterThan(0);

      // Reopening task1
      task1.status = 'pending';
      const eval4 = evaluateTaskDependency(task2, tasks);
      expect(eval4.isBlocked).toBe(true);

      // Summary metrics
      const summary = calculateTimelineSummary(tasks);
      expect(summary.totalTasks).toBe(2);
      expect(summary.atRiskTasks).toBe(1);
    });
  });

  // ==========================================
  // WORKFLOW D: MANAGE VENDORS & QUOTATIONS
  // ==========================================
  describe('Workflow D: Manage vendors and quotations', () => {
    it('creates vendor, parses quotations, evaluates forensic taxes, and links to budget without mutating envelope', () => {
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        maxBudget: 1200000,
        totalGuests: 200
      };
      const plan = generateFallbackPlan(draft);
      savePlan(plan);

      // 1. Create vendor
      const vendor: Vendor = {
        id: 'vendor_royal_catering',
        name: 'Royal Mewar Hospitality',
        category: 'Food & Catering',
        contactPerson: 'Harsh Vardhan',
        phone: '+91 9876543210',
        email: 'info@royalmewar.in',
        status: 'contacted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistVendor(vendor, draft);

      // 2. Add two test quotations
      const quote1: VendorQuote = {
        id: 'quote_1',
        vendorId: 'vendor_royal_catering',
        vendorName: 'Royal Mewar Hospitality',
        category: 'Food & Catering',
        title: 'Grand Heritage Feast Package',
        rawQuoteText: 'Base cost: ₹2,00,000 for 200 guests. 18% GST extra. Excludes transport.',
        quotedTotal: 200000,
        pricingModel: 'lump_sum',
        reviewStatus: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const quote2: VendorQuote = {
        id: 'quote_2',
        vendorId: 'vendor_royal_catering',
        vendorName: 'Royal Mewar Hospitality',
        category: 'Food & Catering',
        title: 'All-Inclusive Palace Banquet',
        rawQuoteText: 'All inclusive: ₹2,50,000. Taxes included. Transport and service staff included.',
        quotedTotal: 250000,
        pricingModel: 'lump_sum',
        reviewStatus: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      persistQuote(quote1, draft);
      persistQuote(quote2, draft);

      // 3. Analyze quotes deterministically
      const analysis1 = analyzeQuoteDeterministically(quote1, 200);
      expect(analysis1.pricingBreakdown.totalCalculated).toBe(236000);
      expect(analysis1.exclusions.some(e => e.toLowerCase().includes('transport'))).toBe(true);

      const analysis2 = analyzeQuoteDeterministically(quote2, 200);
      expect(analysis2.taxAndTerms.taxesIncluded).toBe(true);

      // 4. Quotation comparison matrix
      const comparison = compareQuotesFallback([quote1, quote2], 200, ['Food Quality']);
      expect(comparison.quotesAnalyzed.length).toBe(2);
      expect(comparison.recommendation?.recommendedQuoteId).toBeDefined();

      // 5. Apply quote to budget
      const targetBudgetItemId = plan.budgetItems[0]?.id;
      expect(targetBudgetItemId).toBeDefined();

      const allocatedBefore = plan.budgetItems[0].allocatedAmount;
      const updatedPlan = applyQuoteToBudget('quote_2', targetBudgetItemId, draft);

      const targetItemAfter = updatedPlan.budgetItems.find(i => i.id === targetBudgetItemId);
      expect(targetItemAfter).toBeDefined();
      expect(targetItemAfter?.allocatedAmount).toBe(allocatedBefore); // Envelop preserved!
      expect(targetItemAfter?.projectedCost).toBe(250000); // Updated to quote total
      expect(targetItemAfter?.costSource).toBe('vendor_quote');

      // Vendor marked booked
      const bookedVendor = updatedPlan.vendors?.find(v => v.id === 'vendor_royal_catering');
      expect(bookedVendor?.status).toBe('booked');
    });
  });

  // ==========================================
  // WORKFLOW E: REPLAN THE EVENT
  // ==========================================
  describe('Workflow E: Replan the event', () => {
    it('executes controlled replan scenario, validates impact math, applies strategy, and rolls back cleanly', () => {
      // Scenario constraints:
      // Original: Budget ₹8,00,000, Guests: 200, Date: 2026-12-15
      // Revised: Budget ₹7,50,000, Guests: 250, Date: 2026-12-01 (14 days earlier)
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        maxBudget: 800000,
        totalGuests: 200,
        eventDate: '2026-12-15',
        priorities: ['Catering & Food Quality', 'Guest Experience', 'Decor']
      };
      saveDraft(draft);

      const plan = generateFallbackPlan(draft);
      savePlan(plan);

      const request: ConstraintChangeRequest = {
        changeId: 'replan_e2e_1',
        basePlanVersion: 'v1.0',
        currentConstraints: {
          maxBudget: 800000,
          totalGuests: 200,
          eventDate: '2026-12-15',
          priorities: draft.priorities
        },
        proposedConstraints: {
          maxBudget: 750000,
          totalGuests: 250,
          eventDate: '2026-12-01'
        },
        userInstructions: 'Protect catering quality while accommodating more guests under lower budget',
        triggerSource: 'budget_cut',
        createdAt: new Date().toISOString()
      };

      // 1. Calculate deterministic impact
      const impact = calculateDeterministicImpact(plan, request);
      expect(impact.budgetDelta).toBe(-50000);
      expect(impact.guestDelta).toBe(50);
      expect(impact.daysShift).toBe(-14);

      // 2. Generate 3 distinct strategies
      const strategies = generateDeterministicAlternatives(plan, request, impact);
      expect(strategies.length).toBe(3);
      expect(strategies.map(s => s.strategyType)).toEqual([
        'protect_priorities',
        'optimize_services',
        'adjust_format'
      ]);

      // Strategy A protects priority 1
      const strategyA = strategies[0];
      expect(strategyA.protectedPriorities).toContain(draft.priorities[0]);

      // 3. Apply selected strategy
      const updatedPlan = applyReplanToPlan(strategyA, request, draft);
      expect(updatedPlan.budgetSummary.totalBudget).toBe(750000);
      expect(updatedPlan.guestSummary.totalGuests).toBe(250);
      expect(updatedPlan.replanHistory?.length).toBe(1);

      // 4. Undo replanning and verify restoration
      const undoResult = undoLastReplanInPlan(draft);
      expect(undoResult.success).toBe(true);
      expect(undoResult.plan.budgetSummary.totalBudget).toBe(800000);
      expect(undoResult.plan.guestSummary.totalGuests).toBe(200);
    });
  });

  // ==========================================
  // WORKFLOW F: IDEAS & GUEST EXPERIENCE
  // ==========================================
  describe('Workflow F: Ideas & Guest Experience', () => {
    it('generates, filters, refines, and bookmarks ideas without altering budget or timeline', () => {
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        maxBudget: 1000000,
        totalGuests: 150,
        priorities: ['Catering & Food Quality', 'Guest Experience'],
        accessibilityRequirements: 'Wheelchair access for elders',
        thingsToAvoid: 'Plastic cutlery and foam decor'
      };
      saveDraft(draft);
      const plan = generateFallbackPlan(draft);
      savePlan(plan);

      // Budget and timeline snapshot before ideas exploration
      const budgetItemsBefore = JSON.stringify(plan.budgetItems);
      const timelineBefore = JSON.stringify(plan.timelineTasks);
      const vendorsBefore = JSON.stringify(plan.vendors);

      // 1. Generate ideas
      const ideas = generateDeterministicIdeas(draft);
      expect(ideas.length).toBeGreaterThanOrEqual(4);

      // Verify category filtering
      const decorIdeas = ideas.filter(i => i.category === 'Decor');
      const foodIdeas = ideas.filter(i => i.category === 'Food');
      expect(decorIdeas.length).toBeGreaterThan(0);
      expect(foodIdeas.length).toBeGreaterThan(0);

      // 2. Refine idea
      const refined = refineIdeaDeterministically('Make it simpler and cheaper', draft, decorIdeas[0]);
      expect(refined.length).toBeGreaterThanOrEqual(2);
      expect(refined[0].isRefined).toBe(true);

      // 3. Save / Bookmark idea
      const targetIdea = ideas[0];
      const planAfterSave = saveIdeaToPlan(targetIdea, draft);
      expect(planAfterSave.savedIdeaIds).toContain(targetIdea.id);

      // Verify zero mutation on budget, timeline, vendors
      expect(JSON.stringify(planAfterSave.budgetItems)).toBe(budgetItemsBefore);
      expect(JSON.stringify(planAfterSave.timelineTasks)).toBe(timelineBefore);
      expect(JSON.stringify(planAfterSave.vendors)).toBe(vendorsBefore);

      // 4. Remove from saved
      const planAfterRemove = removeIdeaFromPlan(targetIdea.id, draft);
      expect(planAfterRemove.savedIdeaIds).not.toContain(targetIdea.id);
    });
  });

  // ==========================================
  // WORKFLOW G: EXPORT AND PRINT
  // ==========================================
  describe('Workflow G: Export and print', () => {
    it('generates standard RFC 5545 iCalendar data and preserves plan integrity', () => {
      const draft: EventDraft = {
        ...DEFAULT_DRAFT,
        eventName: 'Kavita & Aman Sangeet & Wedding',
        eventDate: '2026-11-25',
        eventLocation: 'Jai Mahal Palace, Jaipur'
      };
      const plan = generateFallbackPlan(draft);

      // 1. Generate ICS with Event and Tasks
      const result = generateICSContent(plan, draft, {
        scope: 'all',
        includeCompletedTasks: false
      });
      const icsData = result.content;

      expect(icsData).toContain('BEGIN:VCALENDAR');
      expect(icsData).toContain('PRODID:-//UtsavFlow//Celebration Planner//EN');
      expect(icsData).toContain('VERSION:2.0');
      expect(icsData).toContain('BEGIN:VEVENT');
      expect(icsData).toContain('SUMMARY:Kavita & Aman Sangeet & Wedding');
      expect(icsData).toContain('DTSTART;VALUE=DATE:20261125');
      expect(icsData).toContain('DTEND;VALUE=DATE:20261126'); // RFC 5545 exclusive end date
      expect(icsData).toContain('END:VCALENDAR');

      // 2. Text escaping check
      const escaped = escapeICSText('Dinner, Drinks & Dancing; 100% fun\\joy\nNext Day');
      expect(escaped).toContain('\\,');
      expect(escaped).toContain('\\;');
      expect(escaped).toContain('\\\\');
      expect(escaped).toContain('\\n');

      // 3. Verify non-mutation of plan
      expect(plan.budgetItems.length).toBeGreaterThan(0);
      expect(plan.timelineTasks.length).toBeGreaterThan(0);
    });
  });
});
