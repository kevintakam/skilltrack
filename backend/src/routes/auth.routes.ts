import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../schemas/auth.schema';

const router = Router();

// Routes publiques (pas de JWT requis)
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

// Route protégée
router.get('/me', authMiddleware, authController.me);

export default router;
