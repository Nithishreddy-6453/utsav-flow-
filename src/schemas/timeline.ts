/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'delayed']);
export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const TimelineTaskSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(2, 'Task title must be at least 2 characters').max(120, 'Task title too long'),
  description: z.string().max(500, 'Description too long').default(''),
  phase: z.string().min(1, 'Phase is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  daysBeforeEvent: z.number().int().optional(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dependencyIds: z.array(z.string()).default([]),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TimelineTaskFormSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters').max(120, 'Task title too long'),
  description: z.string().max(500, 'Description too long').optional().default(''),
  phase: z.string().min(1, 'Please select or enter a planning phase'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid due date (YYYY-MM-DD)'),
  priority: TaskPrioritySchema,
  dependencyIds: z.array(z.string()).default([]),
  notes: z.string().max(500, 'Notes too long').optional().default(''),
});

export type TimelineTaskFormData = z.infer<typeof TimelineTaskFormSchema>;
