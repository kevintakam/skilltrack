import { z } from 'zod';

const FREQUENCIES = ['daily', 'weekly'] as const;
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const; // 1=Lundi, 7=Dimanche

export const createHabitSchema = z.object({
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
      .default('✅'),

    frequency: z
      .enum(FREQUENCIES)
      .optional()
      .default('daily'),

    targetDays: z
      .array(
        z.coerce
          .number()
          .int('Chaque jour doit être un entier')
          .min(1, 'Les jours doivent être compris entre 1 et 7')
          .max(7, 'Les jours doivent être compris entre 1 et 7')
      )
      .min(1, 'Au moins un jour est requis')
      .optional()
      .default([1, 2, 3, 4, 5, 6, 7]),

    objectiveId: z
      .string()
      .optional()
      .nullable(),
  }),
});
export const updateHabitSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100).trim().optional(),
    emoji: z.string().max(10).optional(),
    frequency: z.enum(FREQUENCIES).optional(),
    targetDays: z.array(z.number().int().min(1).max(7)).min(1).optional(),
    objectiveId: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>['body'];
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>['body'];
