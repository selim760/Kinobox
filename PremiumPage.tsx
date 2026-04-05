import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/usePremium";
import Navbar from "@/components/Navbar";
import PromoCodeInput from "@/components/PromoCodeInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, ArrowLeft, Check, Sparkles, Download, Search,
  Shield, Film, Zap, Copy, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const FEATURES = [
  { icon: Sparkles, title: "AI Улучшение видео", desc: "Повышение качества до 4K/8K в реальном времени" },
  { icon: Film, title: "Эксклюзивный контент", desc: "Доступ к фильмам и сериалам только для Premium" },
  { icon: Download, title: "Скачивание", desc: "Скачивайте фильмы для офлайн-просмотра" },
  { icon: Search, title: "Улучшенный поиск", desc: "Расширенные фильтры и рекомендации" },
  { icon: Shield, title: "Без рекламы", desc: "Никакой рекламы и отвлекающих элементов" },
  { icon: Zap, title: "Приоритетная загрузка", desc: "Быстрая загрузка и буферизация видео" },
];

const PHONE_NUMBER = "+99362411723";

const PremiumPage = () => {
  const { user } = useAuth();
  const { isPremium, expiresAt, loading } = usePremium();
  const navigate = useNavigate();

  const copyPhone = () => {
    navigator.clipboard.writeText(PHONE_NUMBER);
    toast.success("Номер скопирован!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cinema-gold/20 to-cinema-gold/5 border border-cinema-gold/30 mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="h-8 w-8 text-cinema-gold" />
            </motion.div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
              KinoBox <span className="text-cinema-gold">Premium</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Откройте полный доступ ко всем возможностям
            </p>
          </div>

          {/* Current status */}
          {user && !loading && isPremium && (
            <div className="p-4 rounded-xl border border-cinema-gold/30 bg-cinema-gold/5 mb-8 text-center">
              <Badge className="bg-cinema-gold text-black gap-1 mb-2">
                <Crown className="h-3 w-3" /> Premium активен
              </Badge>
              {expiresAt && (
                <p className="text-muted-foreground text-sm">
                  Действует до {new Date(expiresAt).toLocaleDateString("ru-RU")}
                </p>
              )}
            </div>
          )}

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 rounded-xl border border-border bg-card hover:border-cinema-gold/30 transition-colors"
              >
                <f.icon className="h-5 w-5 text-cinema-gold mb-2" />
                <h3 className="text-foreground font-semibold text-sm">{f.title}</h3>
                <p className="text-muted-foreground text-xs mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Payment instructions */}
          {(!user || !isPremium) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl border border-cinema-gold/30 bg-gradient-to-b from-cinema-gold/5 to-transparent mb-6"
            >
              <h2 className="text-foreground font-semibold text-lg flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-cinema-gold" />
                Как получить Premium
              </h2>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cinema-gold/20 text-cinema-gold flex items-center justify-center text-xs font-bold">1</span>
                  <span>{user ? "Переведите оплату" : "Зарегистрируйтесь на сайте"}</span>
                </li>
                {!user && (
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cinema-gold/20 text-cinema-gold flex items-center justify-center text-xs font-bold">2</span>
                    <span>Переведите оплату</span>
                  </li>
                )}
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cinema-gold/20 text-cinema-gold flex items-center justify-center text-xs font-bold">{user ? "2" : "3"}</span>
                  <span>На номер:</span>
                </li>
              </ol>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 font-mono text-foreground text-lg tracking-wider text-center">
                  {PHONE_NUMBER}
                </div>
                <Button variant="cinema-outline" size="icon" onClick={copyPhone} className="flex-shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs mt-3">
                После перевода администратор подтвердит оплату и вы получите промо-код для активации Premium.
              </p>

              {!user && (
                <Button variant="cinema" className="w-full mt-4 gap-2" onClick={() => navigate("/auth")}>
                  Зарегистрироваться
                </Button>
              )}
            </motion.div>
          )}

          {/* Promo Code Input (logged in + not premium) */}
          {user && !isPremium && <PromoCodeInput />}

          {/* Features list for non-premium */}
          {(!user || !isPremium) && (
            <div className="mt-8 p-4 rounded-xl border border-border bg-card">
              <h3 className="text-foreground font-semibold mb-3">Что входит в Premium:</h3>
              <ul className="space-y-2">
                {FEATURES.map((f) => (
                  <li key={f.title} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-cinema-gold flex-shrink-0" />
                    {f.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PremiumPage;
