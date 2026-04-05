import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/tmdb";

const WatchHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { history, isLoading, clearHistory } = useWatchHistory();
  const { t } = useLanguage();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-display text-3xl text-foreground">{t("watchHistory")}</h1>
            </div>
            {history.length > 0 && (
              <Button variant="cinema-outline" size="sm" onClick={() => clearHistory.mutate()} className="gap-1">
                <Trash2 className="h-4 w-4" /> {t("clearHistory")}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t("noWatchHistory")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const progress = item.total_duration > 0 ? (item.playback_position / item.total_duration) * 100 : 0;
                const posterSrc = item.poster_path?.startsWith("http") ? item.poster_path : getImageUrl(item.poster_path);
                const path = item.content_type === "custom" ? `/custom/${item.content_id}` : `/${item.content_type}/${item.content_id}`;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate(path)}
                  >
                    <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                      <img src={posterSrc} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted-foreground/30">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{item.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {item.completed ? "✓ Просмотрено" : `${Math.round(progress)}%`}
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        {new Date(item.last_watched_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WatchHistoryPage;
