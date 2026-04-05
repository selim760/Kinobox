import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";

/** Small "Premium" lock overlay for movie cards */
const PremiumBadge = ({ showLock = false }: { showLock?: boolean }) => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();

  if (isPremium) return null;

  if (showLock) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); navigate("/premium"); }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-md"
      >
        <Lock className="h-8 w-8 text-cinema-gold mb-1" />
        <span className="text-cinema-gold text-xs font-semibold">Premium</span>
      </button>
    );
  }

  return (
    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-cinema-gold/90 text-black rounded px-1.5 py-0.5 text-[10px] font-bold">
      <Crown className="h-3 w-3" />
      Premium
    </div>
  );
};

export default PremiumBadge;
