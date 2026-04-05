// TMDb API integration
// Using TMDb API v3 - free for non-commercial use
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";
const TMDB_KEY = "2dca580c2a14b55200e784d157207b4d"; // Public demo key

export interface Movie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: string;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  videos?: {
    results: { key: string; site: string; type: string; name: string }[];
  };
  similar?: { results: Movie[] };
}

export const getImageUrl = (path: string | null, size = "w500") => {
  if (!path) return "/placeholder.svg";
  return `${TMDB_IMAGE}/${size}${path}`;
};

async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "ru-RU");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
  return res.json();
}

export const getTrending = () =>
  fetchTMDB<{ results: Movie[] }>("/trending/all/week").then((r) => r.results);

export const getPopularMovies = () =>
  fetchTMDB<{ results: Movie[] }>("/movie/popular").then((r) => r.results);

export const getPopularSeries = () =>
  fetchTMDB<{ results: Movie[] }>("/tv/popular").then((r) => r.results);

export const getUpcoming = () =>
  fetchTMDB<{ results: Movie[] }>("/movie/upcoming").then((r) => r.results);

export const getMovieDetails = (id: number) =>
  fetchTMDB<MovieDetails>(`/movie/${id}`, { append_to_response: "videos,similar" });

export const getTVDetails = (id: number) =>
  fetchTMDB<MovieDetails>(`/tv/${id}`, { append_to_response: "videos,similar" });

export const searchMulti = (query: string) =>
  fetchTMDB<{ results: Movie[] }>("/search/multi", { query });

export const getGenres = () =>
  fetchTMDB<{ genres: { id: number; name: string }[] }>("/genre/movie/list").then((r) => r.genres);

export const discoverByGenre = (genreId: number) =>
  fetchTMDB<{ results: Movie[] }>("/discover/movie", { with_genres: String(genreId) }).then((r) => r.results);
