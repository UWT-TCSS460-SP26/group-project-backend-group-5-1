import { fetchTmdb } from './movies';
import { prisma } from '../lib/prisma';

interface TmdbPersonSearchResponse {
  results: { id: number; name: string }[];
  total_results: number;
}

interface TmdbCombinedCredit {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  character: string;
}

interface TmdbCombinedCreditsResponse {
  cast: TmdbCombinedCredit[];
}

interface RatingGroupRow {
  mediaId: number;
  _avg: { score: number | null };
  _count: { id: number };
}

export interface EnrichedCredit {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  overview: string;
  release_date: string | null;
  poster_path: string | null;
  character: string;
  community_rating: number | null;
  community_rating_count: number;
}

export async function searchPersonCredits(
  name: string,
  mediaType: 'movie' | 'tv' | 'all',
  limit: number
): Promise<EnrichedCredit[] | null> {
  const searchData = (await fetchTmdb('/search/person', {
    query: name,
  })) as unknown as TmdbPersonSearchResponse;

  if (!searchData.results || searchData.results.length === 0) {
    return null;
  }

  const personId = searchData.results[0].id;
  const creditsData = (await fetchTmdb(
    `/person/${personId}/combined_credits`
  )) as unknown as TmdbCombinedCreditsResponse;

  let credits = creditsData.cast ?? [];

  if (mediaType !== 'all') {
    credits = credits.filter((c) => c.media_type === mediaType);
  }

  credits = credits.slice(0, limit);

  const movieIds = credits.filter((c) => c.media_type === 'movie').map((c) => c.id);
  const tvIds = credits.filter((c) => c.media_type === 'tv').map((c) => c.id);

  const [movieRatings, tvRatings] = await Promise.all([
    movieIds.length > 0
      ? (prisma.rating.groupBy({
          by: ['mediaId'],
          where: { mediaId: { in: movieIds }, mediaType: 'movie' },
          _avg: { score: true },
          _count: { id: true },
        }) as unknown as Promise<RatingGroupRow[]>)
      : Promise.resolve([] as RatingGroupRow[]),
    tvIds.length > 0
      ? (prisma.rating.groupBy({
          by: ['mediaId'],
          where: { mediaId: { in: tvIds }, mediaType: 'tv' },
          _avg: { score: true },
          _count: { id: true },
        }) as unknown as Promise<RatingGroupRow[]>)
      : Promise.resolve([] as RatingGroupRow[]),
  ]);

  const ratingMap = new Map<string, { avg: number | null; count: number }>();
  for (const r of movieRatings) {
    ratingMap.set(`movie:${r.mediaId}`, { avg: r._avg.score, count: r._count.id });
  }
  for (const r of tvRatings) {
    ratingMap.set(`tv:${r.mediaId}`, { avg: r._avg.score, count: r._count.id });
  }

  return credits.map((credit) => {
    const rating = ratingMap.get(`${credit.media_type}:${credit.id}`);
    return {
      id: credit.id,
      title: credit.title ?? credit.name ?? '',
      media_type: credit.media_type,
      overview: credit.overview,
      release_date: credit.release_date ?? credit.first_air_date ?? null,
      poster_path: credit.poster_path,
      character: credit.character,
      community_rating: rating?.avg ?? null,
      community_rating_count: rating?.count ?? 0,
    };
  });
}
