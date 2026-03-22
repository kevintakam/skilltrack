import { Router } from 'express';
import * as objectivesController from '../controllers/objectives.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  updateStatusSchema,
} from '../schemas/objective.schema';

const router = Router();

// Toutes les routes objectifs nécessitent un JWT
router.use(authMiddleware);

router.get('/', objectivesController.getObjectives);
router.post('/', validate(createObjectiveSchema), objectivesController.createObjective);
router.get('/:id', objectivesController.getObjectiveById);
router.patch('/:id', validate(updateObjectiveSchema), objectivesController.updateObjective);
router.patch('/:id/status', validate(updateStatusSchema), objectivesController.updateObjectiveStatus);
router.delete('/:id', objectivesController.deleteObjective);

export default router;
