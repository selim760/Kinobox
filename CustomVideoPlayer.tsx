import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  X, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, Sparkles,
  SkipForward, SkipBack, Subtitles, Search,
  Loader2,
} from "lucide-react";
import type { VideoSourceType } from "@/lib/video";
import { usePremium } from "@/hooks/usePremium";
import AIEnhancementPanel from "./AIEnhancementPanel";
import { searchMulti, getImageUrl, type Movie } from "@/lib/tmdb";
import { useLanguage } from "@/contexts/LanguageContext";

interface Episode {
  number: number;
  title: string;
  src: string;
}

interface CustomVideoPlayerProps {
  type: VideoSourceType;
  src: string;
  onClose: () => void;
  title?: string;
  episodes?: Episode[];
  currentEpisode?: number;
  onEpisodeChange?: (ep: number) => void;
  onSaveProgress?: (position: number, duration: number) => void;
}

const QUALITY_OPTIONS = [
  { label: "360p", value: 360, premium: false },
  { label: "720p", value: 720, premium: false },
  { label: "1080p", value: 1080, premium: false },
  { label: "2K", value: 1440, premium: true },
  { label: "4K", value: 2160, premium: true },
  { label: "8K", value: 4320, premium: true },
];

const CustomVideoPlayer = ({
  type, src, onClose, title, episodes, currentEpisode, onEpisodeChange, onSaveProgress,
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const progressTimer = useRef<ReturnType<typeof setInterval>>();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(1080);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [videoLoading, setVideoLoading] = useState(true);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const seekBy = useCallback((s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  // Save progress periodically
  useEffect(() => {
    if (!onSaveProgress) return;
    progressTimer.current = setInterval(() => {
      const v = videoRef.current;
      if (v && v.currentTime > 0 && v.duration > 0) {
        onSaveProgress(v.currentTime, v.duration);
      }
    }, 15000);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [onSaveProgress]);

  // Save progress on close
  const handleClose = useCallback(() => {
    const v = videoRef.current;
    if (v && onSaveProgress && v.currentTime > 0 && v.duration > 0) {
      onSaveProgress(v.currentTime, v.duration);
    }
    onClose();
  }, [onClose, onSaveProgress]);

  // Lock body scroll + escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (showSearch && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") { if (showSearch) setShowSearch(false); else handleClose(); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowRight") seekBy(10);
      if (e.key === "ArrowLeft") seekBy(-10);
      if (e.key === "f") toggleFullscreen();
      if (e.key === "m") setMuted(p => !p);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [handleClose, togglePlay, seekBy, toggleFullscreen, showSearch]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (playing) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [playing, resetControlsTimer]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { results } = await searchMulti(searchQuery.trim()) as unknown as { results: Movie[] };
        setSearchResults(results.filter((r) => r.poster_path && (r.media_type === "movie" || r.media_type === "tv")).slice(0, 8));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const handleSearchSelect = (movie: Movie) => {
    const mediaType = movie.media_type || "movie";
    handleClose();
    navigate(`/${mediaType}/${movie.id}`);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const isNativeVideo = type === "mp4";

  // For youtube/iframe
  if (!isNativeVideo) {
    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      >
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            onClick={handleClose}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showSearch && (
          <div className="absolute top-14 right-2 sm:right-4 z-20 w-72 sm:w-80">
            <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-xl">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchMovieOrSeries")}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-2"
              />
              {searching && <p className="text-muted-foreground text-xs py-2 text-center">{t("searching")}</p>}
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {searchResults.map((m) => (
                    <button
                      key={`${m.media_type}-${m.id}`}
                      onClick={() => handleSearchSelect(m)}
                      className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-secondary transition-colors text-left"
                    >
                      <img src={getImageUrl(m.poster_path, "w92")} alt="" className="w-8 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-medium truncate">{m.title || m.name}</p>
                        <p className="text-muted-foreground text-[10px]">{m.media_type === "tv" ? t("tvShow") : t("movie")} • {(m.release_date || m.first_air_date || "").slice(0, 4)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="w-full h-full sm:h-auto sm:max-w-5xl sm:aspect-video sm:mx-4">
          {type === "youtube" ? (
            <iframe
              src={`https://www.youtube.com/embed/${src}?autoplay=1&rel=0`}
              className="w-full h-full sm:rounded-lg"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title="Video"
            />
          ) : (
            <iframe
              src={src}
              className="w-full h-full sm:rounded-lg bg-black"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              title="External video player"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onMouseMove={resetControlsTimer}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "VIDEO" || (e.target as HTMLElement).tagName === "CANVAS") {
          togglePlay();
        }
      }}
    >
      {/* Video preloader */}
      {videoLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t("loading")}</p>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-contain ${aiEnabled ? "hidden" : ""}`}
        playsInline
        autoPlay
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setVideoLoading(true)}
        onCanPlay={() => setVideoLoading(false)}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) {
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) {
              setBuffered(v.buffered.end(v.buffered.length - 1));
            }
          }
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) {
            setDuration(v.duration);
            v.volume = volume;
            setVideoLoading(false);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          if (onSaveProgress && videoRef.current) {
            onSaveProgress(videoRef.current.currentTime, videoRef.current.duration);
          }
          if (episodes && currentEpisode !== undefined && currentEpisode < episodes.length - 1) {
            onEpisodeChange?.(currentEpisode + 1);
          }
        }}
      />

      {/* AI Enhanced canvas */}
      {aiEnabled && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />
      )}

      {aiEnabled && (
        <AIEnhancementPanel
          videoRef={videoRef}
          canvasRef={canvasRef}
          enabled={aiEnabled}
          quality={selectedQuality}
        />
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="h-9 w-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary/80 transition-colors text-foreground">
              <X className="h-5 w-5" />
            </button>
            {title && <span className="text-foreground text-sm font-medium truncate max-w-[50vw]">{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSearch(!showSearch); setShowSettings(false); setShowEpisodes(false); }}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                showSearch ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary/80"
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                if (!isPremium && !aiEnabled) {
                  setShowAiPanel(true);
                  return;
                }
                setAiEnabled(!aiEnabled);
              }}
              className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium transition-colors ${
                aiEnabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-foreground hover:bg-secondary/80"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </button>

            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                showSubtitles ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary/80"
              }`}
            >
              <Subtitles className="h-4 w-4" />
            </button>

            <button
              onClick={() => { setShowSettings(!showSettings); setShowEpisodes(false); setShowSearch(false); }}
              className="h-9 w-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary/80 transition-colors text-foreground"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center play button */}
        {!playing && !videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlay}
              className="pointer-events-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors"
            >
              <Play className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground fill-current ml-1" />
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div
            className="w-full h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer mb-3 relative group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute h-full bg-white/30 rounded-full"
              style={{ width: duration ? `${(buffered / duration) * 100}%` : "0%" }}
            />
            <div
              className="absolute h-full bg-primary rounded-full transition-[width] duration-100"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%", transform: "translate(-50%, -50%)" }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => seekBy(-10)} className="h-8 w-8 flex items-center justify-center text-foreground hover:text-primary transition-colors">
                <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center text-foreground hover:text-primary transition-colors">
                {playing ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />}
              </button>
              <button onClick={() => seekBy(10)} className="h-8 w-8 flex items-center justify-center text-foreground hover:text-primary transition-colors">
                <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button
                  onClick={() => {
                    const newMuted = !muted;
                    setMuted(newMuted);
                    if (videoRef.current) videoRef.current.muted = newMuted;
                  }}
                  className="h-8 w-8 flex items-center justify-center text-foreground hover:text-primary transition-colors"
                >
                  {muted || volume === 0 ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 transition-all accent-primary h-1 cursor-pointer overflow-hidden"
                />
              </div>

              <span className="text-foreground text-xs sm:text-sm tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {episodes && episodes.length > 1 && (
                <button
                  onClick={() => { setShowEpisodes(!showEpisodes); setShowSettings(false); setShowSearch(false); }}
                  className="h-8 px-2 sm:px-3 rounded text-xs text-foreground bg-secondary/60 hover:bg-secondary/80 transition-colors"
                >
                  {t("episode")} {(currentEpisode ?? 0) + 1}
                </button>
              )}
              <button onClick={toggleFullscreen} className="h-8 w-8 flex items-center justify-center text-foreground hover:text-primary transition-colors">
                {fullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search panel */}
      {showSearch && showControls && (
        <div className="absolute left-3 sm:left-4 top-16 sm:top-20 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 w-72 sm:w-80 shadow-xl z-20" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchMovieOrSeries")}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-2"
          />
          {searching && <p className="text-muted-foreground text-xs py-2 text-center">{t("searching")}</p>}
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((m) => (
                <button
                  key={`${m.media_type}-${m.id}`}
                  onClick={() => handleSearchSelect(m)}
                  className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-secondary transition-colors text-left"
                >
                  <img src={getImageUrl(m.poster_path, "w92")} alt="" className="w-8 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-medium truncate">{m.title || m.name}</p>
                    <p className="text-muted-foreground text-[10px]">{m.media_type === "tv" ? t("tvShow") : t("movie")} • {(m.release_date || m.first_air_date || "").slice(0, 4)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <p className="text-muted-foreground text-xs py-2 text-center">{t("nothingFound")}</p>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && showControls && (
        <div className="absolute right-3 sm:right-4 bottom-20 sm:bottom-24 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 w-48 sm:w-56 shadow-xl z-20">
          <h4 className="text-foreground text-xs font-semibold mb-2">{t("quality")}</h4>
          <div className="space-y-1">
            {QUALITY_OPTIONS.map((q) => {
              const locked = q.premium && !isPremium;
              return (
                <button
                  key={q.value}
                  onClick={() => {
                    if (locked) return;
                    setSelectedQuality(q.value);
                    setShowSettings(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    selectedQuality === q.value
                      ? "bg-primary text-primary-foreground"
                      : locked
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span>{q.label}</span>
                  {locked && <span className="text-[10px] text-cinema-gold">Premium</span>}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border mt-2 pt-2">
            <h4 className="text-foreground text-xs font-semibold mb-2">{t("aiEnhancement")}</h4>
            <button
              onClick={() => {
                if (!isPremium) {
                  setShowAiPanel(true);
                  setShowSettings(false);
                  return;
                }
                setAiEnabled(!aiEnabled);
                setShowSettings(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                aiEnabled ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              {aiEnabled ? t("disable") : t("enable")}
              {!isPremium && <span className="text-[10px] text-cinema-gold ml-auto">Premium</span>}
            </button>
          </div>
        </div>
      )}

      {/* Episodes panel */}
      {showEpisodes && episodes && showControls && (
        <div className="absolute right-3 sm:right-4 bottom-20 sm:bottom-24 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 w-56 sm:w-64 shadow-xl z-20 max-h-60 overflow-y-auto">
          <h4 className="text-foreground text-xs font-semibold mb-2">{t("episodes")}</h4>
          <div className="space-y-1">
            {episodes.map((ep, i) => (
              <button
                key={ep.number}
                onClick={() => {
                  onEpisodeChange?.(i);
                  setShowEpisodes(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  currentEpisode === i
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {t("episode")} {ep.number}: {ep.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Premium gate panel */}
      {showAiPanel && !isPremium && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30" onClick={() => setShowAiPanel(false)}>
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm mx-4 text-center" onClick={(e) => e.stopPropagation()}>
            <Sparkles className="h-10 w-10 text-cinema-gold mx-auto mb-3" />
            <h3 className="text-foreground text-lg font-bold mb-2">{t("aiEnhancement")} — Premium</h3>
            <p className="text-muted-foreground text-sm mb-4">{t("premiumRequired")}</p>
            <button onClick={() => setShowAiPanel(false)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              OK
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CustomVideoPlayer;
