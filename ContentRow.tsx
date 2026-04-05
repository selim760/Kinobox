import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Movie } from "@/lib/tmdb";
import MovieCard from "./MovieCard";

interface ContentRowProps {
  title: string;
  movies: Movie[];
}

const ContentRow = ({ title, movies }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!movies.length) return null;

  return (
    <section ref={sectionRef} className="relative group/row py-4">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 px-4 sm:px-6">
        {title}
      </h2>
      {visible ? (
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="hidden sm:flex absolute left-0 top-0 bottom-8 z-10 w-10 items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden sm:flex absolute right-0 top-0 bottom-8 z-10 w-10 items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6 text-foreground" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 carousel-mask snap-x snap-mandatory sm:snap-none"
            style={{ scrollbarWidth: "none" }}
          >
            {movies.map((movie, i) => (
              <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[220px] sm:h-[280px]" /> // placeholder height
      )}
    </section>
  );
};

export default ContentRow;
