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
  Sparkles,
  BookOpen,
  X,
  ArrowRight
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
    case WeaponType.POOP_SPRAY:
      return <Sparkles className={`${className} text-amber-700`} />;
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

// Shared Codex Data
export const weaponsCodex = [
  {
    id: WeaponType.KUNAI,
    name: "쿠나이",
    desc: "가장 가까운 적을 조준해 수리검을 연속으로 발사하는 추적형 무기입니다. 조작 피로도가 매우 낮아 대중적입니다.",
    levels: [
      "1성: 지정 대상을 향해 수리검 1개 발사",
      "2성: 공격 주기 15% 단축 및 연사 편의 제공",
      "3성: 수리검 발사 수 2개로 증가 (순차 사격)",
      "4성: 수리검 크기 15% 증가 및 대미지 20% 상승",
      "5성: 수리검 발사 수 3개로 최종 확대"
    ],
    evoWith: "특공 강화 탄환",
    evoResult: "영혼 수리검"
  },
  {
    id: WeaponType.SOCCER_BALL,
    name: "축구공",
    desc: "적과 지형지물에 충돌하며 튕기는 탄성제어 공을 투척합니다. 좁은 구역에서 대량의 적에게 파괴적입니다.",
    levels: [
      "1성: 물리 튕김 효과를 지닌 축구공 1개 투사",
      "2성: 축구공 투사 수 2개로 증가 및 대미지 10% 증가",
      "3성: 축구공 탄성 및 크기 20% 증가",
      "4성: 필드 잔존 지속 시간 1.5초 증가",
      "5성: 축구공 투사 수 3개로 최종 증가 및 타격 진동 발생"
    ],
    evoWith: "특수 러닝 슈즈",
    evoResult: "양자 공"
  },
  {
    id: WeaponType.GUARDIAN,
    name: "수호자",
    desc: "자신을 중심으로 공전하는 대형 넉백 원반을 소환합니다. 적들의 접근과 날아오는 탄막을 완벽하게 차단합니다.",
    levels: [
      "1성: 플레이어 주변을 일정 시간 도는 보호막 원반 2개 전개",
      "2성: 수리검 원반 수가 3개로 증가",
      "3성: 회전 범위 및 적 밀쳐내기(넉백) 강도 25% 업그레이드",
      "4성: 회전 유지 시간 2초 연장 및 가해지는 대미지 20% 상승",
      "5성: 수리검 원반 수가 4개로 최종 확장"
    ],
    evoWith: "에너지 드링크",
    evoResult: "디펜더 보호구"
  },
  {
    id: WeaponType.MOLOTOV,
    name: "화염병",
    desc: "무작위 주변 방향으로 고열 휘발유통을 던집니다. 바닥에 거대한 지속형 장판 화염을 형성합니다.",
    levels: [
      "1성: 지면에 닿으면 화염 바닥을 형성하는 화염병 1개 소환",
      "2성: 소환 개수 2개로 증가 및 장판 대미지 주기 10% 단축",
      "3성: 화염 방사 범위 30% 증가 및 고열 대미지 상승",
      "4성: 화염 바닥 유지 시간 1.5초 연장",
      "5성: 소환 개수 3개로 증가하여 광범위 지옥불 바다 완성"
    ],
    evoWith: "방탄 세라믹 슈트",
    evoResult: "정화의 가스통"
  },
  {
    id: WeaponType.LIGHTNING,
    name: "번개 발사기",
    desc: "하늘에서 무작위 대상을 향해 치명적인 고압 낙뢰를 떨어뜨립니다. 보스 전투와 대형 몬스터 사냥에 탁월합니다.",
    levels: [
      "1성: 무작위 타깃을 대상으로 공중 낙뢰 1회 타격",
      "2성: 낙뢰 수 2회로 증가",
      "3성: 낙뢰 가해 폭 범위 20% 및 기본 타격력 25% 상승",
      "4성: 번개 재장전 대기시간 15% 감소",
      "5성: 낙뢰 수 3회로 최종 고압 연쇄 타격 가능"
    ],
    evoWith: "강력 전자기석",
    evoResult: "천둥 발전소"
  },
  {
    id: WeaponType.GATLING,
    name: "전설의 개틀링건",
    desc: "정면에 대고 무자비한 중화기 탄환 스트림을 뿜어냅니다. 수평 방면의 몬스터 웨이브를 관통해버립니다.",
    levels: [
      "1성: 전방 부채꼴을 향해 초고속 에너지탄 연속 격사",
      "2성: 사격 속도 및 투사체 발사 각도 보정",
      "3성: 탄환 구경 크기 증가 및 대미지 15% 증가",
      "4성: 탄환이 최초 1명의 대상을 물리 관통",
      "5성: 사격 난사 속도 한계 돌파 및 대미지 25% 추가 증가"
    ],
    evoWith: "에너지 드링크",
    evoResult: "초시공 플라즈마 개틀링"
  },
  {
    id: WeaponType.POOP_SPRAY,
    name: "똥 뿌리기",
    desc: "캐릭터가 걸어간 궤적을 따라 구수한 갈색 똥을 흩뿌립니다. 밟은 몬스터는 강력한 악취 슬로우에 걸립니다.",
    levels: [
      "1성: 플레이어 후방에 지속적으로 똥 덩어리 1개씩 드롭",
      "2성: 대미지 계수 2배 극대 증가 및 드롭 주기 가속화",
      "3성: 똥 덩어리 범위 20% 증가 및 부식 효과 부여",
      "4성: 똥 바닥 잔존 수명 2초 연장",
      "5성: 똥 드롭량 급증 및 가스 넉백 폭발 탑재"
    ],
    evoWith: "특수 러닝 슈즈",
    evoResult: "황금 무지개 똥폭풍"
  }
];

export const passivesCodex = [
  {
    id: PassiveType.ATTACK_BOOST,
    name: "특공 강화 탄환",
    desc: "모든 무기의 기본 공격력을 중첩하여 극대화합니다. 한방 한방의 화력을 키워 적을 압사시킵니다.",
    levels: [
      "1레벨: 전원 무기 공격력 10% 증가",
      "2레벨: 전원 무기 공격력 20% 증가",
      "3레벨: 전원 무기 공격력 30% 증가",
      "4레벨: 전원 무기 공격력 40% 증가",
      "5레벨: 전원 무기 공격력 50% 증가"
    ],
    evoFor: "쿠나이 ➜ 영혼 수리검"
  },
  {
    id: PassiveType.MAGNET,
    name: "강력 전자기석",
    desc: "인력 중력장을 제어하여 바닥에 놓인 마그넷, 골드, 고농축 XP 보석을 빨아들이는 반경을 증대시킵니다.",
    levels: [
      "1레벨: 아이템 수거 범위 20% 확대",
      "2레벨: 아이템 수거 범위 40% 확대",
      "3레벨: 아이템 수거 범위 60% 확대",
      "4레벨: 아이템 수거 범위 80% 확대",
      "5레벨: 아이템 수거 범위 100% (화면의 절반) 확대"
    ],
    evoFor: "번개 발사기 ➜ 천둥 발전소"
  },
  {
    id: PassiveType.SPEED_BOOST,
    name: "특수 러닝 슈즈",
    desc: "대원의 민첩성을 상승시켜 몬스터들의 에워싸기 포위망이나 보스의 위협적인 슬램 장판을 순식간에 회피합니다.",
    levels: [
      "1레벨: 캐릭터 이동 속도 10% 증가",
      "2레벨: 캐릭터 이동 속도 20% 증가",
      "3레벨: 캐릭터 이동 속도 30% 증가",
      "4레벨: 캐릭터 이동 속도 40% 증가",
      "5레벨: 캐릭터 이동 속도 50% 극대 증가"
    ],
    evoFor: "축구공 ➜ 양자 공 / 똥 뿌리기 ➜ 황금 무지개 똥폭풍"
  },
  {
    id: PassiveType.HP_BOOST,
    name: "방탄 세라믹 슈트",
    desc: "대원의 최전선 방어 아머 시스템을 보강합니다. 최대 생명력 상한을 대폭 증가시키고 비상 회복 메커니즘을 돕습니다.",
    levels: [
      "1레벨: 최대 HP 10% 증가 및 즉시 최대치의 20% 치료",
      "2레벨: 최대 HP 20% 증가 및 즉시 최대치의 20% 치료",
      "3레벨: 최대 HP 30% 증가 및 즉시 최대치의 20% 치료",
      "4레벨: 최대 HP 40% 증가 및 즉시 최대치의 20% 치료",
      "5레벨: 최대 HP 50% 증가 및 즉시 최대치의 20% 치료"
    ],
    evoFor: "화염병 ➜ 정화의 가스통"
  },
  {
    id: PassiveType.COOLDOWN_REDUCE,
    name: "에너지 드링크",
    desc: "모든 액티브 무기의 발사 쿨타임과 스킬 대기 주기를 단축시켜 쉴 틈 없는 강력한 탄막 세례를 가능케 합니다.",
    levels: [
      "1레벨: 모든 공격 주기 8% 단축 (속사력 상승)",
      "2레벨: 모든 공격 주기 16% 단축",
      "3레벨: 모든 공격 주기 24% 단축",
      "4레벨: 모든 공격 주기 32% 단축",
      "5레벨: 모든 공격 주기 40% 대단축"
    ],
    evoFor: "수호자 ➜ 디펜더 보호구 / 개틀링건 ➜ 초시공 플라즈마 개틀링"
  }
];

export const evoCodex = [
  {
    weaponId: WeaponType.KUNAI,
    passiveId: PassiveType.ATTACK_BOOST,
    evoName: "영혼 수리검 (EVO)",
    desc: "쿠나이가 고차원 영적 에너지와 결합하여 무제한 관통 및 사방 폭풍 난사를 가합니다. 쿨타임이 완전히 0초가 되어 쉴 새 없이 전 화면에 난사합니다."
  },
  {
    weaponId: WeaponType.SOCCER_BALL,
    passiveId: PassiveType.SPEED_BOOST,
    evoName: "양자 공 (EVO)",
    desc: "일반 축구공이 양자역학 충돌 구체로 승격합니다. 탄성 튕김 속도가 전광석화 수준으로 빨라지며, 타격 시 무수한 미세 잔상 구체로 실시간 미세 분열되어 다중 타격합니다."
  },
  {
    weaponId: WeaponType.GUARDIAN,
    passiveId: PassiveType.COOLDOWN_REDUCE,
    evoName: "디펜더 보호구 (EVO)",
    desc: "수호자 원반의 동력 제한이 제거됩니다. 소환 시간의 한계가 영구적으로 철폐되어 24시간 내내 무적의 방패막 4개가 초고속 회전 공전하여 날아오는 투사체를 완벽히 상쇄합니다."
  },
  {
    weaponId: WeaponType.MOLOTOV,
    passiveId: PassiveType.HP_BOOST,
    evoName: "정화의 가스통 (EVO)",
    desc: "가솔린을 넘어 극한의 수소 청정 기화 폭발을 야기합니다. 지면 전체에 열역학적인 청색 고열 명계 불꽃 바다를 조성하여 침투한 괴수들을 단 수초 만에 녹여버립니다."
  },
  {
    weaponId: WeaponType.LIGHTNING,
    passiveId: PassiveType.MAGNET,
    evoName: "천둥 발전소 (EVO)",
    desc: "뇌신급 전류 제어 장치로 발돋움합니다. 번개가 떨어질 때, 타격 영역 주변을 향해 수 갈래의 고압 감전 유도 스파크 전자기선이 동시 다발적으로 연쇄 타격합니다."
  },
  {
    weaponId: WeaponType.GATLING,
    passiveId: PassiveType.COOLDOWN_REDUCE,
    evoName: "초시공 플라즈마 개틀링 (EVO)",
    desc: "시공간 에너지를 주입받은 최종 중화기. 관통 성능을 전 영역으로 장착하고 탄환 적중 지점마다 자성 연쇄 유도 번개 미사일을 전 맵에 사방으로 뿌려 초전박살냅니다."
  },
  {
    weaponId: WeaponType.POOP_SPRAY,
    passiveId: PassiveType.SPEED_BOOST,
    evoName: "황금 무지개 똥폭풍 (EVO)",
    desc: "마침내 고귀한 유기물 비료의 극의에 도달했습니다. 캐릭터의 모든 이동 경로에 영롱하고 전율이 일어나는 형형색색의 무지개 똥폭풍을 살포하여 주변 of 모든 생물을 즉시 정화시킵니다."
  }
];

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
  const [isCodexOpen, setIsCodexOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"WEAPON" | "PASSIVE" | "EVO">("WEAPON");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentRank = getRankByHighScore(highScore);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-white select-none relative">
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
            className="bg-slate-900 hover:bg-slate-850 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all border border-slate-800 active:scale-[0.97] flex items-center justify-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>장비 연구소</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onToggleSound();
            }}
            className="bg-slate-900 hover:bg-slate-850 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all border border-slate-800 active:scale-[0.97] flex items-center justify-center space-x-2"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span>소리: {soundEnabled ? "켜짐" : "꺼짐"}</span>
          </button>
        </div>

        {/* COMPENDIUM / CODEX BUTTON */}
        <button
          onClick={() => {
            soundEngine.playUpgradeSelect();
            setIsCodexOpen(true);
          }}
          className="relative overflow-hidden w-full bg-gradient-to-r from-cyan-950/40 to-sky-950/40 hover:from-cyan-900/60 hover:to-sky-900/60 text-cyan-200 py-3.5 px-6 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-[0.97] flex items-center justify-center space-x-2.5 border border-cyan-500/30 hover:border-cyan-400/50"
        >
          <BookOpen className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
          <span className="tracking-wide">전투 특공 기밀 도감 (기능/조합법)</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="text-[10px] text-slate-600 text-center mt-2">
        © 2026 Survivor Studio • HTML5 Canvas Optimized
      </div>
    </div>

    {/* 기밀 도감 풀스크린 모달 오버레이 */}
    {isCodexOpen && (
      <div className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col p-4 animate-fade-in select-none">
        
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-3.5 shrink-0">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-black tracking-tight text-white flex items-center">
                특공 작전 기밀 도감
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-mono">
                  Confidential
                </span>
              </h2>
              <p className="text-[9px] text-slate-500 font-medium">전장 장비 성능 및 EVO 돌파 공식 수록</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              setIsCodexOpen(false);
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              setActiveTab("WEAPON");
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
              activeTab === "WEAPON"
                ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400 shadow-inner"
                : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
            }`}
          >
            액티브 무기
          </button>
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              setActiveTab("PASSIVE");
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
              activeTab === "PASSIVE"
                ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-inner"
                : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
            }`}
          >
            지원 장비
          </button>
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              setActiveTab("EVO");
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
              activeTab === "EVO"
                ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-inner"
                : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
            }`}
          >
            돌파 조합 (EVO)
          </button>
        </div>

        {/* 탭 본문 내용 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-4">
          
          {/* 1. 무기 탭 */}
          {activeTab === "WEAPON" && weaponsCodex.map((w) => (
            <div key={w.id} className="bg-slate-900/40 border border-slate-900/80 p-3.5 rounded-2xl flex flex-col space-y-2.5 relative group overflow-hidden">
              <div className="flex items-start space-x-3">
                {/* 무기 아이콘 */}
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  {renderSkillIcon(w.id, "w-6 h-6")}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{w.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{w.desc}</p>
                </div>
              </div>

              {/* 성급 강화 정보 */}
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 space-y-1">
                <span className="text-[9px] font-black text-cyan-400/90 tracking-wide uppercase">★ 성급 강화 루트</span>
                <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-300">
                  {w.levels.map((lvl, index) => (
                    <div key={index} className="flex items-center space-x-1 py-0.5 border-b border-slate-900/50 last:border-0">
                      <span className="text-cyan-500 shrink-0 font-bold">Lvl {index + 1}</span>
                      <span className="text-slate-400 truncate">{lvl.split(": ")[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 돌파 조합 레시피 */}
              <div className="flex justify-between items-center text-[10px] bg-slate-950/30 border border-slate-900 rounded-xl px-3 py-2 text-slate-400">
                <span className="font-bold text-slate-500">돌파 장비 공급책</span>
                <div className="flex items-center space-x-1 text-amber-400 font-extrabold">
                  <span>{w.evoWith}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-cyan-400">{w.evoResult}</span>
                </div>
              </div>
            </div>
          ))}

          {/* 2. 패시브 탭 */}
          {activeTab === "PASSIVE" && passivesCodex.map((p) => (
            <div key={p.id} className="bg-slate-900/40 border border-slate-900/80 p-3.5 rounded-2xl flex flex-col space-y-2.5 relative group overflow-hidden">
              <div className="flex items-start space-x-3">
                {/* 패시브 아이콘 */}
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  {renderSkillIcon(p.id, "w-6 h-6")}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{p.desc}</p>
                </div>
              </div>

              {/* 레벨 강화 정보 */}
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 space-y-1">
                <span className="text-[9px] font-black text-emerald-400/90 tracking-wide uppercase">★ 보급 중첩 성능</span>
                <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-300">
                  {p.levels.map((lvl, index) => (
                    <div key={index} className="flex items-center space-x-1 py-0.5 border-b border-slate-900/50 last:border-0">
                      <span className="text-emerald-500 shrink-0 font-bold">Lvl {index + 1}</span>
                      <span className="text-slate-400 truncate">{lvl.split(": ")[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 대상 돌파 파트너 */}
              <div className="flex justify-between items-center text-[10px] bg-slate-950/30 border border-slate-900 rounded-xl px-3 py-2 text-slate-400">
                <span className="font-bold text-slate-500">돌파 촉진 활성화</span>
                <div className="flex items-center space-x-1.5 text-emerald-400 font-extrabold">
                  <span>{p.evoFor}</span>
                </div>
              </div>
            </div>
          ))}

          {/* 3. 돌파(EVO) 탭 */}
          {activeTab === "EVO" && evoCodex.map((e, idx) => {
            const hasGatlingIcon = e.weaponId === WeaponType.GATLING;
            return (
              <div key={idx} className="bg-slate-900/40 border border-amber-500/20 p-4 rounded-2xl flex flex-col space-y-3 relative overflow-hidden shadow-lg shadow-amber-950/10">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full pointer-events-none" />
                
                {/* 돌파 조합식 흐름도 */}
                <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 rounded-xl p-2.5">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {renderSkillIcon(e.weaponId, "w-5 h-5")}
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold truncate max-w-[65px]">
                      {weaponsCodex.find(w => w.id === e.weaponId)?.name || "개틀링건"}
                    </span>
                  </div>

                  <span className="text-slate-600 font-bold text-xs shrink-0">+</span>

                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {renderSkillIcon(e.passiveId, "w-5 h-5")}
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold truncate max-w-[65px]">
                      {passivesCodex.find(p => p.id === e.passiveId)?.name || "보조공급"}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />

                  <div className="flex flex-col items-center space-y-1 bg-amber-500/5 border border-amber-500/30 rounded-lg px-2 py-1">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      {renderSkillIcon(e.weaponId, "w-5 h-5 text-amber-400 animate-pulse")}
                    </div>
                    <span className="text-[8px] text-amber-400 font-extrabold truncate max-w-[70px]">
                      {e.evoName.split(" ")[0]}
                    </span>
                  </div>
                </div>

                {/* 진화 무기 세부 설명 */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 tracking-wide">{e.evoName}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl">
                    {e.desc}
                  </p>
                </div>
              </div>
            );
          })}

        </div>

        {/* 닫기 풋터 */}
        <div className="pt-2 border-t border-slate-900 shrink-0">
          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              setIsCodexOpen(false);
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 py-2.5 rounded-xl font-bold text-xs border border-slate-800 transition-all text-center"
          >
            기밀 해제 및 닫기
          </button>
        </div>
      </div>
    )}
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
  equippedWeapons?: { id: WeaponType; level: number; isEvo: boolean }[];
  equippedPassives?: { id: PassiveType; level: number }[];
}

export const LevelUpChooser: React.FC<LevelUpChooserProps> = ({
  cards,
  onSelectCard,
  equippedWeapons = [],
  equippedPassives = [],
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
        {/* Currently Possessed Abilities Panel */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 space-y-2 backdrop-blur-sm shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-black tracking-wider uppercase">
            <span className="text-slate-400">💼 현재 보유한 장비 및 무기</span>
            <span className="text-emerald-400 font-mono">{equippedWeapons.length + equippedPassives.length}/12</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weapons Group */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-extrabold text-sky-400 border-b border-sky-950 pb-0.5 uppercase tracking-wider">무기 슬롯 (WEAPONS)</div>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const weapon = equippedWeapons[idx];
                  return (
                    <div
                      key={`eq-w-${idx}`}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative ${
                        weapon 
                          ? weapon.isEvo 
                            ? "bg-amber-950/40 border-amber-500/50" 
                            : "bg-slate-950 border-sky-900" 
                          : "bg-slate-950/30 border-slate-900/40 border-dashed"
                      }`}
                    >
                      {weapon ? (
                        <>
                          {renderSkillIcon(weapon.id, "w-4 h-4")}
                          <span className={`absolute -bottom-1 -right-1 text-[7px] font-mono font-black px-1 rounded-sm border ${
                            weapon.isEvo 
                              ? "bg-amber-500 border-amber-400 text-slate-950 scale-90" 
                              : "bg-slate-800 border-slate-700 text-slate-300 scale-90"
                          }`}>
                            {weapon.isEvo ? "E" : `${weapon.level}`}
                          </span>
                        </>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passives Group */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-extrabold text-emerald-400 border-b border-emerald-950 pb-0.5 uppercase tracking-wider">지원 장비 (PASSIVES)</div>
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }).map((_, idx) => {
                  const passive = equippedPassives[idx];
                  return (
                    <div
                      key={`eq-p-${idx}`}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative ${
                        passive 
                          ? "bg-slate-950 border-emerald-900" 
                          : "bg-slate-950/30 border-slate-900/40 border-dashed"
                      }`}
                    >
                      {passive ? (
                        <>
                          {renderSkillIcon(passive.id, "w-4 h-4")}
                          <span className="absolute -bottom-1 -right-1 text-[7px] font-mono font-black px-1 rounded-sm border bg-slate-800 border-slate-700 text-emerald-400 scale-90">
                            {passive.level}
                          </span>
                        </>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
  const [isCodexOpen, setIsCodexOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"WEAPON" | "PASSIVE" | "EVO">("WEAPON");

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center z-45 p-4 select-none animate-fade-in relative">
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
              setIsCodexOpen(true);
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 text-cyan-400 py-3 rounded-xl font-bold text-sm transition-all border border-slate-700 active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4.5 h-4.5 text-cyan-400" />
            <span>📖 작전 도감 확인</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onRestart();
            }}
            className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 py-3 rounded-xl font-bold text-sm transition-all border border-slate-900 active:scale-[0.98]"
          >
            다시 시작 (재도전)
          </button>

          <button
            onClick={() => {
              soundEngine.playUpgradeSelect();
              onQuit();
            }}
            className="w-full bg-slate-950 hover:bg-red-950/30 text-slate-500 hover:text-red-400 py-3 rounded-xl font-bold text-sm transition-all border border-slate-900 active:scale-[0.98]"
          >
            마을로 귀환 (포기)
          </button>
        </div>
      </div>

      {/* 기밀 도감 풀스크린 모달 오버레이 */}
      {isCodexOpen && (
        <div className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col p-4 animate-fade-in select-none">
          
          {/* 모달 헤더 */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-3.5 shrink-0">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-black tracking-tight text-white flex items-center">
                  특공 작전 기밀 도감
                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-mono">
                    Confidential
                  </span>
                </h2>
                <p className="text-[9px] text-slate-500 font-medium">전장 장비 성능 및 EVO 돌파 공식 수록</p>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setIsCodexOpen(false);
              }}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setActiveTab("WEAPON");
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
                activeTab === "WEAPON"
                  ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400 shadow-inner"
                  : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
              }`}
            >
              액티브 무기
            </button>
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setActiveTab("PASSIVE");
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
                activeTab === "PASSIVE"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-inner"
                  : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
              }`}
            >
              지원 장비
            </button>
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setActiveTab("EVO");
              }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all text-center border ${
                activeTab === "EVO"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-inner"
                  : "bg-slate-900/50 border-slate-900 text-slate-400 hover:bg-slate-900"
              }`}
            >
              돌파 조합 (EVO)
            </button>
          </div>

          {/* 탭 본문 내용 (스크롤 영역) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-4">
            
            {/* 1. 무기 탭 */}
            {activeTab === "WEAPON" && weaponsCodex.map((w) => (
              <div key={w.id} className="bg-slate-900/40 border border-slate-900/80 p-3.5 rounded-2xl flex flex-col space-y-2.5 relative group overflow-hidden text-left font-sans">
                <div className="flex items-start space-x-3">
                  {/* 무기 아이콘 */}
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                    {renderSkillIcon(w.id, "w-6 h-6")}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{w.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{w.desc}</p>
                  </div>
                </div>

                {/* 성급 강화 정보 */}
                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 space-y-1">
                  <span className="text-[9px] font-black text-cyan-400/90 tracking-wide uppercase">★ 성급 강화 루트</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-300">
                    {w.levels.map((lvl, index) => (
                      <div key={index} className="flex items-center space-x-1 py-0.5 border-b border-slate-900/50 last:border-0">
                        <span className="text-cyan-500 shrink-0 font-bold">Lvl {index + 1}</span>
                        <span className="text-slate-400 truncate">{lvl.split(": ")[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 돌파 조합 레시피 */}
                <div className="flex justify-between items-center text-[10px] bg-slate-950/30 border border-slate-900 rounded-xl px-3 py-2 text-slate-400">
                  <span className="font-bold text-slate-500">돌파 장비 공급책</span>
                  <div className="flex items-center space-x-1 text-amber-400 font-extrabold">
                    <span>{w.evoWith}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-cyan-400">{w.evoResult}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* 2. 패시브 탭 */}
            {activeTab === "PASSIVE" && passivesCodex.map((p) => (
              <div key={p.id} className="bg-slate-900/40 border border-slate-900/80 p-3.5 rounded-2xl flex flex-col space-y-2.5 relative group overflow-hidden text-left font-sans">
                <div className="flex items-start space-x-3">
                  {/* 패시브 아이콘 */}
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                    {renderSkillIcon(p.id, "w-6 h-6")}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                </div>

                {/* 레벨 강화 정보 */}
                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 space-y-1">
                  <span className="text-[9px] font-black text-emerald-400/90 tracking-wide uppercase">★ 보급 중첩 성능</span>
                  <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-300">
                    {p.levels.map((lvl, index) => (
                      <div key={index} className="flex items-center space-x-1 py-0.5 border-b border-slate-900/50 last:border-0">
                        <span className="text-emerald-500 shrink-0 font-bold">Lvl {index + 1}</span>
                        <span className="text-slate-400 truncate">{lvl.split(": ")[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 대상 돌파 파트너 */}
                <div className="flex justify-between items-center text-[10px] bg-slate-950/30 border border-slate-900 rounded-xl px-3 py-2 text-slate-400">
                  <span className="font-bold text-slate-500">돌파 촉진 활성화</span>
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-extrabold">
                    <span>{p.evoFor}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* 3. 돌파(EVO) 탭 */}
            {activeTab === "EVO" && evoCodex.map((e, idx) => {
              return (
                <div key={idx} className="bg-slate-900/40 border border-amber-500/20 p-4 rounded-2xl flex flex-col space-y-3 relative overflow-hidden shadow-lg shadow-amber-950/10 text-left font-sans">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full pointer-events-none" />
                  
                  {/* 돌파 조합식 흐름도 */}
                  <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 rounded-xl p-2.5">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {renderSkillIcon(e.weaponId, "w-5 h-5")}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold truncate max-w-[65px]">
                        {weaponsCodex.find(w => w.id === e.weaponId)?.name || "개틀링건"}
                      </span>
                    </div>

                    <span className="text-slate-600 font-bold text-xs shrink-0">+</span>

                    <div className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {renderSkillIcon(e.passiveId, "w-5 h-5")}
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold truncate max-w-[65px]">
                        {passivesCodex.find(p => p.id === e.passiveId)?.name || "보조공급"}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />

                    <div className="flex flex-col items-center space-y-1 bg-amber-500/5 border border-amber-500/30 rounded-lg px-2 py-1">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        {renderSkillIcon(e.weaponId, "w-5 h-5 text-amber-400 animate-pulse")}
                      </div>
                      <span className="text-[8px] text-amber-400 font-extrabold truncate max-w-[70px]">
                        {e.evoName.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  {/* 진화 무기 세부 설명 */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-black text-amber-400 tracking-wide">{e.evoName}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl text-left">
                      {e.desc}
                    </p>
                  </div>
                </div>
              );
            })}

          </div>

          {/* 닫기 풋터 */}
          <div className="pt-2 border-t border-slate-900 shrink-0">
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setIsCodexOpen(false);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 py-2.5 rounded-xl font-bold text-xs border border-slate-800 transition-all text-center"
            >
              전술 기밀 열람 종료
            </button>
          </div>
        </div>
      )}
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
