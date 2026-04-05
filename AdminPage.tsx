import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, Film, Tv, Loader2, ShieldAlert, Upload, Link as LinkIcon, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { searchMulti, getImageUrl, type Movie } from "@/lib/tmdb";
import { toast } from "sonner";
import AdminUsers from "@/components/AdminUsers";
import AdminPromoCodes from "@/components/AdminPromoCodes";

interface ContentItem {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  video_url: string | null;
}

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedContent, setAddedContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // Video input state
  const [videoInputs, setVideoInputs] = useState<Record<string, { url: string; uploading: boolean }>>({});

  // Manual add state
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualType, setManualType] = useState<"movie" | "tv">("movie");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualPosterFile, setManualPosterFile] = useState<File | null>(null);
  const [manualVideoFile, setManualVideoFile] = useState<File | null>(null);
  const [manualAdding, setManualAdding] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .then(({ data }) => {
        const admin = !!(data && data.length > 0);
        setIsAdmin(admin);
        setCheckingRole(false);
        if (!admin) toast.error("У вас нет прав администратора");
      });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("custom_content")
      .select("id, tmdb_id, media_type, title, poster_path, video_url")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAddedContent(data as ContentItem[]);
        setLoadingContent(false);
      });
  }, [isAdmin]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { results } = await searchMulti(query.trim()) as unknown as { results: Movie[] };
      setSearchResults(results.filter((r) => r.media_type === "movie" || r.media_type === "tv"));
    } catch {
      toast.error("Ошибка поиска");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (movie: Movie) => {
    const mediaType = movie.media_type || "movie";
    const title = movie.title || movie.name || "Без названия";
    const { data: inserted, error } = await supabase.from("custom_content").insert({
      tmdb_id: movie.id,
      media_type: mediaType,
      title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      overview: movie.overview,
      vote_average: movie.vote_average,
      release_date: movie.release_date || movie.first_air_date || null,
      added_by: user!.id,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") toast.info("Уже добавлено");
      else toast.error("Ошибка добавления");
      return;
    }
    toast.success(`${title} добавлен`);
    setAddedContent((prev) => [{ id: inserted.id, tmdb_id: movie.id, media_type: mediaType, title, poster_path: movie.poster_path, video_url: null }, ...prev]);
  };

  const handleRemove = async (id: string, title: string) => {
    const { error } = await supabase.from("custom_content").delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    toast.success(`${title} удалён`);
    setAddedContent((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSetVideoUrl = async (id: string, url: string) => {
    const { error } = await supabase.from("custom_content").update({ video_url: url }).eq("id", id);
    if (error) { toast.error("Ошибка сохранения"); return; }
    toast.success("Ссылка сохранена");
    setAddedContent((prev) => prev.map((c) => c.id === id ? { ...c, video_url: url } : c));
    setVideoInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleUploadVideo = async (id: string, file: File) => {
    setVideoInputs((prev) => ({ ...prev, [id]: { url: "", uploading: true } }));
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${id}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("videos").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast.error("Ошибка загрузки файла");
      setVideoInputs((prev) => ({ ...prev, [id]: { url: "", uploading: false } }));
      return;
    }
    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
    await handleSetVideoUrl(id, urlData.publicUrl);
    setVideoInputs((prev) => ({ ...prev, [id]: { url: "", uploading: false } }));
  };

  const handleManualAdd = async () => {
    if (!manualTitle.trim()) return;
    setManualAdding(true);

    let posterPath: string | null = null;
    let videoUrl = manualVideoUrl || null;

    try {
      // Upload poster if provided
      if (manualPosterFile) {
        const ext = manualPosterFile.name.split(".").pop() || "jpg";
        const posterStoragePath = `posters/${Date.now()}.${ext}`;
        const { error: pErr } = await supabase.storage.from("videos").upload(posterStoragePath, manualPosterFile);
        if (!pErr) {
          const { data: pUrl } = supabase.storage.from("videos").getPublicUrl(posterStoragePath);
          posterPath = pUrl.publicUrl;
        }
      }

      // Upload video file if provided
      if (manualVideoFile) {
        const ext = manualVideoFile.name.split(".").pop() || "mp4";
        const videoStoragePath = `manual/${Date.now()}.${ext}`;
        const { error: vErr } = await supabase.storage.from("videos").upload(videoStoragePath, manualVideoFile);
        if (!vErr) {
          const { data: vUrl } = supabase.storage.from("videos").getPublicUrl(videoStoragePath);
          videoUrl = vUrl.publicUrl;
        }
      }

      const { data: inserted, error } = await supabase.from("custom_content").insert({
        tmdb_id: 0,
        media_type: manualType,
        title: manualTitle.trim(),
        poster_path: posterPath,
        video_url: videoUrl,
        added_by: user!.id,
      }).select("id").single();

      if (error) { toast.error("Ошибка добавления"); return; }

      toast.success(`${manualTitle} добавлен`);
      setAddedContent((prev) => [{
        id: inserted.id, tmdb_id: 0, media_type: manualType,
        title: manualTitle.trim(), poster_path: posterPath, video_url: videoUrl,
      }, ...prev]);
      setManualTitle(""); setManualVideoUrl(""); setManualPosterFile(null); setManualVideoFile(null); setShowManualAdd(false);
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setManualAdding(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex flex-col items-center justify-center gap-4 px-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Доступ запрещён</h1>
          <p className="text-muted-foreground text-center">Только администраторы могут управлять контентом.</p>
          <Button variant="cinema" onClick={() => navigate("/")}>На главную</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-[1000px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">Админ-панель</h1>
          <p className="text-muted-foreground mb-8">Управление контентом KinoBox</p>

          {/* Manual Add Toggle */}
          <div className="flex gap-2 mb-6">
            <Button variant={showManualAdd ? "cinema" : "cinema-outline"} onClick={() => setShowManualAdd(!showManualAdd)} className="gap-2">
              <Upload className="h-4 w-4" />
              Добавить вручную
            </Button>
          </div>

          {/* Manual Add Form */}
          {showManualAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8 p-4 rounded-xl border border-border bg-card space-y-4">
              <h3 className="text-foreground font-semibold">Добавить контент вручную</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Название</Label>
                  <Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Название фильма/сериала" className="bg-background border-border mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Тип</Label>
                  <div className="flex gap-2 mt-1">
                    <Button variant={manualType === "movie" ? "cinema" : "cinema-outline"} size="sm" onClick={() => setManualType("movie")} className="gap-1"><Film className="h-3 w-3" />Фильм</Button>
                    <Button variant={manualType === "tv" ? "cinema" : "cinema-outline"} size="sm" onClick={() => setManualType("tv")} className="gap-1"><Tv className="h-3 w-3" />Сериал</Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Ссылка на видео (MP4 URL)</Label>
                <Input value={manualVideoUrl} onChange={(e) => setManualVideoUrl(e.target.value)} placeholder="https://example.com/movie.mp4" className="bg-background border-border mt-1" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Или загрузить MP4 файл</Label>
                  <Input type="file" accept="video/mp4,video/*" onChange={(e) => setManualVideoFile(e.target.files?.[0] || null)} className="bg-background border-border mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Постер (изображение)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setManualPosterFile(e.target.files?.[0] || null)} className="bg-background border-border mt-1" />
                </div>
              </div>
              <Button variant="cinema" onClick={handleManualAdd} disabled={manualAdding || !manualTitle.trim()} className="gap-2">
                {manualAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Добавить
              </Button>
            </motion.div>
          )}

          {/* TMDb Search */}
          <h3 className="text-foreground font-semibold mb-3">Поиск в TMDb</h3>
          <div className="flex gap-2 mb-8">
            <Input
              placeholder="Поиск фильма или сериала..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-background border-border"
            />
            <Button variant="cinema" onClick={handleSearch} disabled={searching} className="flex-shrink-0">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-10">
              <h2 className="text-foreground font-semibold mb-4">Результаты поиска</h2>
              <div className="space-y-3">
                {searchResults.map((movie) => {
                  const title = movie.title || movie.name || "";
                  const alreadyAdded = addedContent.some((c) => c.tmdb_id === movie.id && c.media_type === (movie.media_type || "movie"));
                  return (
                    <div key={`${movie.media_type}-${movie.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                      <img src={getImageUrl(movie.poster_path, "w92")} alt={title} className="w-12 h-16 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium truncate">{title}</p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          {movie.media_type === "tv" ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                          {movie.media_type === "tv" ? "Сериал" : "Фильм"}
                          {(movie.release_date || movie.first_air_date) && ` • ${(movie.release_date || movie.first_air_date || "").slice(0, 4)}`}
                        </p>
                      </div>
                      <Button variant={alreadyAdded ? "cinema-outline" : "cinema"} size="sm" disabled={alreadyAdded} onClick={() => handleAdd(movie)}>
                        {alreadyAdded ? "Добавлено" : <><Plus className="h-4 w-4 mr-1" />Добавить</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Added Content */}
          <h2 className="text-foreground font-semibold mb-4">Добавленный контент ({addedContent.length})</h2>
          {loadingContent ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : addedContent.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Контент ещё не добавлен.</p>
          ) : (
            <div className="space-y-3">
              {addedContent.map((item) => {
                const vi = videoInputs[item.id];
                return (
                  <div key={item.id} className="p-3 rounded-lg border border-border bg-card space-y-2">
                    <div className="flex items-center gap-3">
                      {item.poster_path ? (
                        <img
                          src={item.tmdb_id > 0 ? getImageUrl(item.poster_path, "w92") : item.poster_path}
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded bg-muted flex items-center justify-center">
                          {item.media_type === "tv" ? <Tv className="h-4 w-4 text-muted-foreground" /> : <Film className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{item.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.media_type === "tv" ? "Сериал" : "Фильм"}
                          {item.video_url && <span className="text-green-500 ml-2">✓ Видео</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="cinema-ghost" size="icon" onClick={() => setVideoInputs((p) => ({ ...p, [item.id]: { url: item.video_url || "", uploading: false } }))}>
                          <LinkIcon className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="cinema-ghost" size="icon" onClick={() => handleRemove(item.id, item.title)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Video URL / Upload panel */}
                    {vi && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-13 space-y-2 pt-2 border-t border-border">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ссылка на MP4 видео"
                            value={vi.url}
                            onChange={(e) => setVideoInputs((p) => ({ ...p, [item.id]: { ...p[item.id], url: e.target.value } }))}
                            className="bg-background border-border text-xs"
                            disabled={vi.uploading}
                          />
                          <Button variant="cinema" size="sm" disabled={vi.uploading || !vi.url.trim()} onClick={() => handleSetVideoUrl(item.id, vi.url.trim())}>
                            Сохранить
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">или</span>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="video/mp4,video/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadVideo(item.id, f);
                              }}
                              disabled={vi.uploading}
                            />
                            <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              {vi.uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                              {vi.uploading ? "Загрузка..." : "Загрузить MP4"}
                            </span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment Confirmation Notice */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="p-4 rounded-xl border border-cinema-gold/30 bg-cinema-gold/5 mb-6">
              <h3 className="text-foreground font-semibold flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-cinema-gold" />
                Подтверждение оплаты Premium
              </h3>
              <p className="text-muted-foreground text-sm">
                Для подтверждения оплаты найдите пользователя ниже и нажмите кнопку выдачи Premium на нужный срок. 
                Или создайте промо-код и передайте его пользователю.
              </p>
            </div>
          </div>

          {/* Promo Codes Management */}
          <div className="mt-6 pt-6 border-t border-border">
            <AdminPromoCodes />
          </div>

          {/* User Management */}
          <div className="mt-12 pt-8 border-t border-border">
            <AdminUsers />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
