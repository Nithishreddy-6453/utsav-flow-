/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CostCalculationModel = 'fixed' | 'per_guest' | 'fixed_plus_per_guest';
export type CostSource = 'ai_estimate' | 'user_estimate' | 'vendor_quote';

export interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  itemName: string;
  calculationModel: CostCalculationModel;
  fixedAmount: number;
  ratePerGuest: number;
  guestCount: number;
  allocatedAmount: number;
  projectedCost: number;
  paidAmount: number;
  costSource: CostSource;
  sourceNotes?: string;
  quotationReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  categoryName: string;
  allocated: number;
  spent: number;
  notes: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  phase: string;
  dueDate: string; // YYYY-MM-DD
  daysBeforeEvent?: number;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineMilestone {
  id: string;
  phase: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'urgent';
  description: string;
}

export interface VendorItem {
  id: string;
  category: string;
  vendorName: string;
  estimatedCost: number;
  status: 'to-contact' | 'quoted' | 'booked';
  notes: string;
}

export type VendorStatus = 'contacted' | 'shortlisted' | 'quote_received' | 'negotiating' | 'booked' | 'rejected';
export type QuoteReviewStatus = 'pending_review' | 'analyzed' | 'accepted' | 'declined';
export type QuotePricingModel = 'lump_sum' | 'per_guest' | 'hybrid' | 'itemized';

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: VendorStatus;
  notes?: string;
  linkedBudgetItemId?: string;
  linkedTimelineTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedQuoteAnalysis {
  summary: string;
  pricingBreakdown: {
    baseAmount: number;
    taxAmount?: number | null;
    taxRatePercent?: number | null;
    serviceCharge?: number | null;
    totalCalculated: number;
    isEstimatedTotal: boolean;
  };
  perGuestRate?: number | null;
  inclusions: string[];
  exclusions: string[];
  taxAndTerms: {
    taxesIncluded: boolean | 'NOT_STATED';
    paymentTerms?: string;
    cancellationPolicy?: string;
    overtimePolicy?: string;
  };
  missingInformation: string[];
  followUpQuestions: string[];
  assumptions: string[];
}

export interface VendorQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  category: string;
  title: string;
  rawQuoteText: string;
  quotedTotal: number;
  pricingModel: QuotePricingModel;
  ratePerGuest?: number;
  validUntil?: string; // YYYY-MM-DD
  reviewStatus: QuoteReviewStatus;
  extractedAnalysis?: ExtractedQuoteAnalysis;
  linkedBudgetItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteComparisonResult {
  category: string;
  quotesAnalyzed: {
    quoteId: string;
    vendorName: string;
    totalCost: number;
    effectiveCostPerGuest?: number | null;
    keyStrengths: string[];
    potentialRisks: string[];
    statedFacts: string[];
    unansweredQuestions: string[];
  }[];
  recommendation?: {
    recommendedQuoteId?: string;
    rationale: string;
    bestValueOption?: string;
    premiumOption?: string;
  };
  comparisonMatrix: {
    feature: string;
    vendorValues: Record<string, string>; // quoteId -> value
  }[];
}

export interface ExperienceIdea {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Delight';
  category: string;
}

export type IdeaBudgetImpact = 
  | 'Likely low impact'
  | 'Potentially moderate impact'
  | 'Potentially high impact'
  | 'Insufficient information to estimate';

export interface PersonalizedIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  whyItFits: string;
  practicalConsiderations: string[];
  mustHaveCompatibility?: string;
  potentialConflicts?: string;
  budgetImpact: IdeaBudgetImpact;
  budgetAssumptions?: string;
  tags: string[];
  image?: string;
  isSaved?: boolean;
  isRefined?: boolean;
  source: 'ai_curated' | 'user_refined' | 'rule_based';
  createdAt: string;
  updatedAt: string;
}

export type ConstraintTriggerSource = 
  | 'budget_cut'
  | 'guest_surge'
  | 'date_shift'
  | 'cost_overrun'
  | 'vendor_quote_change'
  | 'custom';

export interface EventConstraints {
  maxBudget: number;
  totalGuests: number;
  eventDate: string; // YYYY-MM-DD
  priorities?: string[];
  mustHaves?: string[];
  culturalPreferences?: string;
  accessibilityRequirements?: string;
  thingsToAvoid?: string;
}

export interface ConstraintChangeRequest {
  changeId: string;
  basePlanVersion: string;
  currentConstraints: EventConstraints;
  proposedConstraints: EventConstraints;
  userInstructions: string;
  triggerSource: ConstraintTriggerSource;
  createdAt: string;
}

export interface AffectedTaskPreview {
  taskId: string;
  title: string;
  originalDueDate: string;
  proposedDueDate: string;
  isManual: boolean;
  isOverdue: boolean;
  isBlocked?: boolean;
}

export interface AffectedVendorPreview {
  vendorId: string;
  vendorName: string;
  category: string;
  reason: string;
  currentQuotedTotal?: number;
}

export interface DeterministicImpact {
  originalBudgetLimit: number;
  proposedBudgetLimit: number;
  budgetDelta: number;
  originalProjectedCost: number;
  proposedProjectedCost: number;
  projectedCostDelta: number;
  originalDeficitOrSurplus: number;
  proposedDeficitOrSurplus: number;
  originalDaysRemaining: number;
  proposedDaysRemaining: number;
  daysShift: number; // e.g. -14 means 14 days earlier
  originalGuests: number;
  proposedGuests: number;
  guestDelta: number;
  recalculatedBudgetItems: BudgetItem[];
  affectedTaskCount: number;
  affectedTasks: AffectedTaskPreview[];
  affectedVendorCount: number;
  affectedVendors: AffectedVendorPreview[];
}

export type TradeOffOptionType = 'protect_priorities' | 'optimize_services' | 'adjust_format';

export interface CategoryAdjustment {
  categoryId: string;
  categoryName: string;
  originalAllocated: number;
  proposedAllocated: number;
  originalProjected: number;
  proposedProjected: number;
  actionNotes: string;
}

export interface TimelineAdjustment {
  taskId: string;
  title: string;
  originalDueDate: string;
  proposedDueDate: string;
  reason: string;
}

export interface TradeOffStrategy {
  id: string;
  title: string;
  strategyType: TradeOffOptionType;
  summary: string;
  rationale: string;
  protectedPriorities: string[];
  proposedCompromises: string[];
  proposedBudgetLimit: number;
  proposedProjectedCost: number;
  netSavings: number;
  projectedDeficitOrSurplus: number;
  categoryAdjustments: CategoryAdjustment[];
  timelineAdjustments: TimelineAdjustment[];
  vendorImplications: string[];
  unresolvedRisks: string[];
  assumptions: string[];
  satisfiesBudget: boolean;
  isFallback?: boolean;
}

export interface ReplanHistoryEntry {
  changeId: string;
  strategyId: string;
  strategyTitle: string;
  strategyType: TradeOffOptionType;
  previousConstraints: EventConstraints;
  updatedConstraints: EventConstraints;
  appliedAt: string;
  summary: string;
  affectedBudgetItemIds: string[];
  affectedTaskIds: string[];
  snapshotPlanJson?: string;
}

export interface EventPlan {
  id: string;
  eventName: string;
  generatedAt: string;
  summary: string;
  version?: number;
  isInitialized?: boolean;
  budgetSummary: {
    totalBudget: number;
    projectedSpend: number;
    bufferReserve: number;
    categories: BudgetCategory[];
  };
  budgetItems: BudgetItem[];
  timelineTasks: TimelineTask[];
  timelineMilestones?: TimelineMilestone[];
  vendorChecklist: VendorItem[];
  vendors?: Vendor[];
  quotes?: VendorQuote[];
  experienceIdeas: ExperienceIdea[];
  personalizedIdeas?: PersonalizedIdea[];
  savedIdeaIds?: string[];
  replanHistory?: ReplanHistoryEntry[];
  guestSummary: {
    totalGuests: number;
    adults: number;
    children: number;
    seniors: number;
    dietaryNotes: string;
  };
}


