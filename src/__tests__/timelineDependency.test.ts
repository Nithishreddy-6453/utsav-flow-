/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDueDateFromOffset,
  calculateDaysRemaining,
  isDateOverdue,
  formatDisplayDate,
  addDaysToDate
} from '../utils/dateCalculations';
import {
  validateTaskDependencies,
  detectCycle,
  getDownstreamTasks,
  evaluateTaskDependency,
  calculateTimelineSummary
} from '../utils/dependencyEngine';
import { TimelineTask } from '../types/plan';

describe('Deterministic Date Calculations', () => {
  it('1. calculates due date relative to event correctly', () => {
    // 2026-11-20 minus 30 days = 2026-10-21
    expect(calculateDueDateFromOffset('2026-11-20', 30)).toBe('2026-10-21');
    // 0 days before event = event day
    expect(calculateDueDateFromOffset('2026-11-20', 0)).toBe('2026-11-20');
    // 90 days before event = 2026-08-22
    expect(calculateDueDateFromOffset('2026-11-20', 90)).toBe('2026-08-22');
  });

  it('2. adjusts correctly when event date changes', () => {
    const originalEvent = '2026-10-15';
    const updatedEvent = '2026-11-15';
    const offset = 14;

    const originalDue = calculateDueDateFromOffset(originalEvent, offset);
    const updatedDue = calculateDueDateFromOffset(updatedEvent, offset);

    expect(originalDue).toBe('2026-10-01');
    expect(updatedDue).toBe('2026-11-01');
  });

  it('3. handles past dates and remaining days accurately', () => {
    // Using reference date 2026-10-26
    const refDate = '2026-10-26';
    expect(calculateDaysRemaining('2026-10-30', refDate)).toBe(4);
    expect(calculateDaysRemaining('2026-10-26', refDate)).toBe(0);
    expect(calculateDaysRemaining('2026-10-20', refDate)).toBe(-6);

    expect(isDateOverdue('2026-10-20', refDate)).toBe(true);
    expect(isDateOverdue('2026-10-30', refDate)).toBe(false);
  });

  it('4. performs pure calendar date arithmetic without timezone shifts', () => {
    const start = '2026-02-28';
    expect(addDaysToDate(start, 1)).toBe('2026-03-01');
    expect(formatDisplayDate('2026-11-20')).toContain('Nov');
  });
});

describe('Dependency Engine & Graph Algorithms', () => {
  const sampleTasks: TimelineTask[] = [
    { id: 't1', title: 'Task 1', description: '', phase: 'P1', dueDate: '2026-10-01', priority: 'high', status: 'completed', dependencyIds: [], createdAt: '', updatedAt: '' },
    { id: 't2', title: 'Task 2', description: '', phase: 'P1', dueDate: '2026-10-10', priority: 'medium', status: 'pending', dependencyIds: ['t1'], createdAt: '', updatedAt: '' },
    { id: 't3', title: 'Task 3', description: '', phase: 'P2', dueDate: '2026-10-20', priority: 'medium', status: 'pending', dependencyIds: ['t2'], createdAt: '', updatedAt: '' },
  ];

  it('5. validates valid dependency references', () => {
    const result = validateTaskDependencies(sampleTasks);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('6. catches non-existent dependency IDs', () => {
    const invalidTasks: TimelineTask[] = [
      { id: 't1', title: 'Task 1', description: '', phase: 'P1', dueDate: '2026-10-01', priority: 'high', status: 'pending', dependencyIds: ['missing_id'], createdAt: '', updatedAt: '' }
    ];
    const result = validateTaskDependencies(invalidTasks);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('non-existent');
  });

  it('7. rejects self-dependencies', () => {
    const selfDepTasks: TimelineTask[] = [
      { id: 't1', title: 'Task 1', description: '', phase: 'P1', dueDate: '2026-10-01', priority: 'high', status: 'pending', dependencyIds: ['t1'], createdAt: '', updatedAt: '' }
    ];
    const result = validateTaskDependencies(selfDepTasks);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('cannot depend on itself');
  });

  it('8. detects circular dependency chains', () => {
    const cyclicTasks: TimelineTask[] = [
      { id: 'a', title: 'A', description: '', phase: 'P1', dueDate: '2026-10-01', priority: 'high', status: 'pending', dependencyIds: ['b'], createdAt: '', updatedAt: '' },
      { id: 'b', title: 'B', description: '', phase: 'P1', dueDate: '2026-10-02', priority: 'high', status: 'pending', dependencyIds: ['c'], createdAt: '', updatedAt: '' },
      { id: 'c', title: 'C', description: '', phase: 'P1', dueDate: '2026-10-03', priority: 'high', status: 'pending', dependencyIds: ['a'], createdAt: '', updatedAt: '' },
    ];
    const cycle = detectCycle(cyclicTasks);
    expect(cycle).not.toBeNull();
  });

  it('9. correctly identifies blocked tasks when prerequisite is incomplete', () => {
    const tasks: TimelineTask[] = [
      { id: 'p1', title: 'Venue Booking', description: '', phase: 'P1', dueDate: '2026-10-01', priority: 'high', status: 'in_progress', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 'p2', title: 'Catering Tasting', description: '', phase: 'P1', dueDate: '2026-10-15', priority: 'high', status: 'pending', dependencyIds: ['p1'], createdAt: '', updatedAt: '' },
    ];

    const depStatus = evaluateTaskDependency(tasks[1], tasks);
    expect(depStatus.isBlocked).toBe(true);
    expect(depStatus.unresolvedPrerequisites.length).toBe(1);
    expect(depStatus.unresolvedPrerequisites[0].id).toBe('p1');
    expect(depStatus.reason).toContain('Waiting for "Venue Booking" to be completed');
  });

  it('10. identifies all downstream affected tasks', () => {
    const tasks: TimelineTask[] = [
      { id: 'a', title: 'A', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 'b', title: 'B', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: ['a'], createdAt: '', updatedAt: '' },
      { id: 'c', title: 'C', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: ['b'], createdAt: '', updatedAt: '' },
      { id: 'd', title: 'D', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: [], createdAt: '', updatedAt: '' },
    ];

    const downstreamFromA = getDownstreamTasks('a', tasks);
    expect(downstreamFromA.map(t => t.id)).toEqual(['b', 'c']);

    const downstreamFromD = getDownstreamTasks('d', tasks);
    expect(downstreamFromD.length).toBe(0);
  });

  it('11. handles multiple prerequisites and partial completion', () => {
    const tasks: TimelineTask[] = [
      { id: 'p1', title: 'Prereq 1', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'completed', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 'p2', title: 'Prereq 2', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 'target', title: 'Target', description: '', phase: 'P', dueDate: '', priority: 'high', status: 'pending', dependencyIds: ['p1', 'p2'], createdAt: '', updatedAt: '' },
    ];

    const depStatus = evaluateTaskDependency(tasks[2], tasks);
    // Even though p1 is complete, p2 is incomplete, so target remains blocked
    expect(depStatus.isBlocked).toBe(true);
    expect(depStatus.unresolvedPrerequisites.map(t => t.id)).toEqual(['p2']);
  });
});

describe('Task State Transitions & Summary Metrics', () => {
  it('12. completes prerequisite and automatically unblocks downstream task', () => {
    const tasks: TimelineTask[] = [
      { id: 't1', title: 'Prereq', description: '', phase: 'P', dueDate: '2026-11-01', priority: 'high', status: 'completed', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 't2', title: 'Dependent', description: '', phase: 'P', dueDate: '2026-11-10', priority: 'medium', status: 'pending', dependencyIds: ['t1'], createdAt: '', updatedAt: '' }
    ];

    const depStatus = evaluateTaskDependency(tasks[1], tasks);
    expect(depStatus.isBlocked).toBe(false);
    expect(depStatus.unresolvedPrerequisites.length).toBe(0);
  });

  it('13. detects delayed prerequisite warning', () => {
    const tasks: TimelineTask[] = [
      { id: 't1', title: 'Venue Booking', description: '', phase: 'P', dueDate: '2026-10-01', priority: 'high', status: 'delayed', dependencyIds: [], createdAt: '', updatedAt: '' },
      { id: 't2', title: 'Catering', description: '', phase: 'P', dueDate: '2026-10-10', priority: 'medium', status: 'pending', dependencyIds: ['t1'], createdAt: '', updatedAt: '' }
    ];

    const depStatus = evaluateTaskDependency(tasks[1], tasks);
    expect(depStatus.isBlocked).toBe(true);
    expect(depStatus.isPrerequisiteDelayed).toBe(true);
    expect(depStatus.reason).toContain('delayed');
  });

  it('14. calculates summary metrics accurately without double counting', () => {
    const refDate = '2026-10-26';
    const tasks: TimelineTask[] = [
      // Completed (even if old due date passed, it must NEVER be at risk)
      { id: '1', title: 'T1', description: '', phase: 'P', dueDate: '2026-09-01', priority: 'high', status: 'completed', dependencyIds: [], createdAt: '', updatedAt: '' },
      // Upcoming (future date, not blocked)
      { id: '2', title: 'T2', description: '', phase: 'P', dueDate: '2026-11-15', priority: 'medium', status: 'pending', dependencyIds: [], createdAt: '', updatedAt: '' },
      // At Risk: Overdue
      { id: '3', title: 'T3', description: '', phase: 'P', dueDate: '2026-10-15', priority: 'high', status: 'pending', dependencyIds: [], createdAt: '', updatedAt: '' },
      // At Risk: Delayed
      { id: '4', title: 'T4', description: '', phase: 'P', dueDate: '2026-11-20', priority: 'low', status: 'delayed', dependencyIds: [], createdAt: '', updatedAt: '' },
    ];

    const summary = calculateTimelineSummary(tasks, refDate);
    expect(summary.totalTasks).toBe(4);
    expect(summary.completedTasks).toBe(1);
    expect(summary.upcomingTasks).toBe(1);
    expect(summary.atRiskTasks).toBe(2); // T3 (overdue) and T4 (delayed)
    expect(summary.progressPercent).toBe(25);
  });

  it('15. handles empty task list safely', () => {
    const summary = calculateTimelineSummary([]);
    expect(summary.totalTasks).toBe(0);
    expect(summary.completedTasks).toBe(0);
    expect(summary.upcomingTasks).toBe(0);
    expect(summary.atRiskTasks).toBe(0);
    expect(summary.progressPercent).toBe(0);
  });
});
