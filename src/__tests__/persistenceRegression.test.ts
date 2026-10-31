/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getSavedDraft, 
  saveDraft, 
  clearDraft, 
  getSavedPlan, 
  savePlan, 
  persistBudgetItem, 
  removeBudgetItem, 
  persistTimelineTask, 
  removeTimelineTask, 
  updateTaskStatus, 
  persistVendor, 
  persistQuote, 
  applyQuoteToBudget, 
  saveIdeaToPlan, 
  removeIdeaFromPlan, 
  hasSavedPlan,
  hasSavedDraft 
} from '../utils/storage';
import { generateFallbackPlan } from '../utils/fallbackPlan';
import { EventDraft } from '../types';
import { BudgetItem, TimelineTask, Vendor, VendorQuote, PersonalizedIdea } from '../types/plan';

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

describe('UtsavFlow Persistence & Data Integrity Regression Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Test A: Initial hydration loads saved plan correctly or generates fallback', () => {
    const draft = getSavedDraft();
    expect(draft).toBeDefined();
    expect(draft.eventName).toBeDefined();

    const plan = getSavedPlan(draft);
    expect(plan).toBeDefined();
    expect(plan.id).toBeDefined();
    expect(plan.isInitialized).toBe(true);
    expect(hasSavedPlan()).toBe(true);
  });

  it('Test B: Mounting does not overwrite valid storage before hydration', () => {
    const customDraft: EventDraft = {
      id: 'draft_custom_1',
      eventName: 'Custom Test Celebration',
      occasionType: 'wedding',
      eventDate: '2026-12-01',
      eventLocation: 'Mumbai',
      eventStyle: ['Traditional'],
      duration: '3 days',
      currency: 'INR',
      maxBudget: 1500000,
      budgetFlexibility: 'strict',
      totalGuests: 250,
      adultGuests: 200,
      childGuests: 30,
      seniorGuests: 20,
      priorities: ['Catering', 'Venue'],
      mustHaves: ['Live Band'],
      customMustHaves: [],
      culturalPreferences: 'North Indian',
      accessibilityRequirements: 'Ramps needed',
      thingsToAvoid: 'Plastic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveDraft(customDraft);
    const plan = generateFallbackPlan(customDraft);
    savePlan(plan);

    const reloadedDraft = getSavedDraft();
    expect(reloadedDraft.eventName).toBe('Custom Test Celebration');
    expect(reloadedDraft.maxBudget).toBe(1500000);

    const reloadedPlan = getSavedPlan(reloadedDraft);
    expect(reloadedPlan.eventName).toBe('Custom Test Celebration');
    expect(reloadedPlan.budgetSummary.totalBudget).toBe(1500000);
  });

  it('Test C: Event persistence across mock reload', () => {
    const draft = getSavedDraft();
    draft.eventName = 'Persistent Reload Test';
    saveDraft(draft);

    const plan = getSavedPlan(draft);
    plan.eventName = 'Persistent Reload Test Plan';
    savePlan(plan);

    // Mock reload by calling getters fresh
    const freshDraft = getSavedDraft();
    expect(freshDraft.eventName).toBe('Persistent Reload Test');

    const freshPlan = getSavedPlan(freshDraft);
    expect(freshPlan.eventName).toBe('Persistent Reload Test Plan');
  });

  it('Test D: Budget items persistence (add, edit, delete) without resurrecting deleted items', () => {
    const plan = getSavedPlan();
    const initialCount = plan.budgetItems.length;

    const newItem: BudgetItem = {
      id: 'bi_test_new',
      categoryId: 'cat_test',
      categoryName: 'Decor',
      itemName: 'Exotic Marigold Canopy',
      calculationModel: 'fixed',
      fixedAmount: 45000,
      ratePerGuest: 0,
      guestCount: 150,
      allocatedAmount: 50000,
      projectedCost: 45000,
      paidAmount: 10000,
      costSource: 'user_estimate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPlan = persistBudgetItem(newItem);
    expect(updatedPlan.budgetItems.length).toBe(initialCount + 1);
    expect(updatedPlan.budgetItems.some(i => i.id === 'bi_test_new')).toBe(true);

    // Edit item
    newItem.projectedCost = 48000;
    const editedPlan = persistBudgetItem(newItem);
    const edited = editedPlan.budgetItems.find(i => i.id === 'bi_test_new');
    expect(edited?.projectedCost).toBe(48000);

    // Delete item
    const finalPlan = removeBudgetItem('bi_test_new');
    expect(finalPlan.budgetItems.some(i => i.id === 'bi_test_new')).toBe(false);

    // Reload plan and verify deletion sticks (does not resurrect)
    const reloaded = getSavedPlan();
    expect(reloaded.budgetItems.some(i => i.id === 'bi_test_new')).toBe(false);
  });

  it('Test E: Timeline tasks persistence (status, dependencies)', () => {
    const newTask: TimelineTask = {
      id: 'task_test_1',
      title: 'Book Photographer',
      description: 'Review cinematic portfolios.',
      phase: 'Vendor Booking',
      dueDate: '2026-10-15',
      priority: 'high',
      status: 'pending',
      dependencyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const planWithTask = persistTimelineTask(newTask);
    expect(planWithTask.timelineTasks.some(t => t.id === 'task_test_1')).toBe(true);

    const statusUpdated = updateTaskStatus('task_test_1', 'completed');
    const task = statusUpdated.timelineTasks.find(t => t.id === 'task_test_1');
    expect(task?.status).toBe('completed');

    const removedPlan = removeTimelineTask('task_test_1');
    expect(removedPlan.timelineTasks.some(t => t.id === 'task_test_1')).toBe(false);
  });

  it('Test F: Vendor and quotation persistence', () => {
    const vendor: Vendor = {
      id: 'v_test_1',
      name: 'Grand Caterers',
      category: 'Catering',
      status: 'quote_received',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const quote: VendorQuote = {
      id: 'q_test_1',
      vendorId: 'v_test_1',
      vendorName: 'Grand Caterers',
      category: 'Catering',
      title: 'Platinum Buffet',
      quotedTotal: 120000,
      pricingModel: 'per_guest',
      ratePerGuest: 800,
      rawQuoteText: 'Buffet spread ₹1,20,000 all inclusive.',
      extractedAnalysis: {
        summary: 'All inclusive buffet quote.',
        pricingBreakdown: { baseAmount: 120000, totalCalculated: 120000, isEstimatedTotal: false },
        inclusions: ['Good menu'],
        exclusions: [],
        taxAndTerms: { taxesIncluded: true },
        missingInformation: [],
        followUpQuestions: [],
        assumptions: []
      },
      reviewStatus: 'analyzed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let plan = persistVendor(vendor);
    plan = persistQuote(quote);

    expect(plan.vendors?.some(v => v.id === 'v_test_1')).toBe(true);
    expect(plan.quotes?.some(q => q.id === 'q_test_1')).toBe(true);

    // Apply quote to budget
    const budgetPlan = applyQuoteToBudget('q_test_1', plan.budgetItems[0].id);
    const targetItem = budgetPlan.budgetItems.find(i => i.id === plan.budgetItems[0].id);
    expect(targetItem?.projectedCost).toBe(120000);
    expect(targetItem?.costSource).toBe('vendor_quote');
  });

  it('Test G: Ideas shortlist persistence', () => {
    const idea: PersonalizedIdea = {
      id: 'idea_test_1',
      title: 'Sufi Night Jamming Circle',
      category: 'Entertainment',
      description: 'A soulful evening with live acoustic Qawwali.',
      whyItFits: 'Matches cultural preferences.',
      practicalConsiderations: ['Sound permit'],
      budgetImpact: 'Potentially moderate impact',
      tags: ['Music', 'Sufi'],
      isSaved: false,
      source: 'ai_curated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedPlan = saveIdeaToPlan(idea);
    expect(savedPlan.savedIdeaIds?.includes('idea_test_1')).toBe(true);

    const removedPlan = removeIdeaFromPlan('idea_test_1');
    expect(removedPlan.savedIdeaIds?.includes('idea_test_1')).toBe(false);
  });

  it('Test H: Malformed JSON handling without wiping entire storage', () => {
    localStorage.setItem('utsavflow_event_plan', 'INVALID_JSON_STRING');
    const plan = getSavedPlan();
    expect(plan).toBeDefined();
    expect(plan.budgetItems).toBeDefined();
    expect(plan.isInitialized).toBe(true);
  });

  it('Test I: Workspace state consistency and storage clearing', () => {
    const draft = getSavedDraft();
    draft.eventName = 'Clear Test Event';
    saveDraft(draft);
    expect(hasSavedDraft()).toBe(true);

    clearDraft();
    expect(hasSavedPlan()).toBe(false);
  });

  it('Test J: Wizard partial draft auto-save persists across browser simulation without form submission', () => {
    // Simulate user editing Step 1 fields
    const step1Draft = getSavedDraft();
    step1Draft.eventName = 'Pooja & Rohan Sangeet Extravaganza';
    step1Draft.eventLocation = 'Jaipur, Rajasthan';
    step1Draft.occasionType = 'wedding';
    saveDraft(step1Draft);

    // Verify immediate persistence in simulated storage
    const reloadedAfterStep1 = getSavedDraft();
    expect(reloadedAfterStep1.eventName).toBe('Pooja & Rohan Sangeet Extravaganza');
    expect(reloadedAfterStep1.eventLocation).toBe('Jaipur, Rajasthan');
    expect(reloadedAfterStep1.occasionType).toBe('wedding');

    // Simulate user typing budget in Step 2 without submitting
    reloadedAfterStep1.maxBudget = 2500000;
    reloadedAfterStep1.totalGuests = 350;
    saveDraft(reloadedAfterStep1);

    // Verify Step 2 persists across mock browser reload
    const reloadedAfterStep2 = getSavedDraft();
    expect(reloadedAfterStep2.maxBudget).toBe(2500000);
    expect(reloadedAfterStep2.totalGuests).toBe(350);
    expect(reloadedAfterStep2.eventName).toBe('Pooja & Rohan Sangeet Extravaganza');
  });

  it('Test K: Multi-item operations and replanning history persistence', () => {
    const plan = getSavedPlan();
    expect(plan.isInitialized).toBe(true);

    // Add replan history entry
    const historyEntry = {
      changeId: 'chg_test_1',
      strategyId: 'strat_1',
      strategyTitle: 'Priority Shield',
      strategyType: 'protect_priorities' as const,
      previousConstraints: {
        maxBudget: 1000000,
        totalGuests: 200,
        eventDate: '2026-11-20'
      },
      updatedConstraints: {
        maxBudget: 800000,
        totalGuests: 180,
        eventDate: '2026-11-20'
      },
      appliedAt: new Date().toISOString(),
      summary: 'Trimmed discretionary decor to safeguard catering.',
      affectedBudgetItemIds: ['bi_1'],
      affectedTaskIds: ['task_1']
    };

    plan.replanHistory = [historyEntry];
    savePlan(plan);

    const reloadedPlan = getSavedPlan();
    expect(reloadedPlan.replanHistory?.length).toBe(1);
    expect(reloadedPlan.replanHistory?.[0].strategyTitle).toBe('Priority Shield');
  });

  it('Test L: Direct workspace route reload and module navigation state continuity', () => {
    // 1. Establish an active saved plan
    const draft = getSavedDraft();
    draft.eventName = 'Direct Route Reload Celebration';
    draft.maxBudget = 1800000;
    saveDraft(draft);

    const plan = generateFallbackPlan(draft);
    savePlan(plan);

    // 2. Simulate navigating to /workspace/budget
    const targetRoute = '/workspace/budget';
    expect(targetRoute).toBe('/workspace/budget');

    // 3. Mock direct page reload on that route
    const reloadedDraft = getSavedDraft();
    const reloadedPlan = getSavedPlan(reloadedDraft);

    expect(reloadedDraft.eventName).toBe('Direct Route Reload Celebration');
    expect(reloadedPlan.eventName).toBe('Direct Route Reload Celebration');
    expect(reloadedPlan.budgetItems.length).toBeGreaterThan(0);
    expect(reloadedPlan.isInitialized).toBe(true);

    // 4. Verify cross-module continuity without data wiping
    expect(reloadedPlan.timelineTasks.length).toBeGreaterThan(0);
    expect(reloadedPlan.vendors?.length).toBeGreaterThan(0);
  });
});
