import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/usePremium";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, LogOut, Settings, Clock, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { isPremium, subscription, expiresAt, loading } = usePremium();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {(user.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-foreground text-xl font-bold">
                {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-4 rounded-xl border border-border bg-card mb-4">
            <h3 className="text-foreground font-semibold mb-2">{t("subscription")}</h3>
            {loading ? (
              <p className="text-muted-foreground text-sm">{t("loading")}</p>
            ) : isPremium ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-cinema-gold text-black gap-1">
                    <Crown className="h-3 w-3" /> Premium
                  </Badge>
                  {expiresAt && (
                    <span className="text-muted-foreground text-xs">
                      {t("validUntil")} {new Date(expiresAt).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
                <Link to="/premium" className="text-cinema-gold text-sm hover:underline flex items-center gap-1">
                  <Settings className="h-3 w-3" /> {t("manageSubscription")}
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground text-sm mb-2">{t("subscriptionFree")}</p>
                <Link to="/premium">
                  <Button variant="cinema" size="sm" className="gap-1">
                    <Crown className="h-4 w-4" /> {t("getPremium")}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-2 mb-6">
            <Link to="/my-list" className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-foreground text-sm font-medium">{t("myList")}</span>
            </Link>
            <Link to="/history" className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground text-sm font-medium">{t("watchHistory").replace(/^[^\s]+\s/, "")}</span>
            </Link>
          </div>

          <div className="mt-6">
            <Button variant="cinema-outline" className="w-full gap-2" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" /> {t("signOut")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
