/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const IdeaBudgetImpactSchema = z.enum([
  'Likely low impact',
  'Potentially moderate impact',
  'Potentially high impact',
  'Insufficient information to estimate'
]);

export const PersonalizedIdeaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Idea title must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(5, 'Description is required'),
  whyItFits: z.string().min(5, 'Personalization rationale is required'),
  practicalConsiderations: z.array(z.string()).default([]),
  mustHaveCompatibility: z.string().optional(),
  potentialConflicts: z.string().optional(),
  budgetImpact: IdeaBudgetImpactSchema,
  budgetAssumptions: z.string().optional(),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
  isSaved: z.boolean().optional(),
  isRefined: z.boolean().optional(),
  source: z.enum(['ai_curated', 'user_refined', 'rule_based']).default('ai_curated'),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const IdeaGenerationRequestSchema = z.object({
  eventName: z.string().min(1),
  occasionType: z.string(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventStyle: z.array(z.string()).default([]),
  maxBudget: z.number().nonnegative(),
  totalGuests: z.number().positive(),
  priorities: z.array(z.string()).default([]),
  mustHaves: z.array(z.string()).default([]),
  culturalPreferences: z.string().optional(),
  accessibilityRequirements: z.string().optional(),
  thingsToAvoid: z.string().optional(),
  selectedCategory: z.string().optional()
});

export const IdeaRefinementRequestSchema = z.object({
  refinementPrompt: z.string().min(2, 'Refinement prompt cannot be empty').max(1000),
  selectedIdea: PersonalizedIdeaSchema.optional(),
  constraints: IdeaGenerationRequestSchema
});

export const IdeaResponseSchema = z.object({
  success: z.boolean(),
  ideas: z.array(PersonalizedIdeaSchema)
});

export type PersonalizedIdeaData = z.infer<typeof PersonalizedIdeaSchema>;
export type IdeaGenerationRequestData = z.infer<typeof IdeaGenerationRequestSchema>;
export type IdeaRefinementRequestData = z.infer<typeof IdeaRefinementRequestSchema>;
export type IdeaResponseData = z.infer<typeof IdeaResponseSchema>;
