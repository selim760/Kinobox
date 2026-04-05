import { useState } from "react";
import { Ticket, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const PromoCodeInput = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleActivate = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    setSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke("activate-code", {
        body: { code: code.trim() },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Ошибка активации");
      } else {
        setSuccess(data.message);
        toast.success(data.message);
        setCode("");
        queryClient.invalidateQueries({ queryKey: ["premium-status"] });
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border bg-card"
    >
      <h3 className="text-foreground font-semibold flex items-center gap-2 mb-3">
        <Ticket className="h-5 w-5 text-cinema-gold" />
        Активировать промо-код
      </h3>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Введите промо-код"
          className="bg-background border-border font-mono tracking-widest"
          maxLength={20}
          onKeyDown={(e) => e.key === "Enter" && handleActivate()}
        />
        <Button
          variant="cinema"
          onClick={handleActivate}
          disabled={loading || !code.trim()}
          className="flex-shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Активировать"}
        </Button>
      </div>
      {success && (
        <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" /> {success}
        </p>
      )}
    </motion.div>
  );
};

export default PromoCodeInput;
