import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Plus, Check, ArrowLeft, Star, Clock, Calendar, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import { getMovieDetails, getTVDetails, getImageUrl, type MovieDetails } from "@/lib/tmdb";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useInternetArchive } from "@/hooks/useInternetArchive";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveVideoSource, type VideoSource } from "@/lib/video";

const MoviePage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerSource, setPlayerSource] = useState<VideoSource | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { upsertProgress } = useWatchHistory();

  const isTV = location.pathname.startsWith("/tv");
  const { data: movie, isLoading } = useQuery<MovieDetails>({
    queryKey: [isTV ? "tv" : "movie", id],
    queryFn: () => (isTV ? getTVDetails(Number(id)) : getMovieDetails(Number(id))),
    enabled: !!id,
  });

  const title = movie?.title || movie?.name || "";
  const { data: archiveUrl, isLoading: archiveLoading } = useInternetArchive(title, !!movie);

  const { data: customVideoUrl } = useQuery({
    queryKey: ["custom-video", movie?.id, isTV ? "tv" : "movie"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_content")
        .select("video_url")
        .eq("tmdb_id", movie!.id)
        .eq("media_type", isTV ? "tv" : "movie")
        .not("video_url", "is", null)
        .single();
      return data?.video_url || null;
    },
    enabled: !!movie,
  });

  const handleSaveProgress = useCallback((position: number, dur: number) => {
    if (!movie || !user) return;
    upsertProgress.mutate({
      content_id: String(movie.id),
      content_type: isTV ? "tv" : "movie",
      title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      playback_position: position,
      total_duration: dur,
    });
  }, [movie, user, isTV, title, upsertProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-[70vh] bg-muted animate-pulse" />
      </div>
    );
  }

  if (!movie) return null;

  const mediaType = isTV ? "tv" : "movie";
  const inList = user ? isInWatchlist(movie.id, mediaType) : false;
  const trailer = movie.videos?.results.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  const customPlayerSource = resolveVideoSource(customVideoUrl);

  const handleWatchlist = () => {
    if (!user) {
      toast.info(t("signInToAdd"));
      navigate("/auth");
      return;
    }
    if (inList) {
      removeFromWatchlist.mutate({ tmdb_id: movie.id, media_type: mediaType });
    } else {
      addToWatchlist.mutate({
        tmdb_id: movie.id,
        media_type: mediaType,
        title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
      });
    }
  };

  const handlePlayTrailer = () => {
    if (trailer) {
      setPlayerSource({ type: "youtube", src: trailer.key });
      setShowPlayer(true);
    }
  };

  const handleWatchFull = () => {
    if (customPlayerSource) {
      setPlayerSource(customPlayerSource);
      setShowPlayer(true);
    } else if (archiveUrl) {
      setPlayerSource({ type: "mp4", src: archiveUrl });
      setShowPlayer(true);
    } else if (trailer) {
      toast.info(t("fullVersionShowTrailer"));
      handlePlayTrailer();
    } else {
      toast.error(t("contentUnavailable"));
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
          title={title}
          onSaveProgress={handleSaveProgress}
        />
      )}
      <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] w-full">
        <img src={getImageUrl(movie.backdrop_path, "original")} alt={title} className="w-full h-full object-cover select-none pointer-events-none" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>
      <div className="relative -mt-[40vh] z-10 max-w-[1400px] mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col md:flex-row gap-6 sm:gap-8">
          <div className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[260px] mx-auto md:mx-0">
            <img src={getImageUrl(movie.poster_path, "w500")} alt={title} className="w-full rounded-lg shadow-2xl select-none" draggable={false} />
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm">
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </button>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-wide text-foreground mb-2">{title}</h1>
            {movie.tagline && <p className="text-muted-foreground italic mb-4">{movie.tagline}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-cinema-gold fill-current" />{movie.vote_average.toFixed(1)}</span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{movie.runtime} {t("min")}</span>
              )}
              {(movie.release_date || movie.first_air_date) && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{(movie.release_date || movie.first_air_date || "").slice(0, 4)}</span>
              )}
            </div>
            {movie.genres && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{g.name}</span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="cinema" size="lg" className="gap-2" onClick={handlePlayTrailer} disabled={!trailer}>
                <Play className="h-5 w-5 fill-current" />
                {trailer ? t("watchTrailer") : t("trailerUnavailable")}
              </Button>
              <Button variant="cinema-outline" size="lg" className="gap-2" onClick={handleWatchlist}>
                {inList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {inList ? t("inList") : t("addToList")}
              </Button>
            </div>
            <h3 className="text-foreground font-semibold mb-2">{t("description")}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{movie.overview || t("noDescription")}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 mb-8"
        >
          <Button
            variant="cinema"
            size="lg"
            className="w-full sm:w-auto gap-3 text-lg px-8 py-6"
            onClick={handleWatchFull}
            disabled={archiveLoading}
          >
            {archiveLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t("searchingContent")}
              </>
            ) : (
              <>
                {isTV ? <Tv className="h-6 w-6" /> : <Film className="h-6 w-6" />}
                {isTV ? t("watchSeries") : t("watchMovie")}
              </>
            )}
          </Button>
          {!archiveLoading && !archiveUrl && !customVideoUrl && (
            <p className="text-muted-foreground text-sm mt-2">{t("fullVersionUnavailable")}</p>
          )}
          {customPlayerSource && (
            <p className="text-green-500 text-sm mt-2">{t("fullVersionAvailable")}</p>
          )}
          {!customPlayerSource && !archiveLoading && archiveUrl && (
            <p className="text-green-500 text-sm mt-2">{t("fullVersionArchive")}</p>
          )}
        </motion.div>

        {movie.similar && movie.similar.results.length > 0 && (
          <div className="mt-4"><ContentRow title={t("similar")} movies={movie.similar.results} /></div>
        )}
      </div>
      <div className="h-16" />
    </div>
  );
};

export default MoviePage;
