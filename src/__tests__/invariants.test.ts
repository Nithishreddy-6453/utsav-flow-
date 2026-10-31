/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateProjectedCost,
  calculateTotalAllocated,
  calculateTotalProjected,
  calculateTotalPaid,
  calculateForecastRemaining,
  calculateUnallocatedBudget,
  calculateDifference,
  isOverAllocation
} from '../utils/calculations';
import {
  validateTaskDependencies,
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
  reconcileStrategyArithmetic,
  applyReplanningStrategy,
  undoLastReplan
} from '../utils/replanningEngine';
import { generateFallbackPlan } from '../utils/fallbackPlan';
import { generateDeterministicIdeas } from '../utils/ideaEngine';
import { DEFAULT_DRAFT } from '../data/presets';
import { EventDraft } from '../types';
import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  VendorQuote,
  ConstraintChangeRequest,
  TradeOffStrategy
} from '../types/plan';

// LocalStorage mock for Node environment
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, val: string) => { storageMap[key] = val; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};
// @ts-ignore
globalThis.localStorage = localStorageMock;

const now = new Date().toISOString();

describe('UtsavFlow Mathematical & Architectural Invariant Verification', () => {
  let sampleDraft: EventDraft;
  let samplePlan: EventPlan;

  beforeEach(() => {
    localStorageMock.clear();
    sampleDraft = {
      ...DEFAULT_DRAFT,
      eventName: 'Meera & Kabir Wedding Celebration',
      occasionType: 'wedding',
      eventDate: '2026-12-25',
      eventLocation: 'Taj Umaid Bhawan Palace, Jodhpur',
      maxBudget: 2000000,
      totalGuests: 250,
      budgetFlexibility: 'strict',
      eventStyle: ['Royal Heritage', 'Traditional Rajasthani'],
      priorities: ['Catering & Royal Banquet', 'Heritage Photography', 'Acoustic Folk Music']
    };
    samplePlan = generateFallbackPlan(sampleDraft);
  });

  // ==========================================
  // INVARIANT 1: FINANCIAL CONSERVATION
  // ==========================================
  describe('Invariant 1: Financial Conservation & Ledger Integrity', () => {
    it('sum of item allocations mathematically matches calculateTotalAllocated', () => {
      const items = samplePlan.budgetItems;
      const totalAllocated = calculateTotalAllocated(items);
      const manualSum = items.reduce((sum, item) => sum + item.allocatedAmount, 0);

      expect(totalAllocated).toBe(manualSum);
      expect(totalAllocated).toBeGreaterThan(0);
    });

    it('sum of item projected costs matches calculateTotalProjected and summary projectedSpend', () => {
      const items = samplePlan.budgetItems;
      const totalProjected = calculateTotalProjected(items);
      const manualSum = items.reduce((sum, item) => sum + item.projectedCost, 0);

      expect(totalProjected).toBe(manualSum);
      expect(totalProjected).toBe(samplePlan.budgetSummary.projectedSpend);
    });

    it('unallocated budget satisfies: TotalBudget === TotalAllocated + UnallocatedBudget', () => {
      const totalBudget = samplePlan.budgetSummary.totalBudget;
      const totalAllocated = calculateTotalAllocated(samplePlan.budgetItems);
      const unallocated = calculateUnallocatedBudget(totalBudget, totalAllocated);

      expect(totalBudget).toBe(totalAllocated + unallocated);
    });

    it('forecast remaining satisfies: ForecastRemaining === TotalBudget - TotalProjected', () => {
      const totalBudget = samplePlan.budgetSummary.totalBudget;
      const totalProjected = calculateTotalProjected(samplePlan.budgetItems);
      const forecastRemaining = calculateForecastRemaining(totalBudget, totalProjected);

      expect(forecastRemaining).toBe(totalBudget - totalProjected);
    });

    it('total paid satisfies non-negative constraint and difference behaves predictably', () => {
      const items: BudgetItem[] = [
        {
          id: 'b1',
          categoryId: 'cat_catering',
          categoryName: 'Catering',
          itemName: 'Royal Buffet',
          allocatedAmount: 500000,
          projectedCost: 480000,
          paidAmount: 200000,
          costSource: 'vendor_quote',
          calculationModel: 'per_guest',
          fixedAmount: 0,
          ratePerGuest: 2400,
          guestCount: 200,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'b2',
          categoryId: 'cat_decor',
          categoryName: 'Decor',
          itemName: 'Floral Mandap',
          allocatedAmount: 300000,
          projectedCost: 320000,
          paidAmount: 150000,
          costSource: 'user_estimate',
          calculationModel: 'fixed',
          fixedAmount: 320000,
          ratePerGuest: 0,
          guestCount: 200,
          createdAt: now,
          updatedAt: now
        }
      ];

      const totalPaid = calculateTotalPaid(items);
      expect(totalPaid).toBe(350000);
      expect(totalPaid).toBeGreaterThanOrEqual(0);
      // calculateDifference(projectedCost, allocatedAmount) -> 480000 - 500000 = -20000
      expect(calculateDifference(items[0].projectedCost, items[0].allocatedAmount)).toBe(-20000);
      // isOverAllocation(projectedCost, allocatedAmount) -> 320000 > 300000 = true
      expect(isOverAllocation(items[1].projectedCost, items[1].allocatedAmount)).toBe(true);
    });

    it('handles negative or invalid number inputs gracefully without NaN or negative allocation drift', () => {
      const corruptedItems: BudgetItem[] = [
        {
          id: 'bad_1',
          categoryId: 'cat_misc',
          categoryName: 'Miscellaneous',
          itemName: 'Bad Item',
          allocatedAmount: -50000,
          projectedCost: -20000,
          paidAmount: -10000,
          costSource: 'user_estimate',
          calculationModel: 'fixed',
          fixedAmount: -20000,
          ratePerGuest: -500,
          guestCount: -10,
          createdAt: now,
          updatedAt: now
        }
      ];

      // Sanitization in calculations forces max(0, value)
      expect(calculateTotalAllocated(corruptedItems)).toBe(0);
      expect(calculateTotalProjected(corruptedItems)).toBe(0);
      expect(calculateTotalPaid(corruptedItems)).toBe(0);
      expect(calculateProjectedCost('per_guest', -100, -50, -10)).toBe(0);
    });
  });

  // ==========================================
  // INVARIANT 2: REPLAN ROLLBACK REVERSIBILITY
  // ==========================================
  describe('Invariant 2: Replanning Rollback Reversibility', () => {
    it('rolling back a replan strategy perfectly restores the previous plan snapshot', () => {
      const originalAllocated = calculateTotalAllocated(samplePlan.budgetItems);
      const originalProjected = calculateTotalProjected(samplePlan.budgetItems);
      const originalGuests = samplePlan.guestSummary.totalGuests;

      const changeRequest: ConstraintChangeRequest = {
        changeId: 'inv_chg_01',
        basePlanVersion: '1',
        currentConstraints: {
          maxBudget: samplePlan.budgetSummary.totalBudget,
          totalGuests: samplePlan.guestSummary.totalGuests,
          eventDate: sampleDraft.eventDate
        },
        proposedConstraints: {
          maxBudget: 1500000, // 25% budget cut
          totalGuests: 250,
          eventDate: sampleDraft.eventDate
        },
        userInstructions: 'Reduce spend while protecting catering',
        triggerSource: 'budget_cut',
        createdAt: now
      };

      const impact = calculateDeterministicImpact(samplePlan, changeRequest);
      const alternatives = generateDeterministicAlternatives(samplePlan, changeRequest, impact);
      expect(alternatives.length).toBeGreaterThan(0);

      const strategyToApply = alternatives[0];
      const replanned = applyReplanningStrategy(samplePlan, strategyToApply, changeRequest);

      // Verify replan altered the budget
      expect(replanned.budgetSummary.totalBudget).toBe(1500000);
      expect(replanned.replanHistory).toBeDefined();
      expect(replanned.replanHistory!.length).toBeGreaterThan(0);

      // Now Roll Back
      const rollbackResult = undoLastReplan(replanned);
      expect(rollbackResult.success).toBe(true);

      const restoredPlan = rollbackResult.plan;
      expect(restoredPlan.budgetSummary.totalBudget).toBe(samplePlan.budgetSummary.totalBudget);
      expect(restoredPlan.guestSummary.totalGuests).toBe(originalGuests);
      expect(calculateTotalAllocated(restoredPlan.budgetItems)).toBe(originalAllocated);
      expect(calculateTotalProjected(restoredPlan.budgetItems)).toBe(originalProjected);
    });

    it('reconcileStrategyArithmetic ensures proposed budget satisfies arithmetic bounds', () => {
      const changeRequest: ConstraintChangeRequest = {
        changeId: 'chg_rec',
        basePlanVersion: '1',
        currentConstraints: {
          maxBudget: 2000000,
          totalGuests: 250,
          eventDate: sampleDraft.eventDate
        },
        proposedConstraints: {
          maxBudget: 1600000,
          totalGuests: 250,
          eventDate: sampleDraft.eventDate
        },
        userInstructions: '',
        triggerSource: 'budget_cut',
        createdAt: now
      };
      const impact = calculateDeterministicImpact(samplePlan, changeRequest);

      const strategy: TradeOffStrategy = {
        id: 'strat_test',
        title: 'Pruning Options',
        strategyType: 'protect_priorities',
        summary: 'Targeted reduction in decor and lighting',
        rationale: 'Protects guest catering',
        protectedPriorities: ['Catering'],
        proposedCompromises: ['Simple decor'],
        proposedBudgetLimit: 1600000,
        proposedProjectedCost: 1550000,
        netSavings: 450000,
        projectedDeficitOrSurplus: 50000,
        categoryAdjustments: [],
        timelineAdjustments: [],
        vendorImplications: [],
        unresolvedRisks: [],
        assumptions: [],
        satisfiesBudget: true
      };

      const reconciled = reconcileStrategyArithmetic(strategy, impact);
      expect(reconciled.satisfiesBudget).toBe(true);
      expect(reconciled.proposedBudgetLimit).toBe(1600000);
    });
  });

  // ==========================================
  // INVARIANT 3: DAG TOPOLOGICAL ORDERING & CYCLES
  // ==========================================
  describe('Invariant 3: DAG Topological Consistency & Cycle Rejection', () => {
    it('detects and rejects direct self-dependencies (Task A depends on Task A)', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'task_self',
          title: 'Book Photographer',
          description: 'Photography contract',
          phase: 'Vendor Booking',
          dueDate: '2026-10-25',
          daysBeforeEvent: 60,
          priority: 'high',
          status: 'pending',
          dependencyIds: ['task_self'],
          createdAt: now,
          updatedAt: now
        }
      ];

      const validation = validateTaskDependencies(tasks);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('cannot depend on itself'))).toBe(true);
    });

    it('detects and rejects direct circular dependency (Task A -> Task B -> Task A)', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'task_a',
          title: 'Finalize Venue Contract',
          description: 'Venue contract',
          phase: 'Venue',
          dueDate: '2026-09-25',
          daysBeforeEvent: 90,
          priority: 'high',
          status: 'pending',
          dependencyIds: ['task_b'],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'task_b',
          title: 'Deposit Advance',
          description: 'Venue advance payment',
          phase: 'Venue',
          dueDate: '2026-09-30',
          daysBeforeEvent: 85,
          priority: 'high',
          status: 'pending',
          dependencyIds: ['task_a'],
          createdAt: now,
          updatedAt: now
        }
      ];

      const validation = validateTaskDependencies(tasks);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Dependency cycle detected'))).toBe(true);
    });

    it('detects and rejects indirect 3-node dependency cycle (A -> B -> C -> A)', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'node_1',
          title: 'Menu Selection',
          description: 'Catering menu selection',
          phase: 'Catering',
          dueDate: '2026-11-15',
          daysBeforeEvent: 40,
          priority: 'medium',
          status: 'pending',
          dependencyIds: ['node_2'],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'node_2',
          title: 'Caterer Tasting Session',
          description: 'Tasting session',
          phase: 'Catering',
          dueDate: '2026-11-10',
          daysBeforeEvent: 45,
          priority: 'medium',
          status: 'pending',
          dependencyIds: ['node_3'],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'node_3',
          title: 'Caterer Shortlist Approval',
          description: 'Shortlist review',
          phase: 'Catering',
          dueDate: '2026-11-05',
          daysBeforeEvent: 50,
          priority: 'medium',
          status: 'pending',
          dependencyIds: ['node_1'],
          createdAt: now,
          updatedAt: now
        }
      ];

      const validation = validateTaskDependencies(tasks);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Dependency cycle detected'))).toBe(true);
    });

    it('accepts valid acyclic dependency chains and correctly marks blocked tasks', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'chain_1',
          title: 'Confirm Guest Count',
          description: 'Master guest list confirmation',
          phase: 'Planning',
          dueDate: '2026-10-25',
          daysBeforeEvent: 60,
          priority: 'high',
          status: 'pending',
          dependencyIds: [],
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'chain_2',
          title: 'Order Invitation Cards',
          description: 'Send invitation design to press',
          phase: 'Stationery',
          dueDate: '2026-11-05',
          daysBeforeEvent: 50,
          priority: 'medium',
          status: 'pending',
          dependencyIds: ['chain_1'],
          createdAt: now,
          updatedAt: now
        }
      ];

      const validation = validateTaskDependencies(tasks);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);

      // chain_2 is blocked because chain_1 is pending
      const depStatus = evaluateTaskDependency(tasks[1], tasks);
      expect(depStatus.isBlocked).toBe(true);
      expect(depStatus.unresolvedPrerequisites.map(p => p.id)).toContain('chain_1');

      // Marking chain_1 as completed unblocks chain_2
      tasks[0].status = 'completed';
      const unblockedStatus = evaluateTaskDependency(tasks[1], tasks);
      expect(unblockedStatus.isBlocked).toBe(false);
    });

    it('calculates timeline summary metrics without division by zero or negative bounds', () => {
      expect(calculateTimelineSummary([]).progressPercent).toBe(0);
      expect(calculateTimelineSummary([]).totalTasks).toBe(0);

      const summary = calculateTimelineSummary(samplePlan.timelineTasks);
      expect(summary.totalTasks).toBe(samplePlan.timelineTasks.length);
      expect(summary.progressPercent).toBeGreaterThanOrEqual(0);
      expect(summary.progressPercent).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================
  // INVARIANT 4: PRICE PROVENANCE & TAX PROVENANCE
  // ==========================================
  describe('Invariant 4: Price Provenance & Tax Distinction', () => {
    it('unmentioned GST in quotation is strictly classified as NOT_STATED, never assumed included', () => {
      const ambiguousQuote: VendorQuote = {
        id: 'q_ambiguous',
        vendorId: 'v_101',
        vendorName: 'Royal Tent House',
        category: 'Decor',
        title: 'Complete Sangeet & Mandap Draping',
        quotedTotal: 300000,
        pricingModel: 'lump_sum',
        rawQuoteText: 'Total package cost ₹3,00,000 for full setup. 50% advance required.',
        reviewStatus: 'pending_review',
        createdAt: now,
        updatedAt: now
      };

      const analysis = analyzeQuoteDeterministically(ambiguousQuote, 200);

      expect(analysis.taxAndTerms.taxesIncluded).toBe('NOT_STATED');
      expect(analysis.missingInformation.some(m => m.toLowerCase().includes('gst'))).toBe(true);
      expect(analysis.pricingBreakdown.totalCalculated).toBe(300000);
    });

    it('explicit inclusive GST is marked as taxesIncluded === true with zero additional liability', () => {
      const inclusiveQuote: VendorQuote = {
        id: 'q_inclusive',
        vendorId: 'v_102',
        vendorName: 'Maharaja Royal Caterers',
        category: 'Catering',
        title: '3-Course Royal Buffet',
        quotedTotal: 500000,
        pricingModel: 'per_guest',
        ratePerGuest: 2000,
        rawQuoteText: 'All rates are inclusive of 18% GST and statutory taxes. No hidden charges.',
        reviewStatus: 'pending_review',
        createdAt: now,
        updatedAt: now
      };

      const analysis = analyzeQuoteDeterministically(inclusiveQuote, 250);

      expect(analysis.taxAndTerms.taxesIncluded).toBe(true);
      expect(analysis.pricingBreakdown.taxAmount).toBe(0);
      expect(analysis.pricingBreakdown.totalCalculated).toBe(500000);
    });

    it('explicit exclusive GST calculates exact 18% tax addition', () => {
      const exclusiveQuote: VendorQuote = {
        id: 'q_exclusive',
        vendorId: 'v_103',
        vendorName: 'Luxe Moments Studio',
        category: 'Photography',
        title: 'Cinematography & Candid Package',
        quotedTotal: 200000,
        pricingModel: 'lump_sum',
        rawQuoteText: 'Base cost ₹2,00,000 plus GST 18% extra as applicable.',
        reviewStatus: 'pending_review',
        createdAt: now,
        updatedAt: now
      };

      const analysis = analyzeQuoteDeterministically(exclusiveQuote, 200);

      expect(analysis.taxAndTerms.taxesIncluded).toBe(false);
      expect(analysis.pricingBreakdown.taxAmount).toBe(36000);
      expect(analysis.pricingBreakdown.totalCalculated).toBe(236000);
    });

    it('multi-quote comparison flags GST risks and highlights verified terms', () => {
      const quotes: VendorQuote[] = [
        {
          id: 'q1',
          vendorId: 'v1',
          vendorName: 'Vendor A',
          category: 'Catering',
          title: 'Package A',
          quotedTotal: 400000,
          pricingModel: 'per_guest',
          ratePerGuest: 1600,
          rawQuoteText: 'Rate ₹1,600 per guest. Taxes not included.',
          reviewStatus: 'pending_review',
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'q2',
          vendorId: 'v2',
          vendorName: 'Vendor B',
          category: 'Catering',
          title: 'Package B',
          quotedTotal: 450000,
          pricingModel: 'per_guest',
          ratePerGuest: 1800,
          rawQuoteText: 'Rate ₹1,800 per plate all-inclusive of all statutory taxes.',
          reviewStatus: 'pending_review',
          createdAt: now,
          updatedAt: now
        }
      ];

      const comparison = compareQuotesFallback(quotes, 250);
      expect(comparison.quotesAnalyzed.length).toBe(2);
      expect(comparison.quotesAnalyzed[0].potentialRisks.some(r => r.includes('GST'))).toBe(true);
      expect(comparison.quotesAnalyzed[1].keyStrengths.some(s => s.toLowerCase().includes('all-inclusive'))).toBe(true);
    });
  });

  // ==========================================
  // INVARIANT 5: PURITY & CONSTRAINTS PRESERVATION
  // ==========================================
  describe('Invariant 5: Pure Functions & Immutability', () => {
    it('generateDeterministicIdeas never mutates input draft', () => {
      const draftSnapshot = JSON.stringify(sampleDraft);
      const ideas = generateDeterministicIdeas(sampleDraft);

      expect(ideas.length).toBeGreaterThan(0);
      expect(JSON.stringify(sampleDraft)).toBe(draftSnapshot);
    });

    it('calculateDeterministicImpact never mutates input plan or change request', () => {
      const planSnapshot = JSON.stringify(samplePlan);
      const request: ConstraintChangeRequest = {
        changeId: 'immut_req',
        basePlanVersion: '1',
        currentConstraints: {
          maxBudget: samplePlan.budgetSummary.totalBudget,
          totalGuests: samplePlan.guestSummary.totalGuests,
          eventDate: sampleDraft.eventDate
        },
        proposedConstraints: { maxBudget: 1800000, totalGuests: 200, eventDate: sampleDraft.eventDate },
        userInstructions: 'Test immutability',
        triggerSource: 'guest_surge',
        createdAt: now
      };
      const reqSnapshot = JSON.stringify(request);

      const impact = calculateDeterministicImpact(samplePlan, request);
      expect(impact.proposedBudgetLimit).toBe(1800000);
      expect(JSON.stringify(samplePlan)).toBe(planSnapshot);
      expect(JSON.stringify(request)).toBe(reqSnapshot);
    });
  });
});
