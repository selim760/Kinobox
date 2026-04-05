import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { searchMulti, getGenres, discoverByGenre, getPopularMovies, Movie } from "@/lib/tmdb";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const { data: genres } = useQuery({ queryKey: ["genres"], queryFn: getGenres });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchMulti(query),
    enabled: query.length > 1,
  });

  const { data: genreResults, isLoading: genreLoading } = useQuery({
    queryKey: ["genre", selectedGenre],
    queryFn: () => discoverByGenre(selectedGenre!),
    enabled: !!selectedGenre && !query,
  });

  const { data: defaultMovies } = useQuery({
    queryKey: ["popular-default"],
    queryFn: getPopularMovies,
    enabled: !query && !selectedGenre,
  });

  const movies: Movie[] = query
    ? (searchResults?.results || []).filter((m: Movie) => m.poster_path)
    : selectedGenre
    ? (genreResults || [])
    : (defaultMovies || []);

  const loading = searchLoading || genreLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto">
        {/* Search input */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedGenre(null);
            }}
            placeholder="Поиск фильмов и сериалов..."
            className="w-full bg-secondary border border-border rounded-lg pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Genre filters */}
        {genres && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => { setSelectedGenre(null); setQuery(""); }}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                !selectedGenre && !query
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Все
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGenre(g.id); setQuery(""); }}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  selectedGenre === g.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-muted rounded-md animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {query && (
              <p className="text-muted-foreground mb-4 text-sm">
                {movies.length > 0
                  ? `Найдено результатов: ${movies.length}`
                  : "Ничего не найдено"}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
