import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Star, Calendar, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { resolveVideoSource } from "@/lib/video";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWatchHistory } from "@/hooks/useWatchHistory";

const CustomContentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPlayer, setShowPlayer] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { upsertProgress } = useWatchHistory();

  const { data: content, isLoading } = useQuery({
    queryKey: ["custom-content", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_content")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleSaveProgress = useCallback((position: number, dur: number) => {
    if (!content || !user) return;
    upsertProgress.mutate({
      content_id: content.id,
      content_type: "custom",
      title: content.title,
      poster_path: content.poster_path,
      backdrop_path: content.backdrop_path,
      video_url: content.video_url,
      playback_position: position,
      total_duration: dur,
    });
  }, [content, user, upsertProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-[70vh] bg-muted animate-pulse" />
      </div>
    );
  }

  if (!content) return null;

  const playerSource = resolveVideoSource(content.video_url);

  const posterUrl = content.poster_path?.startsWith("http")
    ? content.poster_path
    : content.poster_path
    ? `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : null;

  const backdropUrl = content.backdrop_path?.startsWith("http")
    ? content.backdrop_path
    : content.backdrop_path
    ? `https://image.tmdb.org/t/p/original${content.backdrop_path}`
    : null;

  const handlePlay = () => {
    if (playerSource) {
      setShowPlayer(true);
    } else {
      toast.error(t("videoUnavailable"));
    }
  };

  return (
    <div className="min-h-screen bg-background" onContextMenu={(e) => e.preventDefault()}>
      <Navbar />
      {showPlayer && playerSource && (
        <CustomVideoPlayer
          type={playerSource.type}
          src={playerSource.src}
          onClose={() => setShowPlayer(false)}
          title={content.title}
          onSaveProgress={handleSaveProgress}
        />
      )}

      <div className="relative h-[70vh] w-full">
        {backdropUrl ? (
          <img src={backdropUrl} alt={content.title} className="w-full h-full object-cover select-none" draggable={false} />
        ) : posterUrl ? (
          <img src={posterUrl} alt={content.title} className="w-full h-full object-cover blur-sm scale-110 select-none" draggable={false} />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      <div className="relative -mt-[40vh] z-10 max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 w-[200px] sm:w-[260px] mx-auto md:mx-0">
            {posterUrl ? (
              <img src={posterUrl} alt={content.title} className="w-full rounded-lg shadow-2xl aspect-[2/3] object-cover select-none" draggable={false} />
            ) : (
              <div className="w-full rounded-lg shadow-2xl aspect-[2/3] bg-muted flex items-center justify-center">
                {content.media_type === "tv" ? <Tv className="h-12 w-12 text-muted-foreground" /> : <Film className="h-12 w-12 text-muted-foreground" />}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm">
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </button>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide text-foreground mb-2">{content.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {content.vote_average && content.vote_average > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-cinema-gold fill-current" />{Number(content.vote_average).toFixed(1)}</span>
              )}
              {content.release_date && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{content.release_date.slice(0, 4)}</span>
              )}
              <span className="flex items-center gap-1">
                {content.media_type === "tv" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                {content.media_type === "tv" ? t("tvShow") : t("movie")}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
               <Button variant="cinema" size="lg" className="gap-2" onClick={handlePlay} disabled={!playerSource}>
                <Play className="h-5 w-5 fill-current" />
                {playerSource
                  ? content.media_type === "tv" ? t("watchSeries") : t("watchMovie")
                  : t("videoUnavailable")}
              </Button>
            </div>
            {content.overview && (
              <>
                <h3 className="text-foreground font-semibold mb-2">{t("description")}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">{content.overview}</p>
              </>
            )}
            {!playerSource && (
              <p className="text-destructive text-sm mt-4">{t("videoUnavailable")}</p>
            )}
          </div>
        </motion.div>
      </div>
      <div className="h-16" />
    </div>
  );
};

export default CustomContentPage;
