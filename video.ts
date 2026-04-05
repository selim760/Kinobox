export type VideoSourceType = "youtube" | "mp4" | "iframe";

export interface VideoSource {
  type: VideoSourceType;
  src: string;
}

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"];

const isDirectVideoUrl = (pathname: string) =>
  DIRECT_VIDEO_EXTENSIONS.some((extension) => pathname.toLowerCase().endsWith(extension));

const extractYouTubeId = (value: string) => {
  const trimmed = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      if (videoId) return videoId;

      const [, section, id] = url.pathname.split("/");
      if ((section === "embed" || section === "shorts" || section === "live") && id) {
        return id;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const resolveVideoSource = (value?: string | null): VideoSource | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    return { type: "youtube", src: youtubeId };
  }

  try {
    const url = new URL(trimmed);

    if (!/^https?:$/.test(url.protocol)) {
      return null;
    }

    if (isDirectVideoUrl(url.pathname)) {
      return { type: "mp4", src: url.toString() };
    }

    return { type: "iframe", src: url.toString() };
  } catch {
    return null;
  }
};