import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { fetchTmdb as fetchMovieTmdb } from '../services/movies';
import { fetchTmdb as fetchTvTmdb } from '../services/tv';

const MIN_RATING_COUNT = 10;

type MediaType = 'movie' | 'tv';

async function enrichWithTmdb(mediaId: number, mediaType: MediaType) {
  if (mediaType === 'movie') {
    return fetchMovieTmdb(`/movie/${mediaId}`);
  }
  return fetchTvTmdb(`/tv/${mediaId}`);
}

/**
 * GET /discovery/top-rated
 * Returns community top-rated movies and TV shows, enriched with TMDB metadata.
 * Requires a minimum of 10 ratings to filter outliers.
 * Public route — no auth required.
 */
export async function getTopRated(req: Request, res: Response) {
  try {
    const aggregates = await prisma.rating.groupBy({
      by: ['mediaId', 'mediaType'],
      _avg: { score: true },
      _count: { score: true },
      having: { score: { _count: { gte: MIN_RATING_COUNT } } },
      orderBy: { _avg: { score: 'desc' } },
      take: 20,
    });

    const enriched = await Promise.all(
      aggregates
        .filter(
          (agg): agg is typeof agg & { mediaType: MediaType } =>
            agg.mediaType === 'movie' || agg.mediaType === 'tv'
        )
        .map(async (agg) => {
          try {
            const tmdbData = await enrichWithTmdb(agg.mediaId, agg.mediaType);
            return {
              mediaId: agg.mediaId,
              mediaType: agg.mediaType,
              community_rating: agg._avg.score,
              community_rating_count: agg._count.score,
              tmdb: tmdbData,
            };
          } catch {
            // TMDB lookup failed — omit from results
            return null;
          }
        })
    );

    return res.json(enriched.filter((item) => item !== null));
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch top-rated items' });
  }
}

/**
 * GET /discovery/most-reviewed
 * Returns community most-reviewed movies and TV shows, enriched with TMDB metadata.
 * Ranked by total number of ratings regardless of score.
 * Public route — no auth required.
 */
export async function getMostReviewed(req: Request, res: Response) {
  try {
    const aggregates = await prisma.rating.groupBy({
      by: ['mediaId', 'mediaType'],
      _avg: { score: true },
      _count: { score: true },
      orderBy: { _count: { score: 'desc' } },
      take: 20,
    });

    const enriched = await Promise.all(
      aggregates
        .filter(
          (agg): agg is typeof agg & { mediaType: MediaType } =>
            agg.mediaType === 'movie' || agg.mediaType === 'tv'
        )
        .map(async (agg) => {
          try {
            const tmdbData = await enrichWithTmdb(agg.mediaId, agg.mediaType);
            return {
              mediaId: agg.mediaId,
              mediaType: agg.mediaType,
              community_rating: agg._avg.score,
              community_rating_count: agg._count.score,
              tmdb: tmdbData,
            };
          } catch {
            // TMDB lookup failed — omit from results
            return null;
          }
        })
    );

    return res.json(enriched.filter((item) => item !== null));
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch most-reviewed items' });
  }
}
