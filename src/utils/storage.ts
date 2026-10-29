/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventDraft } from '../types';
import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  TaskStatus,
  Vendor,
  VendorQuote,
  QuoteReviewStatus,
  TradeOffStrategy,
  ConstraintChangeRequest,
  PersonalizedIdea
} from '../types/plan';
import { DEFAULT_DRAFT } from '../data/presets';
import {
  generateFallbackPlan,
  generateDefaultBudgetItems,
  generateDefaultTimelineTasks,
  generateDefaultVendors,
  generateDefaultQuotes
} from './fallbackPlan';
import { calculateTotalProjected } from './calculations';
import { applyReplanningStrategy, undoLastReplan } from './replanningEngine';

const STORAGE_KEY = 'utsavflow_event_draft';
const PLAN_STORAGE_KEY = 'utsavflow_event_plan';

export function getSavedDraft(): EventDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_DRAFT, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load draft from localStorage:', e);
  }
  return DEFAULT_DRAFT;
}

export function hasSavedPlan(): boolean {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && (parsed.id || parsed.eventName));
  } catch {
    return false;
  }
}

export function hasSavedDraft(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.eventName);
  } catch {
    return false;
  }
}

export function saveDraft(draft: EventDraft): boolean {
  try {
    const updated = {
      ...draft,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('utsavflow_draft_updated', { detail: updated }));
    }
    return true;
  } catch (e) {
    console.warn('Failed to save draft to localStorage:', e);
    return false;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PLAN_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('utsavflow_data_cleared'));
    }
  } catch (e) {
    console.warn('Failed to clear draft:', e);
  }
}

export function clearAllData(): void {
  clearDraft();
}

export function getSavedPlan(draft?: EventDraft): EventPlan {
  const currentDraft = draft || getSavedDraft();
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw) {
      const parsed: EventPlan = JSON.parse(raw);
      let needsSave = false;

      // Only seed collections if they are missing or if the plan was never initialized
      const isInitial = !parsed.isInitialized;

      // Migrate or seed budgetItems if missing or never initialized
      if (!Array.isArray(parsed.budgetItems) || (isInitial && parsed.budgetItems.length === 0)) {
        parsed.budgetItems = generateDefaultBudgetItems(
          parsed.budgetSummary?.totalBudget || currentDraft.maxBudget || 1000000,
          currentDraft.totalGuests || 150
        );
        needsSave = true;
      }

      // Migrate or seed timelineTasks if missing or never initialized
      if (!Array.isArray(parsed.timelineTasks) || (isInitial && parsed.timelineTasks.length === 0)) {
        parsed.timelineTasks = generateDefaultTimelineTasks(currentDraft.eventDate || '2026-11-20');
        needsSave = true;
      }

      // Migrate or seed vendors if missing or never initialized
      if (!Array.isArray(parsed.vendors) || (isInitial && parsed.vendors.length === 0)) {
        parsed.vendors = generateDefaultVendors();
        needsSave = true;
      }

      // Migrate or seed quotes if missing or never initialized
      if (!Array.isArray(parsed.quotes) || (isInitial && parsed.quotes.length === 0)) {
        parsed.quotes = generateDefaultQuotes(parsed.vendors, currentDraft.totalGuests || 150);
        needsSave = true;
      }

      if (isInitial) {
        parsed.isInitialized = true;
        needsSave = true;
      }

      if (needsSave) {
        savePlan(parsed);
      }

      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load plan from localStorage:', e);
  }

  // Fallback to generating plan from draft if not stored yet
  const fallback = generateFallbackPlan(currentDraft);
  fallback.isInitialized = true;
  savePlan(fallback);
  return fallback;
}

export function savePlan(plan: EventPlan): boolean {
  try {
    // Recalculate summary projected spend from actual budget items if available
    if (Array.isArray(plan.budgetItems)) {
      const totalProjected = calculateTotalProjected(plan.budgetItems);
      plan.budgetSummary = {
        ...plan.budgetSummary,
        projectedSpend: totalProjected
      };
    }
    plan.isInitialized = true;
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('utsavflow_plan_updated', { detail: plan }));
    }
    return true;
  } catch (e) {
    console.warn('Failed to save plan to localStorage:', e);
    return false;
  }
}

/**
 * Adds or updates a budget item in the saved plan, recalculating totals.
 */
export function persistBudgetItem(item: BudgetItem, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const items = Array.isArray(plan.budgetItems) ? [...plan.budgetItems] : [];
  
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    items.push({ ...item, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  plan.budgetItems = items;
  savePlan(plan);
  return plan;
}

/**
 * Deletes a budget item by ID and recalculates totals.
 */
export function removeBudgetItem(itemId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.budgetItems = (plan.budgetItems || []).filter(i => i.id !== itemId);
  savePlan(plan);
  return plan;
}

/**
 * Adds or updates a timeline task in the saved plan.
 */
export function persistTimelineTask(task: TimelineTask, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const tasks = Array.isArray(plan.timelineTasks) ? [...plan.timelineTasks] : [];

  const existingIndex = tasks.findIndex(t => t.id === task.id);
  if (existingIndex >= 0) {
    tasks[existingIndex] = { ...task, updatedAt: new Date().toISOString() };
  } else {
    tasks.push({ ...task, createdAt: task.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  plan.timelineTasks = tasks;
  savePlan(plan);
  return plan;
}

/**
 * Deletes a timeline task by ID and removes it from other tasks' dependencyIds.
 */
export function removeTimelineTask(taskId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  // Remove task and clean up references to it
  plan.timelineTasks = (plan.timelineTasks || [])
    .filter(t => t.id !== taskId)
    .map(t => ({
      ...t,
      dependencyIds: (t.dependencyIds || []).filter(id => id !== taskId)
    }));
  savePlan(plan);
  return plan;
}

/**
 * Updates a task's status directly and persists the plan.
 */
export function updateTaskStatus(taskId: string, status: TaskStatus, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.timelineTasks = (plan.timelineTasks || []).map(t => {
    if (t.id === taskId) {
      return { ...t, status, updatedAt: new Date().toISOString() };
    }
    return t;
  });
  savePlan(plan);
  return plan;
}

/**
 * Adds or updates a vendor in the saved plan.
 */
export function persistVendor(vendor: Vendor, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const vendors = Array.isArray(plan.vendors) ? [...plan.vendors] : [];

  const existingIndex = vendors.findIndex(v => v.id === vendor.id);
  if (existingIndex >= 0) {
    vendors[existingIndex] = { ...vendor, updatedAt: new Date().toISOString() };
  } else {
    vendors.push({ ...vendor, createdAt: vendor.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  plan.vendors = vendors;
  savePlan(plan);
  return plan;
}

/**
 * Deletes a vendor and cascades deletion to that vendor's quotes.
 */
export function removeVendor(vendorId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.vendors = (plan.vendors || []).filter(v => v.id !== vendorId);
  plan.quotes = (plan.quotes || []).filter(q => q.vendorId !== vendorId);
  savePlan(plan);
  return plan;
}

/**
 * Adds or updates a quotation in the saved plan.
 */
export function persistQuote(quote: VendorQuote, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const quotes = Array.isArray(plan.quotes) ? [...plan.quotes] : [];

  const existingIndex = quotes.findIndex(q => q.id === quote.id);
  if (existingIndex >= 0) {
    quotes[existingIndex] = { ...quote, updatedAt: new Date().toISOString() };
  } else {
    quotes.push({ ...quote, createdAt: quote.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  plan.quotes = quotes;
  savePlan(plan);
  return plan;
}

/**
 * Deletes a quote by ID.
 */
export function removeQuote(quoteId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.quotes = (plan.quotes || []).filter(q => q.id !== quoteId);
  savePlan(plan);
  return plan;
}

/**
 * Updates review status of a quote.
 */
export function updateQuoteStatus(quoteId: string, status: QuoteReviewStatus, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.quotes = (plan.quotes || []).map(q => {
    if (q.id === quoteId) {
      return { ...q, reviewStatus: status, updatedAt: new Date().toISOString() };
    }
    return q;
  });
  savePlan(plan);
  return plan;
}

/**
 * Explicitly applies an accepted quotation to a linked budget item.
 * Strictly preserves the allocatedAmount (budget envelope) while updating projectedCost,
 * marking costSource as 'vendor_quote', and noting the quotation reference.
 * Also marks the accepted quote as 'accepted' and updates vendor status to 'booked'.
 */
export function applyQuoteToBudget(quoteId: string, budgetItemId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const quote = (plan.quotes || []).find(q => q.id === quoteId);
  if (!quote) return plan;

  // 1. Update budget item
  plan.budgetItems = (plan.budgetItems || []).map(item => {
    if (item.id === budgetItemId) {
      const isPerGuest = item.calculationModel === 'per_guest';
      const effectiveRate = quote.ratePerGuest || (item.guestCount > 0 ? Math.round(quote.quotedTotal / item.guestCount) : 0);

      return {
        ...item,
        fixedAmount: isPerGuest ? 0 : quote.quotedTotal,
        ratePerGuest: isPerGuest ? effectiveRate : 0,
        projectedCost: quote.quotedTotal,
        costSource: 'vendor_quote',
        quotationReference: `${quote.vendorName} - ${quote.title}`,
        sourceNotes: `Confirmed from vendor quotation #${quote.id.slice(-4)}. Quoted: ₹${quote.quotedTotal.toLocaleString('en-IN')}`,
        updatedAt: new Date().toISOString()
      };
    }
    return item;
  });

  // 2. Mark this quote as accepted
  plan.quotes = (plan.quotes || []).map(q => {
    if (q.id === quoteId) {
      return { ...q, reviewStatus: 'accepted' as QuoteReviewStatus, linkedBudgetItemId: budgetItemId, updatedAt: new Date().toISOString() };
    }
    if (q.linkedBudgetItemId === budgetItemId && q.reviewStatus === 'accepted') {
      return { ...q, reviewStatus: 'analyzed' as QuoteReviewStatus, updatedAt: new Date().toISOString() };
    }
    return q;
  });

  // 3. Mark the vendor as booked
  if (quote.vendorId) {
    plan.vendors = (plan.vendors || []).map(v => {
      if (v.id === quote.vendorId) {
        return { ...v, status: 'booked', linkedBudgetItemId: budgetItemId, updatedAt: new Date().toISOString() };
      }
      return v;
    });
  }

  // 4. Save and return updated plan with recomputed projected spend
  savePlan(plan);
  return plan;
}

/**
 * Applies a verified replanning strategy to the saved plan and synchronizes the draft constraints.
 */
export function applyReplanToPlan(
  strategy: TradeOffStrategy,
  request: ConstraintChangeRequest,
  draft?: EventDraft
): EventPlan {
  const currentDraft = draft || getSavedDraft();
  const plan = getSavedPlan(currentDraft);

  const updatedPlan = applyReplanningStrategy(plan, strategy, request);
  savePlan(updatedPlan);

  // Synchronize draft constraints so wizard and dashboard stay aligned
  const updatedDraft: EventDraft = {
    ...currentDraft,
    maxBudget: request.proposedConstraints.maxBudget,
    totalGuests: request.proposedConstraints.totalGuests,
    eventDate: request.proposedConstraints.eventDate,
    updatedAt: new Date().toISOString()
  };
  saveDraft(updatedDraft);

  return updatedPlan;
}

/**
 * Rolls back the latest replan in the saved plan, restoring prior state.
 */
export function undoLastReplanInPlan(draft?: EventDraft): { success: boolean; plan: EventPlan; message: string } {
  const currentDraft = draft || getSavedDraft();
  const plan = getSavedPlan(currentDraft);

  const result = undoLastReplan(plan);
  if (result.success) {
    savePlan(result.plan);
    const updatedDraft: EventDraft = {
      ...currentDraft,
      maxBudget: result.plan.budgetSummary?.totalBudget || currentDraft.maxBudget,
      totalGuests: result.plan.guestSummary?.totalGuests || currentDraft.totalGuests,
      updatedAt: new Date().toISOString()
    };
    saveDraft(updatedDraft);
  }
  return result;
}

/**
 * Saves a personalized idea to the event plan.
 * Pure update: does NOT mutate budget, timeline, or vendors.
 */
export function saveIdeaToPlan(idea: PersonalizedIdea, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const savedIds = new Set<string>(plan.savedIdeaIds || []);
  savedIds.add(idea.id);
  plan.savedIdeaIds = Array.from(savedIds);

  const existingIdeas = plan.personalizedIdeas || [];
  const idx = existingIdeas.findIndex(i => i.id === idea.id);

  if (idx >= 0) {
    existingIdeas[idx] = { ...existingIdeas[idx], ...idea, isSaved: true, updatedAt: new Date().toISOString() };
  } else {
    existingIdeas.unshift({ ...idea, isSaved: true, createdAt: idea.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }

  plan.personalizedIdeas = existingIdeas;
  savePlan(plan);
  return plan;
}

/**
 * Removes an idea from the saved shortlist in the event plan.
 */
export function removeIdeaFromPlan(ideaId: string, draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  plan.savedIdeaIds = (plan.savedIdeaIds || []).filter(id => id !== ideaId);

  plan.personalizedIdeas = (plan.personalizedIdeas || []).map(i => {
    if (i.id === ideaId) {
      return { ...i, isSaved: false, updatedAt: new Date().toISOString() };
    }
    return i;
  });

  savePlan(plan);
  return plan;
}

/**
 * Toggles the saved state of an idea in the event plan.
 */
export function toggleSaveIdea(idea: PersonalizedIdea, draft?: EventDraft): { plan: EventPlan; isSaved: boolean } {
  const plan = getSavedPlan(draft);
  const isCurrentlySaved = (plan.savedIdeaIds || []).includes(idea.id);

  if (isCurrentlySaved) {
    const updatedPlan = removeIdeaFromPlan(idea.id, draft);
    return { plan: updatedPlan, isSaved: false };
  } else {
    const updatedPlan = saveIdeaToPlan(idea, draft);
    return { plan: updatedPlan, isSaved: true };
  }
}

/**
 * Updates the active personalized ideas list in the plan while preserving saved flags.
 */
export function updatePlanIdeas(ideas: PersonalizedIdea[], draft?: EventDraft): EventPlan {
  const plan = getSavedPlan(draft);
  const savedIds = new Set<string>(plan.savedIdeaIds || []);

  // Preserve saved status from savedIds
  const mergedIdeas = ideas.map(idea => ({
    ...idea,
    isSaved: savedIds.has(idea.id)
  }));

  // Ensure any saved ideas not in the new list are still retained
  const existingSaved = (plan.personalizedIdeas || []).filter(i => savedIds.has(i.id) && !mergedIdeas.some(m => m.id === i.id));
  plan.personalizedIdeas = [...mergedIdeas, ...existingSaved];

  savePlan(plan);
  return plan;
}

