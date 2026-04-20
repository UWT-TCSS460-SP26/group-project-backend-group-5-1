import {
  TMDB_PAGE_SIZE,
  TmdbResponse,
  TmdbMovie,
  TmdbError,
  MovieQueryParams,
} from '../mappers/movies';

const fetchTmdb = async (
  path: string,
  params: Record<string, string | undefined> = {}
): Promise<TmdbResponse | TmdbMovie> => {
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

  return response.json() as Promise<TmdbResponse | TmdbMovie>;
};

const fetchMoviePage = async (
  path: string,
  params: Record<string, string | undefined>,
  page: number
): Promise<TmdbMovie[]> => {
  const data = (await fetchTmdb(path, { ...params, page: page.toString() })) as TmdbResponse;
  return data.results;
};

const parseMovieQuery = (
  query: MovieQueryParams
): { path: string; params: Record<string, string | undefined> } => {
  const {
    query: queryParam,
    primary_release_date_gte,
    primary_release_date_lte,
    with_genres,
    with_runtime_gte,
    with_runtime_lte,
    language,
  } = query;

  const isTextSearch = typeof queryParam === 'string' && queryParam.trim().length > 0;

  if (isTextSearch) {
    return {
      path: '/search/movie',
      params: {
        query: queryParam as string,
        language: language as string | undefined,
      },
    };
  }

  return {
    path: '/discover/movie',
    params: {
      primary_release_date_gte: primary_release_date_gte as string | undefined,
      primary_release_date_lte: primary_release_date_lte as string | undefined,
      with_genres: with_genres as string | undefined,
      with_runtime_gte: with_runtime_gte as string | undefined,
      with_runtime_lte: with_runtime_lte as string | undefined,
      language: language as string | undefined,
    },
  };
};

export {
  fetchTmdb,
  fetchMoviePage,
  parseMovieQuery,
  TMDB_PAGE_SIZE,
  TmdbResponse,
  TmdbMovie,
  TmdbError,
  MovieQueryParams,
};
