import { Play, Plus, Star } from "lucide-react";
import { Movie, getImageUrl } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

const MovieCard = ({ movie, index = 0 }: MovieCardProps) => {
  const navigate = useNavigate();
  const title = movie.title || movie.name || "";
  const mediaType = movie.media_type === "tv" || movie.first_air_date ? "tv" : "movie";
  const customId = (movie as any)._custom_id;

  const handleClick = () => {
    if (customId) {
      navigate(`/custom/${customId}`);
    } else {
      navigate(`/${mediaType}/${movie.id}`);
    }
  };

  const posterSrc = customId && movie.poster_path?.startsWith("http")
    ? movie.poster_path
    : getImageUrl(movie.poster_path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative flex-shrink-0 w-[130px] xs:w-[150px] sm:w-[180px] md:w-[200px] cursor-pointer snap-start"
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
        <img
          src={posterSrc}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-cinema-darker/0 group-hover:bg-cinema-darker/60 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:bg-cinema-red-glow transition-colors">
              <Play className="h-4 w-4 text-primary-foreground fill-current" />
            </button>
            <button className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
              <Plus className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>
        {/* Rating badge */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-cinema-darker/80 rounded px-1.5 py-0.5 text-xs">
            <Star className="h-3 w-3 text-cinema-gold fill-current" />
            <span className="text-foreground">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-foreground truncate">{title}</p>
    </motion.div>
  );
};

export default MovieCard;
