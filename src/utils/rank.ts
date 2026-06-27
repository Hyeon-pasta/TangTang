export enum RankTier {
  IRON = "IRON",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  DIAMOND = "DIAMOND",
  CHALLENGER = "CHALLENGER",
}

export interface RankInfo {
  tier: RankTier;
  name: string;
  colorClass: string; // Tailwind class for text / badges
  bgClass: string; // Tailwind class for backgrounds
  borderClass: string; // Tailwind class for borders
  requiredTime: number; // in seconds
  nextRequiredTime: number | null; // in seconds to reach next tier
  iconColor: string; // hex or specialized color
}

export const RANKS: Record<RankTier, RankInfo> = {
  [RankTier.IRON]: {
    tier: RankTier.IRON,
    name: "아이언",
    colorClass: "text-slate-400",
    bgClass: "bg-slate-900/80",
    borderClass: "border-slate-700",
    requiredTime: 0,
    nextRequiredTime: 30,
    iconColor: "#94a3b8",
  },
  [RankTier.BRONZE]: {
    tier: RankTier.BRONZE,
    name: "브론즈",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-950/20",
    borderClass: "border-amber-800/40",
    requiredTime: 30,
    nextRequiredTime: 60,
    iconColor: "#b45309",
  },
  [RankTier.SILVER]: {
    tier: RankTier.SILVER,
    name: "실버",
    colorClass: "text-slate-300",
    bgClass: "bg-slate-200/5",
    borderClass: "border-slate-400/30",
    requiredTime: 60,
    nextRequiredTime: 120,
    iconColor: "#cbd5e1",
  },
  [RankTier.GOLD]: {
    tier: RankTier.GOLD,
    name: "골드",
    colorClass: "text-yellow-400",
    bgClass: "bg-yellow-950/20",
    borderClass: "border-yellow-600/30",
    requiredTime: 120,
    nextRequiredTime: 180,
    iconColor: "#facc15",
  },
  [RankTier.DIAMOND]: {
    tier: RankTier.DIAMOND,
    name: "다이아몬드",
    colorClass: "text-sky-400",
    bgClass: "bg-sky-950/30",
    borderClass: "border-sky-400/40",
    requiredTime: 180,
    nextRequiredTime: 240,
    iconColor: "#38bdf8",
  },
  [RankTier.CHALLENGER]: {
    tier: RankTier.CHALLENGER,
    name: "챌린저 0점",
    colorClass: "text-amber-300",
    bgClass: "bg-slate-900/90",
    borderClass: "border-amber-400/50",
    requiredTime: 240,
    nextRequiredTime: null,
    iconColor: "#fbbf24",
  },
};

export function getRankByHighScore(seconds: number): RankInfo {
  if (seconds >= 240) {
    // Challenger points start at 240s and increase by 10 points every 10 seconds up to 1000 points.
    const points = Math.min(1000, Math.floor((seconds - 240) / 10) * 10);
    return {
      ...RANKS[RankTier.CHALLENGER],
      name: `챌린저 ${points}점`,
    };
  }
  if (seconds >= 180) return RANKS[RankTier.DIAMOND];
  if (seconds >= 120) return RANKS[RankTier.GOLD];
  if (seconds >= 60) return RANKS[RankTier.SILVER];
  if (seconds >= 30) return RANKS[RankTier.BRONZE];
  return RANKS[RankTier.IRON];
}
