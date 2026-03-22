import bcrypt from 'bcryptjs';
import prisma from '../types/prisma';
import { createError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';


const JWT_SECRET: Secret = process.env.JWT_SECRET ?? '';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET ?? '';

const ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '7d';

const REFRESH_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']) ?? '30d';


// ── Helpers JWT ──────────────────────────────────────────────────────

const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

// ── Service functions ────────────────────────────────────────────────

export const registerUser = async (data: RegisterInput) => {
  // Vérifier si l'email est déjà utilisé
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw createError('Cet email est déjà utilisé', 409);
  }

  // Hasher le mot de passe (10 rounds = bon équilibre sécurité/vitesse)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
    // Ne JAMAIS retourner le mot de passe
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
    },
  });

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (data: LoginInput) => {
  // Trouver l'utilisateur par email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Même message si user inexistant ou mauvais mot de passe
  // (évite d'indiquer si l'email existe)
  if (!user) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  // Comparer le mot de passe avec le hash
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw createError('Email ou mot de passe incorrect', 401);
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  // Retourner user sans mot de passe
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as { userId: string };

    // Vérifier que l'user existe toujours
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw createError('Utilisateur introuvable', 401);
    }

    const newAccessToken = generateAccessToken(user.id, user.email);

    return { accessToken: newAccessToken };
  } catch {
    throw createError('Refresh token invalide ou expiré', 401);
  }
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          objectives: true,
          sessions: true,
          habits: true,
        },
      },
    },
  });

  if (!user) {
    throw createError('Utilisateur introuvable', 404);
  }

  return user;
};
