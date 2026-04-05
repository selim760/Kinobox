import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const AdminRegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !adminCode) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-admin", {
        body: { email, password, adminCode },
      });

      if (error) {
        toast.error("Ошибка соединения с сервером");
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || "Аккаунт создан!");
        navigate("/auth");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="font-display text-3xl text-foreground mb-2">Регистрация админа</h1>
          <p className="text-muted-foreground text-sm">
            Для создания аккаунта администратора KinoBox необходим секретный код
          </p>
        </div>

        <div className="glass-surface rounded-xl p-6 border border-border">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background border-border"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Пароль (минимум 6 символов)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-background border-border"
                required
                minLength={6}
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Секретный код администратора"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="pl-10 bg-background border-border"
                required
              />
            </div>
            <Button variant="cinema" className="w-full" type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Создание...</> : "Создать аккаунт админа"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Уже есть аккаунт?{" "}
            <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
              Войти
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminRegisterPage;
