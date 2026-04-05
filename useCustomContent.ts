import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Movie } from "@/lib/tmdb";

export const useCustomContent = () => {
  return useQuery<Movie[]>({
    queryKey: ["custom-content-list"],
    refetchInterval: 3 * 60 * 1000,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_content")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id as unknown as number, // We'll use string id for custom content
        title: item.title,
        name: item.title,
        overview: item.overview || "",
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: Number(item.vote_average) || 0,
        release_date: item.release_date || undefined,
        genre_ids: [],
        media_type: item.media_type,
        // Custom flag to identify custom content
        _custom_id: item.id,
      })) as (Movie & { _custom_id: string })[];
    },
  });
};
