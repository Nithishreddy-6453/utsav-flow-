/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses YYYY-MM-DD into calendar parts without timezone shifts.
 */
export function parseISODateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Creates UTC date object matching calendar date at 00:00:00 UTC.
 */
export function createUTCDate(dateStr: string): Date | null {
  const parts = parseISODateParts(dateStr);
  if (!parts) return null;
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0));
}

/**
 * Formats UTC Date to YYYY-MM-DD.
 */
export function formatToISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds or subtracts days to an ISO YYYY-MM-DD string using UTC calendar arithmetic.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const date = createUTCDate(dateStr);
  if (!date) return dateStr;
  date.setUTCDate(date.getUTCDate() + days);
  return formatToISODate(date);
}

/**
 * Calculates due date given an event date and number of days before the event.
 * e.g., Event on 2026-11-20, offset 30 days before = 2026-10-21.
 */
export function calculateDueDateFromOffset(eventDateStr: string, daysBeforeEvent: number): string {
  const safeOffset = Math.max(0, Math.round(daysBeforeEvent || 0));
  return addDaysToDate(eventDateStr, -safeOffset);
}

/**
 * Calculates calendar days remaining between referenceDate and targetDate.
 * If targetDate is in the past relative to referenceDate, returns a negative number.
 */
export function calculateDaysRemaining(targetDateStr: string, referenceDateStr?: string): number {
  const target = createUTCDate(targetDateStr);
  if (!target) return 0;

  let ref: Date;
  if (referenceDateStr) {
    const parsedRef = createUTCDate(referenceDateStr);
    ref = parsedRef || new Date();
  } else {
    // Current UTC calendar date at 00:00:00 UTC
    const now = new Date();
    ref = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  }

  const diffMs = target.getTime() - ref.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.round(diffMs / oneDayMs);
}

/**
 * Checks if a due date is in the past relative to reference date (exclusive of today).
 */
export function isDateOverdue(dueDateStr: string, referenceDateStr?: string): boolean {
  const daysLeft = calculateDaysRemaining(dueDateStr, referenceDateStr);
  return daysLeft < 0;
}

/**
 * Formats YYYY-MM-DD into a human-readable format e.g. "15 Nov 2026" or "Nov 15, 2026".
 */
export function formatDisplayDate(dateStr: string): string {
  const parts = parseISODateParts(dateStr);
  if (!parts) return dateStr || 'TBD';

  try {
    const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(utcDate);
  } catch {
    return dateStr;
  }
}
