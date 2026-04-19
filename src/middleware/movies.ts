import { Request, Response, NextFunction } from 'express';

// validateLimit
const MAX_LIMIT = 50;

export const validateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const { limit } = req.query;

  if (limit === undefined) return next();

  if (typeof limit !== 'string') {
    res.status(400).json({ error: 'limit must be a string' });
    return;
  }

  const parsed = parseInt(limit, 10);

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

// trimMovieFields
const MOVIE_SUMMARY_FIELDS = ['backdrop_path', 'id', 'title', 'poster_path'] as const;

type MovieSummaryField = (typeof MOVIE_SUMMARY_FIELDS)[number];
type FilteredMovie = Pick<Record<MovieSummaryField, string | number | null>, MovieSummaryField>;

const filterMovieSummary = (movie: Record<string, unknown>): FilteredMovie =>
  MOVIE_SUMMARY_FIELDS.reduce((acc, field) => {
    if (field in movie) acc[field] = movie[field] as string | number | null;
    return acc;
  }, {} as FilteredMovie);

export const trimMovieFields = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = (data: unknown) => {
    if (Array.isArray(data)) {
      return originalJson(data.map((item: Record<string, unknown>) => filterMovieSummary(item)));
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      'results' in data &&
      Array.isArray((data as Record<string, unknown>).results)
    ) {
      return originalJson(
        ((data as Record<string, unknown>).results as Record<string, unknown>[]).map(
          filterMovieSummary
        )
      );
    }
    return originalJson(data);
  };

  next();
};

// validateMovieId
export const validateMovieId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    res.status(400).json({ error: 'Movie id must be a string' });
    return;
  }

  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed < 1) {
    res.status(400).json({ error: 'Movie id must be a positive integer' });
    return;
  }

  next();
};

// trimMovieByIdFields
const MOVIE_DETAIL_FIELDS = [
  'adult',
  'genre_ids',
  'original_language',
  'original_title',
  'overview',
  'release_date',
  'title',
] as const;

type MovieDetailField = (typeof MOVIE_DETAIL_FIELDS)[number];
type FilteredMovieDetail = Partial<Record<MovieDetailField, unknown>>;

export const trimMovieByIdFields = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = (data: unknown) => {
    if (typeof data === 'object' && data !== null && !('error' in data)) {
      const movie = data as Record<string, unknown>;
      const filtered = MOVIE_DETAIL_FIELDS.reduce((acc, field) => {
        if (field in movie) acc[field] = movie[field];
        return acc;
      }, {} as FilteredMovieDetail);
      return originalJson(filtered);
    }
    return originalJson(data);
  };

  next();
};
