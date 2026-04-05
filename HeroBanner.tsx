import { useState, useEffect } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Movie, getImageUrl } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroBannerProps {
  movies: Movie[];
}

const HeroBanner = ({ movies }: HeroBannerProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const featured = movies.slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (!featured.length) return null;

  const movie = featured[current];
  const title = movie.title || movie.name || "";
  const mediaType = movie.media_type === "tv" ? "tv" : "movie";

  return (
    <div className="relative h-[60vh] sm:h-[75vh] lg:h-[85vh] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(movie.backdrop_path, "original")}
            alt={title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

      <div className="absolute bottom-[15%] left-0 right-0 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wide text-foreground mb-2 sm:mb-4">
              {title}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 leading-relaxed">
              {movie.overview}
            </p>
             <div className="flex gap-2 sm:gap-3">
              <Button
                variant="cinema"
                size="default"
                onClick={() => navigate(`/${mediaType}/${movie.id}`)}
                className="gap-2"
              >
                <Play className="h-5 w-5 fill-current" />
                {t("watch")}
              </Button>
              <Button
                variant="cinema-outline"
                size="default"
                onClick={() => navigate(`/${mediaType}/${movie.id}`)}
                className="gap-2"
              >
                <Info className="h-5 w-5" />
                {t("moreInfo")}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-8">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
