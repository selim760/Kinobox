import Navbar from "@/components/Navbar";
import { Film, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { getImageUrl } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const MyListPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto flex flex-col items-center justify-center py-20 text-center">
          <Film className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">Войдите, чтобы увидеть ваш список</p>
          <Link to="/auth">
            <Button variant="cinema">Войти</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-8">Мой список</h1>
        <WatchlistContent navigate={navigate} />
      </div>
    </div>
  );
};

const WatchlistContent = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const { watchlist, isLoading, removeFromWatchlist } = useWatchlist();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Film className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-2">Ваш список пуст</p>
        <p className="text-sm text-muted-foreground/60 mb-6">Добавляйте фильмы и сериалы, чтобы смотреть позже</p>
        <Link to="/">
          <Button variant="cinema">Перейти к каталогу</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {watchlist.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group relative cursor-pointer"
          onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
        >
          <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted">
            <img
              src={getImageUrl(item.poster_path)}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all duration-300 flex items-center justify-center">
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full bg-destructive flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist.mutate({ tmdb_id: item.tmdb_id, media_type: item.media_type });
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive-foreground" />
              </button>
            </div>
            {item.vote_average && item.vote_average > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 text-xs">
                <Star className="h-3 w-3 text-cinema-gold fill-current" />
                <span className="text-foreground">{Number(item.vote_average).toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-foreground truncate">{item.title}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default MyListPage;
