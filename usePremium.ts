import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface PremiumStatus {
  isPremium: boolean;
  isAdmin: boolean;
  subscription: string;
  expiresAt: string | null;
}

export const usePremium = (): PremiumStatus & { loading: boolean } => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["premium-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription, subscription_expires_at")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["user-is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      return !!(data && data.length > 0);
    },
    enabled: !!user,
    staleTime: 300_000,
  });

  const now = new Date();
  const expiresAt = profile?.subscription_expires_at ?? null;
  const isExpired = expiresAt ? new Date(expiresAt) < now : false;
  const isPremium =
    (isAdmin ?? false) ||
    (profile?.subscription === "premium" && !isExpired);

  return {
    isPremium,
    isAdmin: isAdmin ?? false,
    subscription: profile?.subscription ?? "free",
    expiresAt,
    loading: profileLoading || roleLoading,
  };
};
