/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OccasionType = 'wedding' | 'birthday' | 'community' | 'other';

export type BudgetFlexibility = 'strict' | 'flexible';

export interface EventDraft {
  id: string;
  eventName: string;
  occasionType: OccasionType;
  eventDate: string; // YYYY-MM-DD
  eventLocation: string;
  eventStyle: string[];
  duration: string;
  
  // Budget & Guests
  currency: string; // 'INR'
  maxBudget: number;
  budgetFlexibility: BudgetFlexibility;
  totalGuests: number;
  adultGuests: number;
  childGuests: number;
  seniorGuests: number;

  // Priorities & Preferences
  priorities: string[]; // ordered list of category keys
  mustHaves: string[];
  customMustHaves: string[];
  culturalPreferences: string;
  accessibilityRequirements: string;
  thingsToAvoid: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PresetConfig {
  title: string;
  subtitle: string;
  occasionType: OccasionType;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventStyle: string[];
  maxBudget: number;
  totalGuests: number;
  adultGuests: number;
  childGuests: number;
  seniorGuests: number;
  priorities: string[];
  mustHaves: string[];
  culturalPreferences: string;
  accessibilityRequirements: string;
  thingsToAvoid: string;
}
