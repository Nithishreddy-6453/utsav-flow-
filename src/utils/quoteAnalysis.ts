/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VendorQuote, ExtractedQuoteAnalysis, QuoteComparisonResult } from '../types/plan';

/**
 * Deterministically analyzes a single quote text to extract inclusions, exclusions,
 * tax status, missing info, and follow-up questions.
 * Handles untrusted input by treating text as raw data and never executing it.
 */
export function analyzeQuoteDeterministically(
  quote: Pick<VendorQuote, 'id' | 'vendorName' | 'category' | 'title' | 'rawQuoteText' | 'quotedTotal' | 'pricingModel' | 'ratePerGuest'>,
  guestCount: number = 150
): ExtractedQuoteAnalysis {
  const text = quote.rawQuoteText || '';
  const lower = text.toLowerCase();

  // 1. Tax & GST Detection
  let taxesIncluded: boolean | 'NOT_STATED' = 'NOT_STATED';
  let taxRatePercent: number | null = null;
  let taxAmount: number | null = null;

  if (
    lower.includes('all-inclusive') ||
    lower.includes('all inclusive') ||
    lower.includes('including gst') ||
    lower.includes('inclusive of taxes') ||
    lower.includes('inclusive of gst') ||
    lower.includes('inclusive of all taxes') ||
    lower.includes('taxes included') ||
    lower.includes('gst included') ||
    lower.includes('tax included')
  ) {
    taxesIncluded = true;
    taxRatePercent = 0;
    taxAmount = 0;
  } else if (
    lower.includes('excluding gst') ||
    lower.includes('plus gst') ||
    lower.includes('gst extra') ||
    lower.includes('tax extra') ||
    lower.includes('taxes extra') ||
    lower.includes('plus 18%') ||
    lower.includes('+ 18%') ||
    lower.includes('18% gst') ||
    lower.includes('gst 18%') ||
    lower.includes('+ gst') ||
    lower.includes('taxes not included') ||
    lower.includes('tax not included') ||
    lower.includes('exclusive of gst') ||
    lower.includes('excludes gst') ||
    lower.includes('tax excluded') ||
    lower.includes('taxes excluded') ||
    lower.includes('gst applies') ||
    lower.includes('gst additional') ||
    lower.includes('taxes additional')
  ) {
    taxesIncluded = false;
    taxRatePercent = 18;
    taxAmount = Math.round(quote.quotedTotal * 0.18);
  } else if (
    lower.includes('gst 5%') ||
    lower.includes('5% gst') ||
    lower.includes('+ 5%') ||
    lower.includes('plus 5%')
  ) {
    taxesIncluded = false;
    taxRatePercent = 5;
    taxAmount = Math.round(quote.quotedTotal * 0.05);
  } else if (lower.includes('gst') || lower.includes('tax')) {
    taxesIncluded = 'NOT_STATED';
  } else {
    // Completely unmentioned
    taxesIncluded = 'NOT_STATED';
  }

  // 2. Pricing Breakdown
  const baseAmount = quote.quotedTotal;
  const totalCalculated = taxAmount ? baseAmount + taxAmount : baseAmount;
  const effectivePerGuest = quote.ratePerGuest && quote.ratePerGuest > 0
    ? quote.ratePerGuest
    : (guestCount > 0 ? Math.round(totalCalculated / guestCount) : null);

  // 3. Extract Inclusions & Exclusions from Lines
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim().replace(/^[-*•]\s*/, ''))
    .filter(l => l.length > 2);

  const inclusions: string[] = [];
  const exclusions: string[] = [];
  let inExclusionSection = false;
  let inInclusionSection = false;

  for (const line of lines) {
    const lLower = line.toLowerCase();
    if (lLower.includes('exclusion') || lLower.includes('excludes:') || lLower.includes('not included:')) {
      inExclusionSection = true;
      inInclusionSection = false;
      continue;
    }
    if (lLower.includes('inclusion') || lLower.includes('includes:') || lLower.includes('package includes:')) {
      inInclusionSection = true;
      inExclusionSection = false;
      continue;
    }

    if (inExclusionSection) {
      if (line.length > 3) exclusions.push(line);
    } else if (inInclusionSection) {
      if (line.length > 3) inclusions.push(line);
    } else {
      // Inline detection
      if (
        lLower.includes('includes ') ||
        lLower.includes('including ') ||
        lLower.includes('complimentary') ||
        lLower.includes('package has')
      ) {
        inclusions.push(line);
      } else if (
        lLower.includes('excludes ') ||
        lLower.includes('does not include') ||
        lLower.includes('extra charge for') ||
        lLower.includes('client must arrange')
      ) {
        exclusions.push(line);
      }
    }
  }

  // Fallback default facts if unstructured text
  if (inclusions.length === 0) {
    const categoryLower = (quote.category || '').toLowerCase();
    if (categoryLower.includes('catering') || categoryLower.includes('food')) {
      inclusions.push('Full buffet service setup and core dining cutlery');
    } else if (categoryLower.includes('photo')) {
      inclusions.push('Event coverage and edited high-resolution media deliverable');
    } else if (categoryLower.includes('decor')) {
      inclusions.push('Standard decorative setup as described');
    } else {
      inclusions.push(`Standard ${quote.category || 'service'} scope for quoted base rate`);
    }
  }

  // 4. Missing Information Warnings
  const missingInformation: string[] = [];
  const followUpQuestions: string[] = [];

  if (taxesIncluded === 'NOT_STATED') {
    missingInformation.push('GST and tax terms are unstated in quotation text.');
    followUpQuestions.push(`Is the quoted ₹${quote.quotedTotal.toLocaleString('en-IN')} inclusive of 18% GST or will taxes be added separately?`);
  } else if (taxesIncluded === false) {
    missingInformation.push(`GST is excluded (adds approx ₹${taxAmount?.toLocaleString('en-IN')} at 18%).`);
    followUpQuestions.push('Can you provide a formal tax invoice breakdown including HSN/SAC codes?');
  }

  if (
    !lower.includes('advance') &&
    !lower.includes('deposit') &&
    !lower.includes('payment schedule') &&
    !lower.includes('% advance')
  ) {
    missingInformation.push('Payment milestones and advance deposit schedule not specified.');
    followUpQuestions.push('What is the required booking advance and milestone payment schedule?');
  }

  if (
    !lower.includes('cancel') &&
    !lower.includes('refund')
  ) {
    missingInformation.push('Cancellation and postponement policy not mentioned.');
    followUpQuestions.push('What is your refund or date-transfer policy in case of unexpected schedule changes?');
  }

  if (
    quote.category.toLowerCase().includes('catering') &&
    !lower.includes('water') &&
    !lower.includes('beverage') &&
    !lower.includes('ice')
  ) {
    missingInformation.push('Packaged drinking water, beverage ice, and food warmers unstated.');
    followUpQuestions.push('Are 250ml mineral water bottles, ice cubes, and chafing fuel included in the plate cost?');
  }

  if (
    (quote.category.toLowerCase().includes('venue') || quote.category.toLowerCase().includes('decor') || quote.category.toLowerCase().includes('entertainment')) &&
    !lower.includes('generator') &&
    !lower.includes('diesel') &&
    !lower.includes('fuel')
  ) {
    missingInformation.push('Generator backup & diesel fuel charges not specified.');
    followUpQuestions.push('Is continuous DG backup power with fuel included, or billed on actual hourly usage?');
  }

  // Overtime detection
  let overtimePolicy = 'Not specified in quote text';
  if (lower.includes('overtime') || lower.includes('extra hour')) {
    const otLine = lines.find(l => l.toLowerCase().includes('overtime') || l.toLowerCase().includes('extra hour'));
    overtimePolicy = otLine || 'Overtime rate mentioned';
  } else {
    followUpQuestions.push('What are the overtime charges per hour if the event runs past the scheduled curfew?');
  }

  // Payment terms extraction
  let paymentTerms = 'Not stated in quote';
  const payLine = lines.find(l => l.toLowerCase().includes('advance') || l.toLowerCase().includes('payment'));
  if (payLine) {
    paymentTerms = payLine;
  }

  return {
    summary: `${quote.vendorName} quotation for ${quote.title} at ₹${quote.quotedTotal.toLocaleString('en-IN')} (${taxesIncluded === true ? 'All-inclusive' : taxesIncluded === false ? 'Excludes GST' : 'Tax unstated'}).`,
    pricingBreakdown: {
      baseAmount,
      taxAmount,
      taxRatePercent,
      serviceCharge: null,
      totalCalculated,
      isEstimatedTotal: taxesIncluded === 'NOT_STATED'
    },
    perGuestRate: effectivePerGuest,
    inclusions,
    exclusions,
    taxAndTerms: {
      taxesIncluded,
      paymentTerms,
      cancellationPolicy: lower.includes('non-refundable') ? 'Non-refundable' : 'Not specified',
      overtimePolicy
    },
    missingInformation,
    followUpQuestions,
    assumptions: [
      `Assumes delivery at venue on scheduled event date for ${guestCount} guests.`,
      taxesIncluded === 'NOT_STATED' ? 'Assumed baseline quote without unstated statutory taxes until verified.' : 'Tax treatment noted from quote wording.'
    ]
  };
}

/**
 * Fallback multi-quote comparison engine.
 */
export function compareQuotesFallback(
  quotes: VendorQuote[],
  guestCount: number = 150,
  priorities: string[] = []
): QuoteComparisonResult {
  if (!quotes || quotes.length === 0) {
    return {
      category: 'General',
      quotesAnalyzed: [],
      comparisonMatrix: []
    };
  }

  const category = quotes[0]?.category || 'General';

  const analyzed = quotes.map(q => {
    const analysis = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
    const risks: string[] = [...analysis.missingInformation];
    if (analysis.taxAndTerms.taxesIncluded === false) {
      risks.push(`Additional GST obligation (approx +₹${analysis.pricingBreakdown.taxAmount?.toLocaleString('en-IN')})`);
    }

    const strengths: string[] = [];
    if (analysis.taxAndTerms.taxesIncluded === true) {
      strengths.push('Clean all-inclusive pricing with no statutory GST surprise');
    }
    if (analysis.inclusions.length > 2) {
      strengths.push(`Comprehensive package (${analysis.inclusions.length} explicit inclusions)`);
    }
    if (q.quotedTotal <= Math.min(...quotes.map(x => x.quotedTotal))) {
      strengths.push('Lowest upfront sticker price in this category');
    }

    return {
      quoteId: q.id,
      vendorName: q.vendorName,
      totalCost: analysis.pricingBreakdown.totalCalculated,
      effectiveCostPerGuest: analysis.perGuestRate,
      keyStrengths: strengths.length > 0 ? strengths : ['Standard commercial terms proposed'],
      potentialRisks: risks.length > 0 ? risks : ['Verify operational timeline with venue'],
      statedFacts: analysis.inclusions,
      unansweredQuestions: analysis.followUpQuestions
    };
  });

  // Sort by total calculated cost
  const sorted = [...analyzed].sort((a, b) => a.totalCost - b.totalCost);
  const bestValue = sorted[0];
  const premium = sorted[sorted.length - 1];

  // Build comparison matrix
  const comparisonMatrix = [
    {
      feature: 'Quoted Base Total',
      vendorValues: quotes.reduce((acc, q) => {
        acc[q.id] = `₹${q.quotedTotal.toLocaleString('en-IN')}`;
        return acc;
      }, {} as Record<string, string>)
    },
    {
      feature: 'Tax Status (GST)',
      vendorValues: quotes.reduce((acc, q) => {
        const a = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
        const st = a.taxAndTerms.taxesIncluded;
        acc[q.id] = st === true ? 'All-Inclusive (0% extra)' : st === false ? `+18% Extra (~₹${a.pricingBreakdown.taxAmount?.toLocaleString('en-IN')})` : 'Unstated (Risk of +18%)';
        return acc;
      }, {} as Record<string, string>)
    },
    {
      feature: 'Total Projected Cost (with Tax)',
      vendorValues: quotes.reduce((acc, q) => {
        const a = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
        acc[q.id] = `₹${a.pricingBreakdown.totalCalculated.toLocaleString('en-IN')}`;
        return acc;
      }, {} as Record<string, string>)
    },
    {
      feature: 'Effective Cost / Guest',
      vendorValues: quotes.reduce((acc, q) => {
        const a = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
        acc[q.id] = a.perGuestRate ? `₹${a.perGuestRate.toLocaleString('en-IN')}` : 'N/A';
        return acc;
      }, {} as Record<string, string>)
    },
    {
      feature: 'Key Inclusions',
      vendorValues: quotes.reduce((acc, q) => {
        const a = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
        acc[q.id] = a.inclusions.slice(0, 3).join(', ') || 'Standard scope';
        return acc;
      }, {} as Record<string, string>)
    },
    {
      feature: 'Unanswered Questions / Gaps',
      vendorValues: quotes.reduce((acc, q) => {
        const a = q.extractedAnalysis || analyzeQuoteDeterministically(q, guestCount);
        acc[q.id] = `${a.followUpQuestions.length} item(s) need clarification`;
        return acc;
      }, {} as Record<string, string>)
    }
  ];

  return {
    category,
    quotesAnalyzed: analyzed,
    recommendation: {
      recommendedQuoteId: bestValue?.quoteId,
      rationale: bestValue
        ? `${bestValue.vendorName} offers the most advantageous total cost (₹${bestValue.totalCost.toLocaleString('en-IN')}) when statutory taxes and omissions are accounted for.`
        : 'Compare vendors by confirming missing tax terms.',
      bestValueOption: bestValue?.vendorName,
      premiumOption: premium?.vendorName !== bestValue?.vendorName ? premium?.vendorName : undefined
    },
    comparisonMatrix
  };
}
