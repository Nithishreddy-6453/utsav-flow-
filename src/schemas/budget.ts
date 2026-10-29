/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const CostCalculationModelSchema = z.enum(['fixed', 'per_guest', 'fixed_plus_per_guest']);
export const CostSourceSchema = z.enum(['ai_estimate', 'user_estimate', 'vendor_quote']);

export const BudgetItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().min(1, 'Category name is required'),
  itemName: z.string().min(1, 'Item name is required').max(100, 'Item name must be under 100 characters'),
  calculationModel: CostCalculationModelSchema,
  fixedAmount: z.number().min(0, 'Fixed amount must be non-negative'),
  ratePerGuest: z.number().min(0, 'Rate per guest must be non-negative'),
  guestCount: z.number().int().min(0, 'Guest count must be non-negative'),
  allocatedAmount: z.number().min(0, 'Allocated budget must be non-negative'),
  projectedCost: z.number().min(0, 'Projected cost must be non-negative'),
  paidAmount: z.number().min(0, 'Paid amount must be non-negative').default(0),
  costSource: CostSourceSchema,
  sourceNotes: z.string().optional().default(''),
  quotationReference: z.string().optional().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const BudgetItemFormSchema = z.object({
  categoryName: z.string().min(1, 'Please select or enter a category'),
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(100, 'Item name too long'),
  calculationModel: CostCalculationModelSchema,
  fixedAmount: z.number().min(0, 'Amount cannot be negative'),
  ratePerGuest: z.number().min(0, 'Rate cannot be negative'),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1'),
  allocatedAmount: z.number().min(0, 'Allocated budget cannot be negative'),
  costSource: CostSourceSchema,
  sourceNotes: z.string().max(500, 'Notes must be under 500 characters').optional().default(''),
  quotationReference: z.string().max(200, 'Quotation reference too long').optional().default(''),
});

export type BudgetItemFormData = z.infer<typeof BudgetItemFormSchema>;
