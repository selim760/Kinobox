import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import SkeletonRow from "@/components/SkeletonRow";
import { getTrending, getPopularMovies, getPopularSeries, getUpcoming } from "@/lib/tmdb";
import { useCustomContent } from "@/hooks/useCustomContent";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Movie } from "@/lib/tmdb";

const Index = () => {
  const refetchConfig = { refetchInterval: 5 * 60 * 1000, staleTime: 2 * 60 * 1000 };
  const { data: trending, isLoading: l1 } = useQuery({ queryKey: ["trending"], queryFn: getTrending, ...refetchConfig });
  const { data: popular, isLoading: l2 } = useQuery({ queryKey: ["popular-movies"], queryFn: getPopularMovies, ...refetchConfig });
  const { data: series, isLoading: l3 } = useQuery({ queryKey: ["popular-series"], queryFn: getPopularSeries, ...refetchConfig });
  const { data: upcoming, isLoading: l4 } = useQuery({ queryKey: ["upcoming"], queryFn: getUpcoming, ...refetchConfig });
  const { data: customContent, isLoading: l5 } = useCustomContent();
  const { user } = useAuth();
  const { continueWatching } = useWatchHistory();
  const { t } = useLanguage();

  // Convert continue watching items to Movie-like objects for ContentRow
  const continueWatchingMovies: (Movie & { _custom_id?: string })[] = continueWatching.map((h) => ({
    id: parseInt(h.content_id) || 0,
    title: h.title,
    name: h.title,
    overview: "",
    poster_path: h.poster_path,
    backdrop_path: h.backdrop_path,
    vote_average: 0,
    genre_ids: [],
    media_type: h.content_type === "custom" ? undefined : h.content_type,
    _custom_id: h.content_type === "custom" ? h.content_id : undefined,
  }));

  // Recently added = custom content sorted by date (already sorted)
  const recentlyAdded = customContent?.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {trending && trending.length > 0 ? (
        <HeroBanner movies={trending} />
      ) : (
        <div className="h-[85vh] bg-muted animate-pulse" />
      )}

      <div className="-mt-20 relative z-10 pb-16">
        {/* Continue Watching - only for logged-in users with history */}
        {user && continueWatchingMovies.length > 0 && (
          <ContentRow title={t("continueWatching")} movies={continueWatchingMovies} />
        )}

        {l5 ? <SkeletonRow /> : customContent && customContent.length > 0 && <ContentRow title={t("ourCatalog")} movies={customContent} />}
        
        {/* Recently Added */}
        {recentlyAdded && recentlyAdded.length > 0 && (
          <ContentRow title={t("recentlyAdded")} movies={recentlyAdded} />
        )}

        {l1 ? <SkeletonRow /> : trending && <ContentRow title={t("trending")} movies={trending} />}
        {l2 ? <SkeletonRow /> : popular && <ContentRow title={t("popularMovies")} movies={popular} />}
        {l3 ? <SkeletonRow /> : series && <ContentRow title={t("popularSeries")} movies={series} />}
        {l4 ? <SkeletonRow /> : upcoming && <ContentRow title={t("newReleases")} movies={upcoming} />}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto text-center">
          <span className="font-display text-2xl text-gradient-red">KinoBox</span>
          <p className="text-sm text-muted-foreground mt-2">{t("footer")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
