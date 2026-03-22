import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Supprimer les données existantes
  await prisma.session.deleteMany();
  await prisma.habitCompletion.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.user.deleteMany();

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'alex@skilltrack.dev',
      password: hashedPassword,
      name: 'Alex Martin',
    },
  });

  console.log('✅ User créé :', user.email);

  // Créer des objectifs
  const obj1 = await prisma.objective.create({
    data: {
      title: "Apprendre l'anglais",
      emoji: '🇬🇧',
      category: 'learning',
      targetMin: 15,
      progress: 0.68,
      status: 'active',
      userId: user.id,
    },
  });

  const obj2 = await prisma.objective.create({
    data: {
      title: 'Maîtriser React Native',
      emoji: '⚛️',
      category: 'learning',
      targetMin: 60,
      progress: 0.41,
      status: 'active',
      userId: user.id,
    },
  });

  const obj3 = await prisma.objective.create({
    data: {
      title: 'Courir 5km',
      emoji: '🏃',
      category: 'sport',
      targetMin: 30,
      progress: 0.23,
      status: 'active',
      userId: user.id,
    },
  });

  console.log('✅ Objectifs créés');

  // Créer des habitudes
  await prisma.habit.createMany({
    data: [
      { title: 'Anglais 15 min', emoji: '🇬🇧', frequency: 'daily', targetDays: [1,2,3,4,5,6,7], userId: user.id, objectiveId: obj1.id },
      { title: 'Coder 1h', emoji: '⚛️', frequency: 'daily', targetDays: [1,2,3,4,5,6,7], userId: user.id, objectiveId: obj2.id },
      { title: 'Sport', emoji: '🏃', frequency: 'weekly', targetDays: [1,3,5], userId: user.id, objectiveId: obj3.id },
      { title: 'Lecture', emoji: '📚', frequency: 'daily', targetDays: [1,2,3,4,5,6,7], userId: user.id },
    ],
  });

  console.log('✅ Habitudes créées');

  // Créer des sessions de test
  const now = new Date();
  const sessions = [];
  for (let i = 0; i < 10; i++) {
    const startedAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const durationMin = Math.floor(Math.random() * 60) + 20;
    sessions.push({
      durationMin,
      startedAt,
      endedAt: new Date(startedAt.getTime() + durationMin * 60 * 1000),
      userId: user.id,
      objectiveId: i % 2 === 0 ? obj1.id : obj2.id,
      note: i === 0 ? 'Super session !' : null,
    });
  }
  await prisma.session.createMany({ data: sessions });

  console.log('✅ Sessions créées');
  console.log('\n🎉 Seed terminé !');
  console.log('📧 Email    : alex@skilltrack.dev');
  console.log('🔑 Password : password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());