import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Loader2, Copy, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CodeItem {
  id: string;
  code: string;
  duration: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

const DURATION_OPTIONS = [
  { value: "7_days", label: "7 дней" },
  { value: "1_month", label: "1 месяц" },
  { value: "6_months", label: "6 месяцев" },
  { value: "12_months", label: "12 месяцев" },
];

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) result += "-";
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const AdminPromoCodes = () => {
  const [codes, setCodes] = useState<CodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newDuration, setNewDuration] = useState("1_month");
  const [batchCount, setBatchCount] = useState(1);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-codes", {
      body: { action: "list" },
    });
    if (!error && data?.codes) {
      setCodes(data.codes);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    const newCodes = Array.from({ length: batchCount }, () => generateCode());
    
    const { data, error } = await supabase.functions.invoke("manage-codes", {
      body: {
        action: "create",
        codes: newCodes,
        duration: newDuration,
      },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Ошибка создания");
    } else {
      toast.success(`Создано ${newCodes.length} код(ов)`);
      fetchCodes();
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error, data } = await supabase.functions.invoke("manage-codes", {
      body: { action: "delete", code_id: id },
    });
    if (error || data?.error) {
      toast.error("Ошибка удаления");
    } else {
      toast.success("Код удалён");
      setCodes((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Код скопирован");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
        <Ticket className="h-5 w-5" />
        Промо-коды
      </h2>

      <Button
        variant={showCreate ? "cinema" : "cinema-outline"}
        size="sm"
        className="gap-2 mb-4"
        onClick={() => setShowCreate(!showCreate)}
      >
        <Plus className="h-4 w-4" /> Создать код
      </Button>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-4 rounded-xl border border-border bg-card space-y-3"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-sm">Длительность</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DURATION_OPTIONS.map((d) => (
                  <Button
                    key={d.value}
                    variant={newDuration === d.value ? "cinema" : "cinema-outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setNewDuration(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Количество</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={batchCount}
                onChange={(e) => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="bg-background border-border mt-1 w-24"
              />
            </div>
          </div>
          <Button variant="cinema" onClick={handleCreate} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Создать {batchCount > 1 ? `${batchCount} кодов` : "код"}
          </Button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : codes.length === 0 ? (
        <p className="text-muted-foreground text-center py-6 text-sm">Промо-коды не созданы.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border bg-card text-sm ${
                c.is_used ? "border-muted opacity-60" : "border-border"
              }`}
            >
              <code className="font-mono text-foreground text-xs tracking-wider flex-1 truncate">{c.code}</code>
              <Badge variant={c.is_used ? "secondary" : "outline"} className="text-[10px] flex-shrink-0">
                {DURATION_OPTIONS.find((d) => d.value === c.duration)?.label || c.duration}
              </Badge>
              {c.is_used ? (
                <Badge variant="secondary" className="text-[10px] flex-shrink-0">Использован</Badge>
              ) : (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="cinema-ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(c.code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="cinema-ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminPromoCodes;
