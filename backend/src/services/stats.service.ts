import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  subDays,
  format,
  eachDayOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import prisma from '../types/prisma';

// ── Dashboard stats ───────────────────────────────────────────────────

export const getDashboardStats = async (userId: string) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Semaine commence lundi
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStart = startOfDay(now);

  // ── 1. Sessions de cette semaine ──────────────────────────────────
  const weekSessions = await prisma.session.findMany({
    where: {
      userId,
      startedAt: { gte: weekStart, lte: weekEnd },
    },
    select: { durationMin: true, startedAt: true, objectiveId: true },
  });

  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.durationMin, 0);
  const weekHours = Math.round((weekMinutes / 60) * 10) / 10;

  // ── 2. Objectifs actifs ───────────────────────────────────────────
  const [activeObjectives, totalObjectives] = await Promise.all([
    prisma.objective.count({ where: { userId, status: 'active' } }),
    prisma.objective.count({ where: { userId } }),
  ]);

  // ── 3. Habitudes aujourd'hui ──────────────────────────────────────
  const todayStr = format(todayStart, 'yyyy-MM-dd');

  const habits = await prisma.habit.findMany({
    where: { userId },
    select: {
      id: true,
      completions: {
        where: {
          date: {
            gte: todayStart,
            lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  const totalHabits = habits.length;
  const doneHabits = habits.filter(h => h.completions.length > 0).length;
  const habitsCompletionRate =
    totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0;

  // ── 4. Streak global (jours avec au moins 1 session ou habitude) ──
  const currentStreak = await calculateGlobalStreak(userId);

  // ── 5. Graphique d'activité (7 derniers jours) ────────────────────
  const last7Days = eachDayOfInterval({
    start: subDays(now, 6),
    end: now,
  });

  const activityChart = await Promise.all(
    last7Days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const sessions = await prisma.session.findMany({
        where: { userId, startedAt: { gte: dayStart, lt: dayEnd } },
        select: { durationMin: true },
      });

      const minutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);

      return {
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'EEE', { locale: fr }), // Lun, Mar, Mer...
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
        sessionCount: sessions.length,
      };
    })
  );

  // ── 6. Objectifs avec progression ────────────────────────────────
  const topObjectives = await prisma.objective.findMany({
    where: { userId, status: 'active' },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      title: true,
      emoji: true,
      progress: true,
      targetMin: true,
      _count: { select: { sessions: true } },
    },
  });

  return {
    week: {
      minutes: weekMinutes,
      hours: weekHours,
      sessionCount: weekSessions.length,
    },
    objectives: {
      active: activeObjectives,
      total: totalObjectives,
    },
    habits: {
      doneToday: doneHabits,
      totalToday: totalHabits,
      completionRate: habitsCompletionRate,
    },
    streak: currentStreak,
    activityChart,
    topObjectives,
  };
};

// ── Streak global : jours consécutifs avec activité ──────────────────
const calculateGlobalStreak = async (userId: string): Promise<number> => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { startedAt: true },
    orderBy: { startedAt: 'desc' },
  });

  if (sessions.length === 0) return 0;

  // Construire un Set de dates avec activité
  const activeDates = new Set(
    sessions.map(s => format(startOfDay(new Date(s.startedAt)), 'yyyy-MM-dd'))
  );

  let streak = 0;
  let checkDate = startOfDay(new Date());

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (activeDates.has(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      // Si c'est aujourd'hui et pas encore de session, on vérifie hier
      if (streak === 0) {
        checkDate = subDays(checkDate, 1);
        const yesterdayStr = format(checkDate, 'yyyy-MM-dd');
        if (activeDates.has(yesterdayStr)) {
          streak++;
          checkDate = subDays(checkDate, 1);
          continue;
        }
      }
      break;
    }
  }

  return streak;
};

// ── Heatmap 91 jours (toutes habitudes confondues) ────────────────────
export const getHeatmapStats = async (userId: string) => {
  const ninetyOneDaysAgo = subDays(new Date(), 91);

  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId },
      date: { gte: ninetyOneDaysAgo },
    },
    select: { date: true },
  });

  // Compter les completions par jour
  const countByDay: Record<string, number> = {};
  for (const c of completions) {
    const dateStr = format(startOfDay(new Date(c.date)), 'yyyy-MM-dd');
    countByDay[dateStr] = (countByDay[dateStr] || 0) + 1;
  }

  // Générer les 91 jours avec niveau d'intensité (0-4)
  const heatmap = [];
  for (let i = 90; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const count = countByDay[date] || 0;
    // Niveau : 0=rien, 1=1 habitude, 2=2, 3=3, 4=4+
    const level = Math.min(count, 4);
    heatmap.push({ date, count, level });
  }

  return { heatmap };
};

// ── Stats profil utilisateur ──────────────────────────────────────────
export const getUserStats = async (userId: string) => {
  const [totalSessions, totalObjectives, doneObjectives, totalHabits] =
    await Promise.all([
      prisma.session.count({ where: { userId } }),
      prisma.objective.count({ where: { userId } }),
      prisma.objective.count({ where: { userId, status: 'done' } }),
      prisma.habit.count({ where: { userId } }),
    ]);

  // Total minutes travaillées
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { durationMin: true },
  });
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Taux global de complétion des habitudes (30 derniers jours)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentCompletions = await prisma.habitCompletion.count({
    where: { habit: { userId }, date: { gte: thirtyDaysAgo } },
  });
  const habitRate =
    totalHabits > 0
      ? Math.round((recentCompletions / (totalHabits * 30)) * 100)
      : 0;

  // Streak global
  const streak = await calculateGlobalStreak(userId);

  // Badges débloqués
  const badges = computeBadges({
    streak,
    totalSessions,
    doneObjectives,
    totalHours,
  });

  return {
    totalMinutes,
    totalHours,
    totalSessions,
    totalObjectives,
    doneObjectives,
    totalHabits,
    habitCompletionRate: Math.min(habitRate, 100),
    streak,
    badges,
  };
};

// ── Badges logic ──────────────────────────────────────────────────────
const computeBadges = (stats: {
  streak: number;
  totalSessions: number;
  doneObjectives: number;
  totalHours: number;
}) => {
  const badges = [
    {
      id: 'first_session',
      emoji: '🚀',
      title: 'Premier pas',
      description: 'Première session enregistrée',
      unlocked: stats.totalSessions >= 1,
    },
    {
      id: 'ten_sessions',
      emoji: '⚡',
      title: 'Démarrage rapide',
      description: '10 sessions au total',
      unlocked: stats.totalSessions >= 10,
    },
    {
      id: 'fifty_sessions',
      emoji: '💪',
      title: 'Régularité',
      description: '50 sessions au total',
      unlocked: stats.totalSessions >= 50,
    },
    {
      id: 'streak_7',
      emoji: '🔥',
      title: 'Flamme de 7 jours',
      description: '7 jours consécutifs d\'activité',
      unlocked: stats.streak >= 7,
    },
    {
      id: 'streak_14',
      emoji: '🔥',
      title: 'Flamme de 14 jours',
      description: '14 jours consécutifs',
      unlocked: stats.streak >= 14,
    },
    {
      id: 'streak_30',
      emoji: '👑',
      title: 'Série de 30 jours',
      description: '30 jours consécutifs',
      unlocked: stats.streak >= 30,
    },
    {
      id: 'first_objective',
      emoji: '🏆',
      title: 'Premier objectif',
      description: 'Objectif terminé avec succès',
      unlocked: stats.doneObjectives >= 1,
    },
    {
      id: 'ten_hours',
      emoji: '⏱️',
      title: '10 heures',
      description: '10 heures travaillées au total',
      unlocked: stats.totalHours >= 10,
    },
    {
      id: 'hundred_hours',
      emoji: '🌟',
      title: '100 heures',
      description: '100 heures travaillées au total',
      unlocked: stats.totalHours >= 100,
    },
  ];

  return badges;
};
