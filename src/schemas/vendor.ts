/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const VendorStatusSchema = z.enum([
  'contacted',
  'shortlisted',
  'quote_received',
  'negotiating',
  'booked',
  'rejected'
]);

export const QuoteReviewStatusSchema = z.enum([
  'pending_review',
  'analyzed',
  'accepted',
  'declined'
]);

export const QuotePricingModelSchema = z.enum([
  'lump_sum',
  'per_guest',
  'hybrid',
  'itemized'
]);

export const VendorFormSchema = z.object({
  name: z.string().min(2, 'Vendor name must be at least 2 characters').max(100, 'Vendor name is too long'),
  category: z.string().min(1, 'Category is required'),
  contactPerson: z.string().max(80, 'Contact person name too long').optional().default(''),
  phone: z.string().max(30, 'Phone number too long').optional().default(''),
  email: z.string().max(100, 'Email is too long').refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email address'
  }).optional().default(''),
  status: VendorStatusSchema,
  notes: z.string().max(1000, 'Notes too long').optional().default(''),
  linkedBudgetItemId: z.string().optional().default(''),
  linkedTimelineTaskId: z.string().optional().default('')
});

export type VendorFormData = z.infer<typeof VendorFormSchema>;

export const QuoteFormSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(2, 'Proposal title must be at least 2 characters').max(120, 'Proposal title too long'),
  rawQuoteText: z.string().min(10, 'Please paste at least 10 characters of the raw quote text or email'),
  quotedTotal: z.number().min(0, 'Quoted amount must be a non-negative number'),
  pricingModel: QuotePricingModelSchema,
  ratePerGuest: z.number().min(0, 'Per guest rate must be a non-negative number').optional().default(0),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid until must be in YYYY-MM-DD format').optional().or(z.literal('')),
  linkedBudgetItemId: z.string().optional().default('')
});

export type QuoteFormData = z.infer<typeof QuoteFormSchema>;

export const ExtractedQuoteAnalysisSchema = z.object({
  summary: z.string(),
  pricingBreakdown: z.object({
    baseAmount: z.number(),
    taxAmount: z.number().nullable().optional(),
    taxRatePercent: z.number().nullable().optional(),
    serviceCharge: z.number().nullable().optional(),
    totalCalculated: z.number(),
    isEstimatedTotal: z.boolean().default(false)
  }),
  perGuestRate: z.number().nullable().optional(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  taxAndTerms: z.object({
    taxesIncluded: z.union([z.boolean(), z.literal('NOT_STATED')]),
    paymentTerms: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    overtimePolicy: z.string().optional()
  }),
  missingInformation: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([])
});

export const QuoteComparisonRequestSchema = z.object({
  category: z.string(),
  quotes: z.array(z.object({
    id: z.string(),
    vendorId: z.string(),
    vendorName: z.string(),
    category: z.string(),
    title: z.string(),
    rawQuoteText: z.string(),
    quotedTotal: z.number(),
    pricingModel: QuotePricingModelSchema,
    ratePerGuest: z.number().optional()
  })).min(1, 'At least one quote is required for analysis'),
  guestCount: z.number().optional().default(150),
  priorities: z.array(z.string()).optional().default([]),
  eventDate: z.string().optional()
});
