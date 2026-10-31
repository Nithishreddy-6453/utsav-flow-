/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventDraft, PresetConfig } from '../types.ts';

export const DEFAULT_DRAFT: EventDraft = {
  id: 'draft-' + Math.random().toString(36).substring(2, 9),
  eventName: "Ananya & Rahul's Grand Wedding",
  occasionType: 'wedding',
  eventDate: '2026-11-14',
  eventLocation: 'Bhubaneswar, Odisha',
  eventStyle: ['Traditional', 'Elegant', 'Modern Warm'],
  duration: '3+ Days Ceremonial',
  currency: 'INR',
  maxBudget: 800000,
  budgetFlexibility: 'strict',
  totalGuests: 200,
  adultGuests: 140,
  childGuests: 30,
  seniorGuests: 30,
  priorities: [
    'Food & Catering',
    'Guest Comfort & Hospitality',
    'Photography & Film',
    'Venue & Atmosphere',
    'Decoration & Florals'
  ],
  mustHaves: [
    'Pure Veg / Jain',
    'Live Shehnai / Acoustic',
    `Kids' Play Area`,
    'Wheelchair Access',
    'Indoor AC Fallback'
  ],
  customMustHaves: ['Wheelchair ramp to stage', 'No plastic water bottles'],
  culturalPreferences: 'Traditional Odia rituals (Baula Patani, Hastaganthi); ventilated havan mandap.',
  accessibilityRequirements: '25 seniors need cushioned ground-floor seating near mandap.',
  thingsToAvoid: 'No loud DJ after 10:30 PM; no thermocol/plastics.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const PRESETS: Record<string, PresetConfig> = {
  wedding: {
    title: 'Grand Indian Wedding',
    subtitle: 'Multi-event ceremony with critical high-scale banquet logistics.',
    occasionType: 'wedding',
    eventName: "Sharma & Verma Wedding",
    eventDate: '2027-02-15',
    eventLocation: 'Bhubaneswar, Odisha',
    eventStyle: ['Traditional & Regal', 'Modern Warm Elegant'],
    maxBudget: 800000,
    totalGuests: 200,
    adultGuests: 140,
    childGuests: 30,
    seniorGuests: 30,
    priorities: ['Food & Catering', 'Guest Comfort & Hospitality', 'Photography & Film', 'Venue & Atmosphere', 'Decoration & Florals'],
    mustHaves: ['Pure Veg / Jain', 'Live Shehnai / Acoustic', 'Kids\' Play Area', 'Wheelchair Access', 'Indoor AC Fallback'],
    culturalPreferences: 'Traditional Odia rituals; ventilated havan mandap.',
    accessibilityRequirements: 'Ground-floor cushioned seating near mandap for elders.',
    thingsToAvoid: 'No loud music past 10:30 PM; no single-use plastics.'
  },
  birthday: {
    title: "Milestone 50th Birthday Dinner",
    subtitle: 'Seated private dining experience with acoustic musical ensemble.',
    occasionType: 'birthday',
    eventName: "Aarav's 1st Birthday Carnival",
    eventDate: '2026-03-28',
    eventLocation: 'Mumbai, Maharashtra',
    eventStyle: ['Fun & Vibrant', 'Intimate'],
    maxBudget: 65000,
    totalGuests: 45,
    adultGuests: 30,
    childGuests: 10,
    seniorGuests: 5,
    priorities: ['Venue & Atmosphere', 'Food & Catering', 'Decoration & Florals', 'Photography & Film', 'Entertainment & Sound'],
    mustHaves: ['Kids\' Play Area', 'Indoor AC Fallback'],
    culturalPreferences: 'Cake cutting ceremony, playful themed backdrop.',
    accessibilityRequirements: 'Easy stroller and wheelchair parking.',
    thingsToAvoid: 'No hazardous confetti.'
  },
  community: {
    title: 'Community Cultural Utsav',
    subtitle: 'Multi-family collective gathering with distributed volunteer stages.',
    occasionType: 'community',
    eventName: 'City Cultural Utsav 2026',
    eventDate: '2026-05-10',
    eventLocation: 'Kolkata, West Bengal',
    eventStyle: ['Traditional', 'Fun & Vibrant'],
    maxBudget: 150000,
    totalGuests: 150,
    adultGuests: 100,
    childGuests: 30,
    seniorGuests: 20,
    priorities: ['Venue & Atmosphere', 'Food & Catering', 'Decoration & Florals', 'Photography & Film', 'Entertainment & Sound'],
    mustHaves: ['Wheelchair Access', 'Indoor AC Fallback'],
    culturalPreferences: 'Stage performances, community music ensemble.',
    accessibilityRequirements: 'Ramped entry and priority seating for elders.',
    thingsToAvoid: 'No single-use plastics.'
  }
};
