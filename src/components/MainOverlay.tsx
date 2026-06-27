import React from "react";
import {
  Shield,
  Zap,
  Flame,
  Magnet,
  Footprints,
  Heart,
  Timer,
  Swords,
  Crosshair,
  TrendingUp,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Award,
  CircleDot,
  Settings,
  ShoppingBag,
  Home,
  CheckCircle,
  HelpCircle,
  TrendingUp as LevelIcon,
  Trophy,
  Sparkles
} from "lucide-react";
import {
  WeaponType,
  PassiveType,
  UpgradeCard,
  PermanentUpgrades,
} from "../types";
import { soundEngine } from "../audio";
import { getRankByHighScore, RANKS, RankTier } from "../utils/rank";

// Helper to resolve skill icons
export const renderSkillIcon = (id: string, className = "w-6 h-6") => {
  switch (id) {
    case WeaponType.KUNAI:
      return <Crosshair className={`${className} text-sky-400`} />;
    case WeaponType.SOCCER_BALL:
      return <CircleDot className={`${className} text-orange-400`} />;
    case WeaponType.GUARDIAN:
      return <Shield className={`${className} text-emerald-400`} />;
    case WeaponType.MOLOTOV:
      return <Flame className={`${className} text-amber-500`} />;
    case WeaponType.LIGHTNING:
      return <Zap className={`${className} text-yellow-400`} />;
    case WeaponType.GATLING:
      return <Sparkles className={`${className} text-amber-400 animate-pulse`} />;
    case PassiveType.ATTACK_BOOST:
      return <Swords className={`${className} text-red-400`} />;
    case PassiveType.MAGNET:
      return <Magnet className={`${className} text-pink-400`} />;
    case PassiveType.SPEED_BOOST:
      return <Footprints className={`${className} text-teal-400`} />;
    case PassiveType.HP_BOOST:
      return <Heart className={`${className} text-rose-500`} />;
    case PassiveType.COOLDOWN_REDUCE:
      return <Timer className={`${className} text-indigo-400`} />;
    default:
      return <HelpCircle className={`${className} text-slate-400`} />;
  }
};

// Main Menu Component
interface MainMenuProps {
  gold: number;
  highScore: number;
  highestKills: number;
  onStartGame: () => void;
  onOpenShop: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  gold,
  highScore,
  highestKills,
  onStartGame,
  onOpenShop,
  soundEnabled,
  onToggleSound,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentRank = getRankByHighScore(highScore);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white select-none">
      <div className="flex flex-col items-center justify-between min-h-full w-full p-4 md:p-6 space-y-4 pb-8">
      {/* Top Bar with Profile/Stats */}
      <div className="w-full max-w-md flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-lg text-slate-950 shadow-md">
            H
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans font-medium">특공 대원</div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-semibold tracking-wide">Survivor_6274</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${currentRank.borderClass} ${currentRank.bgClass} ${currentRank.colorClass}`}>
                {currentRank.name}
              </span>
            </div>
          </div>
        </div>

        {/* Gold Counter */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-yellow-500/30">
          <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-600 to-amber-400 flex items-center justify-center font-bold text-[10px] text-yellow-950 shadow-inner">
            ₩
          </span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            {gold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col items-center my-3 text-center animate-fade-in">
        <div className="relative mb-1.5">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-30 blur-md animate-pulse" />
          <div className="relative bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-800">
            <span className="text-emerald-400 text-[10px] font-bold tracking-[0.2em] font-sans">
              MOBILIZED ACTION SURVIVOR
            </span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-lg font-sans">
          탕탕특공대
        </h1>
        <p className="text-slate-400 text-xs mt-1.5 max-w-xs md:max-w-md">
          자동 공격 무기를 선택하고, 시시각각 몰려드는 수천 마리의 몬스터로부터 5분 동안 생존하세요!
        </p>
      </div>

      {/* Statistics Box */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-900 backdrop-blur-md">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center relative group">
          <Award className="w-5 h-5 text-yellow-500 mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">최대 생존 시간</span>
          <span className="text-lg font-bold font-mono text-white mt-0.5">
            {formatTime(highScore)}
          </span>
        </div>
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center">
          <Swords className="w-5 h-5 text-red-400 mb-1" />
          <span className="text-[10px] text-slate-400 font-medium">최다 처치 수</span>
          <span className="text-lg font-bold font-mono text-white mt-0.5">
            {highestKills.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Rank Progress / Milestone Section */}
      <div className="w-full max-w-md mt-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-900 backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>대원 랭크 달성 현황</span>
          </div>
          <span className={`text-xs font-bold ${currentRank.colorClass}`}>
            현재: {currentRank.name}
          </span>
        </div>

        {/* Rank milestone list */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.values(RANKS).map((rank) => {
            const isUnlocked = highScore >= rank.requiredTime;
            const isCurrent = currentRank.tier === rank.tier;
            let displayName = rank.name;
            if (rank.tier === RankTier.CHALLENGER && isUnlocked) {
              const pts = Math.min(1000, Math.floor((highScore - 240) / 10) * 10);
              displayName = `챌린저 ${pts}점`;
            }
            return (
              <div
                key={rank.tier}
                className={`flex flex-col items-center justify-between p-1.5 rounded-lg border transition-all ${
                  isCurrent
                    ? `${rank.borderClass} ${rank.bgClass} ring-1 ring-slate-500/30 scale-105`
                    : isUnlocked
                    ? "border-slate-800 bg-slate-900/60 opacity-80"
                    : "border-slate-950 bg-slate-950/40 opacity-40"
                }`}
                title={`${rank.name}: ${rank.requiredTime}초 이상 생존`}
              >
                <span className={`text-[10px] font-black tracking-tighter ${isUnlocked ? rank.colorClass : "text-slate-600"}`}>
                  {displayName}
                </span>
                <span className="text-[8px] font-mono text-slate-500 mt-1">
                  {rank.requiredTime}초
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar to next rank */}
        {currentRank.nextRequiredTime !== null ? (
          <div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
              <span>다음 랭크까지</span>
              <span>
                {highScore}초 / {currentRank.nextRequiredTime}초
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (highScore / currentRank.nextRequiredTime) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            {currentRank.tier === RankTier.CHALLENGER ? (
              <div>
                {(() => {
                  const pts = Math.min(1000, Math.floor((highScore - 240) / 10) * 10);
                  return (
                    <>
                      <div className="flex justify-between items-center text-[10px] text-amber-400 mb-1 font-bold">
                        <span>챌린저 점수 달성도</span>
                        <span>{pts}점 / 1000점</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full transition-all duration-500 animate-pulse"
                          style={{
                            width: `${(pts / 1000) * 100}%`,
                          }}
                        />
                      </div>
                      {pts >= 1000 && (
                        <div className="text-center text-[10px] text-amber-300 font-extrabold mt-2 animate-bounce">
                          👑 전 세계 0.01% 불멸의 챌린저 1000점 정점 달성! 👑
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-[10px] text-sky-400 font-semibold py-1">
                🎉 최고 등급 [챌린저]를 달성했습니다! 당신은 최강의 특공대원입니다!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Buttons / Options */}
      <div className="w-full max-w-md flex flex-col space-y-3">
        <button
          onClick={() => {
            soundEngine.playUpgradeSelect();
            onStartGame();
          }}
          className="relative group overflow-hidden w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 py-4 px-6 rounded-2xl font-extrabold text-lg tracking-wider shadow-lg shadow-emerald-950/40 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>전투 시작 (생존 개시)</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onOpenShop();
            }}
            className="bg-slate-900 hover:bg-slate-850 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all border border-slate-800 active:scale-[0.97] flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>장비 연구소</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onToggleSound();
            }}
            className="bg-slate-900 hover:bg-slate-850 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all border border-slate-800 active:scale-[0.97] flex items-center justify-center space-x-2"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span>소리: {soundEnabled ? "켜짐" : "꺼짐"}</span>
          </button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="text-[10px] text-slate-600 text-center mt-2">
        © 2026 Survivor Studio • HTML5 Canvas Optimized
      </div>
    </div>
  </div>
  );
};

// Permanent Upgrade Shop Component
interface ShopProps {
  gold: number;
  upgrades: PermanentUpgrades;
  onUpgrade: (type: keyof PermanentUpgrades) => void;
  onReset: () => void;
  onClose: () => void;
}

export const Shop: React.FC<ShopProps> = ({
  gold,
  upgrades,
  onUpgrade,
  onReset,
  onClose,
}) => {
  const getUpgradeCost = (currentLevel: number) => {
    return (currentLevel + 1) * 300;
  };

  const getUpgradeValue = (type: keyof PermanentUpgrades, level: number) => {
    switch (type) {
      case "atkLevel":
        return `공격력 +${level * 10}%`;
      case "hpLevel":
        return `최대 체력 +${level * 10}%`;
      case "speedLevel":
        return `이동속도 +${level * 5}%`;
      case "magnetLevel":
        return `획득 범위 +${level * 20}%`;
      default:
        return "";
    }
  };

  const renderUpgradeRow = (
    label: string,
    type: keyof PermanentUpgrades,
    level: number,
    icon: React.ReactNode,
    desc: string
  ) => {
    const cost = getUpgradeCost(level);
    const isMax = level >= 5;
    const canAfford = gold >= cost;

    return (
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                현재 효과: {getUpgradeValue(type, level)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs text-slate-400">레벨</div>
            <div className="text-sm font-bold text-slate-200">
              {level}/5
            </div>
          </div>
        </div>

        {/* Level indicators */}
        <div className="flex space-x-1.5 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`flex-1 rounded-full ${
                idx <= level
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <div className="flex justify-between items-center pt-1">
          <div className="text-[11px] text-slate-400">
            {!isMax && (
              <>
                다음 효과: <span className="text-emerald-400">{getUpgradeValue(type, level + 1)}</span>
              </>
            )}
          </div>

          <button
            disabled={isMax || !canAfford}
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onUpgrade(type);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-95 ${
              isMax
                ? "bg-slate-950 text-slate-500 cursor-not-allowed border border-slate-900"
                : canAfford
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-950/20"
                : "bg-slate-850 text-slate-400 border border-slate-800 cursor-not-allowed"
            }`}
          >
            {isMax ? (
              <span>MAX</span>
            ) : (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-amber-950 flex items-center justify-center font-bold text-[8px] text-amber-400 shadow-inner">
                  ₩
                </span>
                <span>{cost.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-extrabold tracking-wide">특공 무기/장비 연구소</h2>
        </div>

        {/* Gold Counter */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1 rounded-full border border-yellow-500/30">
          <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-600 to-amber-400 flex items-center justify-center font-bold text-[9px] text-yellow-950">
            ₩
          </span>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {gold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Upgrades Grid */}
      <div className="flex-1 p-5 space-y-4 max-w-md mx-auto w-full overflow-y-auto pb-24">
        <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-900 text-xs text-slate-400 leading-relaxed">
          💡 이곳에서 특공대원의 능력치를 영구적으로 업그레이드할 수 있습니다. 획득한 골드는 연구소 가동비로 사용됩니다.
        </div>

        {renderUpgradeRow(
          "특공 강화 탄환 (공격력)",
          "atkLevel",
          upgrades.atkLevel,
          <Swords className="w-5 h-5 text-red-400" />,
          "모든 공격 무기의 대미지를 증가시킵니다."
        )}

        {renderUpgradeRow(
          "방탄 세라믹 슈트 (최대 체력)",
          "hpLevel",
          upgrades.hpLevel,
          <Heart className="w-5 h-5 text-rose-400" />,
          "최대 체력(HP)을 높여 생존율을 극대화합니다."
        )}

        {renderUpgradeRow(
          "특수 러닝 슈즈 (이동속도)",
          "speedLevel",
          upgrades.speedLevel,
          <Footprints className="w-5 h-5 text-teal-400" />,
          "대원의 이동 속도를 증가시켜 추격을 따돌립니다."
        )}

        {renderUpgradeRow(
          "강력한 전자기석 (자석 범위)",
          "magnetLevel",
          upgrades.magnetLevel,
          <Magnet className="w-5 h-5 text-pink-400" />,
          "아이템과 보석을 더 먼 거리에서 자력으로 당깁니다."
        )}

        {/* Reset button */}
        {(upgrades.atkLevel > 0 ||
          upgrades.hpLevel > 0 ||
          upgrades.speedLevel > 0 ||
          upgrades.magnetLevel > 0) && (
          <button
            onClick={() => {
              if (window.confirm("정말로 모든 업그레이드를 초기화하고 골드를 환불받으시겠습니까?")) {
                onReset();
              }
            }}
            className="w-full bg-slate-900/40 hover:bg-red-950/20 border border-slate-800 text-slate-400 hover:text-red-400 py-3 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>능력치 일괄 초기화 (100% 환불)</span>
          </button>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/90 backdrop-blur-md fixed bottom-0 left-0 right-0 z-20 flex justify-center">
        <button
          onClick={onClose}
          className="w-full max-w-md bg-slate-900 hover:bg-slate-850 text-white py-3 px-6 rounded-xl font-bold text-sm border border-slate-800 active:scale-95 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-black/40"
        >
          <Home className="w-4 h-4" />
          <span>메인 화면으로 이동</span>
        </button>
      </div>
    </div>
  );
};

// In-game Level-Up Upgrade Cards Chooser Overlay
interface LevelUpChooserProps {
  cards: UpgradeCard[];
  onSelectCard: (card: UpgradeCard) => void;
}

export const LevelUpChooser: React.FC<LevelUpChooserProps> = ({
  cards,
  onSelectCard,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center z-40 p-4 select-none animate-fade-in">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-1">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center space-x-1">
            <LevelIcon className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">
              LEVEL UP
            </span>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">지원 보급 선택</h2>
        <p className="text-slate-400 text-xs mt-1">
          전투 효율을 극대화할 보급품이나 기술을 선택하십시오.
        </p>
      </div>

      <div className="flex flex-col space-y-3 w-full max-w-xs md:max-w-md">
        {cards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onSelectCard(card);
            }}
            className={`group text-left p-4 rounded-2xl border transition-all duration-300 relative flex items-center justify-between shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 ${
              card.isLegendary
                ? "bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-slate-900 border-yellow-500 shadow-yellow-500/25 shadow-xl"
                : card.isEvo
                ? "bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border-amber-500 hover:border-amber-400 shadow-amber-950/10"
                : card.type === "weapon"
                ? "bg-slate-900 border-sky-950 hover:border-sky-500/50"
                : "bg-slate-900 border-slate-800 hover:border-emerald-500/30"
            }`}
          >
            {/* Legendary badge */}
            {card.isLegendary && (
              <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full border border-yellow-300 animate-bounce tracking-wider shadow-md shadow-yellow-950/50">
                ★ 전설 무장 (LEGENDARY) ★
              </span>
            )}

            {/* Evo particle burst on selection / look */}
            {card.isEvo && !card.isLegendary && (
              <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse tracking-wider">
                ★ 초고성능 돌파 (EVO) ★
              </span>
            )}

            <div className="flex items-center space-x-4">
              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center p-1 border ${
                  card.isLegendary
                    ? "bg-yellow-500/20 border-yellow-400 shadow-lg shadow-yellow-500/20"
                    : card.isEvo
                    ? "bg-amber-950/80 border-amber-500/50"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                {renderSkillIcon(card.skillId, "w-6 h-6")}
              </div>

              {/* Text Context */}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    {card.name}
                  </span>
                  {!card.isEvo && (
                    <span className="bg-slate-800 text-[10px] text-slate-300 font-mono font-bold px-1.5 py-0.2 rounded">
                      Lv.{card.level}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-[180px] md:max-w-[280px]">
                  {card.description}
                </p>
              </div>
            </div>

            {/* Checkbox decoration or small visual cue */}
            <div className="ml-2">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  card.isEvo
                    ? "border-amber-400/50 bg-amber-400/10 group-hover:bg-amber-400/20"
                    : "border-slate-800 bg-slate-950 group-hover:border-emerald-500/50"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all scale-0 group-hover:scale-100 ${
                    card.isEvo ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Pause Menu Overlay
interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onRestart,
  onQuit,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center z-45 p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-center space-y-6 shadow-2xl">
        <div>
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-extrabold text-white">작전 일시 정지</h2>
          <p className="text-xs text-slate-400 mt-1">상황을 정비하고 복귀하십시오.</p>
        </div>

        <div className="flex flex-col space-y-2.5">
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onResume();
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-md shadow-emerald-950/20"
          >
            전투 계속하기
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onRestart();
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 text-white py-3 rounded-xl font-bold text-sm transition-all border border-slate-700 active:scale-[0.98]"
          >
            다시 시작 (재도전)
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onQuit();
            }}
            className="w-full bg-slate-950 hover:bg-red-950/30 text-slate-400 hover:text-red-400 py-3 rounded-xl font-bold text-sm transition-all border border-slate-900 active:scale-[0.98]"
          >
            마을로 귀환 (포기)
          </button>
        </div>
      </div>
    </div>
  );
};

// Game Over Overlay
interface GameOverOverlayProps {
  victory: boolean;
  timeSurvived: number;
  kills: number;
  levelReached: number;
  goldEarned: number;
  onRetry: () => void;
  onHome: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  victory,
  timeSurvived,
  kills,
  levelReached,
  goldEarned,
  onRetry,
  onHome,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const achievedRank = getRankByHighScore(timeSurvived);

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-center items-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-scale-up">
        {/* Banner */}
        <div>
          {victory ? (
            <div className="inline-block bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-[10px] font-extrabold tracking-[0.2em] mb-2">
              VICTORY SURVIVAL
            </div>
          ) : (
            <div className="inline-block bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-400 text-[10px] font-extrabold tracking-[0.2em] mb-2">
              MISSION FAILED
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tight text-white">
            {victory ? "작전 완벽 성공!" : "작전 실패"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {victory
              ? "메카 보스를 무찌르고 인류의 터전을 사수했습니다!"
              : "몰려드는 좀비 군세를 극복하지 못했습니다."}
          </p>
        </div>

        {/* Achieved Rank Badge */}
        <div className={`p-3 rounded-2xl border ${achievedRank.bgClass} ${achievedRank.borderClass} flex flex-col items-center justify-center`}>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">달성한 생존 랭크</span>
          <div className="flex items-center space-x-2 mt-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className={`text-xl font-extrabold tracking-wide ${achievedRank.colorClass}`}>
              {achievedRank.name}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 font-sans">
            ({timeSurvived}초 생존 돌파)
          </span>
        </div>

        {/* Detailed Stats */}
        <div className="bg-slate-950 rounded-2xl border border-slate-900 p-4 divide-y divide-slate-900/60 font-sans">
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-400">생존 시간</span>
            <span className="text-sm font-bold font-mono text-white">
              {formatTime(timeSurvived)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-400">처치 수 (Kills)</span>
            <span className="text-sm font-bold font-mono text-red-400">
              {kills.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-400">최종 대원 레벨</span>
            <span className="text-sm font-bold font-mono text-sky-400">
              Lv.{levelReached}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-400">획득한 골드</span>
            <span className="text-sm font-extrabold font-mono text-yellow-400 flex items-center space-x-1">
              <span>+ {goldEarned.toLocaleString()}</span>
              <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-600 to-amber-400 flex items-center justify-center font-bold text-[8px] text-yellow-950 font-sans shadow-inner">
                ₩
              </span>
            </span>
          </div>
        </div>

        {/* Level bar or aesthetic visual */}
        <div className="flex justify-center py-0.5">
          <div className="flex space-x-1">
            <div className="w-1.5 h-6 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1.5 h-8 rounded-full bg-emerald-500/80 animate-pulse delay-75" />
            <div className="w-1.5 h-10 rounded-full bg-emerald-500/60 animate-pulse delay-150" />
            <div className="w-1.5 h-8 rounded-full bg-emerald-500/80 animate-pulse delay-75" />
            <div className="w-1.5 h-6 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2.5 pt-1">
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onRetry();
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-md shadow-emerald-950/20"
          >
            다시 도전하기
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onHome();
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 text-white py-3 rounded-xl font-bold text-sm transition-all border border-slate-700 active:scale-[0.98]"
          >
            장비 연구 및 귀환
          </button>
        </div>
      </div>
    </div>
  );
};

// In-Game Skills List HUD
interface ActiveSkillsHUDProps {
  weapons: { id: WeaponType; level: number; isEvo: boolean }[];
  passives: { id: PassiveType; level: number }[];
}

export const ActiveSkillsHUD: React.FC<ActiveSkillsHUDProps> = ({
  weapons,
  passives,
}) => {
  return (
    <div className="absolute top-16 left-4 flex flex-col space-y-1.5 z-20 pointer-events-none">
      {/* Weapons equipped row */}
      <div className="flex items-center space-x-1.5">
        <div className="text-[9px] text-slate-500 font-bold bg-slate-950/40 border border-slate-800/40 px-1 py-0.2 rounded font-sans uppercase">
          WPN
        </div>
        {weapons.map((wpn, idx) => (
          <div
            key={idx}
            className={`w-7 h-7 rounded-lg flex items-center justify-center p-0.5 border backdrop-blur-sm relative ${
              wpn.isEvo
                ? "bg-amber-950/40 border-amber-500"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            {renderSkillIcon(wpn.id, "w-4 h-4")}
            <span
              className={`absolute -bottom-1 -right-1 text-[8px] font-mono font-black px-1 rounded shadow-md ${
                wpn.isEvo
                  ? "bg-amber-500 text-amber-950"
                  : "bg-slate-950 text-sky-400 border border-slate-800"
              }`}
            >
              {wpn.isEvo ? "E" : wpn.level}
            </span>
          </div>
        ))}
        {weapons.length === 0 && (
          <span className="text-[10px] text-slate-500 italic">비어있음</span>
        )}
      </div>

      {/* Passives equipped row */}
      <div className="flex items-center space-x-1.5">
        <div className="text-[9px] text-slate-500 font-bold bg-slate-950/40 border border-slate-800/40 px-1 py-0.2 rounded font-sans uppercase">
          SPL
        </div>
        {passives.map((pas, idx) => (
          <div
            key={idx}
            className="w-7 h-7 rounded-lg flex items-center justify-center p-0.5 border border-slate-800 bg-slate-900/60 backdrop-blur-sm relative"
          >
            {renderSkillIcon(pas.id, "w-4 h-4")}
            <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-black bg-slate-950 text-emerald-400 border border-slate-800 px-1 rounded shadow-md">
              {pas.level}
            </span>
          </div>
        ))}
        {passives.length === 0 && (
          <span className="text-[10px] text-slate-500 italic">비어있음</span>
        )}
      </div>
    </div>
  );
};
