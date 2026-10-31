/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VendorFormSchema, QuoteFormSchema } from '../schemas/vendor';
import {
  analyzeQuoteDeterministically,
  compareQuotesFallback
} from '../utils/quoteAnalysis';
import {
  persistVendor,
  removeVendor,
  persistQuote,
  applyQuoteToBudget,
  getSavedPlan,
  savePlan
} from '../utils/storage';
import { generateFallbackPlan } from '../utils/fallbackPlan';
import { DEFAULT_DRAFT } from '../data/presets';
import { Vendor, VendorQuote } from '../types/plan';

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

describe('Phase 5: Vendor Studio & Quotation Audit Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    const initialPlan = generateFallbackPlan(DEFAULT_DRAFT);
    savePlan(initialPlan);
  });

  describe('Vendor Schema & Lifecycle Validation', () => {
    it('accepts a valid vendor with linked budget and task', () => {
      const validVendor = {
        name: 'Royal Heritage Caterers',
        category: 'Catering',
        contactPerson: 'Chef Sanjeev',
        phone: '+91 98200 11223',
        email: 'sanjeev@caterers.in',
        status: 'shortlisted',
        notes: 'Vegetarian specialist with live counters',
        linkedBudgetItemId: 'bi_catering_2',
        linkedTimelineTaskId: 'task_catering_lock'
      };

      const result = VendorFormSchema.safeParse(validVendor);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Royal Heritage Caterers');
        expect(result.data.category).toBe('Catering');
      }
    });

    it('rejects an invalid vendor with empty name or invalid email', () => {
      const invalidVendor = {
        name: 'A', // too short
        category: 'Catering',
        email: 'not-an-email',
        status: 'contacted'
      };

      const result = VendorFormSchema.safeParse(invalidVendor);
      expect(result.success).toBe(false);
    });

    it('persists and removes a vendor from storage with quote cascading', () => {
      const newVendor: Vendor = {
        id: 'test_vendor_99',
        name: 'Specialist Decorators',
        category: 'Decor',
        status: 'contacted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const planWithVendor = persistVendor(newVendor, DEFAULT_DRAFT);
      expect(planWithVendor.vendors?.some(v => v.id === 'test_vendor_99')).toBe(true);

      const testQuote: VendorQuote = {
        id: 'quote_test_99',
        vendorId: 'test_vendor_99',
        vendorName: 'Specialist Decorators',
        category: 'Decor',
        title: 'Floral Concept A',
        rawQuoteText: 'Base quote ₹1,50,000 for full stage floral',
        quotedTotal: 150000,
        pricingModel: 'lump_sum',
        reviewStatus: 'analyzed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      persistQuote(testQuote, DEFAULT_DRAFT);

      const planAfterQuote = getSavedPlan(DEFAULT_DRAFT);
      expect(planAfterQuote.quotes?.some(q => q.id === 'quote_test_99')).toBe(true);

      // Now remove vendor; should cascade delete the associated quote
      const planAfterDelete = removeVendor('test_vendor_99', DEFAULT_DRAFT);
      expect(planAfterDelete.vendors?.some(v => v.id === 'test_vendor_99')).toBe(false);
      expect(planAfterDelete.quotes?.some(q => q.vendorId === 'test_vendor_99')).toBe(false);
    });
  });

  describe('Quotation Schema & Raw Text Integrity', () => {
    it('validates a quote and strictly preserves unedited raw quote text', () => {
      const rawText = `Estimate #402:
- 3 starters, 4 curries, live chaat
- Excludes 18% GST and diesel fuel
- Payment: 50% advance non-refundable`;

      const validQuotePayload = {
        vendorId: 'v1',
        vendorName: 'Royal Spice Caterers',
        category: 'Catering',
        title: 'Heritage Spread v2',
        rawQuoteText: rawText,
        quotedTotal: 250000,
        pricingModel: 'lump_sum',
        ratePerGuest: 1667,
        validUntil: '2026-12-31'
      };

      const result = QuoteFormSchema.safeParse(validQuotePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rawQuoteText).toBe(rawText);
        expect(result.data.quotedTotal).toBe(250000);
      }
    });

    it('rejects a quote with negative amount or missing vendor', () => {
      const invalidQuote = {
        vendorId: '',
        vendorName: 'No Vendor',
        category: 'Catering',
        title: 'Invalid',
        rawQuoteText: 'Short',
        quotedTotal: -500,
        pricingModel: 'lump_sum'
      };

      const result = QuoteFormSchema.safeParse(invalidQuote);
      expect(result.success).toBe(false);
    });
  });

  describe('Forensic Quote Audit & Tax Extraction Engine', () => {
    it('detects all-inclusive package with no extra GST burden', () => {
      const quote: Pick<VendorQuote, 'id' | 'vendorName' | 'category' | 'title' | 'rawQuoteText' | 'quotedTotal' | 'pricingModel' | 'ratePerGuest'> = {
        id: 'q_inc',
        vendorName: 'Royal Spice',
        category: 'Catering',
        title: 'All inclusive feast',
        rawQuoteText: `Package rate: ₹2,40,000 all-inclusive.
Includes:
- Full buffet service and cutlery
- Uniformed waitstaff
- 18% GST is included in the package rate`,
        quotedTotal: 240000,
        pricingModel: 'lump_sum',
        ratePerGuest: 1600
      };

      const analysis = analyzeQuoteDeterministically(quote, 150);
      expect(analysis.taxAndTerms.taxesIncluded).toBe(true);
      expect(analysis.pricingBreakdown.taxAmount).toBe(0);
      expect(analysis.pricingBreakdown.totalCalculated).toBe(240000);
      expect(analysis.inclusions.length).toBeGreaterThanOrEqual(1);
    });

    it('detects excluded GST and calculates extra statutory tax exposure', () => {
      const quote: Pick<VendorQuote, 'id' | 'vendorName' | 'category' | 'title' | 'rawQuoteText' | 'quotedTotal' | 'pricingModel' | 'ratePerGuest'> = {
        id: 'q_exc',
        vendorName: 'Utsav Flavours',
        category: 'Catering',
        title: 'Basic combo',
        rawQuoteText: `Sticker quote: ₹2,20,000.
Exclusions:
- Taxes extra: GST 18% applies on final bill
- Drinking water jars and ice to be provided by host
- Generator fuel extra at ₹6,500`,
        quotedTotal: 220000,
        pricingModel: 'lump_sum',
        ratePerGuest: 1467
      };

      const analysis = analyzeQuoteDeterministically(quote, 150);
      expect(analysis.taxAndTerms.taxesIncluded).toBe(false);
      expect(analysis.pricingBreakdown.taxRatePercent).toBe(18);
      // 18% of 220,000 is 39,600
      expect(analysis.pricingBreakdown.taxAmount).toBe(39600);
      expect(analysis.pricingBreakdown.totalCalculated).toBe(259600);
      expect(analysis.exclusions.some(e => e.toLowerCase().includes('water') || e.toLowerCase().includes('taxes'))).toBe(true);
    });

    it('marks unstated tax as NOT_STATED and creates warning and question', () => {
      const quote: Pick<VendorQuote, 'id' | 'vendorName' | 'category' | 'title' | 'rawQuoteText' | 'quotedTotal' | 'pricingModel' | 'ratePerGuest'> = {
        id: 'q_unstated',
        vendorName: 'Mystic Decorators',
        category: 'Decor',
        title: 'Stage package',
        rawQuoteText: `Quotation:
- Grand floral entrance arch
- Fairy lights across lawns
Rate: ₹1,00,000 lump sum`,
        quotedTotal: 100000,
        pricingModel: 'lump_sum'
      };

      const analysis = analyzeQuoteDeterministically(quote, 150);
      expect(analysis.taxAndTerms.taxesIncluded).toBe('NOT_STATED');
      expect(analysis.missingInformation.some(m => m.includes('GST') || m.includes('tax'))).toBe(true);
      expect(analysis.followUpQuestions.some(q => q.includes('GST') || q.includes('tax'))).toBe(true);
    });
  });

  describe('Multi-Quote Comparison Logic', () => {
    it('compares quotes and correctly reveals true exposure vs sticker price', () => {
      const q1: VendorQuote = {
        id: 'q1',
        vendorId: 'v1',
        vendorName: 'Royal Spice Caterers',
        category: 'Catering',
        title: 'All-inclusive buffet',
        rawQuoteText: 'Total: ₹2,40,000 all-inclusive with 18% GST included.',
        quotedTotal: 240000,
        pricingModel: 'lump_sum',
        reviewStatus: 'analyzed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const q2: VendorQuote = {
        id: 'q2',
        vendorId: 'v2',
        vendorName: 'Utsav Flavours',
        category: 'Catering',
        title: 'Sticker quote',
        rawQuoteText: 'Total: ₹2,20,000. Taxes extra: GST 18% applies.',
        quotedTotal: 220000,
        pricingModel: 'lump_sum',
        reviewStatus: 'analyzed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const comparison = compareQuotesFallback([q1, q2], 150);
      expect(comparison.quotesAnalyzed.length).toBe(2);

      // Royal Spice net total = 240,000; Utsav Flavours net total = 220,000 + 39,600 = 259,600!
      // So Royal Spice is actually cheaper net!
      const royalSpiceAnalyzed = comparison.quotesAnalyzed.find(q => q.vendorName.includes('Royal Spice'));
      const utsavAnalyzed = comparison.quotesAnalyzed.find(q => q.vendorName.includes('Utsav Flavours'));

      expect(royalSpiceAnalyzed?.totalCost).toBe(240000);
      expect(utsavAnalyzed?.totalCost).toBe(259600);
      expect(comparison.recommendation?.recommendedQuoteId).toBe('q1');
    });
  });

  describe('Budget Linking & Envelope Preservation', () => {
    it('applies accepted quote to budget item without overwriting allocatedAmount', () => {
      const plan = getSavedPlan(DEFAULT_DRAFT);
      const targetItem = plan.budgetItems.find(b => b.categoryId === 'catering') || plan.budgetItems[1];
      const initialAllocated = targetItem.allocatedAmount;

      const testQuote: VendorQuote = {
        id: 'quote_to_accept_1',
        vendorId: 'vendor_1',
        vendorName: 'Royal Spice Caterers',
        category: 'Catering',
        title: 'Final Accepted Banquet Menu',
        rawQuoteText: 'Total package ₹2,75,000 all inclusive.',
        quotedTotal: 275000,
        pricingModel: 'lump_sum',
        reviewStatus: 'analyzed',
        linkedBudgetItemId: targetItem.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      persistQuote(testQuote, DEFAULT_DRAFT);

      // Apply to budget
      const updatedPlan = applyQuoteToBudget('quote_to_accept_1', targetItem.id, DEFAULT_DRAFT);

      const updatedItem = updatedPlan.budgetItems.find(b => b.id === targetItem.id);
      expect(updatedItem).toBeDefined();

      // Allocated envelope must remain PRESERVED
      expect(updatedItem?.allocatedAmount).toBe(initialAllocated);

      // Projected cost and price provenance must be updated
      expect(updatedItem?.projectedCost).toBe(275000);
      expect(updatedItem?.costSource).toBe('vendor_quote');
      expect(updatedItem?.quotationReference).toContain('Royal Spice Caterers');

      // Quote status must be 'accepted'
      const updatedQuote = updatedPlan.quotes?.find(q => q.id === 'quote_to_accept_1');
      expect(updatedQuote?.reviewStatus).toBe('accepted');

      // Vendor status must be updated to 'booked'
      const updatedVendor = updatedPlan.vendors?.find(v => v.id === 'vendor_1');
      expect(updatedVendor?.status).toBe('booked');
    });
  });
});
