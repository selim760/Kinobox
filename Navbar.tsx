import { forwardRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, LogOut, User, ShieldCheck, Crown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Navbar = forwardRef<HTMLElement>((_props, ref) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, lang, setLang, langLabels, languages } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const LanguageSwitcher = ({ mobile = false }: { mobile?: boolean }) => {
    if (mobile) {
      return (
        <div className="flex items-center gap-2 py-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          {languages.map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setMobileOpen(false); }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {langLabels[l]}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">{langLabels[lang]}</span>
        </button>
        {showLangMenu && (
          <div className="absolute top-8 right-0 bg-card border border-border rounded-lg shadow-xl py-1 z-50 min-w-[80px]">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => { setLang(l); setShowLangMenu(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  lang === l ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                }`}
              >
                {langLabels[l]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const PremiumLink = ({ mobile = false }: { mobile?: boolean }) => {
    if (mobile) {
      return (
        <Link
          to={user ? "/premium" : "/auth"}
          onClick={() => setMobileOpen(false)}
          className="text-cinema-gold py-2 flex items-center gap-2"
        >
          <Crown className="h-4 w-4" /> {t("premium")}
        </Link>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={user ? "/premium" : "/auth"}
            className="text-sm text-cinema-gold hover:text-cinema-gold/80 transition-colors flex items-center gap-1"
          >
            <Crown className="h-4 w-4" /> {t("premium")}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-card border-cinema-gold/30 max-w-[220px] p-3">
          <p className="text-cinema-gold font-semibold text-xs mb-1">{t("premiumFeatures")}</p>
          <ul className="text-[11px] text-muted-foreground space-y-0.5">
            <li>• {t("aiVideoEnhancement")}</li>
            <li>• {t("exclusiveContent")}</li>
            <li>• {t("noAds")}</li>
            <li>• {t("downloadMovies")}</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <nav
      ref={ref}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-surface shadow-lg" : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-3xl tracking-wider text-gradient-red">KinoBox</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("home")}</Link>
          <Link to="/search?type=movie" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("movies")}</Link>
          <Link to="/search?type=tv" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("series")}</Link>
          <Link to="/my-list" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("myList")}</Link>
          {user && (
            <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("watchHistory").replace(/^[^\s]+\s/, "")}
            </Link>
          )}
          <PremiumLink />
          {isAdmin && (
            <Link to="/admin" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> {t("admin")}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <AnimatePresence>
            {searchOpen && (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "min(250px, 50vw)", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                onSubmit={handleSearch}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  className="w-full bg-secondary border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </motion.form>
            )}
          </AnimatePresence>
          <Button variant="cinema-ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/profile">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {(user.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="cinema-ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="cinema" size="sm" className="hidden sm:flex gap-1">
                <User className="h-4 w-4" /> {t("signIn")}
              </Button>
            </Link>
          )}

          <Button variant="cinema-ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-surface border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-foreground py-2">{t("home")}</Link>
              <Link to="/search?type=movie" onClick={() => setMobileOpen(false)} className="text-foreground py-2">{t("movies")}</Link>
              <Link to="/search?type=tv" onClick={() => setMobileOpen(false)} className="text-foreground py-2">{t("series")}</Link>
              <Link to="/my-list" onClick={() => setMobileOpen(false)} className="text-foreground py-2">{t("myList")}</Link>
              {user && (
                <Link to="/history" onClick={() => setMobileOpen(false)} className="text-foreground py-2">{t("watchHistory").replace(/^[^\s]+\s/, "")}</Link>
              )}
              <PremiumLink mobile />
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-primary py-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> {t("admin")}
                </Link>
              )}
              <LanguageSwitcher mobile />
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="cinema-outline" className="w-full gap-2">
                      <User className="h-4 w-4" /> {t("profile")}
                    </Button>
                  </Link>
                  <Button variant="cinema-outline" className="w-full" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                    {t("signOut")}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="cinema" className="w-full">{t("signIn")}</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

Navbar.displayName = "Navbar";
export default Navbar;
