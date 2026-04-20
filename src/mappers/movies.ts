import { ParsedQs } from 'qs';

const TMDB_PAGE_SIZE = 20;

interface TmdbResponse {
  results: TmdbMovie[];
}

interface TmdbMovie {
  id: number;
  title: string;
  backdrop_path: string | null;
  poster_path: string | null;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  original_title: string;
  overview: string;
  release_date: string;
}

interface TmdbError extends Error {
  status?: number;
}

interface MovieQueryParams {
  query?: string | ParsedQs;
  primary_release_date_gte?: string | ParsedQs;
  primary_release_date_lte?: string | ParsedQs;
  with_genres?: string | ParsedQs;
  vote_average_gte?: string | ParsedQs;
  vote_average_lte?: string | ParsedQs;
  with_runtime_gte?: string | ParsedQs;
  with_runtime_lte?: string | ParsedQs;
  language?: string | ParsedQs;
  limit?: string | ParsedQs;
}

export const MOVIE_SUMMARY_FIELDS = ['backdrop_path', 'id', 'title', 'poster_path'] as const;

export const MOVIE_DETAIL_FIELDS = [
  'title',
  'original_title',
  'overview',
  'tagline',
  'runtime',
  'release_date',
  'status',
  'adult',
  'genre_ids',
  'genres',
  'original_language',
  'spoken_languages',
  'budget',
  'revenue',
  'poster_path',
  'backdrop_path',
  'imdb_id',
  'production_companies',
  'production_countries',
  'belongs_to_collection',
] as const;

export { TMDB_PAGE_SIZE, TmdbResponse, TmdbMovie, TmdbError, MovieQueryParams };
