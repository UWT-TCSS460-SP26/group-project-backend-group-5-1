import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { fetchTmdb as fetchMovieTmdb } from '../services/movies';
import { fetchTmdb as fetchTvTmdb } from '../services/tv';

const MIN_RATING_COUNT = 10;

type MediaType = 'movie' | 'tv';

interface MovieTmdbSummary {
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genres: { id: number; name: string }[];
  release_date: string;
}

interface TvTmdbSummary {
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genres: { id: number; name: string }[];
  first_air_date: string;
}

type TmdbSummary = MovieTmdbSummary | TvTmdbSummary;

async function enrichWithTmdb(mediaId: number, mediaType: MediaType): Promise<TmdbSummary> {
  if (mediaType === 'movie') {
    const data = (await fetchMovieTmdb(`/movie/${mediaId}`)) as unknown as Record<string, unknown>;
    return {
      title: data['title'] as string,
      poster_path: (data['poster_path'] as string | null) ?? null,
      backdrop_path: (data['backdrop_path'] as string | null) ?? null,
      overview: (data['overview'] as string) ?? '',
      genres: (data['genres'] as { id: number; name: string }[]) ?? [],
      release_date: (data['release_date'] as string) ?? '',
    };
  }
  const data = (await fetchTvTmdb(`/tv/${mediaId}`)) as unknown as Record<string, unknown>;
  return {
    name: data['name'] as string,
    poster_path: (data['poster_path'] as string | null) ?? null,
    backdrop_path: (data['backdrop_path'] as string | null) ?? null,
    overview: (data['overview'] as string) ?? '',
    genres: (data['genres'] as { id: number; name: string }[]) ?? [],
    first_air_date: (data['first_air_date'] as string) ?? '',
  };
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
