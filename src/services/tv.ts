import { TmdbTvResponse, TmdbTvDetails } from '../mappers/tv';
import { ParsedQs } from 'qs';

interface TmdbError extends Error {
  status?: number;
}

export const TMDB_PAGE_SIZE = 20;

export const fetchTmdb = async (
  path: string,
  params: Record<string, string | undefined> = {}
): Promise<TmdbTvResponse | TmdbTvDetails> => {
  const url = new URL(`${process.env.TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY as string);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error: TmdbError = new Error(`TMDB error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<TmdbTvResponse | TmdbTvDetails>;
};

export const fetchTvPage = async (
  path: string,
  params: Record<string, string | undefined>,
  page: number
): Promise<TmdbTvDetails[]> => {
  const data = (await fetchTmdb(path, { ...params, page: page.toString() })) as TmdbTvResponse;
  return data.results;
};

export const parseTvQuery = (
  query: ParsedQs
): { path: string; params: Record<string, string | undefined> } => {
  const {
    q,
    language,
    first_air_date_gte,
    first_air_date_lte,
    with_genres,
    with_runtime_gte,
    with_runtime_lte,
  } = query;

  const isTextSearch = typeof q === 'string' && q.trim().length > 0;

  if (isTextSearch) {
    return {
      path: '/search/tv',
      params: {
        query: q as string,
        language: language as string | undefined,
      },
    };
  }

  return {
    path: '/discover/tv',
    params: {
      first_air_date_gte: first_air_date_gte as string | undefined,
      first_air_date_lte: first_air_date_lte as string | undefined,
      with_genres: with_genres as string | undefined,
      with_runtime_gte: with_runtime_gte as string | undefined,
      with_runtime_lte: with_runtime_lte as string | undefined,
      language: language as string | undefined,
    },
  };
};
