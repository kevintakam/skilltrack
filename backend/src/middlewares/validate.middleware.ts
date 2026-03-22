import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Middleware générique de validation Zod
// Usage: router.post('/route', validate(monSchema), monController)
export const validate =
  (schema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.body = result.body ?? req.body;
      if (result.params) {
        req.params = result.params as Request['params'];
      }
      if (result.query) {
        req.query = result.query as Request['query'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => ({
          field: e.path.filter((p) => p !== 'body').join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: messages,
        });
        return;
      }

      next(error);
    }
  };