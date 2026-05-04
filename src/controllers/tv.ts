import { Request, Response } from 'express';
import { fetchTmdb, fetchTvPage, parseTvQuery, TMDB_PAGE_SIZE } from '../services/tv';
import { prisma } from '../lib/prisma';

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
    const tvId = parseInt(id as string, 10);

    // Fetch TMDB data
    const tmdbData = await fetchTmdb(`/tv/${id}`);

    // Fetch community data
    const [ratingAgg, recentReviews, reviewCount] = await Promise.all([
      prisma.rating.aggregate({
        where: { mediaId: tvId, mediaType: 'tv' },
        _avg: { score: true },
        _count: true,
      }),
      prisma.review.findMany({
        where: { mediaId: tvId, mediaType: 'tv' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { username: true } } },
      }),
      prisma.review.count({ where: { mediaId: tvId, mediaType: 'tv' } }),
    ]);

    // Merge and respond
    const enrichedData = {
      ...tmdbData,
      community_rating: ratingAgg._avg.score || null,
      community_rating_count: ratingAgg._count,
      review_count: reviewCount,
      recent_reviews: recentReviews.map((r) => ({
        id: r.id,
        review_text: r.body,
        created_at: r.createdAt,
        user: r.user,
      })),
    };

    res.json(enrichedData);
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
