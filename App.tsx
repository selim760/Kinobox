import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import MoviePage from "./pages/MoviePage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import MyListPage from "./pages/MyListPage";
import AuthPage from "./pages/AuthPage";
import CustomContentPage from "./pages/CustomContentPage";
import ProfilePage from "./pages/ProfilePage";
import PremiumPage from "./pages/PremiumPage";
import WatchHistoryPage from "./pages/WatchHistoryPage";
import { InstallPrompt } from "./components/InstallPrompt";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem("kb_splash_seen");
    return !seen;
  });

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem("kb_splash_seen", "1");
    setShowSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/movie/:id" element={<MoviePage />} />
                <Route path="/tv/:id" element={<MoviePage />} />
                <Route path="/custom/:id" element={<CustomContentPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin-register" element={<AdminRegisterPage />} />
                <Route path="/my-list" element={<MyListPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/history" element={<WatchHistoryPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
