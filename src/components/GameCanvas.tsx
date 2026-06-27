import React, { useRef, useEffect, useState } from "react";
import {
  WeaponType,
  PassiveType,
  UpgradeCard,
  PlayerStats,
  PermanentUpgrades,
} from "../types";
import { soundEngine } from "../audio";
import { renderSkillIcon } from "./MainOverlay";
import {
  Sword,
  Shield,
  Zap,
  Sparkles,
  Clock,
  Compass,
  Coins,
  Wrench,
  X,
  ChevronRight,
} from "lucide-react";

interface GameCanvasProps {
  permanentUpgrades: PermanentUpgrades;
  soundEnabled: boolean;
  joystickAngle: number | null;
  joystickForce: number;
  onLevelUp: (choices: UpgradeCard[]) => void;
  onGameOver: (stats: {
    victory: boolean;
    timeSurvived: number;
    kills: number;
    levelReached: number;
    goldEarned: number;
  }) => void;
  isPaused: boolean;
  levelUpSelectedCard: UpgradeCard | null;
  setLevelUpSelectedCard: (card: UpgradeCard | null) => void;
  isEndlessMode: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  permanentUpgrades,
  soundEnabled,
  joystickAngle,
  joystickForce,
  onLevelUp,
  onGameOver,
  isPaused,
  levelUpSelectedCard,
  setLevelUpSelectedCard,
  isEndlessMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // In-game states mirrored for UI Overlay
  const [inGameLevel, setInGameLevel] = useState(1);
  const [inGameXP, setInGameXP] = useState(0);
  const [inGameMaxXP, setInGameMaxXP] = useState(30);
  const [inGameHP, setInGameHP] = useState(100);
  const [inGameMaxHP, setInGameMaxHP] = useState(100);
  const [inGameKills, setInGameKills] = useState(0);
  const [inGameTime, setInGameTime] = useState(0);
  const [equippedWeapons, setEquippedWeapons] = useState<{ id: WeaponType; level: number; isEvo: boolean }[]>([]);
  const [equippedPassives, setEquippedPassives] = useState<{ id: PassiveType; level: number }[]>([]);
  const [inGameGold, setInGameGold] = useState(0);

  // In-game Equipment Reinforcement states
  const [showReinforceModal, setShowReinforceModal] = useState(false);
  const [reinforcements, setReinforcements] = useState({
    weapon: 0,
    armor: 0,
    boots: 0,
    magnet: 0,
    watch: 0,
    ring: 0,
  });

  // Boss health indicator
  const [bossHealth, setBossHealth] = useState<{ current: number; max: number; name: string } | null>(null);
  const [finalBossTimeLeft, setFinalBossTimeLeft] = useState<number | null>(null);

  // Game references
  const gameLoopRef = useRef<number | null>(null);
  const keyboardRef = useRef<{ [key: string]: boolean }>({});
  const joystickAngleRef = useRef<number | null>(null);
  const joystickForceRef = useRef<number>(0);
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  // Sync props to refs on every render
  joystickAngleRef.current = joystickAngle;
  joystickForceRef.current = joystickForce;
  soundEnabledRef.current = soundEnabled;

  // Core Game State Variables (held in refs for high-frequency canvas access without re-renders)
  const gameState = useRef({
    player: {
      x: 0,
      y: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      baseSpeed: 2.8,
      speedMultiplier: 1.0,
      atkMultiplier: 1.0,
      magnetRadius: 70,
      cooldownMultiplier: 1.0,
      level: 1,
      xp: 0,
      maxXp: 30,
      kills: 0,
      gold: 0,
      timeElapsed: 0,
    },
    // Skill levels
    skills: {
      weapons: {} as Record<WeaponType, { level: number; isEvo: boolean }>,
      passives: {} as Record<PassiveType, { level: number }>,
    },
    // Timers
    timers: {
      kunai: 0,
      soccerBall: 0,
      guardian: 0,
      molotov: 0,
      lightning: 0,
      gatling: 0,
      poopSpray: 0,
      poopRainbowState: 0,
      enemySpawn: 0,
      gameSecond: 0,
    },
    enemies: [] as any[],
    projectiles: [] as any[],
    gems: [] as any[],
    particles: [] as any[],
    damageTexts: [] as any[],
    screenShake: 0,
    camera: { x: 0, y: 0 },
    dimensions: { width: 400, height: 600 },
    activeWeaponEvolutions: {} as Record<WeaponType, boolean>,
    bossSpawned: false,
    bossDefeated: false,
    finalBossSpawned: false,
    finalBossActive: false,
    finalBossTimer: 180,
    nextMiniBossKills: 100,
    miniBossKillIncrement: 150,
    miniBossCount: 0,
    spawnedDashBoss: false,
    spawnedBurstBoss: false,
    spawnedSlamBoss: false,
    isLevelingUp: false,
    isEnded: false,
    equipmentReinforcements: {
      weapon: 0,
      armor: 0,
      boots: 0,
      magnet: 0,
      watch: 0,
      ring: 0,
    },
  });

  // Sound Engine Sync
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // Track keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardRef.current[e.key.toLowerCase()] = true;
      keyboardRef.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardRef.current[e.key.toLowerCase()] = false;
      keyboardRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Initialize Game on Mount
  useEffect(() => {
    // Canvas Resizing
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      gameState.current.dimensions = { width, height };
    };

    const observer = new ResizeObserver(() => handleResize());
    if (containerRef.current) observer.observe(containerRef.current);
    handleResize();

    // Reset Game State Ref
    const playerAtkMod = 1.0 + permanentUpgrades.atkLevel * 0.1;
    const playerHpMod = 100 * (1.0 + permanentUpgrades.hpLevel * 0.1);
    const playerSpeedMod = 1.0 + permanentUpgrades.speedLevel * 0.05;
    const playerMagnetMod = 70 * (1.0 + permanentUpgrades.magnetLevel * 0.2);

    gameState.current = {
      player: {
        x: 0,
        y: 0,
        radius: 18,
        hp: playerHpMod,
        maxHp: playerHpMod,
        baseSpeed: 2.8 * playerSpeedMod,
        speedMultiplier: 1.0,
        atkMultiplier: playerAtkMod,
        magnetRadius: playerMagnetMod,
        cooldownMultiplier: 1.0,
        level: 1,
        xp: 0,
        maxXp: 30,
        kills: 0,
        gold: 0,
        timeElapsed: 0,
      },
      skills: {
        weapons: {
          [WeaponType.KUNAI]: { level: 1, isEvo: false }, // Start with level 1 Kunai by default!
        } as Record<WeaponType, { level: number; isEvo: boolean }>,
        passives: {} as Record<PassiveType, { level: number }>,
      },
      timers: {
        kunai: 0,
        soccerBall: 0,
        guardian: 0,
        molotov: 0,
        lightning: 0,
        gatling: 0,
        poopSpray: 0,
        poopRainbowState: 0,
        enemySpawn: 0,
        gameSecond: 0,
      },
      enemies: [],
      projectiles: [],
      gems: [],
      particles: [],
      damageTexts: [],
      screenShake: 0,
      camera: { x: 0, y: 0 },
      dimensions: { width: canvasRef.current?.width || 400, height: canvasRef.current?.height || 600 },
      activeWeaponEvolutions: {
        [WeaponType.KUNAI]: false,
        [WeaponType.SOCCER_BALL]: false,
        [WeaponType.GUARDIAN]: false,
        [WeaponType.MOLOTOV]: false,
        [WeaponType.LIGHTNING]: false,
        [WeaponType.GATLING]: false,
        [WeaponType.POOP_SPRAY]: false,
      },
      bossSpawned: false,
      bossDefeated: false,
      finalBossSpawned: false,
      finalBossActive: false,
      finalBossTimer: 180,
      nextMiniBossKills: 100,
      miniBossKillIncrement: 150,
      miniBossCount: 0,
      spawnedDashBoss: false,
      spawnedBurstBoss: false,
      spawnedSlamBoss: false,
      isLevelingUp: false,
      isEnded: false,
      equipmentReinforcements: {
        weapon: 0,
        armor: 0,
        boots: 0,
        magnet: 0,
        watch: 0,
        ring: 0,
      },
    };

    setReinforcements({
      weapon: 0,
      armor: 0,
      boots: 0,
      magnet: 0,
      watch: 0,
      ring: 0,
    });
    setShowReinforceModal(false);

    // Update HUD initially
    updateReactHUD();

    return () => {
      observer.disconnect();
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [permanentUpgrades]);

  // Handle selected upgrade card from React LevelUp Overlay
  useEffect(() => {
    if (!levelUpSelectedCard) return;

    const g = gameState.current;
    const { skillId, type } = levelUpSelectedCard;

    if (type === "weapon") {
      const existing = g.skills.weapons[skillId as WeaponType];
      if (existing) {
        if (levelUpSelectedCard.isEvo) {
          existing.isEvo = true;
          g.activeWeaponEvolutions[skillId as WeaponType] = true;
          soundEngine.playEvo();
        } else {
          existing.level += 1;
        }
      } else {
        g.skills.weapons[skillId as WeaponType] = { level: 1, isEvo: false };
      }
    } else if (type === "passive") {
      const existing = g.skills.passives[skillId as PassiveType];
      if (existing) {
        existing.level += 1;
      } else {
        g.skills.passives[skillId as PassiveType] = { level: 1 };
      }

      // Reapply stats upgrades
      recalculatePlayerPassives();
    }

    // Play heal effect or minor animation on upgrade
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.player.maxHp * 0.2); // Heal 20% on Level Up!
    g.particles.push(...createLevelUpSparkles(g.player.x, g.player.y));

    // Reset Choice
    setLevelUpSelectedCard(null);
    g.isLevelingUp = false;
    updateReactHUD();
  }, [levelUpSelectedCard]);

  // Recalculate passive items multipliers
  const recalculatePlayerPassives = () => {
    const g = gameState.current;
    const atkLvl = g.skills.passives[PassiveType.ATTACK_BOOST]?.level || 0;
    const speedLvl = g.skills.passives[PassiveType.SPEED_BOOST]?.level || 0;
    const hpLvl = g.skills.passives[PassiveType.HP_BOOST]?.level || 0;
    const magnetLvl = g.skills.passives[PassiveType.MAGNET]?.level || 0;
    const cdLvl = g.skills.passives[PassiveType.COOLDOWN_REDUCE]?.level || 0;

    const permAtkMod = 1.0 + permanentUpgrades.atkLevel * 0.1;
    const permHpMod = 100 * (1.0 + permanentUpgrades.hpLevel * 0.1);
    const permSpeedMod = 1.0 + permanentUpgrades.speedLevel * 0.05;
    const permMagnetMod = 70 * (1.0 + permanentUpgrades.magnetLevel * 0.2);

    // Apply in-game equipment reinforcement multipliers
    const gearReinf = g.equipmentReinforcements || { weapon: 0, armor: 0, boots: 0, magnet: 0, watch: 0, ring: 0 };
    const equipAtkBonus = gearReinf.weapon * 0.08;       // +8% per level
    const equipHpBonus = gearReinf.armor * 0.10;         // +10% max HP per level
    const equipSpeedBonus = gearReinf.boots * 0.04;       // +4% speed per level
    const equipMagnetBonus = gearReinf.magnet * 0.12;     // +12% magnet radius per level
    const equipCdBonus = gearReinf.watch * 0.04;          // -4% cooldown per level

    g.player.atkMultiplier = permAtkMod * (1.0 + atkLvl * 0.1) * (1.0 + equipAtkBonus);
    g.player.speedMultiplier = (1.0 + speedLvl * 0.1) * (1.0 + equipSpeedBonus);
    g.player.magnetRadius = permMagnetMod * (1.0 + magnetLvl * 0.2) * (1.0 + equipMagnetBonus);
    g.player.cooldownMultiplier = (1.0 - cdLvl * 0.08) * (1.0 - equipCdBonus);

    const oldMax = g.player.maxHp;
    g.player.maxHp = permHpMod * (1.0 + hpLvl * 0.1) * (1.0 + equipHpBonus);
    g.player.hp = Math.min(g.player.maxHp, g.player.hp + (g.player.maxHp - oldMax)); // Add difference to health safely
  };

  // Sync state to React HUD
  const updateReactHUD = () => {
    const g = gameState.current;
    setInGameLevel(g.player.level);
    setInGameXP(g.player.xp);
    setInGameMaxXP(g.player.maxXp);
    setInGameHP(Math.max(0, Math.ceil(g.player.hp)));
    setInGameMaxHP(Math.ceil(g.player.maxHp));
    setInGameKills(g.player.kills);
    setInGameTime(g.player.timeElapsed);
    setInGameGold(g.player.gold);
    setFinalBossTimeLeft(g.finalBossActive ? g.finalBossTimer : null);
    if (g.equipmentReinforcements) {
      setReinforcements({ ...g.equipmentReinforcements });
    }

    // Sync weapons HUD
    const wList = Object.entries(g.skills.weapons).map(([id, data]) => {
      const weaponData = data as { level: number; isEvo: boolean };
      return {
        id: id as WeaponType,
        level: weaponData.level,
        isEvo: weaponData.isEvo,
      };
    });
    setEquippedWeapons(wList);

    // Sync passives HUD
    const pList = Object.entries(g.skills.passives).map(([id, data]) => {
      const passiveData = data as { level: number };
      return {
        id: id as PassiveType,
        level: passiveData.level,
      };
    });
    setEquippedPassives(pList);
  };

  // Handle in-game equipment slot reinforcement with gold
  const handleUpgradeReinforcement = (slot: keyof typeof reinforcements) => {
    const g = gameState.current;
    if (!g.equipmentReinforcements) {
      g.equipmentReinforcements = { weapon: 0, armor: 0, boots: 0, magnet: 0, watch: 0, ring: 0 };
    }
    const currentLvl = g.equipmentReinforcements[slot];
    if (currentLvl >= 5) return; // Max level 5
    const cost = (currentLvl + 1) * 75;
    if (g.player.gold < cost) return;

    // Deduct gold
    g.player.gold -= cost;
    g.equipmentReinforcements[slot] += 1;

    // Recompute passives
    recalculatePlayerPassives();

    // Trigger visual/audio feedback
    soundEngine.playLevelUp();

    // Spawn a shiny level-up particle or text around player
    g.damageTexts.push({
      x: g.player.x,
      y: g.player.y - 30,
      text: `장비 강화 성공! Lv.${g.equipmentReinforcements[slot]}`,
      color: "#fbbf24", // Golden
      size: 15,
      life: 1.2,
    });

    // Update state to trigger React re-render
    setReinforcements({ ...g.equipmentReinforcements });
    updateReactHUD();
  };

  // Particle Generators
  const createExplosion = (x: number, y: number, color: string, count = 10) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.04,
      });
    }
    return particles;
  };

  const createLevelUpSparkles = (x: number, y: number) => {
    const particles = [];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: i % 2 === 0 ? "#10b981" : "#38bdf8", // emerald or sky blue
        life: 1.0,
        decay: 0.02,
      });
    }
    return particles;
  };

  // Weapon Upgrade Options Picker
  const triggerLevelUpChoices = () => {
    const g = gameState.current;
    g.isLevelingUp = true;
    soundEngine.playLevelUp();

    // Find all potential weapon / passive upgrades available to the player
    const choices: UpgradeCard[] = [];

    // Weapon list
    const weaponPool = [
      { id: WeaponType.KUNAI, name: "쿠나이", desc: "가장 가까운 적을 추적하는 수리검을 연속 발사합니다." },
      { id: WeaponType.SOCCER_BALL, name: "축구공", desc: "적과 벽을 튕겨다니며 강력한 충돌 물리 피해를 줍니다." },
      { id: WeaponType.GUARDIAN, name: "수호자", desc: "플레이어 주변을 공전하는 보호막을 생성해 적들을 밀쳐냅니다." },
      { id: WeaponType.MOLOTOV, name: "화염병", desc: "바닥에 던져 지속적인 화염 대미지를 주는 불길 지대를 만듭니다." },
      { id: WeaponType.LIGHTNING, name: "번개 발사기", desc: "하늘에서 무작위 대상을 향해 치명적인 낙뢰를 떨어뜨립니다." },
      { id: WeaponType.POOP_SPRAY, name: "똥 뿌리기", desc: "캐릭터 뒤에 갈색깔 똥이 지속적으로 뿌려져 밟는 적들에게 지속적인 광역 피해를 줍니다." },
    ];

    // Passive list
    const passivePool = [
      { id: PassiveType.ATTACK_BOOST, name: "특공 강화 탄환", desc: "모든 무기의 공격력 대미지를 10% 증가시킵니다." },
      { id: PassiveType.MAGNET, name: "강력 전자기석", desc: "아이템 및 XP 획득 범위를 20% 늘려줍니다." },
      { id: PassiveType.SPEED_BOOST, name: "특수 러닝 슈즈", desc: "대원의 이동 속도를 10% 빠르게 합니다." },
      { id: PassiveType.HP_BOOST, name: "방탄 세라믹 슈트", desc: "최대 체력을 10% 늘리고 즉시 20%를 회복합니다." },
      { id: PassiveType.COOLDOWN_REDUCE, name: "에너지 드링크", desc: "모든 무기의 공격 주기 쿨타임을 8% 단축시킵니다." },
    ];

    const currentWeapons = g.skills.weapons;
    const currentPassives = g.skills.passives;

    // Build Upgrade Cards
    const cards: UpgradeCard[] = [];

    // Check for Weapon Evolutions (EVO)
    // EVO conditions: Max Weapon Level (5) + Having corresponding passive supply item (level >= 1)
    const evolutionPairs: Array<{ w: WeaponType; p: PassiveType; name: string; desc: string }> = [
      {
        w: WeaponType.KUNAI,
        p: PassiveType.ATTACK_BOOST,
        name: "영혼 수리검",
        desc: "쿠나이가 관통 영혼 수리검으로 진화! 사방을 끊임없이 찢어발깁니다.",
      },
      {
        w: WeaponType.SOCCER_BALL,
        p: PassiveType.SPEED_BOOST,
        name: "양자 공",
        desc: "초고속 전자기 잔상을 남기며 적들 사이를 질주 및 분열 충돌합니다.",
      },
      {
        w: WeaponType.GUARDIAN,
        p: PassiveType.COOLDOWN_REDUCE,
        name: "디펜더 보호구",
        desc: "쉬지 않고 대형 방패가 초고속 고정 공전하며 원거리 투사체 및 적 진입을 전면 차단합니다.",
      },
      {
        w: WeaponType.MOLOTOV,
        p: PassiveType.HP_BOOST,
        name: "정화의 가스통",
        desc: "고열 가스 불바다를 폭발시켜 치명적인 청색 지옥불 존을 지탱합니다.",
      },
      {
        w: WeaponType.LIGHTNING,
        p: PassiveType.MAGNET,
        name: "천둥 발전소",
        desc: "낙뢰 타격 시 주변 적들에게 2차 충격 파동 및 폭풍 연쇄 낙뢰를 연출합니다.",
      },
      {
        w: WeaponType.GATLING,
        p: PassiveType.COOLDOWN_REDUCE,
        name: "초시공 플라즈마 개틀링",
        desc: "미래 지향형 플라즈마 에너지포로 격상! 적을 무자비하게 통과하며 연쇄 전자기 유도 미사일을 사방에 난사합니다.",
      },
      {
        w: WeaponType.POOP_SPRAY,
        p: PassiveType.SPEED_BOOST,
        name: "황금 무지개 똥폭풍",
        desc: "최종 똥 뿌리기로 진화! 앞뒤좌우로 똥을 뿌리고, 10초마다 6초 동안 무지막지한 위력의 무지개 똥을 뿌려 적들을 파멸시킵니다.",
      }
    ];

    // Evaluate EVOs first
    evolutionPairs.forEach((pair) => {
      const weaponData = currentWeapons[pair.w];
      const passiveData = currentPassives[pair.p];

      // If weapon is level 5, passive is acquired, and not yet evolved
      if (weaponData && weaponData.level >= 5 && passiveData && !weaponData.isEvo) {
        cards.push({
          id: `evo-${pair.w}`,
          name: pair.name,
          description: pair.desc,
          type: "weapon",
          skillId: pair.w,
          level: 6,
          icon: pair.w,
          isEvo: true,
          isLegendary: pair.w === WeaponType.GATLING,
        });
      }
    });

    // Handle normal weapon upgrades
    weaponPool.forEach((wpn) => {
      const data = currentWeapons[wpn.id];
      // Max level is 5
      if (!data) {
        // Can acquire new weapon if we have less than 6 active weapons (or just unlimited for fun, but standard limit is 6)
        if (Object.keys(currentWeapons).length < 6) {
          cards.push({
            id: `new-${wpn.id}`,
            name: `${wpn.name} (획득)`,
            description: wpn.desc,
            type: "weapon",
            skillId: wpn.id,
            level: 1,
            icon: wpn.id,
            isEvo: false,
          });
        }
      } else if (data.level < 5 && !data.isEvo) {
        cards.push({
          id: `up-${wpn.id}`,
          name: `${wpn.name} 강화`,
          description: `투사체 개수, 화력, 혹은 크기가 강화됩니다. (다음 레벨: ${data.level + 1})`,
          type: "weapon",
          skillId: wpn.id,
          level: data.level + 1,
          icon: wpn.id,
          isEvo: false,
        });
      }
    });

    // Handle supply passives
    passivePool.forEach((pas) => {
      const data = currentPassives[pas.id];
      if (!data) {
        if (Object.keys(currentPassives).length < 6) {
          cards.push({
            id: `new-${pas.id}`,
            name: `${pas.name} (획득)`,
            description: pas.desc,
            type: "passive",
            skillId: pas.id,
            level: 1,
            icon: pas.id,
            isEvo: false,
          });
        }
      } else if (data.level < 5) {
        cards.push({
          id: `up-${pas.id}`,
          name: `${pas.name} 강화`,
          description: `성능 배율이 누적 향상됩니다. (다음 레벨: ${data.level + 1})`,
          type: "passive",
          skillId: pas.id,
          level: data.level + 1,
          icon: pas.id,
          isEvo: false,
        });
      }
    });

    // Handle GATLING legendary weapon upgrades
    const hasGatling = !!currentWeapons[WeaponType.GATLING];
    // 32% chance to draft Gatling initially, or if player already has it, they can upgrade it.
    const canDraftGatling = hasGatling || (Math.random() < 0.32);
    if (canDraftGatling) {
      const gatlingData = currentWeapons[WeaponType.GATLING];
      if (!gatlingData) {
        if (Object.keys(currentWeapons).length < 6) {
          cards.push({
            id: `new-${WeaponType.GATLING}`,
            name: "전설의 개틀링건 (보급)",
            description: "[초희귀 전설 무기] 전방의 모든 적들을 초고속으로 관통 및 찢어발기는 화포 탄막을 대량 사격합니다.",
            type: "weapon",
            skillId: WeaponType.GATLING,
            level: 1,
            icon: WeaponType.GATLING,
            isEvo: false,
            isLegendary: true,
          });
        }
      } else if (gatlingData.level < 5 && !gatlingData.isEvo) {
        cards.push({
          id: `up-${WeaponType.GATLING}`,
          name: "개틀링건 튜닝 강화",
          description: `탄환 피해량, 사격 주기, 관통력 및 탄환 크기가 극한으로 증폭됩니다. (다음 레벨: ${gatlingData.level + 1})`,
          type: "weapon",
          skillId: WeaponType.GATLING,
          level: gatlingData.level + 1,
          icon: WeaponType.GATLING,
          isEvo: false,
          isLegendary: true,
        });
      }
    }

    // Select 4 random unique cards (Increased from 3 for more choices as requested!)
    const shuffled = cards.sort(() => 0.5 - Math.random());
    const finalChoices = shuffled.slice(0, 4);

    // Fallback if no upgrades are possible (all MAXed out)
    if (finalChoices.length === 0) {
      // Give a gold / heal fallback card!
      finalChoices.push({
        id: "fallback-gold",
        name: "군용 구급상자 (보급)",
        description: "모든 무기 최대 도달 상태. 대원의 체력을 100% 가깝게 긴급 치유합니다.",
        type: "passive",
        skillId: PassiveType.HP_BOOST,
        level: 5,
        icon: "HEAL",
        isEvo: false,
      });
    }

    onLevelUp(finalChoices);
  };

  // Level Up Check
  const checkLevelUp = () => {
    const g = gameState.current;
    if (g.player.xp >= g.player.maxXp) {
      g.player.xp -= g.player.maxXp;
      g.player.level += 1;
      g.player.maxXp = Math.floor(g.player.maxXp * 1.3) + 15;
      triggerLevelUpChoices();
    }
  };

  // Main game loop (running inside React's visual cycle)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(100, time - lastTime); // Cap delta to prevent massive jumps when tab loses focus
      lastTime = time;

      if (!isPaused && !showReinforceModal && !gameState.current.isLevelingUp && !gameState.current.isEnded) {
        updateGame(delta);
      }

      renderGame(ctx);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPaused, showReinforceModal]);

  // Main update physics
  const updateGame = (delta: number) => {
    const g = gameState.current;

    // Screen Shake decay
    if (g.screenShake > 0) {
      g.screenShake -= 0.1 * (delta / 16.6);
      if (g.screenShake < 0) g.screenShake = 0;
    }

    // 1. Player movement controls
    let dx = 0;
    let dy = 0;

    // Keyboard (WASD, Arrows)
    if (keyboardRef.current["w"] || keyboardRef.current["arrowup"] || keyboardRef.current["keyw"]) dy -= 1;
    if (keyboardRef.current["s"] || keyboardRef.current["arrowdown"] || keyboardRef.current["keys"]) dy += 1;
    if (keyboardRef.current["a"] || keyboardRef.current["arrowleft"] || keyboardRef.current["keya"]) dx -= 1;
    if (keyboardRef.current["d"] || keyboardRef.current["arrowright"] || keyboardRef.current["keyd"]) dx += 1;

    // Calculate length
    let len = Math.sqrt(dx * dx + dy * dy);
    let moveAngle: number | null = null;
    let moveForce = 0;

    if (len > 0) {
      moveAngle = Math.atan2(dy, dx);
      moveForce = 1.0;
    } else if (joystickAngleRef.current !== null) {
      moveAngle = joystickAngleRef.current;
      moveForce = joystickForceRef.current;
    }

    if (moveAngle !== null) {
      const currentSpeed = g.player.baseSpeed * g.player.speedMultiplier * moveForce;
      g.player.x += Math.cos(moveAngle) * currentSpeed;
      g.player.y += Math.sin(moveAngle) * currentSpeed;

      // Spawning dash trail particles
      if (Math.random() < 0.15) {
        g.particles.push({
          x: g.player.x - Math.cos(moveAngle) * 12,
          y: g.player.y - Math.sin(moveAngle) * 12 + 6,
          dx: -Math.cos(moveAngle) * 0.5 + (Math.random() - 0.5) * 0.5,
          dy: (Math.random() - 0.5) * 0.5,
          size: 3 + Math.random() * 3,
          color: "rgba(255, 255, 255, 0.2)",
          life: 0.6,
          decay: 0.04,
        });
      }
    }

    // Camera following smoothly
    g.camera.x += (g.player.x - g.camera.x - g.dimensions.width / 2) * 0.1;
    g.camera.y += (g.player.y - g.camera.y - g.dimensions.height / 2) * 0.1;

    // 2. Incremental second trackers and spawn triggers
    g.timers.enemySpawn += delta;
    g.timers.gameSecond += delta;

    if (g.timers.gameSecond >= 1000) {
      g.timers.gameSecond -= 1000;
      g.player.timeElapsed += 1;

      // Give 10 gold automatically per survived 10 seconds to help players gather resources
      if (g.player.timeElapsed % 10 === 0) {
        const ringLevel = g.equipmentReinforcements?.ring || 0;
        const goldMultiplier = 1.0 + ringLevel * 0.15;
        g.player.gold += Math.floor(10 * goldMultiplier);
      }

      // Check for BOSS spawning: 60s for normal mode, every 120s (60, 180, 300, 420, ...) for endless mode
      if (isEndlessMode) {
        if (g.player.timeElapsed > 0 && g.player.timeElapsed % 120 === 60 && g.player.timeElapsed < 600) {
          if (g.enemies.filter(e => e.type === "BOSS").length === 0) {
            spawnBoss();
          }
        }
      } else {
        if (g.player.timeElapsed === 60 && !g.bossSpawned) {
          spawnBoss();
        }
      }

      // Check Final Boss spawning at 10 minutes (600s)
      if (g.player.timeElapsed === 600 && !g.finalBossSpawned) {
        spawnFinalBoss();
      }

      // Countdown timer for Final Boss active (3 minutes limit)
      if (g.finalBossActive) {
        g.finalBossTimer -= 1;
        if (g.finalBossTimer <= 0) {
          endGame(false); // Game Over (Timeout)
          return;
        }
      }

      updateReactHUD();
    }

    // Enemy spawn controller based on time survived
    const spawnRate = Math.max(250, 1200 - Math.floor(g.player.timeElapsed / 10) * 80);
    if (g.timers.enemySpawn >= spawnRate) {
      g.timers.enemySpawn = 0;
      // Do not spawn infinite normal enemies during boss fights to avoid clustering
      if (g.enemies.filter(e => e.type === "BOSS").length === 0) {
        // Spawn more enemies simultaneously as elapsed time grows!
        const baseSpawnCount = 1 + Math.floor(g.player.timeElapsed / 45);
        const spawnCount = Math.min(6, baseSpawnCount);
        for (let i = 0; i < spawnCount; i++) {
          spawnEnemies();
        }
      }
    }

    // 3. Update Weapons timers and spawn projectiles
    updateWeapons(delta);

    // 4. Update Projectiles
    updateProjectiles(delta);

    // 5. Update Enemies
    updateEnemies(delta);

    // 6. Update XP Gems, vacuum magnetic logic
    updateGems();

    // 7. Update Particles
    updateParticles();

    // 8. Update floating texts
    updateDamageTexts();

    // Level-Up trigger check
    checkLevelUp();
  };

  // Weapon spawning controllers
  const updateWeapons = (delta: number) => {
    const g = gameState.current;
    const cdMultiplier = g.player.cooldownMultiplier;

    // Kunai (Automatic target closest)
    if (g.skills.weapons[WeaponType.KUNAI]) {
      const kunaiData = g.skills.weapons[WeaponType.KUNAI];
      g.timers.kunai += delta;

      // Cooldown speeds up per weapon level
      const rate = (kunaiData.isEvo ? 180 : 1000 - kunaiData.level * 120) * cdMultiplier;
      if (g.timers.kunai >= rate) {
        g.timers.kunai = 0;
        fireKunai(kunaiData);
      }
    }

    // Soccer Ball (Bounces physics)
    if (g.skills.weapons[WeaponType.SOCCER_BALL]) {
      const ballData = g.skills.weapons[WeaponType.SOCCER_BALL];
      g.timers.soccerBall += delta;

      const rate = (3200 - ballData.level * 400) * cdMultiplier;
      if (g.timers.soccerBall >= rate) {
        g.timers.soccerBall = 0;
        fireSoccerBall(ballData);
      }
    }

    // Guardian (Spinning Tops) - Always active, we just manage their active physics
    if (g.skills.weapons[WeaponType.GUARDIAN]) {
      const guardianData = g.skills.weapons[WeaponType.GUARDIAN];
      // Keep number of orbital shields matching level + evo status
      const requiredShields = (guardianData.isEvo ? 6 : 2 + guardianData.level);
      const activeShields = g.projectiles.filter((p: any) => p.type === "GUARDIAN");

      if (activeShields.length < requiredShields) {
        // Spawn them
        const countToSpawn = requiredShields - activeShields.length;
        for (let i = 0; i < countToSpawn; i++) {
          g.projectiles.push({
            type: "GUARDIAN",
            angle: (i * (Math.PI * 2)) / requiredShields,
            distance: 65 + guardianData.level * 8,
            speed: 0.04 + (guardianData.isEvo ? 0.03 : guardianData.level * 0.005),
            size: guardianData.isEvo ? 24 : 12 + guardianData.level * 2,
            damage: (12 + guardianData.level * 6) * g.player.atkMultiplier,
            color: guardianData.isEvo ? "#f59e0b" : "#10b981", // Amber for Evo, Emerald for normal
          });
        }
      }
    }

    // Molotov (Puddles of fire)
    if (g.skills.weapons[WeaponType.MOLOTOV]) {
      const moloData = g.skills.weapons[WeaponType.MOLOTOV];
      g.timers.molotov += delta;

      const rate = (3600 - moloData.level * 300) * cdMultiplier;
      if (g.timers.molotov >= rate) {
        g.timers.molotov = 0;
        fireMolotov(moloData);
      }
    }

    // Lightning Transmitter (Lightning)
    if (g.skills.weapons[WeaponType.LIGHTNING]) {
      const lightData = g.skills.weapons[WeaponType.LIGHTNING];
      g.timers.lightning += delta;

      const rate = (2600 - lightData.level * 300) * cdMultiplier;
      if (g.timers.lightning >= rate) {
        g.timers.lightning = 0;
        fireLightning(lightData);
      }
    }

    // Gatling (Ultra rapid speed bullet stream!)
    if (g.skills.weapons[WeaponType.GATLING]) {
      const gatData = g.skills.weapons[WeaponType.GATLING];
      g.timers.gatling += delta;

      const rate = (gatData.isEvo ? 45 : 180 - gatData.level * 20) * cdMultiplier;
      if (g.timers.gatling >= rate) {
        g.timers.gatling = 0;
        fireGatling(gatData);
      }
    }

    // Poop Spray (Drops poop behind character continuously)
    if (g.skills.weapons[WeaponType.POOP_SPRAY]) {
      const poopData = g.skills.weapons[WeaponType.POOP_SPRAY];
      g.timers.poopSpray = (g.timers.poopSpray || 0) + delta;

      // Cycle rainbow poop timer if max level / evolved
      if (poopData.isEvo) {
        g.timers.poopRainbowState = (g.timers.poopRainbowState || 0) + delta;
        if (g.timers.poopRainbowState >= 10000) {
          g.timers.poopRainbowState -= 10000;
        }
      }

      // Poop drop rate (e.g. drop every 350ms, slightly faster if evolved or higher level)
      const rate = (poopData.isEvo ? 200 : 400 - poopData.level * 25) * cdMultiplier;
      if (g.timers.poopSpray >= rate) {
        g.timers.poopSpray = 0;
        firePoopSpray(poopData);
      }
    }
  };

  // --- FIRE WEAPON FUNCTIONS ---

  const fireKunai = (wpnData: any) => {
    const g = gameState.current;
    if (g.enemies.length === 0) return;

    // Find closest enemies
    const targets = [...g.enemies]
      .map((e) => {
        const dx = e.x - g.player.x;
        const dy = e.y - g.player.y;
        return { enemy: e, dist: dx * dx + dy * dy };
      })
      .sort((a, b) => a.dist - b.dist);

    const targetCount = wpnData.isEvo ? 4 : Math.min(targets.length, 1 + Math.floor(wpnData.level / 2));

    for (let i = 0; i < targetCount; i++) {
      if (!targets[i]) break;
      const enemy = targets[i].enemy;
      const angle = Math.atan2(enemy.y - g.player.y, enemy.x - g.player.x);

      // Add slight offset for multi-shots so they spread beautifully
      const angleOffset = (i - (targetCount - 1) / 2) * 0.15;

      g.projectiles.push({
        type: "KUNAI",
        x: g.player.x,
        y: g.player.y,
        dx: Math.cos(angle + angleOffset),
        dy: Math.sin(angle + angleOffset),
        speed: wpnData.isEvo ? 12 : 7 + wpnData.level,
        size: wpnData.isEvo ? 16 : 8 + wpnData.level * 1.5,
        damage: (10 + wpnData.level * 4) * g.player.atkMultiplier * (wpnData.isEvo ? 1.8 : 1),
        piercing: wpnData.isEvo ? 999 : Math.floor(wpnData.level / 2), // EVO pierces everything!
        color: wpnData.isEvo ? "#f59e0b" : "#38bdf8",
        life: 3000,
      });
    }

    if (soundEnabledRef.current && Math.random() < 0.4) {
      soundEngine.playShoot();
    }
  };

  const fireSoccerBall = (wpnData: any) => {
    const g = gameState.current;
    const count = wpnData.isEvo ? 5 : 1 + Math.floor(wpnData.level / 2);

    for (let i = 0; i < count; i++) {
      // Fire in random outward directions
      const angle = Math.random() * Math.PI * 2;
      g.projectiles.push({
        type: "SOCCER_BALL",
        x: g.player.x,
        y: g.player.y,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        speed: wpnData.isEvo ? 9 : 5 + wpnData.level * 0.6,
        size: wpnData.isEvo ? 20 : 12 + wpnData.level * 2,
        damage: (20 + wpnData.level * 8) * g.player.atkMultiplier * (wpnData.isEvo ? 1.5 : 1),
        bounces: wpnData.isEvo ? 12 : 3 + wpnData.level,
        color: wpnData.isEvo ? "#a855f7" : "#f97316", // Purple for Evo quantum, Orange for normal
        life: 5000,
      });
    }

    if (soundEnabledRef.current) {
      soundEngine.playShoot();
    }
  };

  const fireMolotov = (wpnData: any) => {
    const g = gameState.current;
    const count = wpnData.isEvo ? 6 : 1 + Math.floor(wpnData.level / 3);

    for (let i = 0; i < count; i++) {
      // Throw bottle at a random position nearby the player
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 120;
      const targetX = g.player.x + Math.cos(angle) * dist;
      const targetY = g.player.y + Math.sin(angle) * dist;

      g.projectiles.push({
        type: "MOLOTOV",
        x: targetX,
        y: targetY,
        timer: 0,
        duration: wpnData.isEvo ? 6000 : 3000 + wpnData.level * 500,
        radius: wpnData.isEvo ? 75 : 40 + wpnData.level * 8,
        damage: (4 + wpnData.level * 2) * g.player.atkMultiplier * (wpnData.isEvo ? 1.6 : 1),
        color: wpnData.isEvo ? "rgba(56, 189, 248, 0.3)" : "rgba(249, 115, 22, 0.3)", // Blue fire for Evo, Orange for normal
        tickTimer: 0,
      });
    }

    if (soundEnabledRef.current && Math.random() < 0.6) {
      soundEngine.playShoot();
    }
  };

  const fireLightning = (wpnData: any) => {
    const g = gameState.current;
    if (g.enemies.length === 0) return;

    // Pick random enemies to strike
    const count = wpnData.isEvo ? 6 : 1 + wpnData.level;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * g.enemies.length);
      const enemy = g.enemies[idx];

      g.projectiles.push({
        type: "LIGHTNING",
        x: enemy.x,
        y: enemy.y,
        size: wpnData.isEvo ? 55 : 30 + wpnData.level * 4,
        damage: (35 + wpnData.level * 12) * g.player.atkMultiplier,
        timer: 200, // Duration to show strike on screen
        isEvo: wpnData.isEvo,
      });

      // Apply instant damage
      const baseDmg = (35 + wpnData.level * 12) * g.player.atkMultiplier;
      applyDamageToEnemy(enemy, baseDmg);

      // Chain lightning for EVO
      if (wpnData.isEvo) {
        // Strike another 2 nearest targets
        const chains = [...g.enemies]
          .filter((e) => e !== enemy)
          .map((e) => {
            const dx = e.x - enemy.x;
            const dy = e.y - enemy.y;
            return { enemy: e, dist: dx * dx + dy * dy };
          })
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 2);

        chains.forEach((chain) => {
          applyDamageToEnemy(chain.enemy, baseDmg * 0.7);
          g.projectiles.push({
            type: "LIGHTNING_CHAIN",
            sx: enemy.x,
            sy: enemy.y,
            tx: chain.enemy.x,
            ty: chain.enemy.y,
            timer: 150,
          });
        });
      }
    }

    if (soundEnabledRef.current) {
      soundEngine.playHit();
    }
  };

  const fireGatling = (wpnData: any) => {
    const g = gameState.current;

    // Determine direction of firing
    let angle = 0;
    const playerSpeed = Math.hypot(g.player.vx || 0, g.player.vy || 0);

    if (playerSpeed > 0.1) {
      angle = Math.atan2(g.player.vy, g.player.vx);
    } else if (g.enemies.length > 0) {
      let closestEnemy = g.enemies[0];
      let minDist = Infinity;
      g.enemies.forEach((e: any) => {
        const d = Math.hypot(e.x - g.player.x, e.y - g.player.y);
        if (d < minDist) {
          minDist = d;
          closestEnemy = e;
        }
      });
      angle = Math.atan2(closestEnemy.y - g.player.y, closestEnemy.x - g.player.x);
    }

    const bulletCount = wpnData.isEvo ? 6 : wpnData.level;
    const spreadAngle = 0.06 + wpnData.level * 0.012;

    for (let i = 0; i < bulletCount; i++) {
      let offset = 0;
      if (bulletCount > 1) {
        offset = (i - (bulletCount - 1) / 2) * spreadAngle;
      }

      const finalAngle = angle + offset + (Math.random() - 0.5) * 0.04;

      g.projectiles.push({
        type: "GATLING",
        x: g.player.x,
        y: g.player.y,
        dx: Math.cos(finalAngle),
        dy: Math.sin(finalAngle),
        speed: wpnData.isEvo ? 14 : 9 + wpnData.level,
        size: wpnData.isEvo ? 12 : 5 + wpnData.level * 0.8,
        damage: (8 + wpnData.level * 3) * g.player.atkMultiplier * (wpnData.isEvo ? 2.4 : 1) * 0.7,
        piercing: wpnData.isEvo ? 999 : 1 + Math.floor(wpnData.level / 2),
        color: wpnData.isEvo ? "#fbbf24" : "#facc15",
        life: 1500,
        isEvo: wpnData.isEvo,
      });
    }

    // Visual muzzle flash sparks
    for (let i = 0; i < 3; i++) {
      const flashAngle = angle + (Math.random() - 0.5) * 0.5;
      const dist = 16;
      g.particles.push({
        x: g.player.x + Math.cos(flashAngle) * dist,
        y: g.player.y + Math.sin(flashAngle) * dist,
        dx: Math.cos(flashAngle) * (2 + Math.random() * 3) + (g.player.vx || 0),
        dy: Math.sin(flashAngle) * (2 + Math.random() * 3) + (g.player.vy || 0),
        color: wpnData.isEvo ? "#a855f7" : "#fbbf24",
        size: 2 + Math.random() * 3,
        life: 1.0,
        decay: 0.07,
      });
    }

    if (soundEnabledRef.current && Math.random() < 0.35) {
      soundEngine.playShoot();
    }
  };

  const firePoopSpray = (wpnData: any) => {
    const g = gameState.current;

    // Determine if currently in rainbow poop mode (first 6 seconds of 10s cycle)
    let isRainbowMode = false;
    if (wpnData.isEvo) {
      const rainbowTimer = g.timers.poopRainbowState || 0;
      if (rainbowTimer < 6000) {
        isRainbowMode = true;
      }
    }

    // Level-based damage
    let damage = 10;
    if (wpnData.level === 2) damage = 20;
    else if (wpnData.level === 3) damage = 30;
    else if (wpnData.level === 4) damage = 40;
    else if (wpnData.level >= 5) damage = 50;

    // Radius
    const radius = wpnData.isEvo ? 32 : 16 + wpnData.level * 2;

    // Character movement vector to drop "behind"
    let dropX = g.player.x;
    let dropY = g.player.y;
    const vx = g.player.vx || 0;
    const vy = g.player.vy || 0;
    const speed = Math.hypot(vx, vy);

    let offsetDist = 18;
    if (speed > 0) {
      dropX -= (vx / speed) * offsetDist;
      dropY -= (vy / speed) * offsetDist;
    }

    // Push behind poop
    g.projectiles.push({
      type: "POOP",
      x: dropX,
      y: dropY,
      timer: 0,
      duration: 4500, // persists on ground for 4.5 seconds
      radius: radius,
      damage: isRainbowMode ? 100 : damage,
      isRainbow: isRainbowMode,
      tickTimer: 0,
    });

    // If evolved, also spray poop in front, back, left, right (앞뒤좌우)
    if (wpnData.isEvo) {
      const offsets = [
        { dx: 35, dy: 0 },
        { dx: -35, dy: 0 },
        { dx: 0, dy: 35 },
        { dx: 0, dy: -35 },
      ];
      offsets.forEach((off) => {
        g.projectiles.push({
          type: "POOP",
          x: g.player.x + off.dx,
          y: g.player.y + off.dy,
          timer: 0,
          duration: 4500,
          radius: radius,
          damage: isRainbowMode ? 100 : damage,
          isRainbow: isRainbowMode,
          tickTimer: 0,
        });
      });
    }

    // Play soft sound if enabled
    if (soundEnabledRef.current && Math.random() < 0.1) {
      soundEngine.playHit();
    }
  };

  const applyDamageToEnemy = (enemy: any, amount: number) => {
    const isCrit = Math.random() < 0.15;
    const finalAmount = isCrit ? Math.floor(amount * 1.5) : Math.floor(amount);

    enemy.hp -= finalAmount;

    // Floating text
    gameState.current.damageTexts.push({
      x: enemy.x + (Math.random() - 0.5) * 10,
      y: enemy.y - 12,
      text: finalAmount.toString(),
      color: isCrit ? "#facc15" : "#ef4444", // critical yellow or normal red
      size: isCrit ? 18 : 13,
      life: 0.8,
    });

    // Knockback
    const angle = Math.atan2(enemy.y - gameState.current.player.y, enemy.x - gameState.current.player.x);
    if (enemy.type !== "BOSS") {
      enemy.x += Math.cos(angle) * 5;
      enemy.y += Math.sin(angle) * 5;
    }

    // Spark particles
    gameState.current.particles.push(...createExplosion(enemy.x, enemy.y, isCrit ? "#fbbf24" : "#f87171", 3));
  };

  // --- ENTITY UPDATE LOGICS ---

  const updateProjectiles = (delta: number) => {
    const g = gameState.current;

    g.projectiles = g.projectiles.filter((p: any) => {
      if (p.type === "GATLING") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        // Check monster collision
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.size / 2) {
            applyDamageToEnemy(e, p.damage);

            // Evolved Gatling shoots tiny chaining lightning spark on hits!
            if (p.isEvo && Math.random() < 0.35) {
              const nearby = g.enemies.filter((o: any) => o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 110);
              if (nearby.length > 0) {
                const randomOther = nearby[Math.floor(Math.random() * nearby.length)];
                applyDamageToEnemy(randomOther, p.damage * 0.5);
                g.projectiles.push({
                  type: "LIGHTNING_CHAIN",
                  sx: e.x,
                  sy: e.y,
                  tx: randomOther.x,
                  ty: randomOther.y,
                  timer: 100,
                });
              }
            }

            p.piercing -= 1;
            if (p.piercing < 0) return false;
          }
        }

        return p.life > 0;
      }

      if (p.type === "KUNAI") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        // Check monster collision
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.size / 2) {
            applyDamageToEnemy(e, p.damage);
            p.piercing -= 1;
            if (p.piercing < 0) return false;
          }
        }

        return p.life > 0;
      }

      if (p.type === "SOCCER_BALL") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        // Bounce on boundaries / fake map borders
        // Let's create virtual bounds around the player to keep them on-screen/active
        const distFromPlayerX = Math.abs(p.x - g.player.x);
        const distFromPlayerY = Math.abs(p.y - g.player.y);

        if (distFromPlayerX > 320) {
          p.dx *= -1;
          p.bounces -= 1;
        }
        if (distFromPlayerY > 480) {
          p.dy *= -1;
          p.bounces -= 1;
        }

        // Check enemy collision
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.size / 2) {
            applyDamageToEnemy(e, p.damage);
            p.dx = (Math.random() - 0.5) * 2;
            p.dy = (Math.random() - 0.5) * 2;
            // Normalize direction
            const dLen = Math.hypot(p.dx, p.dy);
            p.dx /= dLen;
            p.dy /= dLen;

            p.bounces -= 1;
            if (p.bounces <= 0) return false;
          }
        }

        return p.life > 0;
      }

      if (p.type === "GUARDIAN") {
        // Orbit around the player
        p.angle += p.speed * (delta / 16.6);
        p.x = g.player.x + Math.cos(p.angle) * p.distance;
        p.y = g.player.y + Math.sin(p.angle) * p.distance;

        // Pulse collision check with enemies
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.size / 2) {
            // Push enemies outward strongly
            const pushAngle = Math.atan2(e.y - g.player.y, e.x - g.player.x);
            if (e.type !== "BOSS") {
              e.x += Math.cos(pushAngle) * 15;
              e.y += Math.sin(pushAngle) * 15;
            }
            if (Math.random() < 0.2) {
              applyDamageToEnemy(e, p.damage);
            }
          }
        }
        return true; // Stays alive indefinitely as controlled by wpn update
      }

      if (p.type === "MOLOTOV") {
        p.timer += delta;
        p.tickTimer += delta;

        // Deal pulse damage over time
        if (p.tickTimer >= 250) {
          p.tickTimer = 0;
          for (let i = 0; i < g.enemies.length; i++) {
            const e = g.enemies[i];
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < p.radius) {
              applyDamageToEnemy(e, p.damage);
            }
          }
        }

        return p.timer < p.duration;
      }

      if (p.type === "POOP") {
        p.timer += delta;
        p.tickTimer += delta;

        // Deal pulse damage over time
        if (p.tickTimer >= 250) {
          p.tickTimer = 0;
          for (let i = 0; i < g.enemies.length; i++) {
            const e = g.enemies[i];
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < p.radius + e.radius) {
              applyDamageToEnemy(e, p.damage);
            }
          }
        }

        return p.timer < p.duration;
      }

      if (p.type === "LIGHTNING") {
        p.timer -= delta;
        return p.timer > 0;
      }

      if (p.type === "LIGHTNING_CHAIN") {
        p.timer -= delta;
        return p.timer > 0;
      }

      return true;
    });
  };

  const updateEnemies = (delta: number) => {
    const g = gameState.current;

    g.enemies = g.enemies.filter((e: any) => {
      // Check death
      if (e.hp <= 0) {
        g.player.kills += 1;
        // Drop XP Gem
        spawnGem(e.x, e.y, e.type);

        if (!g.finalBossActive) {
          if (g.player.kills >= 2000 && !g.spawnedDashBoss) {
            g.spawnedDashBoss = true;
            spawnMiniBoss("DASH", true);
          } else if (g.player.kills >= 5000 && !g.spawnedBurstBoss) {
            g.spawnedBurstBoss = true;
            spawnMiniBoss("BURST", true);
          } else if (g.player.kills >= 7500 && !g.spawnedSlamBoss) {
            g.spawnedSlamBoss = true;
            spawnMiniBoss("SLAM", true);
          } else if (g.player.kills >= g.nextMiniBossKills) {
            spawnMiniBoss();
            g.nextMiniBossKills += g.miniBossKillIncrement;
            g.miniBossKillIncrement += 50;
          }
        }

        if (e.type === "BOSS") {
          g.bossDefeated = true;
          setBossHealth(null);
          g.particles.push(...createExplosion(e.x, e.y, "#eab308", 40));
          soundEngine.playBossAlert();
          // Spawn mega chest (Red Magnet powerup)
          g.gems.push({
            x: e.x,
            y: e.y,
            type: "CHEST",
            size: 14,
            pulse: 0,
          });
        }

        if (e.type === "MINI_BOSS") {
          g.particles.push(...createExplosion(e.x, e.y, e.color, 30));
          soundEngine.playLevelUp(); // play level up chime
          forceLevelUp(); // immediately level up 1 level!
          
          // Drop a gold bag on defeat
          g.gems.push({
            x: e.x,
            y: e.y,
            type: "GOLD_BAG",
            size: 12,
            pulse: 0,
          });
        }

        if (e.type === "FINAL_BOSS") {
          g.finalBossActive = false;
          g.finalBossDefeated = true;
          setBossHealth(null);
          g.particles.push(...createExplosion(e.x, e.y, "#fbbf24", 80));
          
          // Defeat reward: 2000 Gold!
          const ringLevel = g.equipmentReinforcements?.ring || 0;
          const goldMultiplier = 1.0 + ringLevel * 0.15;
          const goldReward = Math.floor(2000 * goldMultiplier);
          g.player.gold += goldReward;

          g.damageTexts.push({
            x: e.x,
            y: e.y - 15,
            text: `최종 보스 제압! +${goldReward.toLocaleString()}G`,
            color: "#fbbf24",
            size: 20,
            life: 2.5,
          });

          soundEngine.playLevelUp();
          endGame(true); // Victory!
          return false;
        }

        // Spark explosion
        g.particles.push(...createExplosion(e.x, e.y, e.color, 8));
        return false;
      }

      // Move toward player
      const dx = g.player.x - e.x;
      const dy = g.player.y - e.y;
      const dist = Math.hypot(dx, dy);

      // Handle custom movement pattern
      if (e.type === "MINI_BOSS") {
        if (e.patternType === "DASH") {
          // DASH Pattern: NORMAL -> CHARGING (stand still, charge) -> DASHING (move fast)
          if (e.state === "NORMAL") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            if (e.patternTimer >= 2200) {
              e.state = "CHARGING";
              e.patternTimer = 0;
              // Aim direction at player
              const angle = Math.atan2(dy, dx);
              e.dashDx = Math.cos(angle);
              e.dashDy = Math.sin(angle);
            }
            // Move normally
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          } else if (e.state === "CHARGING") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            if (e.patternTimer >= 1000) {
              e.state = "DASHING";
              e.patternTimer = 0;
            }
          } else if (e.state === "DASHING") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            // Move super fast
            e.x += e.dashDx * e.speed * 4.2 * (delta / 16.6);
            e.y += e.dashDy * e.speed * 4.2 * (delta / 16.6);
            if (e.patternTimer >= 700) {
              e.state = "NORMAL";
              e.patternTimer = 0;
            }
          }
        } else if (e.patternType === "BURST") {
          // BURST Pattern: Move normally + Shoot radial ring of purples
          e.shootTimer = (e.shootTimer || 0) + delta;
          if (e.shootTimer >= 2000) {
            e.shootTimer = 0;
            const numProjectiles = 12;
            for (let i = 0; i < numProjectiles; i++) {
              const angle = (i * Math.PI * 2) / numProjectiles;
              g.projectiles.push({
                type: "ACID_BALL",
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: 3.0,
                size: 9,
                damage: e.damage * 0.8,
                color: e.color, // Purple
                life: 3500,
              });
            }
          }
          // Move normally
          const angle = Math.atan2(dy, dx);
          e.x += Math.cos(angle) * e.speed * (delta / 16.6);
          e.y += Math.sin(angle) * e.speed * (delta / 16.6);
        } else if (e.patternType === "SLAM") {
          // SLAM Pattern: Move normally -> stand still to slam and release shockwave
          if (e.state === "NORMAL") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            if (e.patternTimer >= 3500) {
              e.state = "SLAM_PREP";
              e.patternTimer = 0;
            }
            // Move normally
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          } else if (e.state === "SLAM_PREP") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            if (e.patternTimer >= 1200) {
              e.state = "SLAM_RELEASE";
              e.patternTimer = 0;
              if (dist < 130) {
                g.player.hp -= e.damage * 1.5;
                g.screenShake = 8;
                if (g.player.hp <= 0) {
                  endGame(false);
                }
              }
              // Spawn cool visual particles in an expanding ring
              for (let i = 0; i < 24; i++) {
                const angle = (i * Math.PI * 2) / 24;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * 4.5,
                  dy: Math.sin(angle) * 4.5,
                  size: 4,
                  color: e.color, // Cyan shockwave
                  life: 0.6,
                  decay: 0.03,
                });
              }
            }
          } else if (e.state === "SLAM_RELEASE") {
            e.patternTimer = (e.patternTimer || 0) + delta;
            if (e.patternTimer >= 600) {
              e.state = "NORMAL";
              e.patternTimer = 0;
            }
          }
        }
      } else if (e.type === "FINAL_BOSS") {
        // FINAL BOSS combines patterns! It cycles every 4 seconds
        e.patternTimer = (e.patternTimer || 0) + delta;
        if (e.patternTimer >= 4000) {
          e.patternTimer = 0;
          e.currentPattern = ((e.currentPattern || 0) + 1) % 3;
          e.state = "NORMAL"; // reset state for new pattern
        }

        const pat = e.currentPattern || 0;
        if (pat === 0) {
          // DASH Mode
          if (e.state === "NORMAL") {
            e.shootTimer = (e.shootTimer || 0) + delta;
            if (e.shootTimer >= 1500) {
              e.state = "CHARGING";
              e.shootTimer = 0;
              const angle = Math.atan2(dy, dx);
              e.dashDx = Math.cos(angle);
              e.dashDy = Math.sin(angle);
            }
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          } else if (e.state === "CHARGING") {
            e.shootTimer = (e.shootTimer || 0) + delta;
            if (e.shootTimer >= 800) {
              e.state = "DASHING";
              e.shootTimer = 0;
            }
          } else if (e.state === "DASHING") {
            e.shootTimer = (e.shootTimer || 0) + delta;
            e.x += e.dashDx * e.speed * 4.5 * (delta / 16.6);
            e.y += e.dashDy * e.speed * 4.5 * (delta / 16.6);
            if (e.shootTimer >= 600) {
              e.state = "NORMAL";
              e.shootTimer = 0;
            }
          }
        } else if (pat === 1) {
          // SPIRAL BURST Mode
          e.shootTimer = (e.shootTimer || 0) + delta;
          if (e.shootTimer >= 350) {
            e.shootTimer = 0;
            e.spiralAngle = (e.spiralAngle || 0) + 0.4;
            for (let i = 0; i < 4; i++) {
              const angle = e.spiralAngle + (i * Math.PI) / 2;
              g.projectiles.push({
                type: "ACID_BALL",
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: 3.5,
                size: 11,
                damage: e.damage * 0.9,
                color: "#fbbf24", // Golden orange
                life: 4000,
              });
            }
          }
          const angle = Math.atan2(dy, dx);
          e.x += Math.cos(angle) * e.speed * (delta / 16.6);
          e.y += Math.sin(angle) * e.speed * (delta / 16.6);
        } else {
          // SHOCKWAVE SLAM Mode
          if (e.state === "NORMAL") {
            e.shootTimer = (e.shootTimer || 0) + delta;
            if (e.shootTimer >= 2000) {
              e.state = "SLAM_PREP";
              e.shootTimer = 0;
            }
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          } else if (e.state === "SLAM_PREP") {
            e.shootTimer = (e.shootTimer || 0) + delta;
            if (e.shootTimer >= 1000) {
              e.state = "NORMAL";
              e.shootTimer = 0;
              if (dist < 180) {
                g.player.hp -= e.damage * 1.8;
                g.screenShake = 12;
                if (g.player.hp <= 0) {
                  endGame(false);
                }
              }
              for (let i = 0; i < 36; i++) {
                const angle = (i * Math.PI * 2) / 36;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * 5.5,
                  dy: Math.sin(angle) * 5.5,
                  size: 5,
                  color: "#fbbf24",
                  life: 0.7,
                  decay: 0.02,
                });
              }
            }
          }
        }
      } else if (e.type === "SPITTER" && dist < 140) {
        // Spit acid ball projectiles!
        e.shootTimer = (e.shootTimer || 0) + delta;
        if (e.shootTimer >= 2000) {
          e.shootTimer = 0;
          const angle = Math.atan2(dy, dx);
          g.projectiles.push({
            type: "ACID_BALL",
            x: e.x,
            y: e.y,
            dx: Math.cos(angle),
            dy: Math.sin(angle),
            speed: 3.5,
            size: 8,
            damage: 15,
            color: "#84cc16", // Lime green
            life: 3000,
          });
        }
      } else {
        // Move forward
        const angle = Math.atan2(dy, dx);
        e.x += Math.cos(angle) * e.speed * (delta / 16.6);
        e.y += Math.sin(angle) * e.speed * (delta / 16.6);
      }

      // Deal damage to Player on collision
      if (dist < g.player.radius + e.radius) {
        g.player.hp -= e.damage * (delta / 1000); // Damage over time
        g.screenShake = 3;

        // Bleed particles
        if (Math.random() < 0.1) {
          g.particles.push({
            x: g.player.x,
            y: g.player.y,
            dx: (Math.random() - 0.5) * 3,
            dy: (Math.random() - 0.5) * 3,
            size: 3,
            color: "#f43f5e", // Blood red
            life: 0.5,
            decay: 0.05,
          });
        }

        if (g.player.hp <= 0) {
          endGame(false);
        }
      }

      return true;
    });

    // Sync Boss Health Bar with Priority Check
    const finalBoss = g.enemies.find((e: any) => e.type === "FINAL_BOSS");
    const normalBoss = g.enemies.find((e: any) => e.type === "BOSS");
    const miniBoss = g.enemies.find((e: any) => e.type === "MINI_BOSS");

    if (finalBoss) {
      setBossHealth({
        current: Math.max(0, finalBoss.hp),
        max: finalBoss.maxHp,
        name: "⚠️ 최종 보스: 오메가 디스트로이어 ⚠️",
      });
    } else if (normalBoss) {
      setBossHealth({
        current: Math.max(0, normalBoss.hp),
        max: normalBoss.maxHp,
        name: "무법 파괴대왕 메카 보스",
      });
    } else if (miniBoss) {
      setBossHealth({
        current: Math.max(0, miniBoss.hp),
        max: miniBoss.maxHp,
        name: miniBoss.name || "정예 미니 보스",
      });
    } else {
      setBossHealth(null);
    }

    // Update enemy acid spitters projectiles
    g.projectiles = g.projectiles.filter((p: any) => {
      if (p.type === "ACID_BALL") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        const dist = Math.hypot(g.player.x - p.x, g.player.y - p.y);
        if (dist < g.player.radius + p.size / 2) {
          g.player.hp -= p.damage;
          g.screenShake = 4;
          if (g.player.hp <= 0) {
            endGame(false);
          }
          return false;
        }

        return p.life > 0;
      }
      return true;
    });
  };

  const updateGems = () => {
    const g = gameState.current;

    g.gems = g.gems.filter((gem: any) => {
      const dx = g.player.x - gem.x;
      const dy = g.player.y - gem.y;
      const dist = Math.hypot(dx, dy);

      // Vacuum attract logic
      if (dist < g.player.magnetRadius) {
        gem.attracted = true;
      }

      if (gem.attracted) {
        // Move towards player with accelerating speed
        const angle = Math.atan2(dy, dx);
        gem.x += Math.cos(angle) * 8;
        gem.y += Math.sin(angle) * 8;
      }

      // Collect gem
      if (dist < g.player.radius + 6) {
        applyGemReward(gem);
        return false;
      }

      return true;
    });
  };

  const applyGemReward = (gem: any) => {
    const g = gameState.current;

    // "초반에 경험치를 많게 얻게 해줘" (Dynamic early game XP boost)
    // Base boost: 3x. Under level 10 or in the first 90s, make it 8x to level up extremely fast!
    const isEarly = g.player.level <= 10 || g.player.timeElapsed < 90;
    const xpMult = isEarly ? 8.5 : 3.5;

    // Gold gain multiplier from Ring Reinforcement
    const ringLevel = g.equipmentReinforcements?.ring || 0;
    const goldMultiplier = 1.0 + ringLevel * 0.15;

    if (gem.type === "XP_BLUE") {
      g.player.xp += Math.round(1 * xpMult);
    } else if (gem.type === "XP_YELLOW") {
      g.player.xp += Math.round(5 * xpMult);
    } else if (gem.type === "XP_RED") {
      g.player.xp += Math.round(20 * xpMult);
    } else if (gem.type === "MEAT") {
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.player.maxHp * 0.3); // Heal 30%
      g.damageTexts.push({
        x: g.player.x,
        y: g.player.y - 15,
        text: "+30% HP",
        color: "#10b981", // green heal
        size: 14,
        life: 0.9,
      });
    } else if (gem.type === "MAGNET") {
      // Pull ALL gems on screen
      g.gems.forEach((m: any) => (m.attracted = true));
    } else if (gem.type === "BOMB") {
      // Kill all normal enemies on screen
      g.enemies.forEach((e: any) => {
        if (e.type !== "BOSS") {
          applyDamageToEnemy(e, 999);
        }
      });
      g.screenShake = 15;
      soundEngine.playBomb();
    } else if (gem.type === "GOLD_BAG") {
      const goldAdded = Math.floor(50 * goldMultiplier);
      g.player.gold += goldAdded;
      g.damageTexts.push({
        x: g.player.x,
        y: g.player.y - 15,
        text: `+${goldAdded}G`,
        color: "#fbbf24",
        size: 12,
        life: 0.8,
      });
    } else if (gem.type === "CHEST") {
      // Mega evolution reward! Give heavy gold and 100% full recovery
      const goldAdded = Math.floor(300 * goldMultiplier);
      g.player.gold += goldAdded;
      g.player.hp = g.player.maxHp;
      g.gems.forEach((m: any) => (m.attracted = true));
      g.damageTexts.push({
        x: g.player.x,
        y: g.player.y - 15,
        text: `보스 제압 보상! 체력 완치 & +${goldAdded}G`,
        color: "#fbbf24", // gold glow
        size: 16,
        life: 1.5,
      });
    }

    if (soundEnabledRef.current) {
      soundEngine.playGem();
    }

    updateReactHUD();
  };

  const updateParticles = () => {
    const g = gameState.current;
    g.particles = g.particles.filter((p: any) => {
      p.x += p.dx;
      p.y += p.dy;
      p.life -= p.decay;
      return p.life > 0;
    });
  };

  const updateDamageTexts = () => {
    const g = gameState.current;
    g.damageTexts = g.damageTexts.filter((t: any) => {
      t.y -= 0.5; // Float upwards
      t.life -= 0.02;
      return t.life > 0;
    });
  };

  // --- SPAWN LOGICS ---

  const spawnEnemies = () => {
    const g = gameState.current;
    if (g.isEnded) return;

    // Pick a random spawning position just outside the view boundary
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(g.dimensions.width, g.dimensions.height) / 2 + 60;
    const sx = g.player.x + Math.cos(spawnAngle) * spawnDist;
    const sy = g.player.y + Math.sin(spawnAngle) * spawnDist;

    // Type selection based on game progress
    let type = "ZOMBIE";
    let color = "#10b981"; // Emerald green
    let speed = 1.2;
    let maxHp = 15 + Math.floor(g.player.timeElapsed * 1.5) + Math.floor(Math.pow(g.player.timeElapsed / 18, 1.8));
    let damage = 10 + Math.floor(g.player.timeElapsed * 0.4);
    let radius = 14;

    const r = Math.random();
    if (g.player.timeElapsed > 30 && r < 0.3) {
      type = "FAST_DOG";
      color = "#f43f5e"; // Rose pink
      speed = 2.2 + (g.player.timeElapsed * 0.002);
      maxHp = 10 + Math.floor(g.player.timeElapsed * 1.0) + Math.floor(Math.pow(g.player.timeElapsed / 22, 1.8));
      damage = 8 + Math.floor(g.player.timeElapsed * 0.3);
      radius = 11;
    } else if (g.player.timeElapsed > 45 && r > 0.8) {
      type = "SPITTER";
      color = "#a855f7"; // Purple
      speed = 0.9 + (g.player.timeElapsed * 0.001);
      maxHp = 30 + Math.floor(g.player.timeElapsed * 2.2) + Math.floor(Math.pow(g.player.timeElapsed / 15, 2.0));
      damage = 15 + Math.floor(g.player.timeElapsed * 0.5);
      radius = 16;
    } else if (g.player.timeElapsed > 80 && r > 0.65) {
      type = "ELITE_PIG";
      color = "#e11d48"; // Ruby red
      speed = 0.7 + (g.player.timeElapsed * 0.001);
      maxHp = 120 + Math.floor(g.player.timeElapsed * 5.0) + Math.floor(Math.pow(g.player.timeElapsed / 15, 2.2));
      damage = 30 + Math.floor(g.player.timeElapsed * 0.8);
      radius = 24;
    }

    g.enemies.push({
      type,
      x: sx,
      y: sy,
      hp: maxHp,
      maxHp,
      damage,
      speed,
      radius,
      color,
    });
  };

  const spawnBoss = () => {
    const g = gameState.current;
    g.bossSpawned = true;

    // Spawn warning / screenshake
    g.screenShake = 10;
    soundEngine.playBossAlert();

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(g.dimensions.width, g.dimensions.height) / 2 + 60;
    const bx = g.player.x + Math.cos(spawnAngle) * spawnDist;
    const by = g.player.y + Math.sin(spawnAngle) * spawnDist;

    const scaleFactor = Math.floor(g.player.timeElapsed / 60); // 1, 2, 3, etc.
    const bossHp = 1200 + Math.max(0, scaleFactor - 1) * 800;
    const bossDamage = 40 + Math.max(0, scaleFactor - 1) * 15;

    g.enemies.push({
      type: "BOSS",
      x: bx,
      y: by,
      hp: bossHp,
      maxHp: bossHp,
      damage: bossDamage,
      speed: 1.4,
      radius: 54,
      color: "#eab308", // Golden Yellow
      shootTimer: 0,
    });
  };

  const forceLevelUp = () => {
    const g = gameState.current;
    g.player.level += 1;
    g.player.maxXp = Math.floor(g.player.maxXp * 1.3) + 15;
    triggerLevelUpChoices();
    updateReactHUD();
  };

  const spawnMiniBoss = (forcedPattern?: "DASH" | "BURST" | "SLAM", isMilestone: boolean = false) => {
    const g = gameState.current;
    g.miniBossCount += 1;

    g.screenShake = 8;
    soundEngine.playBossAlert();

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(g.dimensions.width, g.dimensions.height) / 2 + 60;
    const bx = g.player.x + Math.cos(spawnAngle) * spawnDist;
    const by = g.player.y + Math.sin(spawnAngle) * spawnDist;

    // Pattern type: 0 = DASH, 1 = BURST, 2 = SLAM
    const patternIndex = g.miniBossCount % 3;
    let patternType: "DASH" | "BURST" | "SLAM" = forcedPattern || (patternIndex === 0 ? "DASH" : patternIndex === 1 ? "BURST" : "SLAM");
    
    let color = "#ec4899"; // pink
    let name = `정예 화염 돌진 미니보스 (${g.miniBossCount}호)`;
    let speed = 1.35;
    let radius = 42;
    let hp = isMilestone ? 15000 : (3000 + Math.floor(g.player.timeElapsed / 60) * 1500);
    let damage = 35 + Math.floor(g.player.timeElapsed / 60) * 5;

    if (patternType === "BURST") {
      color = "#a855f7"; // purple
      name = `정예 탄막 폭발 미니보스 (${g.miniBossCount}호)`;
      speed = 1.15;
      radius = 46;
      hp = isMilestone ? 25000 : (3000 + Math.floor(g.player.timeElapsed / 60) * 1500);
    } else if (patternType === "SLAM") {
      color = "#06b6d4"; // cyan
      name = `정예 충격파 미니보스 (${g.miniBossCount}호)`;
      speed = 1.05;
      radius = 52;
      hp = isMilestone ? 30000 : (3000 + Math.floor(g.player.timeElapsed / 60) * 1500);
    }

    if (isMilestone) {
      if (patternType === "DASH") {
        name = "🔥 정예 화염 돌진 엘리트 보스 [HP 15000] 🔥";
      } else if (patternType === "BURST") {
        name = "🌀 정예 탄막 폭발 엘리트 보스 [HP 25000] 🌀";
      } else if (patternType === "SLAM") {
        name = "⚡ 정예 충격파 슬램 엘리트 보스 [HP 30000] ⚡";
      }
    }

    g.enemies.push({
      type: "MINI_BOSS",
      patternType,
      state: "NORMAL",
      patternTimer: 0,
      shootTimer: 0,
      name,
      x: bx,
      y: by,
      hp,
      maxHp: hp,
      damage,
      speed,
      radius,
      color,
    });
  };

  const spawnFinalBoss = () => {
    const g = gameState.current;
    g.finalBossSpawned = true;
    g.finalBossActive = true;
    g.finalBossTimer = 180; // 3 minutes = 180 seconds

    g.screenShake = 15;
    soundEngine.playBossAlert();

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(g.dimensions.width, g.dimensions.height) / 2 + 80;
    const bx = g.player.x + Math.cos(spawnAngle) * spawnDist;
    const by = g.player.y + Math.sin(spawnAngle) * spawnDist;

    g.enemies.push({
      type: "FINAL_BOSS",
      x: bx,
      y: by,
      hp: 50000,
      maxHp: 50000,
      damage: 75,
      speed: 1.1,
      radius: 80,
      color: "#fbbf24", // Golden orange
      shootTimer: 0,
      patternTimer: 0,
      currentPattern: 0,
      name: "⚠️ 최종 보스: 오메가 디스트로이어 ⚠️",
    });
  };

  const spawnGem = (x: number, y: number, enemyType: string) => {
    const g = gameState.current;
    let type = "XP_BLUE";
    let size = 5;

    const r = Math.random();

    // Bigger drops for harder targets
    if (enemyType === "BOSS") {
      // Spawns chest handled directly on boss death
      return;
    } else if (enemyType === "ELITE_PIG") {
      type = "XP_RED";
      size = 8;
    } else if (enemyType === "SPITTER" || enemyType === "FAST_DOG") {
      type = r < 0.2 ? "XP_YELLOW" : "XP_BLUE";
      size = r < 0.2 ? 7 : 5;
    } else {
      // Normal zombies have a rare drop rate for items
      if (r < 0.02) {
        type = "MEAT";
        size = 10;
      } else if (r > 0.98) {
        type = "MAGNET";
        size = 10;
      } else if (r > 0.97 && r <= 0.98) {
        type = "BOMB";
        size = 10;
      } else if (r > 0.95 && r <= 0.97) {
        type = "GOLD_BAG";
        size = 9;
      } else {
        type = "XP_BLUE";
        size = 5;
      }
    }

    g.gems.push({
      x,
      y,
      type,
      size,
      pulse: 0,
      attracted: false,
    });
  };

  // End Game (Victory or Defeat)
  const endGame = (victory: boolean) => {
    const g = gameState.current;
    if (g.isEnded) return;
    g.isEnded = true;

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);

    if (victory) {
      soundEngine.playLevelUp();
    } else {
      soundEngine.playGameOver();
    }

    onGameOver({
      victory,
      timeSurvived: g.player.timeElapsed,
      kills: g.player.kills,
      levelReached: g.player.level,
      goldEarned: g.player.gold,
    });
  };

  // --- RENDER GAME CANVAS GRAPHICS ---

  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const g = gameState.current;

    // Apply screen shake offsets
    ctx.save();
    if (g.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * g.screenShake;
      const shakeY = (Math.random() - 0.5) * g.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Clear background
    ctx.fillStyle = "#0f172a"; // deep slate background
    ctx.fillRect(0, 0, g.dimensions.width, g.dimensions.height);

    // 2. Draw procedural tiling pattern (Grass / Tech ruins grid)
    // Draw repeated grid lines based on camera coordinates
    ctx.strokeStyle = "rgba(51, 65, 85, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 80;
    const startX = Math.floor(g.camera.x / gridSize) * gridSize;
    const startY = Math.floor(g.camera.y / gridSize) * gridSize;

    for (let x = startX - gridSize; x < startX + g.dimensions.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x - g.camera.x, 0);
      ctx.lineTo(x - g.camera.x, g.dimensions.height);
      ctx.stroke();
    }

    for (let y = startY - gridSize; y < startY + g.dimensions.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y - g.camera.y);
      ctx.lineTo(g.dimensions.width, y - g.camera.y);
      ctx.stroke();
    }

    // Draw little aesthetic dot markers on intersections
    ctx.fillStyle = "rgba(71, 85, 105, 0.4)";
    for (let x = startX - gridSize; x < startX + g.dimensions.width + gridSize; x += gridSize) {
      for (let y = startY - gridSize; y < startY + g.dimensions.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x - g.camera.x, y - g.camera.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Translate coordinates relative to camera for other in-game objects
    ctx.translate(-g.camera.x, -g.camera.y);

    // 3. Draw Molotov Fire zones first (so they are under enemies/player)
    g.projectiles.forEach((p: any) => {
      if (p.type === "MOLOTOV") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Fire border outline glow
        ctx.strokeStyle = p.color.replace("0.3", "0.7");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.95 + Math.sin(p.timer * 0.01) * 0.05), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (p.type === "POOP") {
        ctx.save();
        
        // Draw shadow underneath the poop
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.radius * 0.35, p.radius, p.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw stacked circles for poop look
        if (p.isRainbow) {
          const baseTime = Date.now() / 150;
          const hue1 = (baseTime * 40) % 360;
          const hue2 = (baseTime * 40 + 120) % 360;
          const hue3 = (baseTime * 40 + 240) % 360;

          ctx.lineWidth = 2.0;
          ctx.strokeStyle = "#ffffff";

          // Bottom layer
          ctx.fillStyle = `hsl(${hue1}, 95%, 60%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y + p.radius * 0.25, p.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Middle layer
          ctx.fillStyle = `hsl(${hue2}, 95%, 65%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.radius * 0.15, p.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Top layer
          ctx.fillStyle = `hsl(${hue3}, 95%, 70%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.radius * 0.45, p.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Sparkles around rainbow poop
          if (Math.random() < 0.1) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDist = p.radius * (0.6 + Math.random() * 0.5);
            ctx.arc(p.x + Math.cos(sparkAngle) * sparkDist, p.y + Math.sin(sparkAngle) * sparkDist, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          const brown1 = "#7c2d12"; // dark reddish brown
          const brown2 = "#9a3412"; // medium brown
          const brown3 = "#c2410c"; // light warm brown
          const outline = "#451a03"; // dark outline

          ctx.lineWidth = 1.8;
          ctx.strokeStyle = outline;

          // Bottom layer
          ctx.fillStyle = brown1;
          ctx.beginPath();
          ctx.arc(p.x, p.y + p.radius * 0.25, p.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Middle layer
          ctx.fillStyle = brown2;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.radius * 0.15, p.radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Top layer
          ctx.fillStyle = brown3;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.radius * 0.45, p.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }
    });

    // 4. Draw XP Gems
    g.gems.forEach((gem: any) => {
      ctx.save();
      // Glow pulse animation
      gem.pulse += 0.15;
      const sizeScale = 1 + Math.sin(gem.pulse) * 0.12;

      let color = "#38bdf8"; // default blue
      if (gem.type === "XP_YELLOW") color = "#eab308";
      if (gem.type === "XP_RED") color = "#f43f5e";
      if (gem.type === "MEAT") {
        // Red heart shape
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(gem.x - 3, gem.y - 3, 4, 0, Math.PI * 2);
        ctx.arc(gem.x + 3, gem.y - 3, 4, 0, Math.PI * 2);
        ctx.lineTo(gem.x, gem.y + 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }
      if (gem.type === "MAGNET") color = "#ec4899"; // Pink
      if (gem.type === "BOMB") color = "#ef4444"; // Red
      if (gem.type === "GOLD_BAG") color = "#facc15"; // Gold
      if (gem.type === "CHEST") {
        // Draw a neat pixel treasure chest!
        ctx.fillStyle = "#d97706";
        ctx.fillRect(gem.x - 8, gem.y - 5, 16, 10);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(gem.x - 8, gem.y - 5, 16, 4);
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(gem.x - 2, gem.y - 2, 4, 4); // Lock lock
        ctx.restore();
        return;
      }

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      // Draw diamond shape for standard gems
      ctx.moveTo(gem.x, gem.y - gem.size * sizeScale);
      ctx.lineTo(gem.x + gem.size * sizeScale, gem.y);
      ctx.lineTo(gem.x, gem.y + gem.size * sizeScale);
      ctx.lineTo(gem.x - gem.size * sizeScale, gem.y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // 5. Draw Enemies
    g.enemies.forEach((e: any) => {
      ctx.save();

      // Soft shadow under monster
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius - 2, e.radius * 0.9, e.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // If charging or preparing slam, draw warning radius and dash vector line
      if (e.state === "CHARGING" || e.state === "SLAM_PREP") {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 2 + Math.sin(Date.now() / 40) * 6, 0, Math.PI * 2);
        ctx.stroke();

        if (e.patternType === "DASH" && e.dashDx !== undefined) {
          ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
          ctx.lineWidth = 3.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + e.dashDx * 240, e.y + e.dashDy * 240);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      const isAnyBoss = e.type === "BOSS" || e.type === "MINI_BOSS" || e.type === "FINAL_BOSS";

      if (isAnyBoss) {
        ctx.save();
        
        // 1. Draw Outer Glowing Aura
        const pulse = Math.sin(Date.now() / 150) * 5;
        const auraRadius = e.radius * 1.45 + pulse;
        const auraGrd = ctx.createRadialGradient(e.x, e.y, e.radius * 0.8, e.x, e.y, auraRadius);
        
        let auraColorStart = "rgba(239, 68, 68, 0.4)"; // default red
        let auraColorEnd = "rgba(239, 68, 68, 0)";
        if (e.type === "FINAL_BOSS") {
          auraColorStart = "rgba(251, 191, 36, 0.5)"; // gold/yellow
          auraColorEnd = "rgba(239, 68, 68, 0)";
        } else if (e.type === "MINI_BOSS") {
          if (e.patternType === "BURST") {
            auraColorStart = "rgba(168, 85, 247, 0.45)"; // purple
            auraColorEnd = "rgba(168, 85, 247, 0)";
          } else if (e.patternType === "SLAM") {
            auraColorStart = "rgba(6, 182, 212, 0.45)"; // cyan
            auraColorEnd = "rgba(6, 182, 212, 0)";
          } else {
            auraColorStart = "rgba(236, 72, 153, 0.45)"; // pink
            auraColorEnd = "rgba(236, 72, 153, 0)";
          }
        } else if (e.type === "BOSS") {
          auraColorStart = "rgba(234, 179, 8, 0.45)"; // yellow
          auraColorEnd = "rgba(234, 179, 8, 0)";
        }

        auraGrd.addColorStop(0, auraColorStart);
        auraGrd.addColorStop(1, auraColorEnd);
        ctx.fillStyle = auraGrd;
        ctx.beginPath();
        ctx.arc(e.x, e.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw rotating spikes (flames/crown)
        const numSpikes = e.type === "FINAL_BOSS" ? 12 : 8;
        const rotationSpeed = e.type === "FINAL_BOSS" ? 0.0006 : 0.0012;
        const baseAngle = Date.now() * rotationSpeed;
        
        for (let i = 0; i < numSpikes; i++) {
          const angle = (i * Math.PI * 2) / numSpikes + baseAngle;
          const spikeLen = e.radius * (e.type === "FINAL_BOSS" ? 0.32 : 0.24);
          const spikeX1 = e.x + Math.cos(angle - 0.18) * e.radius;
          const spikeY1 = e.y + Math.sin(angle - 0.18) * e.radius;
          const spikeX2 = e.x + Math.cos(angle + 0.18) * e.radius;
          const spikeY2 = e.y + Math.sin(angle + 0.18) * e.radius;
          
          // Outer tip with dynamic breathing animation
          const tipDist = e.radius + spikeLen + Math.sin(Date.now() / 120 + i) * 3;
          const tipX = e.x + Math.cos(angle) * tipDist;
          const tipY = e.y + Math.sin(angle) * tipDist;

          ctx.fillStyle = e.color;
          ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(spikeX1, spikeY1);
          ctx.lineTo(tipX, tipY);
          ctx.lineTo(spikeX2, spikeY2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // 3. Spinning Outer Ring / Shield Orbits
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius + 10 + Math.sin(Date.now() / 100) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // For final boss, draw double spinning orbital shield rings & orbiting smaller crystals
        if (e.type === "FINAL_BOSS") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 12]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // 4 small spinning dark energy orbs around final boss
          const numOrbs = 4;
          const orbOrbitRadius = e.radius + 32;
          const orbAngleBase = Date.now() * 0.002;
          for (let j = 0; j < numOrbs; j++) {
            const orbAngle = (j * Math.PI * 2) / numOrbs + orbAngleBase;
            const orbX = e.x + Math.cos(orbAngle) * orbOrbitRadius;
            const orbY = e.y + Math.sin(orbAngle) * orbOrbitRadius;

            // Orb Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.arc(orbX, orbY + 4, 6, 0, Math.PI * 2);
            ctx.fill();

            // Orb Core
            ctx.fillStyle = "#ec4899"; // Dark pink energy crystal
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }

        // 4. Main Body Core (using a beautiful radial gradient to look 3D)
        const bodyGrd = ctx.createRadialGradient(
          e.x - e.radius * 0.2,
          e.y - e.radius * 0.2,
          e.radius * 0.1,
          e.x,
          e.y,
          e.radius
        );
        bodyGrd.addColorStop(0, "#ffffff"); // high-contrast shine
        bodyGrd.addColorStop(0.2, e.color);
        bodyGrd.addColorStop(1, "#0f172a"); // deep shadow edge

        ctx.fillStyle = bodyGrd;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outward thick stroke for high contrast
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // 5. Demonic Angry Eyes with Glowing trail
        // Angry Eyebrows
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        // Left Eyebrow
        ctx.beginPath();
        ctx.moveTo(e.x - e.radius * 0.45, e.y - e.radius * 0.38);
        ctx.lineTo(e.x - e.radius * 0.1, e.y - e.radius * 0.22);
        ctx.stroke();

        // Right Eyebrow
        ctx.beginPath();
        ctx.moveTo(e.x + e.radius * 0.45, e.y - e.radius * 0.38);
        ctx.lineTo(e.x + e.radius * 0.1, e.y - e.radius * 0.22);
        ctx.stroke();

        // Left glowing red/yellow eye
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.ellipse(e.x - e.radius * 0.26, e.y - e.radius * 0.15, e.radius * 0.16, e.radius * 0.08, -Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();

        // Right glowing red/yellow eye
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.ellipse(e.x + e.radius * 0.26, e.y - e.radius * 0.15, e.radius * 0.16, e.radius * 0.08, Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();

        // Eye Pupils (glowing white slits)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(e.x - e.radius * 0.26, e.y - e.radius * 0.15, e.radius * 0.04, e.radius * 0.08, -Math.PI / 10, 0, Math.PI * 2);
        ctx.ellipse(e.x + e.radius * 0.26, e.y - e.radius * 0.15, e.radius * 0.04, e.radius * 0.08, Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();

        // Demonic mouth (cruel grin)
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(e.x, e.y + e.radius * 0.25, e.radius * 0.25, 0, Math.PI, false);
        ctx.stroke();

        // Teeth inside the mouth for final boss
        if (e.type === "FINAL_BOSS") {
          ctx.fillStyle = "#ffffff";
          // Draw simple little sharp white triangles for teeth
          const drawTooth = (tx: number, ty: number, tSize: number, up: boolean) => {
            ctx.beginPath();
            ctx.moveTo(tx - tSize / 2, ty);
            ctx.lineTo(tx + tSize / 2, ty);
            ctx.lineTo(tx, up ? ty + tSize : ty - tSize);
            ctx.closePath();
            ctx.fill();
          };
          drawTooth(e.x - 8, e.y + e.radius * 0.25, 6, true);
          drawTooth(e.x + 8, e.y + e.radius * 0.25, 6, true);
        }

        ctx.restore();
      } else {
        // Draw shiny ring for elite bosses
        if (e.type === "MINI_BOSS" || e.type === "FINAL_BOSS") {
          ctx.strokeStyle = e.type === "FINAL_BOSS" ? "#fbbf24" : e.color;
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 7 + Math.sin(Date.now() / 80) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Body core
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outward stroke
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Angry Eyes representation
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(e.x - e.radius * 0.3, e.y - e.radius * 0.2, e.radius * 0.18, 0, Math.PI * 2);
        ctx.arc(e.x + e.radius * 0.3, e.y - e.radius * 0.2, e.radius * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(e.x - e.radius * 0.26, e.y - e.radius * 0.18, e.radius * 0.08, 0, Math.PI * 2);
        ctx.arc(e.x + e.radius * 0.34, e.y - e.radius * 0.18, e.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      // Health bar above hard/elite enemies
      if (e.hp < e.maxHp && e.type !== "BOSS" && e.type !== "FINAL_BOSS") {
        const barW = e.radius * 1.5;
        const barH = 3.5;
        const barX = e.x - barW / 2;
        const barY = e.y - e.radius - 7;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, barH);

        const fillW = Math.max(0, (e.hp / e.maxHp) * barW);
        ctx.fillStyle = "#ef4444"; // red health
        ctx.fillRect(barX, barY, fillW, barH);
      }

      ctx.restore();
    });

    // 6. Draw Player
    ctx.save();
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(g.player.x, g.player.y + g.player.radius - 2, g.player.radius * 0.9, g.player.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#10b981"; // Emerald agent
    ctx.beginPath();
    ctx.arc(g.player.x, g.player.y, g.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Cool neon outline
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cute tactical visor!
    ctx.fillStyle = "#38bdf8"; // sky blue shield visor
    ctx.fillRect(g.player.x - 11, g.player.y - 7, 22, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(g.player.x - 9, g.player.y - 7, 5, 2); // visor glare

    // Body armor badge
    ctx.fillStyle = "#fbbf24"; // golden badge
    ctx.beginPath();
    ctx.moveTo(g.player.x, g.player.y + 2);
    ctx.lineTo(g.player.x + 3, g.player.y + 6);
    ctx.lineTo(g.player.x - 3, g.player.y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 7. Draw Projectiles
    g.projectiles.forEach((p: any) => {
      ctx.save();

      if (p.type === "KUNAI") {
        ctx.translate(p.x, p.y);
        const angle = Math.atan2(p.dy, p.dx);
        ctx.rotate(angle);

        // Shuriken / spirit spin if evolved
        if (p.piercing > 10) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          // Draw spinning star
          for (let i = 0; i < 4; i++) {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, p.size);
            ctx.rotate(Math.PI / 2);
          }
          ctx.stroke();
        } else {
          // Standard Kunai spike
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(p.size, 0);
          ctx.lineTo(-p.size / 2, -p.size / 2);
          ctx.lineTo(-p.size / 4, 0);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (p.type === "SOCCER_BALL") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.005); // constant spin based on age

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw hexagon patterns for soccer ball
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (p.type === "GUARDIAN") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * 12); // extremely fast self rotation!

        // Outer spinning barrier
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Inside lines / fan blades representation
        ctx.fillStyle = p.color;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-2, -p.size / 2, 4, p.size);
          ctx.rotate(Math.PI / 4);
        }
      }

      if (p.type === "LIGHTNING") {
        // Vertical strike
        ctx.strokeStyle = p.isEvo ? "#f59e0b" : "#facc15";
        ctx.lineWidth = 4;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 180);
        ctx.lineTo(p.x - 12, p.y - 90);
        ctx.lineTo(p.x + 8, p.y - 45);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Ground burst indicator
        ctx.fillStyle = "rgba(253, 224, 71, 0.15)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.type === "LIGHTNING_CHAIN") {
        // Strike path connecting chain points
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo((p.sx + p.tx) / 2 + (Math.random() - 0.5) * 20, (p.sy + p.ty) / 2 + (Math.random() - 0.5) * 20);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
      }

      if (p.type === "GATLING") {
        ctx.translate(p.x, p.y);
        const angle = Math.atan2(p.dy, p.dx);
        ctx.rotate(angle);

        ctx.strokeStyle = p.isEvo ? "#fbbf24" : "#facc15";
        ctx.lineWidth = p.isEvo ? 4 : 2;
        ctx.shadowColor = p.isEvo ? "#f59e0b" : "#fbbf24";
        ctx.shadowBlur = p.isEvo ? 10 : 5;
        
        ctx.beginPath();
        ctx.moveTo(-p.size * 2, 0);
        ctx.lineTo(p.size, 0);
        ctx.stroke();

        if (p.isEvo) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.size, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (p.type === "ACID_BALL") {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 8. Draw Particles
    g.particles.forEach((p: any) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 9. Draw Floating Damage/Text Indicators
    g.damageTexts.forEach((t: any) => {
      ctx.save();
      ctx.fillStyle = t.color;
      ctx.globalAlpha = t.life;
      ctx.font = `bold ${t.size}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    ctx.restore(); // Restore shake offset
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-none select-none" />

      {/* Final Boss Countdown Timer */}
      {finalBossTimeLeft !== null && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-rose-950/95 border border-rose-500/40 px-4 py-1.5 rounded-full text-xs font-black text-rose-200 tracking-wider shadow-lg animate-pulse flex items-center space-x-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>최종보스 처치 제한시간: {Math.floor(finalBossTimeLeft / 60)}분 {(finalBossTimeLeft % 60).toString().padStart(2, "0")}초</span>
        </div>
      )}

      {/* Top HUD: Time, Kills, XP progress bar */}
      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none select-none font-sans flex flex-col space-y-2">
        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-full flex p-0.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 shadow-md transition-all duration-100"
            style={{ width: `${(inGameXP / inGameMaxXP) * 100}%` }}
          />
        </div>

        {/* Info row */}
        <div className="flex justify-between items-center text-white bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/20 backdrop-blur-sm shadow-md">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest">대원 레벨</span>
            <span className="text-sm font-extrabold text-sky-400 font-mono">Lv.{inGameLevel}</span>
          </div>

          {/* Time Timer */}
          <div className="text-base font-black text-white font-mono tracking-wide flex flex-col items-center">
            <span>
              {Math.floor(inGameTime / 60).toString().padStart(2, "0")}:
              {(inGameTime % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {/* Real-time gold counter */}
          <div className="flex items-center space-x-1 font-mono text-amber-400 font-bold text-xs bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
            <span className="text-[10px] text-amber-300">₩</span>
            <span>{inGameGold.toLocaleString()}</span>
          </div>

          {/* Kill Count */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest">처치 수</span>
            <span className="text-sm font-black text-red-400 font-mono">
              {inGameKills.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Gear Reinforcement Trigger Button */}
      <div className="absolute bottom-24 right-4 z-30 pointer-events-auto">
        <button
          onClick={() => {
            soundEngine.playUpgradeSelect();
            setShowReinforceModal(true);
          }}
          className="relative group bg-gradient-to-br from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 p-2.5 rounded-2xl font-extrabold text-[10px] tracking-wider shadow-lg shadow-amber-950/40 border border-amber-300/30 transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center space-y-1 w-14 h-14"
        >
          <Wrench className="w-5 h-5 text-slate-950 animate-bounce" />
          <span className="text-[8px] font-black tracking-tighter">장비 강화</span>
        </button>
      </div>

      {/* Bottom Floating Health bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-xs px-4">
        <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/30 backdrop-blur-md shadow-2xl flex flex-col space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold">
            <span>대원 생존 체력</span>
            <span className="font-mono text-emerald-400">
              {inGameHP} / {inGameMaxHP}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 flex">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                inGameHP < inGameMaxHP * 0.3
                  ? "bg-rose-500 animate-pulse"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-400"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (inGameHP / inGameMaxHP) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOSS HEALTH INDICATOR BAR (shown on screen top-center if boss is active) */}
      {bossHealth && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-lg px-4 animate-scale-up">
          <div className="bg-slate-950/90 border border-red-500/40 p-3 rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.25)] flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-xs text-red-200 font-extrabold tracking-wide">
              <span className="flex items-center space-x-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1" />
                <span>{bossHealth.name}</span>
              </span>
              <span className="font-mono text-sm bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-lg text-red-400 font-black">
                {bossHealth.current.toLocaleString()} / {bossHealth.max.toLocaleString()}
              </span>
            </div>
            <div className="relative w-full h-3.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5 flex">
              {/* Slow-catchup trailing damage bar */}
              <div
                className="absolute top-0.5 left-0.5 bottom-0.5 rounded-full bg-red-400/40 transition-all duration-500 ease-out"
                style={{ width: `calc(${(bossHealth.current / bossHealth.max) * 100}% - 4px)` }}
              />
              {/* Main health bar */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-100 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                style={{ width: `${(bossHealth.current / bossHealth.max) * 100}%` }}
              />
            </div>
            {/* Health Percentage indicator */}
            <div className="flex justify-center">
              <span className="text-[10px] text-red-400/80 font-mono font-bold tracking-widest uppercase">
                HEALTH CAPACITY: {Math.max(0, Math.ceil((bossHealth.current / bossHealth.max) * 100))}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: In-Game Gear Reinforcement Research Lab */}
      {showReinforceModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col justify-center items-center z-45 p-4 animate-fade-in select-none">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 w-full max-w-sm flex flex-col max-h-[85vh] shadow-2xl relative overflow-hidden">
            {/* Header decor */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-teal-500" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 mt-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black text-white">특공대 실시간 장비 강화</h3>
                  <p className="text-[9px] text-slate-400">전투 중 획득한 골드로 무장 강화</p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playUpgradeSelect();
                  setShowReinforceModal(false);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-750 flex items-center justify-center text-slate-400 hover:text-white transition-all pointer-events-auto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* In-game Gold display */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex justify-between items-center mb-3 text-left">
              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>보유 작전 골드</span>
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                ₩ {inGameGold.toLocaleString()}
              </span>
            </div>

            {/* Reinforcement Slots List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar pointer-events-auto">
              {[
                {
                  id: "weapon" as const,
                  name: "전술 무기 강화",
                  desc: "모든 무기의 공격력을 증폭시킵니다.",
                  effect: (lvl: number) => `공격력 +${lvl * 8}%`,
                  nextEffect: (lvl: number) => `공격력 +${(lvl + 1) * 8}%`,
                  icon: <Sword className="w-3.5 h-3.5 text-rose-400" />,
                  color: "border-rose-950/20 bg-rose-950/5",
                },
                {
                  id: "armor" as const,
                  name: "특공 방탄복 주입",
                  desc: "최대 체력을 증가시키고 체력을 회복합니다.",
                  effect: (lvl: number) => `최대 HP +${lvl * 10}%`,
                  nextEffect: (lvl: number) => `최대 HP +${(lvl + 1) * 10}%`,
                  icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
                  color: "border-emerald-950/20 bg-emerald-950/5",
                },
                {
                  id: "boots" as const,
                  name: "전투 신발 튜닝",
                  desc: "작전 대원의 이동 속도를 보완합니다.",
                  effect: (lvl: number) => `이동속도 +${lvl * 4}%`,
                  nextEffect: (lvl: number) => `이동속도 +${(lvl + 1) * 4}%`,
                  icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
                  color: "border-sky-950/20 bg-sky-950/5",
                },
                {
                  id: "magnet" as const,
                  name: "정보기 자석 최적화",
                  desc: "경험치 보석 획득 범위를 대폭 넓힙니다.",
                  effect: (lvl: number) => `자석 범위 +${lvl * 12}%`,
                  nextEffect: (lvl: number) => `자석 범위 +${(lvl + 1) * 12}%`,
                  icon: <Compass className="w-3.5 h-3.5 text-violet-400" />,
                  color: "border-violet-950/20 bg-violet-950/5",
                },
                {
                  id: "watch" as const,
                  name: "정밀 칩셋 과부하",
                  desc: "모든 무기의 공격 대기 시간을 단축합니다.",
                  effect: (lvl: number) => `공격 쿨타임 -${lvl * 4}%`,
                  nextEffect: (lvl: number) => `공격 쿨타임 -${(lvl + 1) * 4}%`,
                  icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
                  color: "border-amber-950/20 bg-amber-950/5",
                },
                {
                  id: "ring" as const,
                  name: "행운의 장치 동조",
                  desc: "보석/시간 보상 골드 획득량을 증가시킵니다.",
                  effect: (lvl: number) => `골드 획득량 +${lvl * 15}%`,
                  nextEffect: (lvl: number) => `골드 획득량 +${(lvl + 1) * 15}%`,
                  icon: <Coins className="w-3.5 h-3.5 text-yellow-400" />,
                  color: "border-yellow-950/20 bg-yellow-950/5",
                },
              ].map((info) => {
                const level = reinforcements[info.id];
                const isMax = level >= 5;
                const cost = (level + 1) * 75;
                const canAfford = inGameGold >= cost;

                return (
                  <div
                    key={info.id}
                    className={`p-2.5 rounded-xl border ${info.color} flex flex-col space-y-1.5 text-left`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-2">
                        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                          {info.icon}
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-white flex items-center space-x-1.5">
                            <span>{info.name}</span>
                            <span className="text-[8px] text-amber-400 font-extrabold font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                              Lv.{level}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{info.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex space-x-1 h-1 bg-slate-950 rounded-full overflow-hidden p-0.5">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 rounded-full ${
                            step <= level
                              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                              : "bg-slate-850"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Footer Button / Effect Preview */}
                    <div className="flex justify-between items-center pt-0.5">
                      <div className="text-[9px] font-bold text-emerald-400">
                        {isMax ? (
                          <span>최대: {info.effect(level)}</span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <span>{info.effect(level)}</span>
                            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
                            <span className="text-amber-300">{info.nextEffect(level)}</span>
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isMax || !canAfford}
                        onClick={() => handleUpgradeReinforcement(info.id)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center space-x-1 active:scale-95 ${
                          isMax
                            ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                            : canAfford
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-950/20"
                            : "bg-slate-800 text-slate-400 border border-slate-750 cursor-not-allowed"
                        }`}
                      >
                        {isMax ? (
                          <span>MAX</span>
                        ) : (
                          <>
                            <span className="w-3 h-3 rounded-full bg-slate-950/10 flex items-center justify-center font-bold text-[7px] text-slate-950">
                              ₩
                            </span>
                            <span>{cost}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                soundEngine.playUpgradeSelect();
                setShowReinforceModal(false);
              }}
              className="mt-3 w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 py-2.5 rounded-xl font-extrabold text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-emerald-950/20 flex items-center justify-center space-x-1.5 pointer-events-auto"
            >
              <span>전투 영역 복귀</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
