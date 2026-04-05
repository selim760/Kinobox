import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminPremiumManagerProps {
  userId: string;
  userName: string;
  currentSubscription: string;
  expiresAt: string | null;
  onUpdate: (subscription: string, expiresAt: string | null) => void;
}

const GRANT_OPTIONS = [
  { label: "7 дней", days: 7 },
  { label: "30 дней", days: 30 },
  { label: "6 мес.", days: 180 },
  { label: "1 год", days: 365 },
];

const AdminPremiumManager = ({ userId, userName, currentSubscription, expiresAt, onUpdate }: AdminPremiumManagerProps) => {
  const [loading, setLoading] = useState(false);

  const grantPremium = async (days: number) => {
    setLoading(true);
    const newExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.functions.invoke("manage-codes", {
      body: { action: "grant_premium", user_id: userId, subscription: "premium", expires_at: newExpiry },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Ошибка");
    } else {
      toast.success(`Premium выдан: ${userName}`);
      onUpdate("premium", newExpiry);
    }
    setLoading(false);
  };

  const revokePremium = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-codes", {
      body: { action: "grant_premium", user_id: userId, subscription: "free", expires_at: null },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Ошибка");
    } else {
      toast.success(`Premium отозван: ${userName}`);
      onUpdate("free", null);
    }
    setLoading(false);
  };

  const isPremium = currentSubscription === "premium" && (!expiresAt || new Date(expiresAt) > new Date());

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isPremium ? (
        <Button variant="cinema-outline" size="sm" className="text-[10px] h-6 gap-1" onClick={revokePremium} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
          Отозвать
        </Button>
      ) : (
        GRANT_OPTIONS.map((opt) => (
          <Button
            key={opt.days}
            variant="cinema-ghost"
            size="sm"
            className="text-[10px] h-6 px-1.5"
            onClick={() => grantPremium(opt.days)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Crown className="h-2.5 w-2.5 text-cinema-gold" />}
            {opt.label}
          </Button>
        ))
      )}
    </div>
  );
};

export default AdminPremiumManager;
