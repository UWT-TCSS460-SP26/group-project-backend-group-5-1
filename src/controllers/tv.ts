import { Request, Response } from 'express';
import { fetchTmdb, fetchTvPage, parseTvQuery, TMDB_PAGE_SIZE } from '../services/tv';

export const getTv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : TMDB_PAGE_SIZE;
    const pagesNeeded = Math.ceil(parsedLimit / TMDB_PAGE_SIZE);

    const { path, params } = parseTvQuery(req.query);

    const pages = Array.from({ length: pagesNeeded }, (_, i) => i + 1);
    const results = await Promise.all(pages.map((page) => fetchTvPage(path, params, page)));
    const merged = results.flat().slice(0, parsedLimit);

    res.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getTvById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = (await fetchTmdb(`/tv/${id}`)) as { id: number };
    res.json(data);
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      res.status(404).json({ error: `TV show with id ${req.params.id} not found` });
      return;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getPopularTv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : TMDB_PAGE_SIZE;
    const pagesNeeded = Math.ceil(parsedLimit / TMDB_PAGE_SIZE);

    const params: Record<string, string | undefined> = {
      language: language as string | undefined,
    };

    const pages = Array.from({ length: pagesNeeded }, (_, i) => i + 1);
    const results = await Promise.all(
      pages.map((page) => fetchTvPage('/tv/popular', params, page))
    );
    const merged = results.flat().slice(0, parsedLimit);

    res.json(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
