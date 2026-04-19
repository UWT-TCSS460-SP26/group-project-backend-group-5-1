import tmdb from "../config/tmdbClient";
import { mapTvSearchResult, mapTvDetails } from "../mappers/tvMapper";


export async function searchTvShows(query: string, year?: string, page: number = 1) {
  if (!query) {
    throw Object.assign(new Error("Missing required query parameter: q"), { status: 400 });
  }

const params: Record<string, string | number> = { query, page };
if (year) params.first_air_date_year = year;


  const { data } = await tmdb.get("/search/tv", { params });

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map(mapTvSearchResult),
  };
}

export async function getPopularTvShows(page: number = 1) {
  const { data } = await tmdb.get("/tv/popular", { params: { page } });

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: data.results.map(mapTvSearchResult),
  };
}

export async function getTvDetails(id: string) {
  if (!id) {
    throw Object.assign(new Error("Missing TV show ID"), { status: 400 });
  }

  const { data } = await tmdb.get(`/tv/${id}`);

  return mapTvDetails(data);
}
