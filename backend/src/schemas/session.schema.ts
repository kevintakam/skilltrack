import { z } from 'zod';

export const createSessionSchema = z.object({
  body: z.object({
    objectiveId: z.string().min(1, "L'objectif est requis"),
    durationMin: z
      .number().int().min(1, 'La durée doit être au moins 1 minute')
      .int()
      .min(1, 'La durée doit être au moins 1 minute')
      .max(480, 'Une session ne peut pas dépasser 8h'),
    note: z.string().max(500).optional().nullable(),
    startedAt: z.string().datetime('La date de début est invalide'),
    endedAt: z.string().datetime('La date de fin est invalide'),
  }).refine(
    (data) => new Date(data.endedAt) > new Date(data.startedAt),
    { message: 'La date de fin doit être après la date de début', path: ['endedAt'] }
  ),
});

export const listSessionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => parseInt(v || '1')),
    limit: z.string().optional().transform(v => Math.min(parseInt(v || '20'), 50)),
    objectiveId: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
