import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as authService from '../services/auth.service';

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    data: { user, accessToken, refreshToken },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: { user, accessToken, refreshToken },
  });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const { accessToken } = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    data: { accessToken },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Côté serveur on ne stocke pas les tokens ici,
  // le client doit supprimer son token en local
  // (à étendre avec une blacklist en production)
  res.status(200).json({
    success: true,
    message: 'Déconnecté avec succès',
  });
});

// GET /api/auth/me  (protégé par authMiddleware)
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
