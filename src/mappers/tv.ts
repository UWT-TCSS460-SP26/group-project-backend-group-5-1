const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const TV_SUMMARY_FIELDS = ['id', 'name', 'poster_path', 'backdrop_path'] as const;

export const TV_DETAIL_FIELDS = [
  'name',
  'original_name',
  'overview',
  'tagline',
  'first_air_date',
  'last_air_date',
  'status',
  'type',
  'adult',
  'genre_ids',
  'genres',
  'original_language',
  'spoken_languages',
  'origin_country',
  'number_of_episodes',
  'number_of_seasons',
  'seasons',
  'episode_run_time',
  'last_episode_to_air',
  'next_episode_to_air',
  'networks',
  'production_companies',
  'production_countries',
  'created_by',
] as const;

function buildPosterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

export interface TmdbTvResponse {
  results: TmdbSearchTv[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface TmdbSearchTv {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string | null;
}

export interface TmdbTvDetails extends TmdbSearchTv {
  overview?: string | null;
  genres?: { id: number; name: string }[];
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  networks?: { id: number; name: string }[];
}

export function mapTvSearchResult(tv: TmdbSearchTv) {
  return {
    id: tv.id,
    title: tv.name,
    posterUrl: buildPosterUrl(tv.poster_path),
    firstAirDate: tv.first_air_date ?? null,
  };
}

export function mapTvDetails(tv: TmdbTvDetails) {
  return {
    id: tv.id,
    title: tv.name,
    posterUrl: buildPosterUrl(tv.poster_path),
    synopsis: tv.overview ?? null,
    firstAirDate: tv.first_air_date ?? null,
    genres: tv.genres?.map((g) => g.name) ?? [],
    status: tv.status ?? null,
    numberOfSeasons: tv.number_of_seasons ?? null,
    numberOfEpisodes: tv.number_of_episodes ?? null,
    networks: tv.networks?.map((n) => n.name) ?? [],
  };
}
