import { startOfWeek, endOfWeek, subDays, format, startOfDay } from 'date-fns';
import prisma from '../types/prisma';
import { createError } from '../middlewares/error.middleware';
import { CreateSessionInput } from '../schemas/session.schema';

// ── Service functions ─────────────────────────────────────────────────

export const getSessions = async (
  userId: string,
  params: {
    page: number;
    limit: number;
    objectiveId?: string;
    from?: string;
    to?: string;
  }
) => {
  const { page, limit, objectiveId, from, to } = params;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (objectiveId) where.objectiveId = objectiveId;
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to) where.startedAt.lte = new Date(to);
  }

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
      include: {
        objective: {
          select: { id: true, title: true, emoji: true },
        },
      },
    }),
    prisma.session.count({ where }),
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const getSessionById = async (id: string, userId: string) => {
  const session = await prisma.session.findFirst({
    where: { id, userId },
    include: {
      objective: { select: { id: true, title: true, emoji: true } },
    },
  });

  if (!session) throw createError('Session introuvable', 404);
  return session;
};

export const createSession = async (
  userId: string,
  data: CreateSessionInput
) => {
  // Vérifier que l'objectif appartient à l'utilisateur
  const objective = await prisma.objective.findFirst({
    where: { id: data.objectiveId, userId },
  });
  if (!objective) throw createError('Objectif introuvable', 404);

  // Créer la session
  const session = await prisma.session.create({
    data: {
      durationMin: data.durationMin,
      note: data.note ?? null,
      startedAt: new Date(data.startedAt),
      endedAt: new Date(data.endedAt),
      userId,
      objectiveId: data.objectiveId,
    },
    include: {
      objective: { select: { id: true, title: true, emoji: true } },
    },
  });

  // Recalculer la progression de l'objectif
  const allSessions = await prisma.session.findMany({
    where: { objectiveId: data.objectiveId },
    select: { durationMin: true },
  });
  const totalMin = allSessions.reduce((sum, s) => sum + s.durationMin, 0);
  const totalTarget = objective.targetMin * 30; // cible sur 30 jours
  const progress = Math.min(Math.round((totalMin / totalTarget) * 100) / 100, 1.0);

  await prisma.objective.update({
    where: { id: data.objectiveId },
    data: { progress },
  });

  return session;
};

export const deleteSession = async (id: string, userId: string) => {
  const existing = await prisma.session.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Session introuvable', 404);

  await prisma.session.delete({ where: { id } });

  // Recalculer la progression après suppression
  const allSessions = await prisma.session.findMany({
    where: { objectiveId: existing.objectiveId },
    select: { durationMin: true },
  });
  const objective = await prisma.objective.findUnique({
    where: { id: existing.objectiveId },
  });

  if (objective) {
    const totalMin = allSessions.reduce((sum, s) => sum + s.durationMin, 0);
    const totalTarget = objective.targetMin * 30;
    const progress = Math.min(
      Math.round((totalMin / totalTarget) * 100) / 100,
      1.0
    );
    await prisma.objective.update({
      where: { id: existing.objectiveId },
      data: { progress },
    });
  }
};
