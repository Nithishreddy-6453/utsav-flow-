/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventDraft } from '../types';
import { EventPlan, BudgetItem, TimelineTask, Vendor, VendorQuote } from '../types/plan';
import { calculateDueDateFromOffset } from './dateCalculations';
import { analyzeQuoteDeterministically } from './quoteAnalysis';
import { generateDeterministicIdeas } from './ideaEngine';

export function generateDefaultVendors(): Vendor[] {
  return [
    {
      id: 'vendor_1',
      name: 'Royal Spice Caterers',
      category: 'Catering',
      contactPerson: 'Chef Rajesh Sharma',
      phone: '+91 98201 12345',
      email: 'rajesh@royalspicecatering.in',
      status: 'quote_received',
      notes: 'Reputed heritage catering team specializing in multi-cuisine North & South Indian spreads.',
      linkedBudgetItemId: 'bi_catering_2',
      linkedTimelineTaskId: 'task_catering_lock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vendor_2',
      name: 'Utsav Flavours Hospitality',
      category: 'Catering',
      contactPerson: 'Sunil Verma',
      phone: '+91 98112 54321',
      email: 'contact@utsavflavours.com',
      status: 'quote_received',
      notes: 'Boutique celebration caterer with live street food counters.',
      linkedBudgetItemId: 'bi_catering_2',
      linkedTimelineTaskId: 'task_catering_lock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vendor_3',
      name: 'Grand Heritage Palace Grounds',
      category: 'Venue',
      contactPerson: 'Meera Deshmukh',
      phone: '+91 98230 98765',
      email: 'events@grandheritagepalace.com',
      status: 'shortlisted',
      notes: 'Central ballroom with connected lawn and parking for 120 cars.',
      linkedBudgetItemId: 'bi_venue_1',
      linkedTimelineTaskId: 'task_venue_scout',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vendor_4',
      name: 'Luminary Cinematic Stories',
      category: 'Photography',
      contactPerson: 'Arjun Nair',
      phone: '+91 98900 11223',
      email: 'arjun@luminarystories.studio',
      status: 'contacted',
      notes: 'Traditional plus candid crew with drone clearance.',
      linkedBudgetItemId: 'bi_photo_4',
      linkedTimelineTaskId: 'task_photo_book',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'vendor_5',
      name: 'Blossom & Light Studio',
      category: 'Decor',
      contactPerson: 'Kavita Roy',
      phone: '+91 98450 33445',
      email: 'kavita@blossomlight.design',
      status: 'contacted',
      notes: 'Specializes in fresh marigold, jasmine and architectural fairy light setups.',
      linkedBudgetItemId: 'bi_decor_3',
      linkedTimelineTaskId: 'task_decor_concept',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function generateDefaultQuotes(vendors: Vendor[], totalGuests: number = 150): VendorQuote[] {
  const v1 = vendors.find(v => v.name.includes('Royal Spice')) || vendors[0];
  const v2 = vendors.find(v => v.name.includes('Utsav Flavours')) || vendors[1];

  const q1: VendorQuote = {
    id: 'quote_1',
    vendorId: v1?.id || 'vendor_1',
    vendorName: v1?.name || 'Royal Spice Caterers',
    category: 'Catering',
    title: 'Grand Heritage Buffet & Live Counters',
    rawQuoteText: `Quotation from Royal Spice Caterers
Date: Valid for 30 days
Event: Celebration Buffet for 150-200 Guests

Package Cost: ₹2,40,000 (All-Inclusive)
Includes:
- Full multi-course buffet (3 starters, 2 live chaat counters, 4 main curries, dal makhani, assorted breads, 3 desserts)
- High-grade bone china crockery, cutlery, and glassware
- Uniformed service captain and 12 waitstaff
- 250ml sealed mineral water bottles & beverage ice
- Chafing dishes, fuel, and setup/cleanup
- 18% GST is included in the package rate. No hidden surcharge.

Payment terms: 40% advance to confirm, 50% one week prior, 10% after event wrap.
Cancellation: 80% refund if cancelled 30 days prior.`,
    quotedTotal: 240000,
    pricingModel: 'per_guest',
    ratePerGuest: 1600,
    validUntil: '2026-12-31',
    reviewStatus: 'analyzed',
    linkedBudgetItemId: 'bi_catering_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const q2: VendorQuote = {
    id: 'quote_2',
    vendorId: v2?.id || 'vendor_2',
    vendorName: v2?.name || 'Utsav Flavours Hospitality',
    category: 'Catering',
    title: 'Street Flavours & Feast Combo',
    rawQuoteText: `ESTIMATE - UTSAV FLAVOURS HOSPITALITY
Client: Celebration Banquet
Base Rate: ₹2,20,000 for up to 150 guests (Extra guests @ ₹1,400/head)

Includes:
- 4 starters, live paani puri & tikki counter, 3 mains, breads, gulab jamun with rabri
- Standard melamine dinnerware and paper napkins
- 8 service staff

Exclusions:
- Taxes extra: GST 18% applies on final bill
- Drinking water jars and ice to be provided by host or charged separately
- Generator fuel & kitchen gas cylinders extra at ₹6,500
- Overtime after 11:30 PM: ₹5,000/hour

Payment: 50% non-refundable deposit on booking. Balance on event morning.`,
    quotedTotal: 220000,
    pricingModel: 'lump_sum',
    ratePerGuest: 1467,
    validUntil: '2026-11-30',
    reviewStatus: 'analyzed',
    linkedBudgetItemId: 'bi_catering_2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  q1.extractedAnalysis = analyzeQuoteDeterministically(q1, totalGuests);
  q2.extractedAnalysis = analyzeQuoteDeterministically(q2, totalGuests);

  return [q1, q2];
}

export function generateDefaultBudgetItems(totalBudget: number, totalGuests: number): BudgetItem[] {
  const guests = Math.max(1, totalGuests || 150);
  const budget = Math.max(50000, totalBudget || 1000000);

  const cateringRate = Math.max(300, Math.round((budget * 0.3) / guests));
  const cateringProjected = cateringRate * guests;

  return [
    {
      id: 'bi_venue_1',
      categoryId: 'venue',
      categoryName: 'Venue',
      itemName: 'Banquet Hall & Lawns',
      calculationModel: 'fixed',
      fixedAmount: Math.round(budget * 0.25),
      ratePerGuest: 0,
      guestCount: guests,
      allocatedAmount: Math.round(budget * 0.25),
      projectedCost: Math.round(budget * 0.25),
      paidAmount: Math.round(budget * 0.05),
      costSource: 'user_estimate',
      sourceNotes: 'Air conditioned hall plus outdoor lawn for rituals',
      quotationReference: 'Grand Palace Lawn quote v1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bi_catering_2',
      categoryId: 'catering',
      categoryName: 'Catering & Food',
      itemName: 'Full Course Celebration Feast',
      calculationModel: 'per_guest',
      fixedAmount: 0,
      ratePerGuest: cateringRate,
      guestCount: guests,
      allocatedAmount: Math.round(budget * 0.3),
      projectedCost: cateringProjected,
      paidAmount: 0,
      costSource: 'vendor_quote',
      sourceNotes: 'Includes welcome drinks, starters, main buffet, and desserts',
      quotationReference: 'Royal Gourmet Caterers Quote #402',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bi_decor_3',
      categoryId: 'decor',
      categoryName: 'Decoration & Lighting',
      itemName: 'Floral Stage & Ambient Lighting',
      calculationModel: 'fixed',
      fixedAmount: Math.round(budget * 0.15),
      ratePerGuest: 0,
      guestCount: guests,
      allocatedAmount: Math.round(budget * 0.15),
      projectedCost: Math.round(budget * 0.16),
      paidAmount: 0,
      costSource: 'ai_estimate',
      sourceNotes: 'Marigold and rose florals with warm fairy lighting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bi_photo_4',
      categoryId: 'photography',
      categoryName: 'Photography & Videography',
      itemName: 'Cinematic Film & Candid Shoots',
      calculationModel: 'fixed',
      fixedAmount: Math.round(budget * 0.12),
      ratePerGuest: 0,
      guestCount: guests,
      allocatedAmount: Math.round(budget * 0.12),
      projectedCost: Math.round(budget * 0.12),
      paidAmount: 0,
      costSource: 'user_estimate',
      sourceNotes: '2 candid photographers + 1 drone videographer + teaser reel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bi_entertainment_5',
      categoryId: 'entertainment',
      categoryName: 'Entertainment',
      itemName: 'DJ Sound, Console & Dhol Players',
      calculationModel: 'fixed',
      fixedAmount: Math.round(budget * 0.08),
      ratePerGuest: 0,
      guestCount: guests,
      allocatedAmount: Math.round(budget * 0.08),
      projectedCost: Math.round(budget * 0.08),
      paidAmount: 0,
      costSource: 'user_estimate',
      sourceNotes: 'Sound system, stage mics, and 2 live Punjabi dhol players',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function generateDefaultTimelineTasks(eventDateStr: string): TimelineTask[] {
  const eventDate = eventDateStr || '2026-11-20';

  return [
    {
      id: 'task_theme_budget',
      title: 'Finalize Event Style & Budget Envelope',
      description: 'Sign off on cultural nuances, style priorities, and set strict category limits.',
      phase: 'Initial Planning',
      dueDate: calculateDueDateFromOffset(eventDate, 120),
      daysBeforeEvent: 120,
      priority: 'high',
      status: 'completed',
      dependencyIds: [],
      notes: 'Initial vision aligned with family members',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_guest_list',
      title: 'Assemble Master Guest List & Cohort Breakdown',
      description: 'Aggregate guest contacts across families, categorizing adults, seniors, and children.',
      phase: 'Initial Planning',
      dueDate: calculateDueDateFromOffset(eventDate, 100),
      daysBeforeEvent: 100,
      priority: 'high',
      status: 'completed',
      dependencyIds: ['task_theme_budget'],
      notes: 'Total guest count locked in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_venue_booking',
      title: 'Finalize & Book Primary Venue',
      description: 'Sign agreement with lawn and banquet hall, verify power backup and curfew rules.',
      phase: 'Venue & Vendor Bookings',
      dueDate: calculateDueDateFromOffset(eventDate, 90),
      daysBeforeEvent: 90,
      priority: 'high',
      status: 'in_progress',
      dependencyIds: ['task_guest_list'],
      notes: 'Initial deposit prepared, contract under legal review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_catering_tasting',
      title: 'Catering Menu Tasting & Vendor Sign-off',
      description: 'Conduct food tasting session, verify dietary and cultural meal requirements.',
      phase: 'Venue & Vendor Bookings',
      dueDate: calculateDueDateFromOffset(eventDate, 75),
      daysBeforeEvent: 75,
      priority: 'high',
      status: 'pending',
      dependencyIds: ['task_venue_booking'],
      notes: 'Requires venue kitchen access confirmation first',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_photo_video',
      title: 'Confirm Photography & Cinematic Film Team',
      description: 'Review portfolio, lock drone permissions, and confirm deliverables.',
      phase: 'Venue & Vendor Bookings',
      dueDate: calculateDueDateFromOffset(eventDate, 70),
      daysBeforeEvent: 70,
      priority: 'medium',
      status: 'pending',
      dependencyIds: ['task_venue_booking'],
      notes: 'Booked Luminary Cinematic Stories',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_decor_concept',
      title: 'Approve Stage Decor & Floral Blueprint',
      description: 'Review 3D floral sketches, lighting layout, and mandap/stage dimensions.',
      phase: 'Venue & Vendor Bookings',
      dueDate: calculateDueDateFromOffset(eventDate, 60),
      daysBeforeEvent: 60,
      priority: 'medium',
      status: 'pending',
      dependencyIds: ['task_venue_booking'],
      notes: 'Must match traditional theme',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_invitations_dispatch',
      title: 'Dispatch Digital & Physical Invitations',
      description: 'Mail printed cards and broadcast digital RSVP invitations to guests.',
      phase: 'Final Preparations',
      dueDate: calculateDueDateFromOffset(eventDate, 45),
      daysBeforeEvent: 45,
      priority: 'high',
      status: 'pending',
      dependencyIds: ['task_catering_tasting'],
      notes: 'RSVP deadline set to 2 weeks before event',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_sound_dimensions',
      title: 'Sound & Stage Dimension Sign-off',
      description: 'Confirm acoustic levels, electrical power loads, and stage measurements with DJ and venue.',
      phase: 'Final Preparations',
      dueDate: calculateDueDateFromOffset(eventDate, 30),
      daysBeforeEvent: 30,
      priority: 'medium',
      status: 'pending',
      dependencyIds: ['task_decor_concept'],
      notes: 'Ensure sound permits are in order for outdoor timings',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_seating_dietary',
      title: 'Finalize Guest Seating & Dietary Audit',
      description: 'Map out table arrangements with special accessibility seating for senior guests.',
      phase: 'Final Preparations',
      dueDate: calculateDueDateFromOffset(eventDate, 14),
      daysBeforeEvent: 14,
      priority: 'medium',
      status: 'pending',
      dependencyIds: ['task_invitations_dispatch'],
      notes: 'Coordinate with caterer for live counters',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_vendor_arrival',
      title: 'Vendor Arrival & Setup Coordination',
      description: 'Direct morning arrivals of caterers, decorators, and AV technicians.',
      phase: 'Event Day',
      dueDate: calculateDueDateFromOffset(eventDate, 0),
      daysBeforeEvent: 0,
      priority: 'high',
      status: 'pending',
      dependencyIds: ['task_sound_dimensions', 'task_seating_dietary'],
      notes: 'Coordinate access with venue manager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task_ceremony_flow',
      title: 'Ceremonial Flow & Master of Ceremonies Briefing',
      description: 'Run through schedule with officiant, hosts, and timeline coordinator.',
      phase: 'Event Day',
      dueDate: calculateDueDateFromOffset(eventDate, 0),
      daysBeforeEvent: 0,
      priority: 'high',
      status: 'pending',
      dependencyIds: ['task_vendor_arrival'],
      notes: 'Ensure microphone checks complete by 4 PM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

export function generateFallbackPlan(draft: EventDraft): EventPlan {
  const totalBudget = draft.maxBudget || 1000000;
  const categoriesList = draft.priorities && draft.priorities.length > 0 
    ? draft.priorities 
    : ['Venue & Catering', 'Decor & Ambience', 'Photography & Film', 'Entertainment', 'Attire & Styling'];

  const weights = [0.35, 0.25, 0.15, 0.15, 0.10];
  const categories = categoriesList.map((cat, idx) => {
    const weight = weights[idx] || 0.10;
    const allocated = Math.round(totalBudget * weight);
    return {
      categoryName: cat,
      allocated,
      spent: Math.round(allocated * 0.2),
      notes: `Allocated based on priority rank #${idx + 1}. Includes buffer for peak season.`
    };
  });

  const budgetItems = generateDefaultBudgetItems(totalBudget, draft.totalGuests || 150);
  const timelineTasks = generateDefaultTimelineTasks(draft.eventDate || '2026-11-20');
  const defaultVendors = generateDefaultVendors();
  const defaultQuotes = generateDefaultQuotes(defaultVendors, draft.totalGuests || 150);
  const projectedSpend = budgetItems.reduce((sum, item) => sum + item.projectedCost, 0);
  const bufferReserve = Math.round(totalBudget * 0.05);

  return {
    id: `plan_${Date.now()}`,
    eventName: draft.eventName || 'Grand Celebration',
    generatedAt: new Date().toISOString(),
    version: 1,
    isInitialized: true,
    summary: `A meticulously planned ${draft.occasionType} for ${draft.totalGuests} guests in ${draft.eventLocation}. Styled with ${draft.eventStyle?.join(', ') || 'classic elegance'} with high protection for ${categoriesList[0] || 'Venue'}.`,
    budgetSummary: {
      totalBudget,
      projectedSpend,
      bufferReserve,
      categories
    },
    budgetItems,
    timelineTasks,
    vendors: defaultVendors,
    quotes: defaultQuotes,
    timelineMilestones: [
      {
        id: 'm1',
        phase: 'Vendor Booking',
        title: 'Secure Primary Venue & Caterer',
        dueDate: calculateDueDateFromOffset(draft.eventDate || '2026-11-20', 90),
        status: 'urgent',
        description: `Finalize contracts and deposit for ${draft.eventLocation}.`
      },
      {
        id: 'm2',
        phase: 'Design & Decor',
        title: 'Finalize Floral & Stage Design Concept',
        dueDate: calculateDueDateFromOffset(draft.eventDate || '2026-11-20', 60),
        status: 'pending',
        description: `Incorporate ${draft.eventStyle?.join(', ') || 'traditional motifs'} and cultural preferences.`
      },
      {
        id: 'm3',
        phase: 'Invitations',
        title: 'Dispatch Digital & Print Invitations',
        dueDate: calculateDueDateFromOffset(draft.eventDate || '2026-11-20', 45),
        status: 'pending',
        description: `Manage RSVPs for ${draft.totalGuests} confirmed guests.`
      },
      {
        id: 'm4',
        phase: 'Logistics',
        title: 'Final Guest Seating & Dietary Audit',
        dueDate: calculateDueDateFromOffset(draft.eventDate || '2026-11-20', 14),
        status: 'pending',
        description: `Ensure compliance with accessibility requirements: ${draft.accessibilityRequirements || 'None specified'}.`
      }
    ],
    vendorChecklist: [
      {
        id: 'v1',
        category: 'Venue',
        vendorName: 'Grand Palace Lawns & Banquets',
        estimatedCost: Math.round(totalBudget * 0.3),
        status: 'quoted',
        notes: 'Includes air-conditioned bridal suite and power backup.'
      },
      {
        id: 'v2',
        category: 'Catering',
        vendorName: 'Royal Gourmet Chefs & Hospitality',
        estimatedCost: Math.round(totalBudget * 0.25),
        status: 'booked',
        notes: `Custom multi-course menu respecting exclusions: ${draft.thingsToAvoid || 'None'}.`
      },
      {
        id: 'v3',
        category: 'Photography',
        vendorName: 'Luminary Cinematic Stories',
        estimatedCost: Math.round(totalBudget * 0.15),
        status: 'to-contact',
        notes: 'Candid photography, drone coverage, and 4K cinematic film.'
      },
      {
        id: 'v4',
        category: 'Decor',
        vendorName: 'Blossom & Light Studio',
        estimatedCost: Math.round(totalBudget * 0.15),
        status: 'to-contact',
        notes: `Floral arrangements matching ${draft.eventStyle?.join(', ') || 'vibrant'} theme.`
      }
    ],
    experienceIdeas: [
      {
        id: 'e1',
        title: 'Personalized Welcome & Floral Garlands',
        description: 'Traditional welcome station with artisanal welcome drinks and bespoke flower garlands.',
        impact: 'Delight',
        category: 'Guest Experience'
      },
      {
        id: 'e2',
        title: 'Live Acoustic & Fusion Instrumentalists',
        description: 'Ambient live music during cocktail hour creating an immersive atmosphere.',
        impact: 'High',
        category: 'Entertainment'
      },
      {
        id: 'e3',
        title: 'Curated Late-Night Dessert & Chai Bar',
        description: 'Specialty artisanal chai station with gourmet mithai and fusion pastries.',
        impact: 'Medium',
        category: 'Catering'
      }
    ],
    personalizedIdeas: generateDeterministicIdeas(draft),
    savedIdeaIds: [],
    guestSummary: {
      totalGuests: draft.totalGuests,
      adults: draft.adultGuests,
      children: draft.childGuests,
      seniors: draft.seniorGuests,
      dietaryNotes: `Prepared for ${draft.totalGuests} guests with consideration for senior seating and children preferences. ${draft.accessibilityRequirements ? 'Accessibility required: ' + draft.accessibilityRequirements : ''}`
    }
  };
}
