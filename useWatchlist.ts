import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WatchlistItem {
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
}

export const useWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addToWatchlist = useMutation({
    mutationFn: async (item: WatchlistItem) => {
      const { error } = await supabase.from("watchlist").insert({
        user_id: user!.id,
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Добавлено в список");
    },
    onError: (err: any) => {
      if (err.code === "23505") {
        toast.info("Уже в вашем списке");
      } else {
        toast.error("Ошибка добавления");
      }
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async ({ tmdb_id, media_type }: { tmdb_id: number; media_type: string }) => {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user!.id)
        .eq("tmdb_id", tmdb_id)
        .eq("media_type", media_type);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success("Удалено из списка");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const isInWatchlist = (tmdb_id: number, media_type: string) =>
    watchlist.some((item) => item.tmdb_id === tmdb_id && item.media_type === media_type);

  return { watchlist, isLoading, addToWatchlist, removeFromWatchlist, isInWatchlist };
};
