import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string('Le nom est requis')
      .min(2, 'Le nom doit faire au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      .trim(),
    email: z
      .string('L email est requis')
      .email('Email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string( 'Le mot de passe est requis' )
      .min(6, 'Le mot de passe doit faire au moins 6 caractères')
      .max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string('L email est requis')
      .email('Email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, 'Le mot de passe est requis'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string( 'Le refresh token est requis'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
