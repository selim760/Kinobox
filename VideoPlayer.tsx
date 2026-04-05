import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { VideoSourceType } from "@/lib/video";
import { useEffect } from "react";

interface VideoPlayerProps {
  type: VideoSourceType;
  src: string;
  onClose: () => void;
}

const VideoPlayer = ({ type, src, onClose }: VideoPlayerProps) => {
  // Lock body scroll and handle escape key
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="w-full h-full sm:h-auto sm:max-w-5xl sm:aspect-video sm:mx-4">
        {type === "youtube" ? (
          <iframe
            src={`https://www.youtube.com/embed/${src}?autoplay=1&rel=0`}
            className="w-full h-full sm:rounded-lg"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title="Video"
          />
        ) : type === "iframe" ? (
          <iframe
            src={src}
            className="w-full h-full sm:rounded-lg bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            title="External video player"
          />
        ) : (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full h-full sm:rounded-lg bg-black object-contain"
          >
            Ваш браузер не поддерживает видео.
          </video>
        )}
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
