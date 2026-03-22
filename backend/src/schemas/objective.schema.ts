import { z } from 'zod';

const CATEGORIES = ['learning', 'sport', 'project', 'reading', 'other'] as const;
const STATUSES = ['active', 'paused', 'done'] as const;

export const createObjectiveSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(2, 'Le titre doit faire au moins 2 caractères')
      .max(100, 'Le titre ne peut pas dépasser 100 caractères'),

    emoji: z
      .string()
      .max(10, "L'emoji ne peut pas dépasser 10 caractères")
      .optional()
      .default('🎯'),

    category: z
      .enum(CATEGORIES)
      .optional()
      .default('learning'),

    targetMin: z.coerce
      .number()
      .int('La durée cible doit être un entier')
      .min(1, 'La durée doit être au moins 1 minute')
      .max(480, 'La durée ne peut pas dépasser 8h par jour'),

    deadline: z
      .string()
      .datetime('La date limite est invalide')
      .optional()
      .nullable(),
  }),
});
export const updateObjectiveSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100).trim().optional(),
    emoji: z.string().max(10).optional(),
    category: z.enum(CATEGORIES).optional(),
    targetMin: z.number().int().min(1).max(480).optional(),
    deadline: z.string().datetime().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.string().refine(
      (value) => STATUSES.includes(value as (typeof STATUSES)[number]),
      {
        message: 'Statut invalide : active, paused ou done',
      }
    ),
  }),
  params: z.object({
    id: z.string().min(1, "L'identifiant est requis"),
  }),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>['body'];
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>['body'];
