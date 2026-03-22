import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', statsController.getDashboard);
router.get('/heatmap', statsController.getHeatmap);
router.get('/profile', statsController.getProfileStats);

export default router;
