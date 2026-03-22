import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as objectivesService from '../services/objectives.service';

type GetSessionByIdParams = {
  id: string;
};

// GET /api/objectives?status=active
export const getObjectives = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };
  const objectives = await objectivesService.getObjectives(req.userId, status);

  res.status(200).json({
    success: true,
    data: { objectives, count: objectives.length },
  });
});

// GET /api/objectives/:id
export const getObjectiveById = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const objective = await objectivesService.getObjectiveById(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    data: { objective },
  });
});

// POST /api/objectives
export const createObjective = asyncHandler(async (req: Request, res: Response) => {
  const objective = await objectivesService.createObjective(req.userId, req.body);

  res.status(201).json({
    success: true,
    message: 'Objectif créé avec succès',
    data: { objective },
  });
});

// PATCH /api/objectives/:id
export const updateObjective = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const objective = await objectivesService.updateObjective(
    req.params.id,
    req.userId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Objectif mis à jour',
    data: { objective },
  });
});

// PATCH /api/objectives/:id/status
export const updateObjectiveStatus = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const { status } = req.body;
  const objective = await objectivesService.updateObjectiveStatus(
    req.params.id,
    req.userId,
    status
  );

  res.status(200).json({
    success: true,
    message: `Objectif marqué comme "${status}"`,
    data: { objective },
  });
});

// DELETE /api/objectives/:id
export const deleteObjective = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  await objectivesService.deleteObjective(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    message: 'Objectif supprimé',
  });
});
