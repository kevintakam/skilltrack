import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as habitsService from '../services/habits.service';

type GetSessionByIdParams = {
  id: string;
};

// GET /api/habits
export const getHabits = asyncHandler(async (req: Request, res: Response) => {
  const habits = await habitsService.getHabits(req.userId);

  res.status(200).json({
    success: true,
    data: { habits, count: habits.length },
  });
});

// GET /api/habits/:id
export const getHabitById = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const habit = await habitsService.getHabitById(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    data: { habit },
  });
});

// POST /api/habits
export const createHabit = asyncHandler(async (req: Request, res: Response) => {
  const habit = await habitsService.createHabit(req.userId, req.body);

  res.status(201).json({
    success: true,
    message: 'Habitude créée avec succès',
    data: { habit },
  });
});

// PATCH /api/habits/:id
export const updateHabit = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const habit = await habitsService.updateHabit(req.params.id, req.userId, req.body);

  res.status(200).json({
    success: true,
    message: 'Habitude mise à jour',
    data: { habit },
  });
});

// DELETE /api/habits/:id
export const deleteHabit = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  await habitsService.deleteHabit(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    message: 'Habitude supprimée',
  });
});

// POST /api/habits/:id/complete  →  cocher aujourd'hui
export const completeHabit = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  const { completion, streak } = await habitsService.completeHabit(
    req.params.id,
    req.userId
  );

  res.status(201).json({
    success: true,
    message: '✅ Habitude cochée !',
    data: { completion, streak },
  });
});

// DELETE /api/habits/:id/complete  →  décocher aujourd'hui
export const uncompleteHabit = asyncHandler(async (req: Request<GetSessionByIdParams>, res: Response) => {
  await habitsService.uncompleteHabit(req.params.id, req.userId);

  res.status(200).json({
    success: true,
    message: 'Habitude décochée',
  });
});
