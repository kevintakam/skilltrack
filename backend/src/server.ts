import app from './app';
import { prisma } from './types/prisma';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Vérifier la connexion à PostgreSQL avant de démarrer
    await prisma.$connect();
    console.log('✅ PostgreSQL connecté');

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════╗');
      console.log('║        SkillTrack API 🚀              ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║  URL     : http://localhost:${PORT}      ║`);
      console.log(`║  Mode    : ${process.env.NODE_ENV || 'development'}              ║`);
      console.log('╠══════════════════════════════════════╣');
      console.log('║  Endpoints disponibles :              ║');
      console.log('║  POST  /api/auth/register             ║');
      console.log('║  POST  /api/auth/login                ║');
      console.log('║  GET   /api/objectives                ║');
      console.log('║  GET   /api/habits                    ║');
      console.log('║  GET   /api/sessions                  ║');
      console.log('║  GET   /api/stats/dashboard           ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');
    });

    // Arrêt propre (Ctrl+C)
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} reçu. Arrêt propre...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ PostgreSQL déconnecté. Bye !');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
