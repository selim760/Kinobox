import { useState, useEffect } from "react";
import { Users, Shield, Ban, Loader2, CheckCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AdminPremiumManager from "./AdminPremiumManager";

interface UserItem {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription: string;
  subscription_expires_at: string | null;
  is_blocked: boolean;
  created_at: string;
  roles: string[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast.error("Ошибка загрузки пользователей");
    } else {
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    setTogglingId(userId);
    const { data, error } = await supabase.functions.invoke("manage-user", {
      body: { action: "block", user_id: userId, is_blocked: !currentlyBlocked },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Ошибка");
    } else {
      toast.success(currentlyBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u))
      );
    }
    setTogglingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Пользователи ({users.length})
      </h2>

      {users.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Пользователей нет.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
                u.is_blocked ? "border-destructive/40 opacity-70" : "border-border"
              }`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground font-bold">
                    {(u.display_name || u.email || "?")[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">
                  {u.display_name || "Без имени"}
                </p>
                <p className="text-muted-foreground text-xs truncate">{u.email}</p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {u.roles.includes("admin") && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary gap-0.5">
                    <Shield className="h-2.5 w-2.5" />
                    Админ
                  </Badge>
                )}
                {u.is_blocked && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                    <Ban className="h-2.5 w-2.5" />
                    Заблок.
                  </Badge>
                )}
                {u.subscription !== "free" && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-cinema-gold text-black gap-0.5">
                    <Crown className="h-2.5 w-2.5" />
                    Premium
                  </Badge>
                )}
              </div>

              {/* Actions */}
              {!u.roles.includes("admin") && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button
                    variant={u.is_blocked ? "cinema" : "cinema-outline"}
                    size="sm"
                    className="text-xs"
                    disabled={togglingId === u.id}
                    onClick={() => toggleBlock(u.id, u.is_blocked)}
                  >
                    {togglingId === u.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : u.is_blocked ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Разблок.</>
                    ) : (
                      <><Ban className="h-3 w-3 mr-1" />Блок.</>
                    )}
                  </Button>
                  <AdminPremiumManager
                    userId={u.id}
                    userName={u.display_name || u.email || ""}
                    currentSubscription={u.subscription}
                    expiresAt={u.subscription_expires_at}
                    onUpdate={(sub, exp) => {
                      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscription: sub, subscription_expires_at: exp } : x));
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminUsers;
