/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const ConstraintTriggerSourceSchema = z.enum([
  'budget_cut',
  'guest_surge',
  'date_shift',
  'cost_overrun',
  'vendor_quote_change',
  'custom'
]);

export const EventConstraintsSchema = z.object({
  maxBudget: z.number().min(10000, 'Budget must be at least ₹10,000').max(100000000, 'Budget exceeds supported limit'),
  totalGuests: z.number().int().min(1, 'Guest count must be at least 1').max(10000, 'Guest count exceeds supported limit'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be in YYYY-MM-DD format'),
  priorities: z.array(z.string()).optional(),
  mustHaves: z.array(z.string()).optional(),
  culturalPreferences: z.string().optional(),
  accessibilityRequirements: z.string().optional(),
  thingsToAvoid: z.string().optional()
});

export const ConstraintChangeRequestSchema = z.object({
  changeId: z.string().min(1),
  basePlanVersion: z.string().min(1),
  currentConstraints: EventConstraintsSchema,
  proposedConstraints: EventConstraintsSchema,
  userInstructions: z.string().max(2000, 'Instructions too long').default(''),
  triggerSource: ConstraintTriggerSourceSchema,
  createdAt: z.string()
});

export type ConstraintChangeRequestData = z.infer<typeof ConstraintChangeRequestSchema>;

export const CategoryAdjustmentSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  originalAllocated: z.number(),
  proposedAllocated: z.number(),
  originalProjected: z.number(),
  proposedProjected: z.number(),
  actionNotes: z.string()
});

export const TimelineAdjustmentSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  originalDueDate: z.string(),
  proposedDueDate: z.string(),
  reason: z.string()
});

export const TradeOffStrategySchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  strategyType: z.enum(['protect_priorities', 'optimize_services', 'adjust_format']),
  summary: z.string(),
  rationale: z.string(),
  protectedPriorities: z.array(z.string()).default([]),
  proposedCompromises: z.array(z.string()).default([]),
  proposedBudgetLimit: z.number(),
  proposedProjectedCost: z.number(),
  netSavings: z.number(),
  projectedDeficitOrSurplus: z.number(),
  categoryAdjustments: z.array(CategoryAdjustmentSchema).default([]),
  timelineAdjustments: z.array(TimelineAdjustmentSchema).default([]),
  vendorImplications: z.array(z.string()).default([]),
  unresolvedRisks: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  satisfiesBudget: z.boolean(),
  isFallback: z.boolean().optional()
});

export const RebalanceRequestSchema = z.object({
  request: ConstraintChangeRequestSchema,
  budgetSummary: z.object({
    totalBudget: z.number(),
    projectedSpend: z.number(),
    categories: z.array(z.object({
      categoryName: z.string(),
      allocated: z.number(),
      spent: z.number()
    }))
  }),
  budgetItems: z.array(z.object({
    id: z.string(),
    categoryId: z.string(),
    categoryName: z.string(),
    itemName: z.string(),
    calculationModel: z.enum(['fixed', 'per_guest', 'fixed_plus_per_guest']),
    fixedAmount: z.number(),
    ratePerGuest: z.number(),
    allocatedAmount: z.number(),
    projectedCost: z.number(),
    costSource: z.string()
  })),
  timelineTasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    phase: z.string(),
    dueDate: z.string(),
    daysBeforeEvent: z.number().optional(),
    priority: z.enum(['high', 'medium', 'low']),
    status: z.enum(['pending', 'in_progress', 'completed', 'delayed']),
    dependencyIds: z.array(z.string()).default([])
  })),
  deterministicImpact: z.object({
    originalBudgetLimit: z.number(),
    proposedBudgetLimit: z.number(),
    originalProjectedCost: z.number(),
    proposedProjectedCost: z.number(),
    originalDeficitOrSurplus: z.number(),
    proposedDeficitOrSurplus: z.number(),
    daysShift: z.number()
  })
});

export const RebalanceResponseSchema = z.object({
  success: z.boolean(),
  strategies: z.array(TradeOffStrategySchema).length(3, 'Replanning engine must produce exactly 3 trade-off strategies')
});
