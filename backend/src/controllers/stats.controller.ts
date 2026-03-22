import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as statsService from '../services/stats.service';

// GET /api/stats/dashboard
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await statsService.getDashboardStats(req.userId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// GET /api/stats/heatmap
export const getHeatmap = asyncHandler(async (req: Request, res: Response) => {
  const data = await statsService.getHeatmapStats(req.userId);

  res.status(200).json({
    success: true,
    data,
  });
});

// GET /api/stats/profile
export const getProfileStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await statsService.getUserStats(req.userId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
