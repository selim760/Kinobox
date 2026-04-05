import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface WatchHistoryItem {
  id: string;
  content_id: string;
  content_type: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  video_url: string | null;
  playback_position: number;
  total_duration: number;
  completed: boolean;
  last_watched_at: string;
}

export const useWatchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["watch-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_watched_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as WatchHistoryItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const continueWatching = history.filter(
    (h) => !h.completed && h.playback_position > 10 && h.total_duration > 0
  );

  const upsertProgress = useMutation({
    mutationFn: async (item: {
      content_id: string;
      content_type: string;
      title: string;
      poster_path?: string | null;
      backdrop_path?: string | null;
      video_url?: string | null;
      playback_position: number;
      total_duration: number;
    }) => {
      if (!user) return;
      const completed = item.total_duration > 0 && item.playback_position / item.total_duration > 0.9;
      const { error } = await supabase
        .from("watch_history")
        .upsert(
          {
            user_id: user.id,
            content_id: item.content_id,
            content_type: item.content_type,
            title: item.title,
            poster_path: item.poster_path || null,
            backdrop_path: item.backdrop_path || null,
            video_url: item.video_url || null,
            playback_position: item.playback_position,
            total_duration: item.total_duration,
            completed,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,content_id,content_type" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
    },
  });

  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("watch_history")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
    },
  });

  return {
    history,
    continueWatching,
    isLoading,
    upsertProgress,
    clearHistory,
  };
};
