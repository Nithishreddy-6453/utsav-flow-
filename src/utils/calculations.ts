/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetItem, CostCalculationModel } from '../types/plan';

/**
 * Calculates projected cost based on calculation model and inputs.
 * Ensures whole integer results and avoids negative values or floating-point drift.
 */
export function calculateProjectedCost(
  model: CostCalculationModel,
  fixedAmount: number,
  ratePerGuest: number,
  guestCount: number
): number {
  const safeFixed = Math.max(0, Math.round(Number(fixedAmount) || 0));
  const safeRate = Math.max(0, Math.round(Number(ratePerGuest) || 0));
  const safeGuests = Math.max(0, Math.round(Number(guestCount) || 0));

  switch (model) {
    case 'fixed':
      return safeFixed;
    case 'per_guest':
      return safeRate * safeGuests;
    case 'fixed_plus_per_guest':
      return safeFixed + (safeRate * safeGuests);
    default:
      return safeFixed;
  }
}

/**
 * Sum of all budget item allocations.
 */
export function calculateTotalAllocated(items: BudgetItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + Math.max(0, Math.round(Number(item.allocatedAmount) || 0)), 0);
}

/**
 * Sum of all budget item projected costs.
 */
export function calculateTotalProjected(items: BudgetItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + Math.max(0, Math.round(Number(item.projectedCost) || 0)), 0);
}

/**
 * Sum of actual recorded payments.
 * Never infers payments from allocations or quotes.
 */
export function calculateTotalPaid(items: BudgetItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + Math.max(0, Math.round(Number(item.paidAmount) || 0)), 0);
}

/**
 * Forecast Remaining = Total Budget - Total Projected.
 * Can be negative if projected costs exceed total budget.
 */
export function calculateForecastRemaining(totalBudget: number, totalProjected: number): number {
  const safeBudget = Math.round(Number(totalBudget) || 0);
  const safeProjected = Math.round(Number(totalProjected) || 0);
  return safeBudget - safeProjected;
}

/**
 * Unallocated Budget = Total Budget - Total Allocated.
 * Can be negative if user has allocated more than their budget limit.
 */
export function calculateUnallocatedBudget(totalBudget: number, totalAllocated: number): number {
  const safeBudget = Math.round(Number(totalBudget) || 0);
  const safeAllocated = Math.round(Number(totalAllocated) || 0);
  return safeBudget - safeAllocated;
}

/**
 * Difference = Projected Cost - Allocated Budget.
 * Positive means over allocation, negative means under allocation.
 */
export function calculateDifference(projectedCost: number, allocatedAmount: number): number {
  const safeProjected = Math.round(Number(projectedCost) || 0);
  const safeAllocated = Math.round(Number(allocatedAmount) || 0);
  return safeProjected - safeAllocated;
}

/**
 * True if projected cost exceeds allocated budget.
 */
export function isOverAllocation(projectedCost: number, allocatedAmount: number): boolean {
  return (Number(projectedCost) || 0) > (Number(allocatedAmount) || 0);
}

/**
 * True if projected total exceeds total budget limit.
 */
export function isBudgetDeficit(totalBudget: number, totalProjected: number): boolean {
  return (Number(totalProjected) || 0) > (Number(totalBudget) || 0);
}

/**
 * Format a number into standard Indian Rupee notation (e.g. ₹1,50,000 or -₹25,000).
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(abs);
    return isNegative ? `-₹${formatted}` : `₹${formatted}`;
  } catch {
    return isNegative ? `-₹${abs.toLocaleString()}` : `₹${abs.toLocaleString()}`;
  }
}
