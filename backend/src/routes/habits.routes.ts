import { Router } from 'express';
import * as habitsController from '../controllers/habits.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createHabitSchema, updateHabitSchema } from '../schemas/habit.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', habitsController.getHabits);
router.post('/', validate(createHabitSchema), habitsController.createHabit);
router.get('/:id', habitsController.getHabitById);
router.patch('/:id', validate(updateHabitSchema), habitsController.updateHabit);
router.delete('/:id', habitsController.deleteHabit);

// Complétion du jour
router.post('/:id/complete', habitsController.completeHabit);
router.delete('/:id/complete', habitsController.uncompleteHabit);

export default router;
