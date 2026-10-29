/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateProjectedCost,
  calculateTotalAllocated,
  calculateTotalProjected,
  calculateTotalPaid,
  calculateForecastRemaining,
  calculateUnallocatedBudget,
  calculateDifference,
  isOverAllocation,
  isBudgetDeficit,
  formatINR
} from '../utils/calculations';
import { BudgetItemFormSchema } from '../schemas/budget';
import { BudgetItem } from '../types/plan';

describe('Financial Calculation Utilities', () => {
  it('1. calculates fixed-cost accurately', () => {
    expect(calculateProjectedCost('fixed', 150000, 0, 0)).toBe(150000);
    expect(calculateProjectedCost('fixed', 50000.7, 0, 0)).toBe(50001);
  });

  it('2. calculates per-guest cost accurately', () => {
    expect(calculateProjectedCost('per_guest', 0, 1200, 150)).toBe(180000);
    expect(calculateProjectedCost('per_guest', 0, 850, 200)).toBe(170000);
  });

  it('3. calculates fixed-plus-per-guest cost accurately', () => {
    // 50,000 base + (400 rate * 200 guests) = 50,000 + 80,000 = 130,000
    expect(calculateProjectedCost('fixed_plus_per_guest', 50000, 400, 200)).toBe(130000);
  });

  it('4. calculates total allocated across budget items', () => {
    const items: BudgetItem[] = [
      { id: '1', categoryId: 'c1', categoryName: 'Venue', itemName: 'Hall', calculationModel: 'fixed', fixedAmount: 100000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 120000, projectedCost: 100000, paidAmount: 0, costSource: 'user_estimate', createdAt: '', updatedAt: '' },
      { id: '2', categoryId: 'c2', categoryName: 'Catering', itemName: 'Food', calculationModel: 'fixed', fixedAmount: 200000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 180000, projectedCost: 200000, paidAmount: 0, costSource: 'user_estimate', createdAt: '', updatedAt: '' },
    ];
    expect(calculateTotalAllocated(items)).toBe(300000);
  });

  it('5. calculates total projected cost across budget items', () => {
    const items: BudgetItem[] = [
      { id: '1', categoryId: 'c1', categoryName: 'Venue', itemName: 'Hall', calculationModel: 'fixed', fixedAmount: 100000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 120000, projectedCost: 100000, paidAmount: 0, costSource: 'user_estimate', createdAt: '', updatedAt: '' },
      { id: '2', categoryId: 'c2', categoryName: 'Catering', itemName: 'Food', calculationModel: 'fixed', fixedAmount: 200000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 180000, projectedCost: 200000, paidAmount: 0, costSource: 'user_estimate', createdAt: '', updatedAt: '' },
    ];
    expect(calculateTotalProjected(items)).toBe(300000);
  });

  it('6. calculates forecast remaining and deficit', () => {
    // Budget 500,000, projected 450,000 -> remaining +50,000
    expect(calculateForecastRemaining(500000, 450000)).toBe(50000);
    expect(isBudgetDeficit(500000, 450000)).toBe(false);

    // Budget 500,000, projected 550,000 -> deficit -50,000
    expect(calculateForecastRemaining(500000, 550000)).toBe(-50000);
    expect(isBudgetDeficit(500000, 550000)).toBe(true);
  });

  it('7. calculates unallocated budget correctly', () => {
    // Budget 1,000,000, allocated 800,000 -> unallocated 200,000
    expect(calculateUnallocatedBudget(1000000, 800000)).toBe(200000);
    // Budget 1,000,000, allocated 1,100,000 -> over-allocated by 100,000
    expect(calculateUnallocatedBudget(1000000, 1100000)).toBe(-100000);
  });

  it('8. calculates paid-so-far without inferring from quotes or allocations', () => {
    const items: BudgetItem[] = [
      { id: '1', categoryId: 'c1', categoryName: 'Venue', itemName: 'Hall', calculationModel: 'fixed', fixedAmount: 100000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 120000, projectedCost: 100000, paidAmount: 25000, costSource: 'user_estimate', createdAt: '', updatedAt: '' },
      { id: '2', categoryId: 'c2', categoryName: 'Catering', itemName: 'Food', calculationModel: 'fixed', fixedAmount: 200000, ratePerGuest: 0, guestCount: 100, allocatedAmount: 180000, projectedCost: 200000, paidAmount: 0, costSource: 'vendor_quote', createdAt: '', updatedAt: '' },
    ];
    expect(calculateTotalPaid(items)).toBe(25000);
  });

  it('9. calculates category-level variance and detects over-allocation', () => {
    // Projected 150,000, Allocated 120,000 -> Difference = +30,000 (Over)
    expect(calculateDifference(150000, 120000)).toBe(30000);
    expect(isOverAllocation(150000, 120000)).toBe(true);

    // Projected 100,000, Allocated 120,000 -> Difference = -20,000 (Under/Buffer)
    expect(calculateDifference(100000, 120000)).toBe(-20000);
    expect(isOverAllocation(100000, 120000)).toBe(false);
  });

  it('10. handles edge cases and invalid values safely', () => {
    expect(calculateProjectedCost('fixed', -500, 0, 0)).toBe(0);
    expect(calculateTotalAllocated([])).toBe(0);
    expect(calculateTotalProjected([])).toBe(0);
    expect(calculateTotalPaid([])).toBe(0);
  });

  it('11. formats Indian Rupee amounts with standard notation', () => {
    expect(formatINR(150000)).toBe('₹1,50,000');
    expect(formatINR(-25000)).toBe('-₹25,000');
    expect(formatINR(0)).toBe('₹0');
  });
});

describe('Budget Item Zod Schema Validation', () => {
  it('12. validates valid budget item form payload', () => {
    const validPayload = {
      categoryName: 'Venue',
      itemName: 'Grand Banquet',
      calculationModel: 'fixed' as const,
      fixedAmount: 200000,
      ratePerGuest: 0,
      guestCount: 150,
      allocatedAmount: 200000,
      costSource: 'user_estimate' as const,
      sourceNotes: 'Includes setup',
      quotationReference: ''
    };

    const result = BudgetItemFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('13. rejects invalid or negative values', () => {
    const invalidPayload = {
      categoryName: '',
      itemName: '',
      calculationModel: 'fixed' as const,
      fixedAmount: -100,
      ratePerGuest: -50,
      guestCount: 0,
      allocatedAmount: -20,
      costSource: 'user_estimate' as const,
    };

    const result = BudgetItemFormSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
