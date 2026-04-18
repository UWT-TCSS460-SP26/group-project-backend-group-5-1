import { Request, Response } from 'express';

const TMDB_PAGE_SIZE = 20;

const fetchTmdb = async (
  path: string,
  params: Record<string, string | undefined> = {}
): Promise<any> => {
  const url = new URL(`${process.env.TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY as string);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = new Error(`TMDB error: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

const fetchMoviePage = async (
  path: string,
  params: Record<string, string | undefined>,
  page: number
): Promise<any[]> => {
  const data = await fetchTmdb(path, { ...params, page: page.toString() });
  return data.results;
};

export const getMovies = async (req: Request, res: Response) => {
  try {
    const {
      query,
      primary_release_date_gte,
      primary_release_date_lte,
      with_genres,
      vote_average_gte,
      vote_average_lte,
      with_runtime_gte,
      with_runtime_lte,
      language,
      limit,
    } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : TMDB_PAGE_SIZE;
    const pagesNeeded = Math.ceil(parsedLimit / TMDB_PAGE_SIZE);
    const isTextSearch = typeof query === 'string' && query.trim().length > 0;

    let path: string;
    let params: Record<string, string | undefined>;

    if (isTextSearch) {
      path = '/search/movie';
      params = {
        query: query as string,
        language: language as string | undefined,
      };
    } else {
      path = '/discover/movie';
      params = {
        primary_release_date_gte: primary_release_date_gte as string | undefined,
        primary_release_date_lte: primary_release_date_lte as string | undefined,
        with_genres: with_genres as string | undefined,
        vote_average_gte: vote_average_gte as string | undefined,
        vote_average_lte: vote_average_lte as string | undefined,
        with_runtime_gte: with_runtime_gte as string | undefined,
        with_runtime_lte: with_runtime_lte as string | undefined,
        language: language as string | undefined,
      };
    }

    const pages = Array.from({ length: pagesNeeded }, (_, i) => i + 1);
    const results = await Promise.all(pages.map((page) => fetchMoviePage(path, params, page)));
    const merged = results.flat().slice(0, parsedLimit);

    res.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getMovieById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await fetchTmdb(`/movie/${id}`);

    res.json(data);
  } catch (error) {
    if ((error as any).status === 404) {
      res.status(404).json({ error: `Movie with id ${req.params.id} not found` });
      return;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getPopularMovies = async (req: Request, res: Response) => {
  try {
    const { language, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : TMDB_PAGE_SIZE;
    const pagesNeeded = Math.ceil(parsedLimit / TMDB_PAGE_SIZE);

    const params: Record<string, string | undefined> = {
      language: language as string | undefined,
    };

    const pages = Array.from({ length: pagesNeeded }, (_, i) => i + 1);
    const results = await Promise.all(
      pages.map((page) => fetchMoviePage('/movie/popular', params, page))
    );
    const merged = results.flat().slice(0, parsedLimit);

    res.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
