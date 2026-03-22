import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes';
import objectivesRoutes from './routes/objectives.routes';
import habitsRoutes from './routes/habits.routes';
import sessionsRoutes from './routes/sessions.routes';
import statsRoutes from './routes/stats.routes';

// Middlewares
import { errorHandler } from './middlewares/error.middleware';

// Charger les variables d'environnement
dotenv.config();

const app = express();

// ── Sécurité ──────────────────────────────────────────────────────────
app.use(helmet()); // Headers HTTP sécurisés
app.use(
  cors({
    origin: [
      'http://localhost:8081',  // Expo web
      'http://localhost:19006', // Expo web (autre port)
      'exp://localhost:8081',   // Expo Go
    ],
    credentials: true,
  })
);

// ── Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logs HTTP ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Affiche: GET /api/auth/me 200 12ms
}

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SkillTrack API is running 🚀',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── Routes API ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/objectives', objectivesRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/stats', statsRoutes);

// ── 404 handler ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route introuvable',
  });
});

// ── Gestion des erreurs globales (DOIT être le dernier middleware) ─────
app.use(errorHandler);

export default app;
