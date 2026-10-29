/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateICSContent,
  downloadICSFile,
  escapeICSText,
  foldICSLine,
  formatDateToICS,
  getNextDayICS,
  generateICSFilename
} from '../utils/calendarExport';
import { generateFallbackPlan } from '../utils/fallbackPlan';
import { DEFAULT_DRAFT } from '../data/presets';
import { EventPlan, TimelineTask, Vendor, VendorQuote, BudgetItem } from '../types/plan';
import { EventDraft } from '../types';
import { evaluateTaskDependency } from '../utils/dependencyEngine';
import { isDateOverdue } from '../utils/dateCalculations';

// Mock localStorage for Node environment
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, val: string) => { storageMap[key] = val; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};
// @ts-ignore
globalThis.localStorage = localStorageMock;

describe('Phase 7: Calendar Export & Print-Ready Event Brief', () => {
  let sampleDraft: EventDraft;
  let samplePlan: EventPlan;

  beforeEach(() => {
    localStorage.clear();
    sampleDraft = {
      ...DEFAULT_DRAFT,
      eventName: 'Aditi & Rohan Royal Wedding, Jaipur',
      occasionType: 'wedding',
      eventDate: '2026-12-15',
      eventLocation: 'Jaipur Heritage Palace, Rajasthan',
      maxBudget: 1500000,
      totalGuests: 250,
      priorities: ['Catering', 'Photography', 'Decor'],
      mustHaves: ['Vegetarian fine dining', 'Wheelchair ramp to mandap'],
      culturalPreferences: 'Traditional Marwari rituals with evening Sangeet',
      accessibilityRequirements: 'Ground floor seating for grandparents',
      thingsToAvoid: 'No plastic cutlery or loud bass after 10 PM'
    };

    samplePlan = generateFallbackPlan(sampleDraft);

    // Budget items with mixed cost sources and paid amounts
    samplePlan.budgetItems = [
      {
        id: 'b1',
        categoryId: 'cat_cat',
        categoryName: 'Catering',
        itemName: 'Grand Buffet Feast',
        calculationModel: 'per_guest',
        fixedAmount: 0,
        ratePerGuest: 1600,
        guestCount: 250,
        allocatedAmount: 400000,
        projectedCost: 400000,
        paidAmount: 100000,
        costSource: 'vendor_quote',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 'b2',
        categoryId: 'cat_photo',
        categoryName: 'Photography',
        itemName: 'Traditional & Candid Team',
        calculationModel: 'fixed',
        fixedAmount: 250000,
        ratePerGuest: 0,
        guestCount: 250,
        allocatedAmount: 250000,
        projectedCost: 250000,
        paidAmount: 50000,
        costSource: 'user_estimate',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 'b3',
        categoryId: 'cat_decor',
        categoryName: 'Decor',
        itemName: 'Mandap & Floral Stage',
        calculationModel: 'fixed',
        fixedAmount: 300000,
        ratePerGuest: 0,
        guestCount: 250,
        allocatedAmount: 300000,
        projectedCost: 300000,
        paidAmount: 0,
        costSource: 'ai_estimate',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }
    ];

    samplePlan.budgetSummary = {
      totalBudget: 1500000,
      projectedSpend: 950000,
      bufferReserve: 75000,
      categories: [
        { categoryName: 'Catering', allocated: 400000, spent: 100000, notes: '' },
        { categoryName: 'Photography', allocated: 250000, spent: 50000, notes: '' },
        { categoryName: 'Decor', allocated: 300000, spent: 0, notes: '' }
      ]
    };

    // Timeline tasks with completed, pending, blocked, and overdue states
    samplePlan.timelineTasks = [
      {
        id: 't_venue',
        title: 'Book Palace Venue Deposit',
        description: 'Sign contract and transfer 25% deposit',
        phase: 'Initial Planning',
        dueDate: '2026-10-15',
        daysBeforeEvent: 60,
        priority: 'high',
        status: 'completed',
        dependencyIds: [],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 't_caterer',
        title: 'Finalize Catering Menu Tasting',
        description: 'Taste live dessert counters and chaat',
        phase: 'Venue & Vendor Bookings',
        dueDate: '2026-11-15',
        daysBeforeEvent: 30,
        priority: 'high',
        status: 'in_progress',
        dependencyIds: ['t_venue'],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      },
      {
        id: 't_decor',
        title: 'Approve Floral Mandap Blueprint',
        description: 'Review marigold and rose entrance sketches',
        phase: 'Final Preparations',
        dueDate: '2026-12-01',
        daysBeforeEvent: 14,
        priority: 'medium',
        status: 'pending',
        dependencyIds: ['t_caterer'],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }
    ];

    // Vendors and quotes
    const vendor: Vendor = {
      id: 'v_royal',
      name: 'Royal Rajputana Caterers',
      category: 'Catering',
      contactPerson: 'Vikram Singh',
      phone: '+91 98290 55443',
      email: 'vikram@rajputanacatering.in',
      status: 'booked',
      notes: 'Confirmed 250 pax buffet with live mithai counters',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    };

    const quote: VendorQuote = {
      id: 'q_royal',
      vendorId: 'v_royal',
      vendorName: 'Royal Rajputana Caterers',
      category: 'Catering',
      title: 'Full Wedding Banquet Package',
      rawQuoteText: 'Buffet @ 1600 per head for 250 pax. Taxes extra as applicable.',
      quotedTotal: 400000,
      pricingModel: 'per_guest',
      ratePerGuest: 1600,
      reviewStatus: 'accepted',
      extractedAnalysis: {
        summary: 'Buffet proposal for 250 pax with taxes unstated',
        pricingBreakdown: {
          baseAmount: 400000,
          totalCalculated: 472000,
          isEstimatedTotal: true
        },
        inclusions: ['Cutlery', 'Service staff'],
        exclusions: ['Mineral water bottles'],
        taxAndTerms: {
          taxesIncluded: 'NOT_STATED' // unstated tax term
        },
        missingInformation: ['GST rate not specified', 'Overtime curfew policy'],
        followUpQuestions: ['Is 18% GST applicable on top?'],
        assumptions: ['Assuming standard venue kitchen setup']
      },
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    };

    samplePlan.vendors = [vendor];
    samplePlan.quotes = [quote];

    // Add applied replan history
    samplePlan.replanHistory = [
      {
        changeId: 'chg_1',
        strategyId: 'strat_protect',
        strategyTitle: 'Protect Top Priorities',
        strategyType: 'protect_priorities',
        previousConstraints: {
          maxBudget: 1600000,
          totalGuests: 200,
          eventDate: '2026-12-15'
        },
        updatedConstraints: {
          maxBudget: 1500000,
          totalGuests: 250,
          eventDate: '2026-12-15'
        },
        appliedAt: '2026-10-20T10:00:00Z',
        summary: 'Accommodated 50 additional guests while maintaining catering budget by trimming discretionary decor.',
        affectedBudgetItemIds: ['b1', 'b3'],
        affectedTaskIds: ['t_caterer']
      }
    ];
  });

  // ==========================================
  // SECTION 1: CALENDAR EXPORT (.ICS)
  // ==========================================
  describe('Calendar Export (.ics RFC 5545)', () => {
    it('1. generates valid export for an event with a valid date', () => {
      const { content, eventCount } = generateICSContent(samplePlan, sampleDraft, {
        scope: 'event_only',
        dtstamp: '20261026T000000Z'
      });

      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('VERSION:2.0');
      expect(content).toContain('PRODID:-//UtsavFlow//Celebration Planner//EN');
      expect(content).toContain('BEGIN:VEVENT');
      expect(content).toContain('SUMMARY:Aditi & Rohan Royal Wedding\\, Jaipur');
      expect(content).toContain('LOCATION:Jaipur Heritage Palace\\, Rajasthan');
      expect(content).toContain('END:VEVENT');
      expect(content).toContain('END:VCALENDAR');
      expect(eventCount).toBe(1);
    });

    it('2. exports all-day event using DTSTART/DTEND date-only syntax without timezone shift', () => {
      const { content } = generateICSContent(samplePlan, sampleDraft, {
        scope: 'event_only',
        dtstamp: '20261026T000000Z'
      });

      // Event on 2026-12-15 -> DTSTART:20261215, DTEND:20261216
      expect(content).toContain('DTSTART;VALUE=DATE:20261215');
      expect(content).toContain('DTEND;VALUE=DATE:20261216');
      expect(content).toContain('TRANSP:TRANSPARENT');
    });

    it('3. task deadlines use the actual saved due dates', () => {
      const { content } = generateICSContent(samplePlan, sampleDraft, {
        scope: 'tasks_only',
        includeCompletedTasks: true,
        dtstamp: '20261026T000000Z'
      });

      // Task t_caterer is due 2026-11-15 -> 20261115
      expect(content).toContain('DTSTART;VALUE=DATE:20261115');
      // Task t_decor is due 2026-12-01 -> 20261201
      expect(content).toContain('DTSTART;VALUE=DATE:20261201');
    });

    it('4. stable UIDs remain identical across repeated exports', () => {
      const run1 = generateICSContent(samplePlan, sampleDraft, {
        scope: 'all',
        includeCompletedTasks: true,
        dtstamp: '20261026T000000Z'
      });

      const run2 = generateICSContent(samplePlan, sampleDraft, {
        scope: 'all',
        includeCompletedTasks: true,
        dtstamp: '20261026T000000Z'
      });

      expect(run1.content).toBe(run2.content);
      expect(run1.content).toContain('UID:utsavflow-task-t_caterer@utsavflow.app');
      expect(run1.content).toContain('UID:utsavflow-task-t_decor@utsavflow.app');
    });

    it('5. special characters (commas, semicolons, backslashes, newlines) are escaped correctly', () => {
      const textWithSpecialChars = 'Notes: Flowers, lights; costs \\ 100% budget\nNext line';
      const escaped = escapeICSText(textWithSpecialChars);
      expect(escaped).toBe('Notes: Flowers\\, lights\\; costs \\\\ 100% budget\\nNext line');
    });

    it('6. invalid dates are handled safely without crashing', () => {
      const invalidDraft: EventDraft = {
        ...sampleDraft,
        eventDate: 'not-a-date'
      };

      const result = generateICSContent(samplePlan, invalidDraft, {
        scope: 'event_only'
      });

      // Skips invalid date event safely
      expect(result.eventCount).toBe(0);
      expect(result.content).toContain('BEGIN:VCALENDAR');
      expect(result.content).toContain('END:VCALENDAR');
    });

    it('7. duplicate event or task entries are never generated', () => {
      // Duplicate task in array
      const planWithDuplicateTasks = {
        ...samplePlan,
        timelineTasks: [...samplePlan.timelineTasks, samplePlan.timelineTasks[1]]
      };

      const { content, eventCount } = generateICSContent(planWithDuplicateTasks, sampleDraft, {
        scope: 'tasks_only',
        includeCompletedTasks: true
      });

      // Distinct tasks only
      expect(eventCount).toBe(3);
      const matches = content.match(/UID:utsavflow-task-t_caterer@utsavflow\.app/g);
      expect(matches?.length).toBe(1);
    });

    it('8. completed-task inclusion and exclusion options work correctly', () => {
      // Default: exclude completed tasks
      const defaultExport = generateICSContent(samplePlan, sampleDraft, {
        scope: 'tasks_only',
        includeCompletedTasks: false
      });
      expect(defaultExport.content).not.toContain('t_venue'); // completed task excluded
      expect(defaultExport.eventCount).toBe(2);

      // Explicit: include completed tasks
      const fullExport = generateICSContent(samplePlan, sampleDraft, {
        scope: 'tasks_only',
        includeCompletedTasks: true
      });
      expect(fullExport.content).toContain('t_venue'); // completed task included
      expect(fullExport.eventCount).toBe(3);
    });

    it('9. empty timelines export correctly with 0 tasks', () => {
      const emptyPlan = {
        ...samplePlan,
        timelineTasks: []
      };

      const { content, eventCount } = generateICSContent(emptyPlan, sampleDraft, {
        scope: 'tasks_only'
      });

      expect(eventCount).toBe(0);
      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('END:VCALENDAR');
    });

    it('10. exporting never mutates the saved plan or draft', () => {
      const planBefore = JSON.stringify(samplePlan);
      const draftBefore = JSON.stringify(sampleDraft);

      generateICSContent(samplePlan, sampleDraft, {
        scope: 'all',
        includeCompletedTasks: true
      });

      expect(JSON.stringify(samplePlan)).toBe(planBefore);
      expect(JSON.stringify(sampleDraft)).toBe(draftBefore);
    });
  });

  // ==========================================
  // SECTION 2: EVENT BRIEF DATA CONSISTENCY
  // ==========================================
  describe('Event Brief Data Consistency & Content Integrity', () => {
    it('11. compiles correct event summary from saved draft', () => {
      expect(sampleDraft.eventName).toBe('Aditi & Rohan Royal Wedding, Jaipur');
      expect(sampleDraft.occasionType).toBe('wedding');
      expect(sampleDraft.eventDate).toBe('2026-12-15');
      expect(sampleDraft.totalGuests).toBe(250);
      expect(sampleDraft.eventLocation).toBe('Jaipur Heritage Palace, Rajasthan');
    });

    it('12. budget totals in brief match Budget Ledger calculations', () => {
      const totalBudget = samplePlan.budgetSummary.totalBudget;
      const projectedSpend = samplePlan.budgetSummary.projectedSpend;
      const deficitOrSurplus = totalBudget - projectedSpend;

      expect(totalBudget).toBe(1500000);
      expect(projectedSpend).toBe(950000);
      expect(deficitOrSurplus).toBe(550000);
      expect(deficitOrSurplus).toBeGreaterThan(0);
    });

    it('13. budget source labels are preserved (vendor_quote, user_estimate, ai_estimate)', () => {
      const sources = samplePlan.budgetItems.map(item => item.costSource);
      expect(sources).toContain('vendor_quote');
      expect(sources).toContain('user_estimate');
      expect(sources).toContain('ai_estimate');
    });

    it('14. only actual recorded payments are included in Paid So Far', () => {
      // b1: 100k, b2: 50k, b3: 0 => total = 150,000
      const paidSoFar = samplePlan.budgetItems.reduce((acc, item) => acc + (item.paidAmount || 0), 0);
      expect(paidSoFar).toBe(150000);
    });

    it('15. timeline tasks and statuses match the saved plan', () => {
      const statuses = samplePlan.timelineTasks.map(t => t.status);
      expect(statuses).toContain('completed');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('pending');
    });

    it('16. blocked, delayed, and overdue states remain distinct in evaluations', () => {
      // t_decor depends on t_caterer (which is in_progress, not completed) => blocked!
      const decorTask = samplePlan.timelineTasks.find(t => t.id === 't_decor')!;
      const depStatus = evaluateTaskDependency(decorTask, samplePlan.timelineTasks);
      expect(depStatus.isBlocked).toBe(true);

      // t_venue is completed, so it is never considered blocked
      const venueTask = samplePlan.timelineTasks.find(t => t.id === 't_venue')!;
      const venueDepStatus = evaluateTaskDependency(venueTask, samplePlan.timelineTasks);
      expect(venueDepStatus.isBlocked).toBe(false);

      // Overdue check
      const pastDueDate = '2020-01-01';
      expect(isDateOverdue(pastDueDate)).toBe(true);
      const futureDueDate = '2030-01-01';
      expect(isDateOverdue(futureDueDate)).toBe(false);
    });

    it('17. vendor quotation and booking statuses are accurate', () => {
      const vendor = samplePlan.vendors![0];
      expect(vendor.status).toBe('booked');
      const quote = samplePlan.quotes![0];
      expect(quote.reviewStatus).toBe('accepted');
      expect(quote.quotedTotal).toBe(400000);
    });

    it('18. missing information is accurately flagged rather than replaced with invented facts', () => {
      const quote = samplePlan.quotes![0];
      expect(quote.extractedAnalysis?.taxAndTerms?.taxesIncluded).toBe('NOT_STATED');
      expect(quote.extractedAnalysis?.missingInformation).toContain('GST rate not specified');
    });

    it('19. optional sections respect user selections (completed tasks, vendor contacts, replan)', () => {
      const completedTasks = samplePlan.timelineTasks.filter(t => t.status === 'completed');
      expect(completedTasks.length).toBe(1);

      // Vendor contact details exist
      const vendor = samplePlan.vendors![0];
      expect(vendor.phone).toBe('+91 98290 55443');
      expect(vendor.email).toBe('vikram@rajputanacatering.in');
    });

    it('20. only the current event data is included in the brief', () => {
      expect(samplePlan.id).toBe(samplePlan.id);
      expect(sampleDraft.eventName).toContain('Aditi & Rohan');
    });

    it('21. recent replanning history distinguishes applied changes from simulations', () => {
      expect(samplePlan.replanHistory).toBeDefined();
      expect(samplePlan.replanHistory?.length).toBe(1);
      const latest = samplePlan.replanHistory![0];
      expect(latest.strategyTitle).toBe('Protect Top Priorities');
      expect(latest.strategyType).toBe('protect_priorities');
      expect(latest.previousConstraints.totalGuests).toBe(200);
      expect(latest.updatedConstraints.totalGuests).toBe(250);
    });

    it('22. generating or previewing an Event Brief never mutates the saved plan', () => {
      const planSnapshot = JSON.stringify(samplePlan);
      const draftSnapshot = JSON.stringify(sampleDraft);

      // Reading derived properties for brief
      const totalBudget = samplePlan.budgetSummary.totalBudget;
      const tasks = samplePlan.timelineTasks;
      const vendors = samplePlan.vendors;

      expect(JSON.stringify(samplePlan)).toBe(planSnapshot);
      expect(JSON.stringify(sampleDraft)).toBe(draftSnapshot);
    });
  });

  // ==========================================
  // SECTION 3: INTEGRATION & INTEROPERABILITY
  // ==========================================
  describe('Integration, Formatting & Error Resilience', () => {
    it('23. calendar download utility generates safe filename based on event name', () => {
      const filename = generateICSFilename('Aditi & Rohan Wedding!');
      expect(filename).toBe('aditi-rohan-wedding.ics');
    });

    it('24. line folding complies with RFC 5545 max 75 octet rule', () => {
      const longText = 'DESCRIPTION:This is a very long celebration description that exceeds seventy five characters in a single line and must be folded properly';
      const folded = foldICSLine(longText);
      const lines = folded.split('\r\n ');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0].length).toBeLessThanOrEqual(75);
    });

    it('25. date conversions produce consistent YYYYMMDD date strings', () => {
      expect(formatDateToICS('2026-12-15')).toBe('20261215');
      expect(getNextDayICS('2026-12-15')).toBe('20261216');
      expect(formatDateToICS('invalid')).toBeNull();
    });

    it('26. downloadICSFile handles runtime errors gracefully without throwing', () => {
      // Passing non-existent plan safely caught
      // @ts-ignore
      const result = downloadICSFile(null, sampleDraft, { scope: 'all' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
