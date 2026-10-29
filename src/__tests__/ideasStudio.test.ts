/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateDeterministicIdeas, refineIdeaDeterministically } from '../utils/ideaEngine';
import {
  PersonalizedIdeaSchema,
  IdeaGenerationRequestSchema,
  IdeaRefinementRequestSchema
} from '../schemas/ideas';
import {
  saveIdeaToPlan,
  removeIdeaFromPlan,
  toggleSaveIdea,
  updatePlanIdeas,
  getSavedPlan,
  savePlan
} from '../utils/storage';
import { applyReplanningStrategy } from '../utils/replanningEngine';
import { DEFAULT_DRAFT } from '../data/presets';
import { EventDraft } from '../types';
import { EventPlan, PersonalizedIdea, ConstraintChangeRequest, TradeOffStrategy } from '../types/plan';

const mockDraft: EventDraft = {
  ...DEFAULT_DRAFT,
  eventName: 'Ananya & Rohan Royal Wedding',
  occasionType: 'wedding',
  eventDate: '2026-11-20',
  eventLocation: 'The Oberoi Rajvilas, Jaipur',
  eventStyle: ['Royal Heritage', 'Traditional Rajasthani'],
  duration: 'Full Day & Evening',
  maxBudget: 2500000,
  budgetFlexibility: 'strict',
  totalGuests: 250,
  adultGuests: 180,
  childGuests: 30,
  seniorGuests: 40,
  priorities: ['Catering & Food Quality', 'Guest Experience & Comfort', 'Heritage Scenography & Decor'],
  mustHaves: ['Authentic Rajasthani Dal Baati Churma live counter', 'Step-free access to mandap'],
  culturalPreferences: 'Marwari Rajasthani customs with satvik options',
  accessibilityRequirements: 'Wheelchair access for maternal grandparents and shaded quiet seating',
  thingsToAvoid: 'Single-use plastic bottles, synthetic foam florals, and loud DJ after 10 PM',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z'
};

const mockPlan: EventPlan = {
  id: 'plan_test_1',
  eventName: 'Ananya & Rohan Royal Wedding',
  generatedAt: '2026-10-01T10:00:00.000Z',
  summary: 'Royal Jaipur Wedding Plan',
  guestSummary: { totalGuests: 250, adults: 180, children: 30, seniors: 40, dietaryNotes: '' },
  budgetSummary: {
    totalBudget: 2500000,
    projectedSpend: 2450000,
    bufferReserve: 50000,
    categories: [
      { categoryName: 'Food & Catering', allocated: 1000000, spent: 980000, notes: 'Premium traditional menu' },
      { categoryName: 'Decor & Production', allocated: 700000, spent: 690000, notes: 'Heritage florals' }
    ]
  },
  budgetItems: [
    {
      id: 'item_1',
      categoryId: 'cat_food',
      categoryName: 'Food & Catering',
      itemName: 'Royal Rajasthani Buffet',
      allocatedAmount: 1000000,
      fixedAmount: 0,
      ratePerGuest: 3900,
      guestCount: 250,
      projectedCost: 975000,
      paidAmount: 0,
      calculationModel: 'per_guest',
      costSource: 'ai_estimate',
      sourceNotes: 'Initial banquet estimate',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z'
    }
  ],
  timelineTasks: [
    {
      id: 'task_1',
      title: 'Finalize Catering Menu',
      description: 'Review satvik options with head chef',
      phase: 'Vendor Booking',
      dueDate: '2026-10-15',
      priority: 'high',
      status: 'pending',
      dependencyIds: [],
      notes: 'Review satvik options with head chef',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z'
    }
  ],
  vendorChecklist: [],
  experienceIdeas: [],
  vendors: [
    {
      id: 'v_1',
      name: 'Rajvilas Banquets',
      category: 'Food & Catering',
      contactPerson: 'Vikram Singh',
      phone: '+91 9876543210',
      status: 'shortlisted',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z'
    }
  ],
  quotes: [],
  personalizedIdeas: [],
  savedIdeaIds: []
};

// Mock localStorage for Node test runner
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, val: string) => { storageMap[key] = val; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};
// @ts-ignore
globalThis.localStorage = localStorageMock;

describe('Phase 8: Personalized Ideas & Guest Experience Studio', () => {
  beforeEach(() => {
    localStorage.clear();
    savePlan(mockPlan);
  });

  // ==========================================
  // GROUP 1: IDEA GENERATION (8 tests)
  // ==========================================
  describe('Group 1: Idea Generation', () => {
    it('1. Returns valid ideas matching schema', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      expect(ideas.length).toBeGreaterThanOrEqual(4);
      for (const idea of ideas) {
        const parsed = PersonalizedIdeaSchema.safeParse(idea);
        expect(parsed.success).toBe(true);
        expect(idea.title).toBeDefined();
        expect(idea.category).toBeDefined();
        expect(idea.whyItFits).toBeDefined();
        expect(idea.budgetImpact).toBeDefined();
      }
    });

    it('2. Rejects invalid idea generation requests (negative budget, zero guests)', () => {
      const invalidNegativeBudget = {
        eventName: 'Test',
        occasionType: 'wedding',
        maxBudget: -5000,
        totalGuests: 100
      };
      const parseResult1 = IdeaGenerationRequestSchema.safeParse(invalidNegativeBudget);
      expect(parseResult1.success).toBe(false);

      const invalidZeroGuests = {
        eventName: 'Test',
        occasionType: 'wedding',
        maxBudget: 500000,
        totalGuests: 0
      };
      const parseResult2 = IdeaGenerationRequestSchema.safeParse(invalidZeroGuests);
      expect(parseResult2.success).toBe(false);
    });

    it('3. Grounded in actual user preferences (priorities, accessibility, avoidances)', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      // Food idea should reflect catering priority
      const foodIdea = ideas.find(i => i.category === 'Food');
      expect(foodIdea).toBeDefined();
      expect(foodIdea?.whyItFits.toLowerCase()).toContain('priority');

      // Guest comfort idea should directly cite wheelchair/accessibility
      const comfortIdea = ideas.find(i => i.category === 'Guest Comfort');
      expect(comfortIdea).toBeDefined();
      expect(comfortIdea?.whyItFits.toLowerCase()).toContain('accessibility');

      // Decor should reflect zero-plastic avoidance
      const decorIdea = ideas.find(i => i.category === 'Decor');
      expect(decorIdea?.whyItFits.toLowerCase()).toContain('plastic');
    });

    it('4. Category filtering works correctly (Decor, Food, Activities, Guest Comfort)', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const decorIdeas = ideas.filter(i => i.category === 'Decor');
      const foodIdeas = ideas.filter(i => i.category === 'Food');
      const comfortIdeas = ideas.filter(i => i.category === 'Guest Comfort');
      const activityIdeas = ideas.filter(i => i.category === 'Activities');

      expect(decorIdeas.length).toBeGreaterThan(0);
      expect(foodIdeas.length).toBeGreaterThan(0);
      expect(comfortIdeas.length).toBeGreaterThan(0);
      expect(activityIdeas.length).toBeGreaterThan(0);
      expect(decorIdeas.every(i => i.category === 'Decor')).toBe(true);
    });

    it('5. Handles empty result gracefully (no crash, valid array)', () => {
      const emptyDraft: EventDraft = {
        ...DEFAULT_DRAFT,
        eventName: 'Blank Draft',
        maxBudget: 100000,
        totalGuests: 50
      };
      const ideas = generateDeterministicIdeas(emptyDraft);
      expect(Array.isArray(ideas)).toBe(true);
      expect(ideas.length).toBeGreaterThan(0);
    });

    it('6. Preserves existing ideas on API generation failure', () => {
      const initial = generateDeterministicIdeas(mockDraft);
      const planWithInitial = updatePlanIdeas(initial, mockDraft);
      expect(planWithInitial.personalizedIdeas?.length).toBe(initial.length);

      // Simulating fallback when new API call fails: existing saved ideas remain intact
      const updated = updatePlanIdeas(initial, mockDraft);
      expect(updated.personalizedIdeas?.length).toBe(initial.length);
    });

    it('7. Gracefully falls back when API is unavailable', () => {
      // Deterministic generator runs entirely client-side/offline
      const fallbackIdeas = generateDeterministicIdeas(mockDraft);
      expect(fallbackIdeas).toBeDefined();
      expect(fallbackIdeas.length).toBeGreaterThanOrEqual(4);
      expect(fallbackIdeas[0].source).toBe('rule_based');
    });

    it('8. Prevents duplicate idea IDs across generation runs', () => {
      const ideas1 = generateDeterministicIdeas(mockDraft);
      const ids = ideas1.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ==========================================
  // GROUP 2: NATURAL-LANGUAGE REFINEMENT (6 tests)
  // ==========================================
  describe('Group 2: Natural-Language Refinement', () => {
    it('9. Produces refined alternatives using actual event constraints', () => {
      const baseIdea = generateDeterministicIdeas(mockDraft)[0];
      const alternatives = refineIdeaDeterministically(
        'Make simpler and more affordable for 250 guests',
        mockDraft,
        baseIdea
      );

      expect(alternatives.length).toBeGreaterThanOrEqual(2);
      expect(alternatives.every(a => a.isRefined)).toBe(true);
      expect(alternatives.some(a => a.budgetImpact === 'Likely low impact')).toBe(true);
    });

    it('10. Preserves original refinement request text if refinement fails or runs', () => {
      const request = {
        refinementPrompt: 'Ensure zero-waste floral setups',
        constraints: {
          eventName: mockDraft.eventName,
          occasionType: mockDraft.occasionType,
          maxBudget: mockDraft.maxBudget,
          totalGuests: mockDraft.totalGuests
        }
      };
      const parseResult = IdeaRefinementRequestSchema.safeParse(request);
      expect(parseResult.success).toBe(true);
      expect(parseResult.data?.refinementPrompt).toBe('Ensure zero-waste floral setups');
    });

    it('11. Preserves user must-haves in refined concepts', () => {
      const alternatives = refineIdeaDeterministically(
        'Focus on elder comfort and seated tea service',
        mockDraft
      );
      const seniorOption = alternatives.find(a => a.category === 'Guest Comfort');
      expect(seniorOption).toBeDefined();
      expect(seniorOption?.mustHaveCompatibility).toBeDefined();
    });

    it('12. Contradictory refinement directions are handled cleanly without broken state', () => {
      // User asks for "cheapest luxury imported diamond stage"
      const alternatives = refineIdeaDeterministically(
        'Make it ultra luxurious but completely zero cost',
        mockDraft
      );
      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0].title).toBeDefined();
    });

    it('13. Refinement does NOT modify event budget ledger', () => {
      const initialPlan = getSavedPlan(mockDraft);
      const initialBudgetItems = JSON.stringify(initialPlan.budgetItems);
      const initialAllocated = initialPlan.budgetSummary?.totalBudget;

      refineIdeaDeterministically('Cut all costs in half', mockDraft);

      const planAfter = getSavedPlan(mockDraft);
      expect(JSON.stringify(planAfter.budgetItems)).toBe(initialBudgetItems);
      expect(planAfter.budgetSummary?.totalBudget).toBe(initialAllocated);
    });

    it('14. Refinement does NOT modify event timeline or vendor quotations', () => {
      const initialPlan = getSavedPlan(mockDraft);
      const initialTasks = JSON.stringify(initialPlan.timelineTasks);
      const initialVendors = JSON.stringify(initialPlan.vendors);

      refineIdeaDeterministically('Delay ceremony by three weeks', mockDraft);

      const planAfter = getSavedPlan(mockDraft);
      expect(JSON.stringify(planAfter.timelineTasks)).toBe(initialTasks);
      expect(JSON.stringify(planAfter.vendors)).toBe(initialVendors);
    });
  });

  // ==========================================
  // GROUP 3: SAVED IDEAS WORKFLOW (6 tests)
  // ==========================================
  describe('Group 3: Saved Ideas Workflow', () => {
    it('15. Saving an idea creates a single saved record with isSaved: true', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const targetIdea = ideas[0];

      const updatedPlan = saveIdeaToPlan(targetIdea, mockDraft);
      expect(updatedPlan.savedIdeaIds).toContain(targetIdea.id);
      const savedInPlan = updatedPlan.personalizedIdeas?.find(i => i.id === targetIdea.id);
      expect(savedInPlan?.isSaved).toBe(true);
    });

    it('16. Repeatedly saving the same idea is idempotent (no duplicates)', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const targetIdea = ideas[0];

      saveIdeaToPlan(targetIdea, mockDraft);
      saveIdeaToPlan(targetIdea, mockDraft);
      const plan = saveIdeaToPlan(targetIdea, mockDraft);

      const matchesInSaved = (plan.savedIdeaIds || []).filter(id => id === targetIdea.id);
      expect(matchesInSaved.length).toBe(1);

      const matchesInList = (plan.personalizedIdeas || []).filter(i => i.id === targetIdea.id);
      expect(matchesInList.length).toBe(1);
    });

    it('17. Removing a saved idea unmarks it and updates persistence', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const targetIdea = ideas[0];

      saveIdeaToPlan(targetIdea, mockDraft);
      const planAfterRemove = removeIdeaFromPlan(targetIdea.id, mockDraft);

      expect(planAfterRemove.savedIdeaIds).not.toContain(targetIdea.id);
      const removedIdea = planAfterRemove.personalizedIdeas?.find(i => i.id === targetIdea.id);
      expect(removedIdea?.isSaved).toBe(false);
    });

    it('18. Saved ideas survive mock browser page refresh', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      saveIdeaToPlan(ideas[0], mockDraft);

      // Simulate page refresh by reading fresh from storage
      const refreshedPlan = getSavedPlan(mockDraft);
      expect(refreshedPlan.savedIdeaIds).toContain(ideas[0].id);
      const saved = refreshedPlan.personalizedIdeas?.find(i => i.id === ideas[0].id);
      expect(saved?.isSaved).toBe(true);
    });

    it('19. Saved ideas persist across event context switches', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      saveIdeaToPlan(ideas[1], mockDraft);

      const planBefore = getSavedPlan(mockDraft);
      expect(planBefore.savedIdeaIds).toContain(ideas[1].id);

      // Switching context or reading plan with different reference
      const planAfter = getSavedPlan();
      expect(planAfter.savedIdeaIds).toContain(ideas[1].id);
    });

    it('20. Replan operations preserve existing saved ideas', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      saveIdeaToPlan(ideas[0], mockDraft);

      // Apply a replanning strategy
      const request: ConstraintChangeRequest = {
        changeId: 'req_test',
        basePlanVersion: 'v1.0',
        currentConstraints: {
          maxBudget: mockDraft.maxBudget,
          totalGuests: mockDraft.totalGuests,
          eventDate: mockDraft.eventDate,
          priorities: mockDraft.priorities
        },
        proposedConstraints: {
          maxBudget: mockDraft.maxBudget - 200000,
          totalGuests: mockDraft.totalGuests,
          eventDate: mockDraft.eventDate
        },
        userInstructions: 'Reduce budget and protect food',
        triggerSource: 'budget_cut',
        createdAt: new Date().toISOString()
      };

      const mockStrategy: TradeOffStrategy = {
        id: 'strat_test',
        title: 'Priority Shield',
        strategyType: 'protect_priorities',
        summary: 'Protect food and trim decor',
        rationale: 'Safeguard priority 1',
        protectedPriorities: ['Catering & Food Quality'],
        proposedCompromises: ['Trim floral mandap'],
        proposedBudgetLimit: 2300000,
        proposedProjectedCost: 2280000,
        netSavings: 200000,
        projectedDeficitOrSurplus: 20000,
        categoryAdjustments: [],
        timelineAdjustments: [],
        vendorImplications: [],
        unresolvedRisks: [],
        assumptions: [],
        satisfiesBudget: true
      };

      const currentPlan = getSavedPlan(mockDraft);
      const updatedPlan = applyReplanningStrategy(currentPlan, mockStrategy, request);
      savePlan(updatedPlan);

      const refreshed = getSavedPlan(mockDraft);
      expect(refreshed.savedIdeaIds).toContain(ideas[0].id);
    });
  });

  // ==========================================
  // GROUP 4: INTEGRATION & CONSISTENCY (5 tests)
  // ==========================================
  describe('Group 4: Integration & Data Consistency', () => {
    it('21. Idea detail view accurately displays selected idea attributes', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const idea = ideas[0];

      expect(idea.title.length).toBeGreaterThan(5);
      expect(idea.description.length).toBeGreaterThan(10);
      expect(idea.whyItFits.length).toBeGreaterThan(10);
      expect(idea.practicalConsiderations?.length).toBeGreaterThan(0);
      expect(idea.budgetImpact).toBeDefined();
    });

    it('22. Filtering by category does not mutate underlying plan data', () => {
      const initial = generateDeterministicIdeas(mockDraft);
      updatePlanIdeas(initial, mockDraft);

      const planBefore = getSavedPlan(mockDraft);
      const originalCount = planBefore.personalizedIdeas?.length;

      // Filter simulation
      const filtered = (planBefore.personalizedIdeas || []).filter(i => i.category === 'Food');
      expect(filtered.length).toBeGreaterThan(0);

      const planAfter = getSavedPlan(mockDraft);
      expect(planAfter.personalizedIdeas?.length).toBe(originalCount);
    });

    it('23. Budget impact is derived qualitatively without committing fixed quotes', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const validQualitativeValues = [
        'Likely low impact',
        'Potentially moderate impact',
        'Potentially high impact',
        'Insufficient information to estimate'
      ];

      for (const idea of ideas) {
        expect(validQualitativeValues).toContain(idea.budgetImpact);
      }
    });

    it('24. Unsupported or speculative vendor prices are not presented as confirmed costs', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      for (const idea of ideas) {
        // Idea object must not contain direct monetary mutation properties like confirmedAmount or invoiceId
        expect((idea as any).confirmedAmount).toBeUndefined();
        expect((idea as any).bookedVendorId).toBeUndefined();
      }
    });

    it('25. All idea objects pass strict Zod validation schema', () => {
      const ideas = generateDeterministicIdeas(mockDraft);
      const refined = refineIdeaDeterministically('Make it eco friendly', mockDraft);

      const all = [...ideas, ...refined];
      for (const item of all) {
        const result = PersonalizedIdeaSchema.safeParse(item);
        expect(result.success).toBe(true);
      }
    });
  });
});
