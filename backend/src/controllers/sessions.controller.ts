import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as sessionsService from '../services/sessions.service';

type GetSessionByIdParams = {
  id: string;
};

// GET /api/sessions?page=1&limit=20&objectiveId=xxx&from=...&to=...
export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;

  const result = await sessionsService.getSessions(req.userId, {
    page: parseInt(query.page) || 1,
    limit: Math.min(parseInt(query.limit) || 20, 50),
    objectiveId: query.objectiveId,
    from: query.from,
    to: query.to,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

// GET /api/sessions/:id
export const getSessionById = asyncHandler(
  async (req: Request<GetSessionByIdParams>, res: Response) => {
    const session = await sessionsService.getSessionById(req.params.id, req.userId);

    res.status(200).json({
      success: true,
      data: { session },
    });
  }
);

// POST /api/sessions
export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const session = await sessionsService.createSession(req.userId, req.body);

  res.status(201).json({
    success: true,
    message: 'Session enregistrée !',
    data: { session },
  });
});

// DELETE /api/sessions/:id
export const deleteSession = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  await sessionsService.deleteSession(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    message: 'Session supprimée',
  });
});
