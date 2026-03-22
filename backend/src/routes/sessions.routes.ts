import { Router } from 'express';
import * as sessionsController from '../controllers/sessions.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createSessionSchema } from '../schemas/session.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', sessionsController.getSessions);
router.post('/', validate(createSessionSchema), sessionsController.createSession);
router.get('/:id', sessionsController.getSessionById);
router.delete('/:id', sessionsController.deleteSession);

export default router;
