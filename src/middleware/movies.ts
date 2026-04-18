import { Request, Response, NextFunction } from 'express';

export const validateLimit = (req: Request, res: Response, next: NextFunction) => {
  const MAX_LIMIT = 50;
  const { limit } = req.query;

  if (limit === undefined) return next();

  const parsed = parseInt(limit as string, 10);

  if (isNaN(parsed) || parsed < 1) {
    res.status(400).json({ error: 'limit must be a positive integer' });
    return;
  }

  if (parsed > MAX_LIMIT) {
    res.status(400).json({ error: `limit must not exceed ${MAX_LIMIT}` });
    return;
  }

  req.query.limit = parsed.toString();
  next();
};

export const trimMovieFields = (req: Request, res: Response, next: NextFunction) => {
  const FIELDS_TO_KEEP = ['backdrop_path', 'id', 'title', 'poster_path'];

  const filterMovie = (movie: any) =>
    FIELDS_TO_KEEP.reduce(
      (acc, field) => {
        if (field in movie) acc[field] = movie[field];
        return acc;
      },
      {} as Record<string, any>
    );

  const originalJson = res.json.bind(res);

  res.json = (data: any) => {
    if (Array.isArray(data)) {
      return originalJson(data.map(filterMovie));
    }
    if (data?.results && Array.isArray(data.results)) {
      return originalJson(data.results.map(filterMovie));
    }
    return originalJson(data);
  };

  next();
};

export const validateMovieId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed < 1) {
    res.status(400).json({ error: 'Movie id must be a positive integer' });
    return;
  }

  next();
};

export const trimMovieByIdFields = (req: Request, res: Response, next: NextFunction) => {
  const FIELDS_TO_KEEP = [
    'adult',
    'genre_ids',
    'original_language',
    'original_title',
    'overview',
    'release_date',
    'title',
  ];
  const originalJson = res.json.bind(res);

  res.json = (data: any) => {
    if (data && !data.error) {
      const filtered = FIELDS_TO_KEEP.reduce(
        (acc, field) => {
          if (field in data) acc[field] = data[field];
          return acc;
        },
        {} as Record<string, any>
      );
      return originalJson(filtered);
    }
    return originalJson(data);
  };

  next();
};
