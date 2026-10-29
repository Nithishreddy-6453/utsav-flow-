/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimelineTask } from '../types/plan';
import { isDateOverdue } from './dateCalculations';

export interface TaskValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TaskDependencyStatus {
  taskId: string;
  isBlocked: boolean;
  isPrerequisiteDelayed: boolean;
  unresolvedPrerequisites: TimelineTask[];
  delayedPrerequisites: TimelineTask[];
  downstreamTasks: TimelineTask[];
  reason?: string;
}

export interface TimelineSummaryMetrics {
  totalTasks: number;
  completedTasks: number;
  upcomingTasks: number;
  atRiskTasks: number;
  progressPercent: number;
}

/**
 * Validates dependencies across all tasks in the list.
 * Checks for missing IDs, self-dependencies, and cycles.
 */
export function validateTaskDependencies(tasks: TimelineTask[]): TaskValidationResult {
  const errors: string[] = [];
  const taskMap = new Map<string, TimelineTask>();

  tasks.forEach(t => {
    taskMap.set(t.id, t);
  });

  // 1. Check for non-existent IDs and self-dependencies
  for (const task of tasks) {
    if (!task.dependencyIds || !Array.isArray(task.dependencyIds)) continue;

    for (const depId of task.dependencyIds) {
      if (depId === task.id) {
        errors.push(`Task "${task.title}" cannot depend on itself.`);
      } else if (!taskMap.has(depId)) {
        errors.push(`Task "${task.title}" references non-existent prerequisite ID "${depId}".`);
      }
    }
  }

  // 2. Cycle Detection using DFS
  const cycle = detectCycle(tasks);
  if (cycle) {
    errors.push(`Dependency cycle detected involving: ${cycle.join(' → ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Detects cycles in task dependencies using depth-first search.
 * Returns array of task titles in the cycle or null if acyclic.
 */
export function detectCycle(tasks: TimelineTask[]): string[] | null {
  const adj = new Map<string, string[]>();
  const taskMap = new Map<string, TimelineTask>();

  tasks.forEach(t => {
    taskMap.set(t.id, t);
    adj.set(t.id, (t.dependencyIds || []).filter(id => id !== t.id));
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(currId: string): boolean {
    visited.add(currId);
    recStack.add(currId);
    path.push(currId);

    const neighbors = adj.get(currId) || [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        if (dfs(n)) return true;
      } else if (recStack.has(n)) {
        path.push(n);
        return true;
      }
    }

    recStack.delete(currId);
    path.pop();
    return false;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (dfs(task.id)) {
        // Extract cycle slice from path
        const first = path[path.length - 1];
        const startIndex = path.indexOf(first);
        const cycleIds = path.slice(startIndex);
        return cycleIds.map(id => taskMap.get(id)?.title || id);
      }
    }
  }

  return null;
}

/**
 * Returns all downstream tasks that directly or indirectly depend on the given taskId.
 */
export function getDownstreamTasks(taskId: string, allTasks: TimelineTask[]): TimelineTask[] {
  const taskMap = new Map<string, TimelineTask>();
  allTasks.forEach(t => taskMap.set(t.id, t));

  // Build reverse adjacency list (prerequisite -> list of dependent tasks)
  const dependentsMap = new Map<string, string[]>();
  allTasks.forEach(t => {
    (t.dependencyIds || []).forEach(depId => {
      const list = dependentsMap.get(depId) || [];
      list.push(t.id);
      dependentsMap.set(depId, list);
    });
  });

  const downstreamIds = new Set<string>();
  const queue: string[] = [taskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = dependentsMap.get(current) || [];
    for (const d of deps) {
      if (!downstreamIds.has(d)) {
        downstreamIds.add(d);
        queue.push(d);
      }
    }
  }

  return Array.from(downstreamIds)
    .map(id => taskMap.get(id))
    .filter((t): t is TimelineTask => !!t);
}

/**
 * Evaluates the dependency state for a single task.
 */
export function evaluateTaskDependency(task: TimelineTask, allTasks: TimelineTask[]): TaskDependencyStatus {
  const taskMap = new Map<string, TimelineTask>();
  allTasks.forEach(t => taskMap.set(t.id, t));

  const unresolvedPrerequisites: TimelineTask[] = [];
  const delayedPrerequisites: TimelineTask[] = [];

  (task.dependencyIds || []).forEach(depId => {
    const prereq = taskMap.get(depId);
    if (prereq) {
      if (prereq.status !== 'completed') {
        unresolvedPrerequisites.push(prereq);
      }
      if (prereq.status === 'delayed') {
        delayedPrerequisites.push(prereq);
      }
    }
  });

  // A completed task is NEVER considered blocked
  const isBlocked = task.status !== 'completed' && unresolvedPrerequisites.length > 0;
  const isPrerequisiteDelayed = task.status !== 'completed' && delayedPrerequisites.length > 0;

  let reason = '';
  if (isBlocked) {
    if (isPrerequisiteDelayed) {
      reason = `Blocked: Prerequisite "${delayedPrerequisites[0].title}" is delayed`;
    } else {
      reason = `Waiting for "${unresolvedPrerequisites[0].title}" to be completed`;
      if (unresolvedPrerequisites.length > 1) {
        reason += ` (+${unresolvedPrerequisites.length - 1} more)`;
      }
    }
  }

  const downstream = getDownstreamTasks(task.id, allTasks);

  return {
    taskId: task.id,
    isBlocked,
    isPrerequisiteDelayed,
    unresolvedPrerequisites,
    delayedPrerequisites,
    downstreamTasks: downstream,
    reason: isBlocked ? reason : undefined
  };
}

/**
 * Calculates overall timeline summary metrics without double-counting.
 * Rules:
 * - Completed: status === 'completed'
 * - Upcoming: incomplete, NOT blocked, NOT overdue, NOT delayed
 * - At-Risk: incomplete AND (isBlocked OR isOverdue OR status === 'delayed')
 */
export function calculateTimelineSummary(tasks: TimelineTask[], referenceDateStr?: string): TimelineSummaryMetrics {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      upcomingTasks: 0,
      atRiskTasks: 0,
      progressPercent: 0
    };
  }

  let completedTasks = 0;
  let upcomingTasks = 0;
  let atRiskTasks = 0;

  tasks.forEach(task => {
    if (task.status === 'completed') {
      completedTasks++;
      return;
    }

    const depStatus = evaluateTaskDependency(task, tasks);
    const overdue = isDateOverdue(task.dueDate, referenceDateStr);
    const isDelayed = task.status === 'delayed';

    if (depStatus.isBlocked || overdue || isDelayed) {
      atRiskTasks++;
    } else {
      upcomingTasks++;
    }
  });

  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return {
    totalTasks,
    completedTasks,
    upcomingTasks,
    atRiskTasks,
    progressPercent
  };
}
