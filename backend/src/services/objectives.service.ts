import prisma from '../types/prisma';
import { createError } from '../middlewares/error.middleware';
import { CreateObjectiveInput, UpdateObjectiveInput } from '../schemas/objective.schema';

// ── Helpers ──────────────────────────────────────────────────────────

// Recalcule la progression d'un objectif depuis ses sessions
const recalculateProgress = async (objectiveId: string): Promise<number> => {
  const objective = await prisma.objective.findUnique({
    where: { id: objectiveId },
    include: { sessions: { select: { durationMin: true } } },
  });

  if (!objective) return 0;

  // Objectif = atteindre targetMin par jour pendant 30 jours
  const totalTarget = objective.targetMin * 30;
  const totalDone = objective.sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const progress = Math.min(totalDone / totalTarget, 1.0);

  return Math.round(progress * 100) / 100; // 2 décimales max
};

// ── Service functions ─────────────────────────────────────────────────

export const getObjectives = async (
  userId: string,
  status?: string
) => {
  const where: any = { userId };
  if (status && ['active', 'paused', 'done'].includes(status)) {
    where.status = status;
  }

  const objectives = await prisma.objective.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { sessions: true } },
    },
  });

  return objectives;
};

export const getObjectiveById = async (id: string, userId: string) => {
  const objective = await prisma.objective.findFirst({
    where: { id, userId },
    include: {
      sessions: {
        orderBy: { startedAt: 'desc' },
        take: 5, // Les 5 dernières sessions
      },
      habits: {
        include: {
          completions: {
            where: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
              },
            },
          },
        },
      },
      _count: { select: { sessions: true } },
    },
  });

  if (!objective) {
    throw createError('Objectif introuvable', 404);
  }

  // Calculer stats supplémentaires
  const allSessions = await prisma.session.findMany({
    where: { objectiveId: id, userId },
    select: { durationMin: true },
  });

  const totalMin = allSessions.reduce((sum, s) => sum + s.durationMin, 0);
  const avgMin = allSessions.length > 0
    ? Math.round(totalMin / allSessions.length)
    : 0;

  return {
    ...objective,
    stats: {
      totalMinutes: totalMin,
      totalHours: Math.round(totalMin / 60 * 10) / 10,
      avgMinutesPerSession: avgMin,
      sessionCount: allSessions.length,
    },
  };
};

export const createObjective = async (
  userId: string,
  data: CreateObjectiveInput
) => {
  const objective = await prisma.objective.create({
    data: {
      title: data.title,
      emoji: data.emoji || '🎯',
      category: data.category || 'learning',
      targetMin: data.targetMin,
      deadline: data.deadline ? new Date(data.deadline) : null,
      userId,
    },
  });

  return objective;
};

export const updateObjective = async (
  id: string,
  userId: string,
  data: UpdateObjectiveInput
) => {
  // Vérifier que l'objectif appartient à l'utilisateur
  const existing = await prisma.objective.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Objectif introuvable', 404);

  const updated = await prisma.objective.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.emoji && { emoji: data.emoji }),
      ...(data.category && { category: data.category }),
      ...(data.targetMin && { targetMin: data.targetMin }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? new Date(data.deadline) : null,
      }),
    },
  });

  return updated;
};

export const updateObjectiveStatus = async (
  id: string,
  userId: string,
  status: string
) => {
  const existing = await prisma.objective.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Objectif introuvable', 404);

  // Recalculer la progression si on marque comme terminé
  let progress = existing.progress;
  if (status === 'done') {
    progress = await recalculateProgress(id);
  }

  const updated = await prisma.objective.update({
    where: { id },
    data: { status, progress },
  });

  return updated;
};

export const deleteObjective = async (id: string, userId: string) => {
  const existing = await prisma.objective.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Objectif introuvable', 404);

  // Cascade : supprime aussi les sessions et habitudes liées (via Prisma)
  await prisma.objective.delete({ where: { id } });
};
