/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EventPlan,
  BudgetItem,
  TimelineTask,
  ConstraintChangeRequest,
  DeterministicImpact,
  TradeOffStrategy,
  AffectedTaskPreview,
  AffectedVendorPreview,
  CategoryAdjustment,
  TimelineAdjustment,
  ReplanHistoryEntry
} from '../types/plan';
import {
  calculateDueDateFromOffset,
  calculateDaysRemaining,
  isDateOverdue
} from './dateCalculations';
import { calculateTotalProjected } from './calculations';

/**
 * Calculates deterministic impact of proposed constraint changes.
 * Pure function: Does NOT mutate the input plan or saved state.
 */
export function calculateDeterministicImpact(
  plan: EventPlan,
  request: ConstraintChangeRequest
): DeterministicImpact {
  const originalBudgetLimit = request.currentConstraints.maxBudget;
  const proposedBudgetLimit = request.proposedConstraints.maxBudget;
  const budgetDelta = proposedBudgetLimit - originalBudgetLimit;

  const originalGuests = Math.max(1, request.currentConstraints.totalGuests || 150);
  const proposedGuests = Math.max(1, request.proposedConstraints.totalGuests || 150);
  const guestDelta = proposedGuests - originalGuests;

  const originalDate = request.currentConstraints.eventDate;
  const proposedDate = request.proposedConstraints.eventDate;

  const originalDaysRemaining = calculateDaysRemaining(originalDate);
  const proposedDaysRemaining = calculateDaysRemaining(proposedDate);
  const daysShift = proposedDaysRemaining - originalDaysRemaining;

  // 1. Recalculate guest-dependent budget items
  const originalBudgetItems = plan.budgetItems || [];
  const recalculatedBudgetItems: BudgetItem[] = originalBudgetItems.map(item => {
    let newProjected = item.projectedCost;

    if (item.calculationModel === 'per_guest') {
      const rate = item.ratePerGuest || (item.guestCount > 0 ? Math.round(item.projectedCost / item.guestCount) : 0);
      newProjected = Math.round(rate * proposedGuests);
      return {
        ...item,
        guestCount: proposedGuests,
        projectedCost: newProjected
      };
    } else if (item.calculationModel === 'fixed_plus_per_guest') {
      const rate = item.ratePerGuest || 0;
      newProjected = Math.round(item.fixedAmount + (rate * proposedGuests));
      return {
        ...item,
        guestCount: proposedGuests,
        projectedCost: newProjected
      };
    } else {
      // Fixed items preserve their fixed cost strictly
      return {
        ...item,
        projectedCost: item.fixedAmount || item.projectedCost
      };
    }
  });

  const originalProjectedCost = calculateTotalProjected(originalBudgetItems);
  const proposedProjectedCost = calculateTotalProjected(recalculatedBudgetItems);
  const projectedCostDelta = proposedProjectedCost - originalProjectedCost;

  const originalDeficitOrSurplus = originalBudgetLimit - originalProjectedCost;
  const proposedDeficitOrSurplus = proposedBudgetLimit - proposedProjectedCost;

  // 2. Timeline Impact
  const tasks = plan.timelineTasks || [];
  const affectedTasks: AffectedTaskPreview[] = [];

  tasks.forEach(task => {
    // Completed tasks remain strictly completed
    if (task.status === 'completed') return;

    if (task.daysBeforeEvent !== undefined) {
      // Event-relative deadline
      const proposedDueDate = calculateDueDateFromOffset(proposedDate, task.daysBeforeEvent);
      if (proposedDueDate !== task.dueDate) {
        affectedTasks.push({
          taskId: task.id,
          title: task.title,
          originalDueDate: task.dueDate,
          proposedDueDate,
          isManual: false,
          isOverdue: isDateOverdue(proposedDueDate)
        });
      }
    } else if (daysShift !== 0) {
      // Manual task with fixed date
      const isOverdueNow = isDateOverdue(task.dueDate);
      if (daysShift < 0 && isDateOverdue(task.dueDate)) {
        affectedTasks.push({
          taskId: task.id,
          title: task.title,
          originalDueDate: task.dueDate,
          proposedDueDate: task.dueDate,
          isManual: true,
          isOverdue: isOverdueNow
        });
      }
    }
  });

  // 3. Vendor Impact
  const vendors = plan.vendors || [];
  const quotes = plan.quotes || [];
  const affectedVendors: AffectedVendorPreview[] = [];

  if (guestDelta !== 0) {
    quotes.forEach(quote => {
      if (quote.category.toLowerCase().includes('catering') || quote.pricingModel === 'per_guest') {
        const v = vendors.find(x => x.id === quote.vendorId);
        affectedVendors.push({
          vendorId: quote.vendorId,
          vendorName: quote.vendorName,
          category: quote.category,
          reason: `Quotation based on initial capacity (${originalGuests} guests). Surge to ${proposedGuests} guests requires headcount addendum.`,
          currentQuotedTotal: quote.quotedTotal
        });
      }
    });
  }

  if (daysShift !== 0) {
    vendors.filter(v => v.status === 'booked' || v.status === 'quote_received').forEach(v => {
      if (!affectedVendors.some(av => av.vendorId === v.id)) {
        affectedVendors.push({
          vendorId: v.id,
          vendorName: v.name,
          category: v.category,
          reason: `Date shift of ${Math.abs(daysShift)} days requires confirming availability for new event date (${proposedDate}).`
        });
      }
    });
  }

  return {
    originalBudgetLimit,
    proposedBudgetLimit,
    budgetDelta,
    originalProjectedCost,
    proposedProjectedCost,
    projectedCostDelta,
    originalDeficitOrSurplus,
    proposedDeficitOrSurplus,
    originalDaysRemaining,
    proposedDaysRemaining,
    daysShift,
    originalGuests,
    proposedGuests,
    guestDelta,
    recalculatedBudgetItems,
    affectedTaskCount: affectedTasks.length,
    affectedTasks,
    affectedVendorCount: affectedVendors.length,
    affectedVendors
  };
}

/**
 * Generates three realistic, distinct, priority-aware trade-off strategies deterministically.
 * Serves as guaranteed fallback and reference logic when offline or if model output requires synthesis.
 */
export function generateDeterministicAlternatives(
  plan: EventPlan,
  request: ConstraintChangeRequest,
  impact: DeterministicImpact
): TradeOffStrategy[] {
  const topPriorities = request.currentConstraints.priorities || ['Food & Catering', 'Venue', 'Guest Comfort'];
  const topPriority = topPriorities[0] || 'Catering';
  const deficit = Math.max(0, -impact.proposedDeficitOrSurplus);
  const affectedTasks = impact.affectedTasks || [];
  const proposedBudgetLimit = impact.proposedBudgetLimit ?? request.proposedConstraints.maxBudget ?? 1000000;
  const proposedProjectedCost = impact.proposedProjectedCost ?? proposedBudgetLimit;

  // Helper to find category allocation and projected
  const categories = plan.budgetSummary?.categories || [];

  // ==========================================
  // STRATEGY A: Protect Top Priorities
  // ==========================================
  const stratACatAdjustments: CategoryAdjustment[] = [];
  let remainingSavingsToFindA = deficit;

  categories.forEach(cat => {
    const isProtected = topPriorities.some(p => cat.categoryName.toLowerCase().includes(p.toLowerCase()));
    if (!isProtected && remainingSavingsToFindA > 0) {
      // Absorb up to 30% from flexible category
      const trimAmount = Math.min(remainingSavingsToFindA, Math.round(cat.allocated * 0.30));
      remainingSavingsToFindA -= trimAmount;
      stratACatAdjustments.push({
        categoryId: cat.categoryName.toLowerCase().replace(/\s+/g, '_'),
        categoryName: cat.categoryName,
        originalAllocated: cat.allocated,
        proposedAllocated: Math.max(0, cat.allocated - trimAmount),
        originalProjected: cat.allocated,
        proposedProjected: Math.max(0, cat.allocated - trimAmount),
        actionNotes: `Streamline optional ${cat.categoryName.toLowerCase()} elements to protect ${topPriority}.`
      });
    }
  });

  const costA = proposedProjectedCost - (deficit - remainingSavingsToFindA);
  const strategyA: TradeOffStrategy = {
    id: `strategy_protect_${Date.now()}_1`,
    title: 'Option A: Priority Shield',
    strategyType: 'protect_priorities',
    summary: `Safeguards your highest priority (${topPriority}) and guest experience while trimming secondary decorative and discretionary lines.`,
    rationale: `Directs resources to core celebration moments that guests remember most, absorbing budget variance in auxiliary design.`,
    protectedPriorities: [topPriority, 'Accessibility & Senior Seating', 'Core Food Quality'],
    proposedCompromises: ['Reduced bespoke decor installations', 'Digital-first wedding stationery', 'Standard audio console setup'],
    proposedBudgetLimit,
    proposedProjectedCost: costA,
    netSavings: proposedProjectedCost - costA,
    projectedDeficitOrSurplus: proposedBudgetLimit - costA,
    categoryAdjustments: stratACatAdjustments,
    timelineAdjustments: affectedTasks.slice(0, 3).map(t => ({
      taskId: t.taskId,
      title: t.title,
      originalDueDate: t.originalDueDate,
      proposedDueDate: t.proposedDueDate,
      reason: 'Recalibrated deadline to match revised planning window.'
    })),
    vendorImplications: [
      'Catering and primary venue contracts remain fully intact.',
      'Request revised minimalist floral quotation from decor studio.'
    ],
    unresolvedRisks: remainingSavingsToFindA > 0
      ? [`Leaves residual deficit of ₹${remainingSavingsToFindA.toLocaleString('en-IN')} if secondary categories cannot be further compressed.`]
      : ['Confirm that non-primary vendors agree to streamlined scopes.'],
    assumptions: ['Core guest count can be accommodated without altering venue deposit.'],
    satisfiesBudget: costA <= impact.proposedBudgetLimit,
    isFallback: true
  };

  // ==========================================
  // STRATEGY B: Optimize Service Configurations
  // ==========================================
  const stratBCatAdjustments: CategoryAdjustment[] = [];
  let remainingSavingsToFindB = deficit;

  categories.forEach(cat => {
    // Spread 12% across almost all categories evenly
    const trimAmount = Math.min(remainingSavingsToFindB, Math.round(cat.allocated * 0.15));
    remainingSavingsToFindB -= trimAmount;
    stratBCatAdjustments.push({
      categoryId: cat.categoryName.toLowerCase().replace(/\s+/g, '_'),
      categoryName: cat.categoryName,
      originalAllocated: cat.allocated,
      proposedAllocated: Math.max(0, cat.allocated - trimAmount),
      originalProjected: cat.allocated,
      proposedProjected: Math.max(0, cat.allocated - trimAmount),
      actionNotes: `Optimize package configurations (e.g. curated fixed course buffet vs redundant counters).`
    });
  });

  const costB = proposedProjectedCost - (deficit - remainingSavingsToFindB);
  const strategyB: TradeOffStrategy = {
    id: `strategy_optimize_${Date.now()}_2`,
    title: 'Option B: Balanced Optimization',
    strategyType: 'optimize_services',
    summary: 'Spreads a modest 10-15% scope refinement across catering packages, media coverage, and setup hours without removing any program item.',
    rationale: 'Avoids deep cuts to any single vendor by choosing smart, high-value tier alternatives across all departments.',
    protectedPriorities: ['Full Program Scope', 'Guest Comfort', 'All Scheduled Rituals'],
    proposedCompromises: ['Consolidate live counters into curated signature dishes', 'Replace 3-person photo crew with 2-lead candid team', '5-hour DJ set instead of 7-hour extended package'],
    proposedBudgetLimit,
    proposedProjectedCost: costB,
    netSavings: proposedProjectedCost - costB,
    projectedDeficitOrSurplus: proposedBudgetLimit - costB,
    categoryAdjustments: stratBCatAdjustments,
    timelineAdjustments: affectedTasks.slice(0, 4).map(t => ({
      taskId: t.taskId,
      title: t.title,
      originalDueDate: t.originalDueDate,
      proposedDueDate: t.proposedDueDate,
      reason: 'Synchronized with balanced vendor negotiation milestones.'
    })),
    vendorImplications: [
      'Request quote addenda for 2-camera photography package.',
      'Refine catering menu from 6 mains to 4 premium signature curries.'
    ],
    unresolvedRisks: [
      'Requires confirming package downgrades with vendors before signing formal contracts.'
    ],
    assumptions: ['Vendors allow tier adjustments prior to final advance disbursement.'],
    satisfiesBudget: costB <= proposedBudgetLimit,
    isFallback: true
  };

  // ==========================================
  // STRATEGY C: Format & Schedule Restructuring
  // ==========================================
  const stratCCatAdjustments: CategoryAdjustment[] = [];
  // Restructuring can tap buffer reserve and venue hours
  const originalBudgetLimit = impact.originalBudgetLimit ?? request.currentConstraints.maxBudget ?? 1000000;
  const totalTrimTarget = Math.max(deficit, Math.round(originalBudgetLimit * 0.08));
  let remainingSavingsToFindC = totalTrimTarget;

  categories.forEach(cat => {
    const isLogistics = cat.categoryName.toLowerCase().includes('venue') || cat.categoryName.toLowerCase().includes('attire');
    const trimPercent = isLogistics ? 0.20 : 0.12;
    const trimAmount = Math.min(remainingSavingsToFindC, Math.round(cat.allocated * trimPercent));
    remainingSavingsToFindC -= trimAmount;
    stratCCatAdjustments.push({
      categoryId: cat.categoryName.toLowerCase().replace(/\s+/g, '_'),
      categoryName: cat.categoryName,
      originalAllocated: cat.allocated,
      proposedAllocated: Math.max(0, cat.allocated - trimAmount),
      originalProjected: cat.allocated,
      proposedProjected: Math.max(0, cat.allocated - trimAmount),
      actionNotes: `Consolidate scheduling to reduce overtime surcharges and dual-venue transportation.`
    });
  });

  const costC = Math.max(50000, proposedProjectedCost - (totalTrimTarget - remainingSavingsToFindC));
  const strategyC: TradeOffStrategy = {
    id: `strategy_format_${Date.now()}_3`,
    title: 'Option C: Consolidated Format',
    strategyType: 'adjust_format',
    summary: 'Restructures event timetable to eliminate venue overtime penalties, combine ceremony stages, and optimize logistics.',
    rationale: 'Generates structural savings by shortening rental windows and eliminating multi-location transport logistics.',
    protectedPriorities: ['Core Ceremony Authenticity', 'Peak Evening Ambiance'],
    proposedCompromises: ['Unified venue ballroom rather than split indoor/outdoor lawns', 'Daytime ceremony immediately flowing into evening reception', 'Pre-mixed cocktail hour with acoustic playlist'],
    proposedBudgetLimit,
    proposedProjectedCost: costC,
    netSavings: proposedProjectedCost - costC,
    projectedDeficitOrSurplus: proposedBudgetLimit - costC,
    categoryAdjustments: stratCCatAdjustments,
    timelineAdjustments: affectedTasks.map(t => ({
      taskId: t.taskId,
      title: t.title,
      originalDueDate: t.originalDueDate,
      proposedDueDate: t.proposedDueDate,
      reason: 'Compressed setup timeline into single consolidated event day block.'
    })),
    vendorImplications: [
      'Eliminates vendor overtime fees by wrapping sound curfew by 11:00 PM.',
      'Single venue delivery window lowers delivery transport costs.'
    ],
    unresolvedRisks: [
      'Tighter turnaround schedule for decorator between ceremony and dinner.'
    ],
    assumptions: ['Venue allows flexible staging transitions within main hall.'],
    satisfiesBudget: costC <= proposedBudgetLimit,
    isFallback: true
  };

  return [strategyA, strategyB, strategyC];
}

/**
 * Reconciles trade-off strategy figures with exact deterministic arithmetic.
 * Ensures model never introduces hallucinated totals or impossible math.
 */
export function reconcileStrategyArithmetic(
  strategy: TradeOffStrategy,
  impact: DeterministicImpact
): TradeOffStrategy {
  const proposedBudgetLimit = impact.proposedBudgetLimit;
  
  // Calculate projected from adjustments if provided
  let calculatedProjected = impact.proposedProjectedCost;
  if (Array.isArray(strategy.categoryAdjustments) && strategy.categoryAdjustments.length > 0) {
    const totalDeltas = strategy.categoryAdjustments.reduce((sum, adj) => {
      return sum + (adj.proposedProjected - adj.originalProjected);
    }, 0);
    calculatedProjected = Math.max(0, impact.proposedProjectedCost + totalDeltas);
  } else if (strategy.proposedProjectedCost > 0) {
    calculatedProjected = strategy.proposedProjectedCost;
  }

  const netSavings = Math.max(0, impact.proposedProjectedCost - calculatedProjected);
  const projectedDeficitOrSurplus = proposedBudgetLimit - calculatedProjected;
  const satisfiesBudget = calculatedProjected <= proposedBudgetLimit;

  return {
    ...strategy,
    proposedBudgetLimit,
    proposedProjectedCost: calculatedProjected,
    netSavings,
    projectedDeficitOrSurplus,
    satisfiesBudget
  };
}

/**
 * Atomically applies an approved replanning strategy to the current event plan.
 * Preserves completed tasks, quotation records, and vendor profiles.
 */
export function applyReplanningStrategy(
  plan: EventPlan,
  strategy: TradeOffStrategy,
  request: ConstraintChangeRequest
): EventPlan {
  // 1. Create previous plan snapshot for safe undo recovery
  const snapshotJson = JSON.stringify(plan);

  // 2. Update constraints in draft & plan
  const updatedPlan: EventPlan = {
    ...plan,
    version: (plan.version || 1) + 1,
    budgetSummary: {
      ...plan.budgetSummary,
      totalBudget: request.proposedConstraints.maxBudget,
      projectedSpend: strategy.proposedProjectedCost
    },
    guestSummary: {
      ...plan.guestSummary,
      totalGuests: request.proposedConstraints.totalGuests
    }
  };

  // 3. Update budget categories if strategy adjusted them
  if (strategy.categoryAdjustments && strategy.categoryAdjustments.length > 0) {
    const adjMap = new Map(strategy.categoryAdjustments.map(a => [a.categoryName.toLowerCase(), a]));
    updatedPlan.budgetSummary.categories = (plan.budgetSummary.categories || []).map(cat => {
      const match = adjMap.get(cat.categoryName.toLowerCase());
      if (match) {
        return {
          ...cat,
          allocated: match.proposedAllocated,
          notes: `${cat.notes} (Revised: ${match.actionNotes})`
        };
      }
      return cat;
    });

    // Update budget items accordingly
    const newGuestCount = request.proposedConstraints.totalGuests;
    updatedPlan.budgetItems = (plan.budgetItems || []).map(item => {
      const match = adjMap.get(item.categoryName.toLowerCase());
      if (item.calculationModel === 'per_guest') {
        const rate = item.ratePerGuest || (item.guestCount > 0 ? Math.round(item.projectedCost / item.guestCount) : 0);
        const newProj = Math.round(rate * newGuestCount);
        return {
          ...item,
          guestCount: newGuestCount,
          projectedCost: newProj,
          allocatedAmount: match ? Math.round(match.proposedAllocated / 2) : item.allocatedAmount,
          updatedAt: new Date().toISOString()
        };
      } else if (item.calculationModel === 'fixed_plus_per_guest') {
        const newProj = Math.round(item.fixedAmount + (item.ratePerGuest * newGuestCount));
        return {
          ...item,
          guestCount: newGuestCount,
          projectedCost: newProj,
          updatedAt: new Date().toISOString()
        };
      } else if (match && item.costSource !== 'vendor_quote') {
        // Only adjust uncommitted items; preserve locked vendor quotes!
        return {
          ...item,
          allocatedAmount: Math.min(item.allocatedAmount, match.proposedAllocated),
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
  }

  // 4. Update timeline tasks: Shift approved deadlines while keeping completed tasks intact!
  if (strategy.timelineAdjustments && strategy.timelineAdjustments.length > 0) {
    const timeMap = new Map(strategy.timelineAdjustments.map(t => [t.taskId, t]));
    updatedPlan.timelineTasks = (plan.timelineTasks || []).map(task => {
      // Completed tasks remain strictly completed!
      if (task.status === 'completed') return task;

      const shift = timeMap.get(task.id);
      if (shift && shift.proposedDueDate) {
        return {
          ...task,
          dueDate: shift.proposedDueDate,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });
  }

  // 5. Append history record
  const historyEntry: ReplanHistoryEntry = {
    changeId: request.changeId || `change_${Date.now()}`,
    strategyId: strategy.id,
    strategyTitle: strategy.title,
    strategyType: strategy.strategyType,
    previousConstraints: request.currentConstraints,
    updatedConstraints: request.proposedConstraints,
    appliedAt: new Date().toISOString(),
    summary: strategy.summary,
    affectedBudgetItemIds: (strategy.categoryAdjustments || []).map(a => a.categoryId),
    affectedTaskIds: (strategy.timelineAdjustments || []).map(t => t.taskId),
    snapshotPlanJson: snapshotJson
  };

  updatedPlan.replanHistory = [historyEntry, ...(plan.replanHistory || []).slice(0, 9)];

  return updatedPlan;
}

/**
 * Safely undoes the most recent applied replan from history.
 */
export function undoLastReplan(plan: EventPlan): { success: boolean; plan: EventPlan; message: string } {
  if (!plan.replanHistory || plan.replanHistory.length === 0) {
    return { success: false, plan, message: 'No replan history available to undo.' };
  }

  const latestEntry = plan.replanHistory[0];
  if (!latestEntry.snapshotPlanJson) {
    return { success: false, plan, message: 'Snapshot state not available for this history entry.' };
  }

  try {
    const previousPlan: EventPlan = JSON.parse(latestEntry.snapshotPlanJson);
    // Keep remaining history
    previousPlan.replanHistory = (plan.replanHistory || []).slice(1);
    return {
      success: true,
      plan: previousPlan,
      message: `Successfully rolled back "${latestEntry.strategyTitle}". Previous constraints and allocations restored.`
    };
  } catch (err) {
    return { success: false, plan, message: 'Failed to restore previous plan snapshot.' };
  }
}
