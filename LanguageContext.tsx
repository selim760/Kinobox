import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "ru" | "tk" | "tr";

const LANG_KEY = "kb_lang";

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  ru: {
    home: "Главная",
    movies: "Фильмы",
    series: "Сериалы",
    myList: "Мой список",
    premium: "Premium",
    admin: "Админ",
    signIn: "Войти",
    signOut: "Выйти",
    profile: "Профиль",
    search: "Поиск...",
    trending: "🔥 В тренде",
    popularMovies: "🎬 Популярные фильмы",
    popularSeries: "📺 Популярные сериалы",
    newReleases: "🆕 Новинки",
    ourCatalog: "🎥 Наш каталог",
    continueWatching: "▶️ Продолжить просмотр",
    recentlyAdded: "🕐 Недавно добавленные",
    watchHistory: "📜 История просмотров",
    similar: "Похожие",
    watch: "Смотреть",
    moreInfo: "Подробнее",
    back: "Назад",
    description: "Описание",
    noDescription: "Описание недоступно.",
    watchTrailer: "Смотреть трейлер",
    trailerUnavailable: "Трейлер недоступен",
    inList: "В списке",
    addToList: "В мой список",
    watchMovie: "Смотреть фильм",
    watchSeries: "Смотреть сериал",
    searchingContent: "Поиск контента...",
    fullVersionUnavailable: "Полная версия из Internet Archive не найдена. Доступен только трейлер.",
    fullVersionAvailable: "✓ Доступна полная версия",
    fullVersionArchive: "✓ Доступна полная версия из Internet Archive (Public Domain)",
    videoUnavailable: "Видео недоступно",
    searchMovieOrSeries: "Поиск фильма или сериала...",
    searching: "Поиск...",
    nothingFound: "Ничего не найдено",
    quality: "Качество",
    aiEnhancement: "AI Улучшение",
    enable: "Включить",
    disable: "Выключить",
    episodes: "Серии",
    episode: "Серия",
    season: "Сезон",
    subscriptionFree: "Бесплатная подписка",
    subscriptionPremium: "Premium активен",
    getPremium: "Получить Premium",
    manageSubscription: "Управление подпиской",
    subscription: "Подписка",
    loading: "Загрузка...",
    validUntil: "до",
    premiumFeatures: "✨ Premium преимущества",
    aiVideoEnhancement: "AI улучшение видео до 8K",
    exclusiveContent: "Эксклюзивный контент",
    noAds: "Без рекламы",
    downloadMovies: "Скачивание фильмов",
    movie: "Фильм",
    tvShow: "Сериал",
    min: "мин",
    footer: "Легальный стриминговый сервис. Все права на контент принадлежат их правообладателям.",
    premiumRequired: "Эта функция доступна только для Premium пользователей.",
    signInToAdd: "Войдите, чтобы добавить в список",
    contentUnavailable: "Контент недоступен",
    fullVersionShowTrailer: "Полная версия недоступна, показываем трейлер",
    favorites: "❤️ Избранное",
    clearHistory: "Очистить историю",
    noWatchHistory: "История просмотров пуста",
    progress: "Прогресс",
  },
  tk: {
    home: "Baş sahypa",
    movies: "Filmler",
    series: "Seriallar",
    myList: "Meniň sanawym",
    premium: "Premium",
    admin: "Admin",
    signIn: "Girmek",
    signOut: "Çykmak",
    profile: "Profil",
    search: "Gözleg...",
    trending: "🔥 Trendde",
    popularMovies: "🎬 Meşhur filmler",
    popularSeries: "📺 Meşhur seriallar",
    newReleases: "🆕 Täzelikler",
    ourCatalog: "🎥 Biziň katalogymyz",
    continueWatching: "▶️ Dowam etmek",
    recentlyAdded: "🕐 Soňky goşulanlar",
    watchHistory: "📜 Tomaşa taryhy",
    similar: "Meňzeş",
    watch: "Tomaşa et",
    moreInfo: "Giňişleýin",
    back: "Yza",
    description: "Beýany",
    noDescription: "Beýany ýok.",
    watchTrailer: "Treýler görmek",
    trailerUnavailable: "Treýler ýok",
    inList: "Sanawda",
    addToList: "Sanawa goş",
    watchMovie: "Film görmek",
    watchSeries: "Serial görmek",
    searchingContent: "Gözlenýär...",
    fullVersionUnavailable: "Doly wersiýa tapylmady.",
    fullVersionAvailable: "✓ Doly wersiýa bar",
    fullVersionArchive: "✓ Internet Archive-den doly wersiýa bar",
    videoUnavailable: "Wideo ýok",
    searchMovieOrSeries: "Film ýa-da serial gözle...",
    searching: "Gözlenýär...",
    nothingFound: "Hiç zat tapylmady",
    quality: "Hil",
    aiEnhancement: "AI Gowulandyrma",
    enable: "Açmak",
    disable: "Ýapmak",
    episodes: "Bölümler",
    episode: "Bölüm",
    season: "Möwsüm",
    subscriptionFree: "Mugt abuna",
    subscriptionPremium: "Premium işjeň",
    getPremium: "Premium almak",
    manageSubscription: "Abuna dolandyrmak",
    subscription: "Abuna",
    loading: "Ýüklenýär...",
    validUntil: "çenli",
    premiumFeatures: "✨ Premium artykmaçlyklar",
    aiVideoEnhancement: "AI wideo gowulandyrma 8K çenli",
    exclusiveContent: "Eksklýuziw mazmun",
    noAds: "Reklamsyz",
    downloadMovies: "Filmleri ýükläp almak",
    movie: "Film",
    tvShow: "Serial",
    min: "min",
    footer: "Kanuny akym hyzmaty. Ähli hukuklar eýelerine degişlidir.",
    premiumRequired: "Bu funksiýa diňe Premium ulanyjylar üçin elýeterlidir.",
    signInToAdd: "Sanawa goşmak üçin giriň",
    contentUnavailable: "Mazmun elýeterli däl",
    fullVersionShowTrailer: "Doly wersiýa ýok, treýler görkezilýär",
    favorites: "❤️ Halanlarym",
    clearHistory: "Taryhy arassala",
    noWatchHistory: "Tomaşa taryhy boş",
    progress: "Öňegidişlik",
  },
  tr: {
    home: "Ana Sayfa",
    movies: "Filmler",
    series: "Diziler",
    myList: "Listem",
    premium: "Premium",
    admin: "Yönetici",
    signIn: "Giriş",
    signOut: "Çıkış",
    profile: "Profil",
    search: "Ara...",
    trending: "🔥 Trend",
    popularMovies: "🎬 Popüler Filmler",
    popularSeries: "📺 Popüler Diziler",
    newReleases: "🆕 Yeni Çıkanlar",
    ourCatalog: "🎥 Kataloğumuz",
    continueWatching: "▶️ İzlemeye Devam Et",
    recentlyAdded: "🕐 Son Eklenenler",
    watchHistory: "📜 İzleme Geçmişi",
    similar: "Benzer",
    watch: "İzle",
    moreInfo: "Detaylar",
    back: "Geri",
    description: "Açıklama",
    noDescription: "Açıklama mevcut değil.",
    watchTrailer: "Fragman İzle",
    trailerUnavailable: "Fragman mevcut değil",
    inList: "Listede",
    addToList: "Listeme Ekle",
    watchMovie: "Filmi İzle",
    watchSeries: "Diziyi İzle",
    searchingContent: "İçerik aranıyor...",
    fullVersionUnavailable: "Tam sürüm bulunamadı.",
    fullVersionAvailable: "✓ Tam sürüm mevcut",
    fullVersionArchive: "✓ Internet Archive'den tam sürüm mevcut",
    videoUnavailable: "Video mevcut değil",
    searchMovieOrSeries: "Film veya dizi ara...",
    searching: "Aranıyor...",
    nothingFound: "Hiçbir şey bulunamadı",
    quality: "Kalite",
    aiEnhancement: "AI İyileştirme",
    enable: "Aç",
    disable: "Kapat",
    episodes: "Bölümler",
    episode: "Bölüm",
    season: "Sezon",
    subscriptionFree: "Ücretsiz abonelik",
    subscriptionPremium: "Premium aktif",
    getPremium: "Premium Al",
    manageSubscription: "Abonelik yönetimi",
    subscription: "Abonelik",
    loading: "Yükleniyor...",
    validUntil: "kadar",
    premiumFeatures: "✨ Premium avantajları",
    aiVideoEnhancement: "8K'ya kadar AI video iyileştirme",
    exclusiveContent: "Özel içerik",
    noAds: "Reklamsız",
    downloadMovies: "Film indirme",
    movie: "Film",
    tvShow: "Dizi",
    min: "dk",
    footer: "Yasal yayın hizmeti. Tüm haklar sahiplerine aittir.",
    premiumRequired: "Bu özellik yalnızca Premium kullanıcılar için geçerlidir.",
    signInToAdd: "Listeye eklemek için giriş yapın",
    contentUnavailable: "İçerik mevcut değil",
    fullVersionShowTrailer: "Tam sürüm mevcut değil, fragman gösteriliyor",
    favorites: "❤️ Favoriler",
    clearHistory: "Geçmişi temizle",
    noWatchHistory: "İzleme geçmişi boş",
    progress: "İlerleme",
  },
};

const LANG_LABELS: Record<Language, string> = {
  ru: "RU",
  tk: "TK",
  tr: "TR",
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  langLabels: typeof LANG_LABELS;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
  t: (k) => k,
  langLabels: LANG_LABELS,
  languages: ["ru", "tk", "tr"],
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (saved === "ru" || saved === "tk" || saved === "tr")) return saved;
    return "ru";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] || translations.ru[key] || key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langLabels: LANG_LABELS, languages: ["ru", "tk", "tr"] }}>
      {children}
    </LanguageContext.Provider>
  );
};
