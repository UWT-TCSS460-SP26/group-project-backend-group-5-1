const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function buildPosterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

// Minimal type for TMDB search results
interface TmdbSearchTv {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string | null;
}

// Minimal type for TMDB detailed TV response
interface TmdbTvDetails extends TmdbSearchTv {
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
