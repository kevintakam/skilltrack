import { startOfDay, subDays, format } from 'date-fns';
import prisma from '../types/prisma';
import { createError } from '../middlewares/error.middleware';
import { CreateHabitInput, UpdateHabitInput } from '../schemas/habit.schema';

// ── Streak calculation ───────────────────────────────────────────────

// Calcule le streak (jours consécutifs) d'une habitude
const calculateStreak = async (habitId: string): Promise<number> => {
  const completions = await prisma.habitCompletion.findMany({
    where: { habitId },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (completions.length === 0) return 0;

  let streak = 0;
  let checkDate = startOfDay(new Date());

  for (const completion of completions) {
    const completionDate = startOfDay(new Date(completion.date));
    const checkDateStr = format(checkDate, 'yyyy-MM-dd');
    const completionDateStr = format(completionDate, 'yyyy-MM-dd');

    if (checkDateStr === completionDateStr) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break; // Chaîne brisée
    }
  }

  return streak;
};

// Calcule les 91 jours de completions pour la heatmap
const getHeatmapData = async (habitId: string) => {
  const ninetyOneDaysAgo = subDays(new Date(), 91);

  const completions = await prisma.habitCompletion.findMany({
    where: {
      habitId,
      date: { gte: ninetyOneDaysAgo },
    },
    select: { date: true },
  });

  // Convertir en Set de dates string pour lookup rapide
  const completionDates = new Set(
    completions.map(c => format(startOfDay(new Date(c.date)), 'yyyy-MM-dd'))
  );

  // Générer les 91 jours
  const heatmap = [];
  for (let i = 90; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    heatmap.push({ date, done: completionDates.has(date) });
  }

  return heatmap;
};

// ── Service functions ─────────────────────────────────────────────────

export const getHabits = async (userId: string) => {
  const habits = await prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      objective: { select: { id: true, title: true, emoji: true } },
      completions: {
        where: {
          date: {
            gte: subDays(new Date(), 7), // 7 derniers jours seulement
          },
        },
        orderBy: { date: 'desc' },
      },
    },
  });

  // Ajouter le streak et si complété aujourd'hui
  const habitsWithStreak = await Promise.all(
    habits.map(async (habit) => {
      const streak = await calculateStreak(habit.id);
      const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const doneToday = habit.completions.some(
        c => format(startOfDay(new Date(c.date)), 'yyyy-MM-dd') === todayStr
      );

      return { ...habit, streak, doneToday };
    })
  );

  return habitsWithStreak;
};

export const getHabitById = async (id: string, userId: string) => {
  const habit = await prisma.habit.findFirst({
    where: { id, userId },
    include: {
      objective: { select: { id: true, title: true, emoji: true } },
    },
  });

  if (!habit) throw createError('Habitude introuvable', 404);

  const streak = await calculateStreak(id);
  const heatmap = await getHeatmapData(id);

  return { ...habit, streak, heatmap };
};

export const createHabit = async (userId: string, data: CreateHabitInput) => {
  // Vérifier que l'objectif lié appartient à l'utilisateur
  if (data.objectiveId) {
    const objective = await prisma.objective.findFirst({
      where: { id: data.objectiveId, userId },
    });
    if (!objective) throw createError('Objectif introuvable', 404);
  }

  const habit = await prisma.habit.create({
    data: {
      title: data.title,
      emoji: data.emoji || '✅',
      frequency: data.frequency || 'daily',
      targetDays: data.targetDays || [1, 2, 3, 4, 5, 6, 7],
      userId,
      objectiveId: data.objectiveId || null,
    },
  });

  return habit;
};

export const updateHabit = async (
  id: string,
  userId: string,
  data: UpdateHabitInput
) => {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Habitude introuvable', 404);

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.emoji && { emoji: data.emoji }),
      ...(data.frequency && { frequency: data.frequency }),
      ...(data.targetDays && { targetDays: data.targetDays }),
      ...(data.objectiveId !== undefined && { objectiveId: data.objectiveId }),
    },
  });

  return updated;
};

export const deleteHabit = async (id: string, userId: string) => {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw createError('Habitude introuvable', 404);

  await prisma.habit.delete({ where: { id } });
};

export const completeHabit = async (id: string, userId: string) => {
  // Vérifier que l'habitude appartient à l'user
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw createError('Habitude introuvable', 404);

  const today = startOfDay(new Date());

  // Vérifier si déjà complété aujourd'hui
  const existing = await prisma.habitCompletion.findFirst({
    where: {
      habitId: id,
      date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    },
  });

  if (existing) {
    throw createError("Cette habitude est déjà cochée aujourd'hui", 409);
  }

  const completion = await prisma.habitCompletion.create({
    data: { habitId: id, date: today },
  });

  const streak = await calculateStreak(id);

  return { completion, streak };
};

export const uncompleteHabit = async (id: string, userId: string) => {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw createError('Habitude introuvable', 404);

  const today = startOfDay(new Date());

  const existing = await prisma.habitCompletion.findFirst({
    where: {
      habitId: id,
      date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    },
  });

  if (!existing) {
    throw createError("Cette habitude n'est pas cochée aujourd'hui", 404);
  }

  await prisma.habitCompletion.delete({ where: { id: existing.id } });
};
