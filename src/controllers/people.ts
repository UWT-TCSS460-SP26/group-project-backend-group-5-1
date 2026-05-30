import { Request, Response } from 'express';
import { searchPersonCredits } from '../services/people';

const DEFAULT_LIMIT = 20;
const VALID_MEDIA_TYPES = ['movie', 'tv', 'all'] as const;
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

export const getPeopleSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, media_type, limit } = req.query;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name query parameter is required' });
      return;
    }

    const resolvedMediaType: string = typeof media_type === 'string' ? media_type : 'all';
    if (!VALID_MEDIA_TYPES.includes(resolvedMediaType as MediaType)) {
      res.status(400).json({ error: 'media_type must be movie, tv, or all' });
      return;
    }

    const parsedLimit = limit ? parseInt(limit as string, 10) : DEFAULT_LIMIT;

    const results = await searchPersonCredits(
      name.trim(),
      resolvedMediaType as MediaType,
      parsedLimit
    );

    if (results === null) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    res.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
