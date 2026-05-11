import { Request, Response, NextFunction } from 'express';

export const validateTvId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'TV id must be a string' });
    return;
  }

  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed === 0) {
    res.status(400).json({ error: 'TV id must be a positive integer' });
    return;
  }

  if (parsed < 0) {
    res.status(404).json({ error: `TV show with id ${id} not found` });
    return;
  }

  next();
};
