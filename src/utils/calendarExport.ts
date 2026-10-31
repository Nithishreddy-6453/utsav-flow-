/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventPlan, TimelineTask } from '../types/plan';
import { EventDraft } from '../types';
import { parseISODateParts, addDaysToDate } from './dateCalculations';

export type CalendarExportScope = 'all' | 'event_only' | 'tasks_only';

export interface CalendarExportOptions {
  scope: CalendarExportScope;
  includeCompletedTasks?: boolean;
  /** Optional deterministic timestamp (YYYYMMDDTHHMMSSZ) for testing */
  dtstamp?: string;
}

export interface CalendarExportResult {
  success: boolean;
  filename: string;
  eventCount: number;
  content?: string;
  error?: string;
}

/**
 * Escapes plain text for iCalendar (RFC 5545).
 * Escapes backslashes, semicolons, commas, and converts newlines to literal '\n'.
 */
export function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Folds iCalendar lines so no line exceeds 75 octets (RFC 5545 section 3.1).
 * CRLF + space is used as line fold delimiter.
 */
export function foldICSLine(line: string): string {
  if (line.length <= 75) return line;
  
  let result = '';
  let remaining = line;
  let isFirst = true;
  
  while (remaining.length > 0) {
    const limit = isFirst ? 75 : 74; // account for continuation space
    if (remaining.length <= limit) {
      result += (isFirst ? '' : '\r\n ') + remaining;
      break;
    }
    
    result += (isFirst ? '' : '\r\n ') + remaining.substring(0, limit);
    remaining = remaining.substring(limit);
    isFirst = false;
  }
  
  return result;
}

/**
 * Formats YYYY-MM-DD into iCalendar DATE format YYYYMMDD.
 * Returns null if the date is invalid.
 */
export function formatDateToICS(dateStr: string): string | null {
  const parts = parseISODateParts(dateStr);
  if (!parts) return null;
  const y = String(parts.year).padStart(4, '0');
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Computes next day date string for RFC 5545 inclusive-exclusive all-day DTEND.
 */
export function getNextDayICS(dateStr: string): string | null {
  const nextDateStr = addDaysToDate(dateStr, 1);
  return formatDateToICS(nextDateStr);
}

/**
 * Formats current UTC time into iCalendar DTSTAMP: YYYYMMDDTHHMMSSZ
 */
export function generateDTSTAMP(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Generates a clean, safe filename from an event name.
 */
export function generateICSFilename(eventName?: string): string {
  const base = (eventName || 'utsavflow-event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'utsavflow-plan'}.ics`;
}

/**
 * Maps task priority to RFC 5545 priority integer (1 = high, 5 = medium, 9 = low).
 */
function mapPriorityToICS(priority: string): number {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 1;
    case 'medium':
      return 5;
    case 'low':
      return 9;
    default:
      return 0; // undefined
  }
}

/**
 * Generates valid iCalendar (.ics) RFC 5545 text content from an event plan.
 * Pure function: does NOT mutate plan or draft state.
 */
export function generateICSContent(
  plan: EventPlan,
  draft: EventDraft,
  options: CalendarExportOptions
): { content: string; eventCount: number } {
  const dtstamp = options.dtstamp || generateDTSTAMP();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UtsavFlow//Celebration Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escapeICSText(draft.eventName || 'UtsavFlow Celebration')
  ];

  let eventCount = 0;
  const seenUIDs = new Set<string>();

  // 1. Export Main Event (if scope is 'all' or 'event_only')
  if (options.scope === 'all' || options.scope === 'event_only') {
    const eventDate = draft.eventDate;
    const startDateICS = eventDate ? formatDateToICS(eventDate) : null;
    const endDateICS = eventDate ? getNextDayICS(eventDate) : null;

    if (startDateICS && endDateICS) {
      const eventUID = `utsavflow-event-${plan.id || 'primary'}-${startDateICS}@utsavflow.app`;
      if (!seenUIDs.has(eventUID)) {
        seenUIDs.add(eventUID);
        eventCount++;

        const summary = draft.eventName || 'Celebration Day';
        const location = draft.eventLocation || '';
        const descriptionParts: string[] = [
          `Event: ${draft.eventName || 'Celebration'}`,
          `Occasion: ${draft.occasionType || 'Celebration'}`,
          `Expected Guests: ${draft.totalGuests || 150}`,
          `Budget: ₹${(plan.budgetSummary?.totalBudget || draft.maxBudget || 0).toLocaleString('en-IN')}`,
          plan.summary ? `Summary: ${plan.summary}` : ''
        ].filter(Boolean);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${eventUID}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`DTSTART;VALUE=DATE:${startDateICS}`);
        lines.push(`DTEND;VALUE=DATE:${endDateICS}`);
        lines.push(`SUMMARY:${escapeICSText(summary)}`);
        if (descriptionParts.length > 0) {
          lines.push(`DESCRIPTION:${escapeICSText(descriptionParts.join('\n'))}`);
        }
        if (location) {
          lines.push(`LOCATION:${escapeICSText(location)}`);
        }
        lines.push('STATUS:CONFIRMED');
        lines.push('TRANSP:TRANSPARENT');
        lines.push('END:VEVENT');
      }
    }
  }

  // 2. Export Planning Tasks (if scope is 'all' or 'tasks_only')
  if (options.scope === 'all' || options.scope === 'tasks_only') {
    const tasks: TimelineTask[] = plan.timelineTasks || [];
    const taskMap = new Map<string, TimelineTask>();
    tasks.forEach(t => taskMap.set(t.id, t));

    for (const task of tasks) {
      // Completed task exclusion policy
      if (task.status === 'completed' && !options.includeCompletedTasks) {
        continue;
      }

      // Check for valid due date
      if (!task.dueDate) continue;
      const startDateICS = formatDateToICS(task.dueDate);
      const endDateICS = getNextDayICS(task.dueDate);
      if (!startDateICS || !endDateICS) continue;

      const taskUID = `utsavflow-task-${task.id}@utsavflow.app`;
      if (seenUIDs.has(taskUID)) continue;
      seenUIDs.add(taskUID);
      eventCount++;

      // Build context-rich description
      const descLines: string[] = [];
      if (task.description) {
        descLines.push(task.description);
      }
      descLines.push(`Phase: ${task.phase || 'General'}`);
      descLines.push(`Status: ${task.status.toUpperCase()}`);
      descLines.push(`Priority: ${task.priority.toUpperCase()}`);

      // Add prerequisite dependencies if present
      if (task.dependencyIds && task.dependencyIds.length > 0) {
        const prereqTitles = task.dependencyIds
          .map(depId => taskMap.get(depId)?.title)
          .filter(Boolean);
        if (prereqTitles.length > 0) {
          descLines.push(`Prerequisites: ${prereqTitles.join(', ')}`);
        }
      }

      if (task.notes) {
        descLines.push(`Notes: ${task.notes}`);
      }

      const statusMap: Record<string, string> = {
        completed: 'COMPIRMED',
        in_progress: 'CONFIRMED',
        pending: 'TENTATIVE',
        delayed: 'CONFIRMED'
      };

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${taskUID}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART;VALUE=DATE:${startDateICS}`);
      lines.push(`DTEND;VALUE=DATE:${endDateICS}`);
      lines.push(`SUMMARY:${escapeICSText(`[UtsavFlow] ${task.title}`)}`);
      lines.push(`DESCRIPTION:${escapeICSText(descLines.join('\n'))}`);
      lines.push(`STATUS:${statusMap[task.status] || 'TENTATIVE'}`);
      
      const priorityNum = mapPriorityToICS(task.priority);
      if (priorityNum > 0) {
        lines.push(`PRIORITY:${priorityNum}`);
      }
      lines.push('TRANSP:TRANSPARENT');
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');

  // Apply line folding and CRLF joining per RFC 5545
  const content = lines.map(line => foldICSLine(line)).join('\r\n') + '\r\n';
  return { content, eventCount };
}

/**
 * Triggers browser download of the generated .ics calendar file.
 * Safely creates and revokes blob URL.
 */
export function downloadICSFile(
  plan: EventPlan,
  draft: EventDraft,
  options: CalendarExportOptions
): CalendarExportResult {
  try {
    const { content, eventCount } = generateICSContent(plan, draft, options);
    const filename = generateICSFilename(draft.eventName);

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return {
      success: true,
      filename,
      eventCount,
      content
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate calendar export';
    return {
      success: false,
      filename: generateICSFilename(draft.eventName),
      eventCount: 0,
      error: errorMsg
    };
  }
}
