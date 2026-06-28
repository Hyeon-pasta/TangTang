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
  equippedWeapons: { id: WeaponType; level: number; isEvo: boolean }[];
  setEquippedWeapons: React.Dispatch<React.SetStateAction<{ id: WeaponType; level: number; isEvo: boolean }[]>>;
  equippedPassives: { id: PassiveType; level: number }[];
  setEquippedPassives: React.Dispatch<React.SetStateAction<{ id: PassiveType; level: number }[]>>;
}

const drawZombieHead = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, isDark: boolean) => {
  ctx.save();

  // Determine colors based on isDark state
  const baseGreen = isDark ? "#2f3e23" : "#8ac959"; // main head color (funny light green)
  const darkGreen = isDark ? "#1f2a17" : "#5d9632"; // shadow and outline color
  const mouthInside = isDark ? "#1f0909" : "#450a0a"; // dark red inside mouth
  const toothColor = isDark ? "#78716c" : "#fef08a";  // yellowish teeth
  const scarColor = isDark ? "#1f2937" : "#78350f";   // stitched scar color

  // 1. DRAW EARS (Left and Right)
  // Left ear
  ctx.fillStyle = baseGreen;
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.arc(x - radius * 1.0, y, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left ear inner detail
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.04;
  ctx.beginPath();
  ctx.arc(x - radius * 1.0, y, radius * 0.08, 0, Math.PI, false);
  ctx.stroke();

  // Right ear
  ctx.fillStyle = baseGreen;
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.arc(x + radius * 1.0, y, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right ear inner detail
  ctx.beginPath();
  ctx.arc(x + radius * 1.0, y, radius * 0.08, 0, Math.PI, false);
  ctx.stroke();

  // 2. DRAW MAIN HEAD BODY
  ctx.fillStyle = baseGreen;
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. FOREHEAD SPOTS & WRINKLES
  // Draw 3 subtle spots on top right
  ctx.fillStyle = darkGreen;
  ctx.beginPath();
  ctx.arc(x + radius * 0.45, y - radius * 0.65, radius * 0.06, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.58, y - radius * 0.6, radius * 0.05, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.5, y - radius * 0.5, radius * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // 4. FOREHEAD STITCHED SCAR (top-left)
  ctx.strokeStyle = scarColor;
  ctx.lineWidth = radius * 0.06;
  ctx.lineCap = "round";
  ctx.beginPath();
  // Curved scar line
  ctx.arc(x - radius * 0.35, y - radius * 0.5, radius * 0.3, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Stitch marks crossing the scar
  ctx.lineWidth = radius * 0.04;
  const numStitches = 4;
  for (let i = 0; i < numStitches; i++) {
    const t = i / (numStitches - 1);
    // Interpolate along the curve of the scar (from left to right)
    const angle = Math.PI * 1.2 + (Math.PI * 0.6) * t;
    const sx = x - radius * 0.35 + Math.cos(angle) * radius * 0.3;
    const sy = y - radius * 0.5 + Math.sin(angle) * radius * 0.3;
    // Perpendicular vector for the stitch cross line
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(sx - px * radius * 0.08, sy - py * radius * 0.08);
    ctx.lineTo(sx + px * radius * 0.08, sy + py * radius * 0.08);
    ctx.stroke();
  }

  // Forehead furrow line (brow wrinkle in middle)
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.04;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.2, y - radius * 0.35);
  ctx.quadraticCurveTo(x, y - radius * 0.42, x + radius * 0.2, y - radius * 0.35);
  ctx.stroke();

  // 5. EYES
  // Left eye (Goofy, round)
  const eyeOutlineColor = isDark ? "#111827" : "#2d4a1a";
  ctx.fillStyle = isDark ? "#4b5563" : "#ffffff";
  ctx.strokeStyle = eyeOutlineColor;
  ctx.lineWidth = radius * 0.07;
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.1, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right eye (Crazy bulging, larger)
  ctx.beginPath();
  ctx.arc(x + radius * 0.3, y - radius * 0.1, radius * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils
  ctx.fillStyle = isDark ? "#111827" : "#1e1b4b"; // almost black
  ctx.beginPath();
  // Left pupil (looking down and left)
  ctx.arc(x - radius * 0.34, y - radius * 0.07, radius * 0.06, 0, Math.PI * 2);
  // Right pupil (looking top and right)
  ctx.arc(x + radius * 0.38, y - radius * 0.15, radius * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // 6. NOSE
  ctx.fillStyle = darkGreen;
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.05, y + radius * 0.08, radius * 0.03, radius * 0.06, -Math.PI / 12, 0, Math.PI * 2);
  ctx.ellipse(x + radius * 0.05, y + radius * 0.08, radius * 0.03, radius * 0.06, Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // 7. SMILE & TEETH
  // Draw open mouth path (crescent smile)
  ctx.fillStyle = mouthInside;
  ctx.strokeStyle = eyeOutlineColor;
  ctx.lineWidth = radius * 0.07;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.58, y + radius * 0.15);
  // Top lip curve
  ctx.quadraticCurveTo(x, y + radius * 0.26, x + radius * 0.58, y + radius * 0.15);
  // Bottom lip curve
  ctx.quadraticCurveTo(x, y + radius * 0.65, x - radius * 0.58, y + radius * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cheek lines / expression wrinkles at corner of mouth
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = radius * 0.04;
  ctx.beginPath();
  ctx.arc(x - radius * 0.58, y + radius * 0.15, radius * 0.08, Math.PI * 0.8, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + radius * 0.58, y + radius * 0.15, radius * 0.08, Math.PI * 1.4, Math.PI * 2.2);
  ctx.stroke();

  // Crooked Yellowish Teeth
  ctx.fillStyle = toothColor;
  ctx.strokeStyle = eyeOutlineColor;
  ctx.lineWidth = radius * 0.03;

  // Helper to draw a small rectangular tooth
  const drawZombieTooth = (tx: number, ty: number, tw: number, th: number, angleRad: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angleRad);
    ctx.beginPath();
    ctx.rect(-tw / 2, 0, tw, th);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // Upper Teeth (hanging down)
  // Left upper tooth (crooked, hanging from top lip)
  drawZombieTooth(x - radius * 0.22, y + radius * 0.21, radius * 0.1, radius * 0.08, Math.PI / 18);
  // Right upper tooth (crooked, hanging from top lip)
  drawZombieTooth(x + radius * 0.25, y + radius * 0.21, radius * 0.09, radius * 0.08, -Math.PI / 12);

  // Lower Teeth (pointing up)
  // Left lower tooth
  drawZombieTooth(x - radius * 0.35, y + radius * 0.38, radius * 0.08, -radius * 0.07, -Math.PI / 12);
  // Middle lower tooth
  drawZombieTooth(x - radius * 0.02, y + radius * 0.45, radius * 0.09, -radius * 0.09, Math.PI / 24);
  // Right lower tooth
  drawZombieTooth(x + radius * 0.32, y + radius * 0.40, radius * 0.08, -radius * 0.07, Math.PI / 18);

  ctx.restore();
};

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
  equippedWeapons,
  setEquippedWeapons,
  equippedPassives,
  setEquippedPassives,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // In-game states mirrored for UI Overlay
  const [inGameLevel, setInGameLevel] = useState(1);
  const [inGameXP, setInGameXP] = useState(0);
  const [inGameMaxXP, setInGameMaxXP] = useState(30);
  const [inGameHP, setInGameHP] = useState(100);
  const [inGameMaxHP, setInGameMaxHP] = useState(100);
  const [inGameShield, setInGameShield] = useState(100);
  const [inGameMaxShield, setInGameMaxShield] = useState(100);
  const [inGameKills, setInGameKills] = useState(0);
  const [inGameTime, setInGameTime] = useState(0);
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

  // Developer mode helper to detect AI Studio environment
  const isDevEnv =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("ais-dev-") ||
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1") ||
      (import.meta as any).env?.DEV);

  const [showDevPanel, setShowDevPanel] = useState(false);
  const [isGodModeState, setIsGodModeState] = useState(false);
  const [isLevelLocked, setIsLevelLocked] = useState(false);
  const [isNormalSpawnsDisabled, setIsNormalSpawnsDisabled] = useState(false);

  // Core Game State Variables (held in refs for high-frequency canvas access without re-renders)
  const gameState = useRef({
    player: {
      x: 0,
      y: 0,
      radius: 18,
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      lastDamageTime: 0,
      baseSpeed: 2.8,
      speedMultiplier: 1.0,
      atkMultiplier: 1.0,
      magnetRadius: 70,
      cooldownMultiplier: 1.0,
      xpMultiplier: 1.0,
      level: 1,
      xp: 0,
      maxXp: 30,
      kills: 0,
      gold: 0,
      timeElapsed: 0,
      isGodMode: false,
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
    camera: { x: 0, y: 0, zoom: 1.0 },
    cinematic: null as any,
    levelLock: false,
    disableNormalSpawns: false,
    dimensions: { width: 400, height: 600 },
    activeWeaponEvolutions: {} as Record<WeaponType, boolean>,
    nextBossSpawnTime: 60,
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
        shield: 100,
        maxShield: 100,
        lastDamageTime: 0,
        baseSpeed: 2.8 * playerSpeedMod,
        speedMultiplier: 1.0,
        atkMultiplier: playerAtkMod,
        magnetRadius: playerMagnetMod,
        cooldownMultiplier: 1.0,
        xpMultiplier: 1.0,
        level: 1,
        xp: 0,
        maxXp: 30,
        kills: 0,
        gold: 0,
        timeElapsed: 0,
        isGodMode: isGodModeState,
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
      camera: { x: 0, y: 0, zoom: 1.0 },
      cinematic: null as any,
      levelLock: isLevelLocked,
      disableNormalSpawns: isNormalSpawnsDisabled,
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
      nextBossSpawnTime: 60,
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
    const xpLvl = g.skills.passives[PassiveType.XP_BOOST]?.level || 0;

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
    g.player.xpMultiplier = 1.0 + xpLvl * 0.2;

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
    setInGameShield(Math.max(0, Math.ceil(g.player.shield)));
    setInGameMaxShield(Math.ceil(g.player.maxShield));
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
      { id: WeaponType.BOOMERANG, name: "부메랑", desc: "회전하며 날아간 뒤 플레이어에게 돌아오는 강철 부메랑을 던져 왕복 대미지를 줍니다." },
    ];

    // Passive list
    const passivePool = [
      { id: PassiveType.ATTACK_BOOST, name: "특공 강화 탄환", desc: "모든 무기의 공격력 대미지를 10% 증가시킵니다." },
      { id: PassiveType.MAGNET, name: "강력 전자기석", desc: "아이템 및 XP 획득 범위를 20% 늘려줍니다." },
      { id: PassiveType.SPEED_BOOST, name: "특수 러닝 슈즈", desc: "대원의 이동 속도를 10% 빠르게 합니다." },
      { id: PassiveType.HP_BOOST, name: "방탄 세라믹 슈트", desc: "최대 체력을 10% 늘리고 즉시 20%를 회복합니다." },
      { id: PassiveType.COOLDOWN_REDUCE, name: "에너지 드링크", desc: "모든 무기의 공격 주기 쿨타임을 8% 단축시킵니다." },
      { id: PassiveType.XP_BOOST, name: "고성능 학습 장치", desc: "획득하는 모든 경험치(XP) 양을 20% 증가시킵니다." },
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
      },
      {
        w: WeaponType.BOOMERANG,
        p: PassiveType.XP_BOOST,
        name: "초공간 톱니바퀴",
        desc: "차원을 가르는 거대한 플라즈마 톱니바퀴. 사방으로 뻗어나가며 적들을 무한히 관통하고 찢어발깁니다.",
      },
      {
        w: WeaponType.EXCALIBUR,
        p: PassiveType.ATTACK_BOOST,
        name: "진·신성제국 성검 엑스칼리버",
        desc: "신의 심판이 도래합니다. 전 영역에 신성한 거대 성검들이 끊임없이 내리꽂혀 화면의 모든 적들을 성멸시킵니다.",
      },
      {
        w: WeaponType.BLACK_HOLE,
        p: PassiveType.MAGNET,
        name: "이차원 붕괴 퀘이사",
        desc: "특이점 제어의 끝판왕. 화면 전체의 적들을 한순간에 중심으로 빨아들여 대형 퀘이사 소용돌이로 산산조각 냅니다.",
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
          isLegendary: pair.w === WeaponType.GATLING || pair.w === WeaponType.EXCALIBUR || pair.w === WeaponType.BLACK_HOLE,
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

    // Handle Legendary Weapon Draft & Upgrades (GATLING, EXCALIBUR, BLACK_HOLE)
    const legendaryPool = [
      { id: WeaponType.GATLING, name: "전설의 개틀링건 (보급)", desc: "[초희귀 전설 무기] 전방의 모든 적들을 초고속으로 관통 및 찢어발기는 화포 탄막을 대량 사격합니다." },
      { id: WeaponType.EXCALIBUR, name: "전설의 성검 엑스칼리버 (보급)", desc: "[초희귀 전설 무기] 하늘에서 거대한 영웅의 성검들이 쏟아져 내려 대지를 가르고 신성한 파동을 뿜어냅니다." },
      { id: WeaponType.BLACK_HOLE, name: "초중력 블랙홀 포 (보급)", desc: "[초희귀 전설 무기] 압축 차원 특이점을 발사해 주변 몬스터를 중심부로 강제 흡입하고 암흑 피해를 줍니다." },
    ];

    legendaryPool.forEach((leg) => {
      const legData = currentWeapons[leg.id];
      const canDraft = !!legData || (Math.random() < 0.32);
      if (canDraft) {
        if (!legData) {
          if (Object.keys(currentWeapons).length < 6) {
            cards.push({
              id: `new-${leg.id}`,
              name: leg.name,
              description: leg.desc,
              type: "weapon",
              skillId: leg.id,
              level: 1,
              icon: leg.id,
              isEvo: false,
              isLegendary: true,
            });
          }
        } else if (legData.level < 5 && !legData.isEvo) {
          cards.push({
            id: `up-${leg.id}`,
            name: `${leg.name.replace(' (보급)', '')} 튜닝 강화`,
            description: `위력, 발사 개수, 효과 범위 및 쿨타임 단축이 극한으로 증폭됩니다. (다음 레벨: ${legData.level + 1})`,
            type: "weapon",
            skillId: leg.id,
            level: legData.level + 1,
            icon: leg.id,
            isEvo: false,
            isLegendary: true,
          });
        }
      }
    });

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
    if (g.levelLock) {
      if (g.player.xp >= g.player.maxXp) {
        g.player.xp = g.player.maxXp - 1;
        updateReactHUD();
      }
      return;
    }
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

      if (!isPaused && !showReinforceModal && !showDevPanel && !gameState.current.isLevelingUp && !gameState.current.isEnded) {
        updateGame(delta);
      }

      renderGame(ctx);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPaused, showReinforceModal, showDevPanel]);

  const damagePlayer = (amount: number) => {
    const g = gameState.current;
    if (g.player.isGodMode || g.cinematic || g.isEnded) return;

    g.player.lastDamageTime = Date.now();

    // Shield check
    if (g.player.shield > 0) {
      if (g.player.shield >= amount) {
        g.player.shield -= amount;
        amount = 0;
      } else {
        amount -= g.player.shield;
        g.player.shield = 0;
      }
    }

    if (amount > 0) {
      g.player.hp -= amount;
      if (g.player.hp <= 0) {
        g.player.hp = 0;
        g.cinematic = {
          type: "player_death",
          timer: 1800,
          maxTimer: 1800,
        };
        soundEngine.playGameOver();
      }
    }
    updateReactHUD();
  };

  // Main update physics
  const updateGame = (delta: number) => {
    const g = gameState.current;

    // Apply God Mode protection
    if (g.player.isGodMode) {
      g.player.hp = g.player.maxHp;
    }

    // Shield regeneration check (10 seconds no damage)
    if (g.player.shield < g.player.maxShield) {
      if (Date.now() - (g.player.lastDamageTime || 0) >= 10000) {
        g.player.shield = Math.min(g.player.maxShield, g.player.shield + g.player.maxShield * (delta / 2000));
        updateReactHUD();
      }
    }

    // Cinematic updates (Timeout / Victory for Final Boss)
    if (g.cinematic) {
      g.cinematic.timer -= delta;
      const finalBoss = g.enemies.find((e: any) => e.type === "FINAL_BOSS") || g.cinematic.bossId;
      
      if (finalBoss) {
        // Center camera on the Final Boss
        g.camera.x += (finalBoss.x - g.camera.x - g.dimensions.width / 2) * 0.1;
        g.camera.y += (finalBoss.y - g.camera.y - g.dimensions.height / 2) * 0.1;
        
        // Zoom camera in gradually
        const progress = 1.0 - Math.max(0, g.cinematic.timer) / g.cinematic.maxTimer;
        g.camera.zoom = 1.0 + progress * 0.8; // scales up to 1.8x
        
        if (g.cinematic.type === "timeout") {
          g.screenShake = 12; // Heavy shaking
          finalBoss.puffScale = 1.0 + progress * 1.5; // swells up to 2.5x size
          
          // Flash colors rapidly
          if (Math.floor(Date.now() / 80) % 2 === 0) {
            finalBoss.color = "#ef4444"; // Red flash
          } else {
            finalBoss.color = "#fbbf24"; // Gold flash
          }
          
          // Combustion spark particles shooting out of swelling boss
          if (Math.random() < 0.45) {
            const randAngle = Math.random() * Math.PI * 2;
            const dist = finalBoss.radius * (finalBoss.puffScale || 1.0) * Math.random();
            g.particles.push({
              x: finalBoss.x + Math.cos(randAngle) * dist,
              y: finalBoss.y + Math.sin(randAngle) * dist,
              dx: (Math.random() - 0.5) * 4,
              dy: (Math.random() - 0.5) * 4,
              size: 6 + Math.random() * 12,
              color: Math.random() < 0.5 ? "rgba(239, 68, 68, 0.85)" : "rgba(253, 224, 71, 0.85)",
              life: 0.6 + Math.random() * 0.4,
              decay: 0.02 + Math.random() * 0.02,
            });
          }
        } else if (g.cinematic.type === "victory") {
          // Boss dizzy shake/shivering on victory cinematic
          finalBoss.x += (Math.random() - 0.5) * 4;
          finalBoss.y += (Math.random() - 0.5) * 4;
          
          // Spawn dead spark particles slowly
          if (Math.random() < 0.25) {
            const randAngle = Math.random() * Math.PI * 2;
            g.particles.push({
              x: finalBoss.x + Math.cos(randAngle) * finalBoss.radius * Math.random(),
              y: finalBoss.y + Math.sin(randAngle) * finalBoss.radius * Math.random(),
              dx: (Math.random() - 0.5) * 1.5,
              dy: (Math.random() - 0.5) * 1.5,
              size: 3 + Math.random() * 4,
              color: "rgba(255, 255, 255, 0.5)",
              life: 0.5 + Math.random() * 0.3,
              decay: 0.04,
            });
          }
        }
      }
      
      // Update particles, projectiles and floating texts even in cinematic
      updateParticles();
      updateDamageTexts();
      updateProjectiles(delta);
      
      // Keep updating enemies for the final boss state checks (specifically for the victory filter check)
      if (g.cinematic.type === "victory") {
        g.projectiles = []; // 플레이어 공격 탄환을 지워 보스 사망 모션을 더 잘 관찰할 수 있게 함
        updateEnemies(delta);
      }
      
      // Screen shake decay in cinematic
      if (g.screenShake > 0) {
        g.screenShake -= 0.1 * (delta / 16.6);
        if (g.screenShake < 0) g.screenShake = 0;
      }

      if (g.cinematic.type === "timeout_aftermath") {
        g.cinematic.tick = (g.cinematic.tick || 0) + 1;
        if (g.cinematic.tick % 2 === 0) {
          const bx = g.cinematic.bossX ?? g.player.x;
          const by = g.cinematic.bossY ?? (g.player.y - 120);
          const baseAngle = (Date.now() * 0.006) % (Math.PI * 2);
          for (let k = 0; k < 18; k++) {
            const angle = baseAngle + (k * Math.PI * 2) / 18;
            g.particles.push({
              x: bx,
              y: by,
              dx: Math.cos(angle) * 15,
              dy: Math.sin(angle) * 15,
              size: 8 + (k % 4),
              color: k % 3 === 0 ? "#ef4444" : k % 3 === 1 ? "#fbbf24" : "#a855f7",
              life: 1.4,
              decay: 0.008,
            });
          }
        }
        g.screenShake = Math.max(g.screenShake, 18);
      }

      if (g.cinematic.type === "player_death" || g.cinematic.type === "timeout_aftermath") {
        if (g.cinematic.timer <= 0) {
          endGame(false);
        }
        return;
      }
      
      // Handle timeout explosion triggers
      if (g.cinematic.type === "timeout" && g.cinematic.timer <= 0) {
        let bx = g.player.x;
        let by = g.player.y - 120;
        if (finalBoss) {
          bx = finalBoss.x;
          by = finalBoss.y;
          g.particles.push(...createExplosion(finalBoss.x, finalBoss.y, "#ef4444", 185));
          for (let i = 0; i < 60; i++) {
            const angle = (i * Math.PI * 2) / 60;
            g.particles.push({
              x: finalBoss.x,
              y: finalBoss.y,
              dx: Math.cos(angle) * 12,
              dy: Math.sin(angle) * 12,
              size: 8,
              color: "#fbbf24",
              life: 1.0,
              decay: 0.015,
            });
          }
          finalBoss.hp = 0;
          g.enemies = g.enemies.filter((e: any) => e !== finalBoss);
        }
        g.screenShake = 55;
        g.cinematic = {
          type: "timeout_aftermath",
          timer: 3500,
          maxTimer: 3500,
          bossX: bx,
          bossY: by,
          tick: 0,
        };
        return;
      }
      
      return;
    }

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

    // Player Poison Damage Update (10초간 1초씩 3HP 감소)
    if (g.player.poisonTimer && g.player.poisonTimer > 0) {
      g.player.poisonTimer -= delta;
      g.player.poisonTick = (g.player.poisonTick || 0) + delta;
      if (g.player.poisonTick >= 1000) {
        g.player.poisonTick -= 1000;
        damagePlayer(3);
        g.damageTexts.push({
          x: g.player.x + (Math.random() - 0.5) * 16,
          y: g.player.y - 25,
          text: "-3 (독 지속피해)",
          color: "#a855f7",
          size: 15,
          life: 1.2,
        });
      }
    }

    // 좀비 잡몹 감염 도트데미지 업데이트 (3초간 1초씩 5HP 감소)
    if (g.player.zombieDotTimer && g.player.zombieDotTimer > 0) {
      g.player.zombieDotTimer -= delta;
      g.player.zombieDotTick = (g.player.zombieDotTick || 0) + delta;
      if (g.player.zombieDotTick >= 1000) {
        g.player.zombieDotTick -= 1000;
        damagePlayer(5);
        g.damageTexts.push({
          x: g.player.x + (Math.random() - 0.5) * 16,
          y: g.player.y - 25,
          text: "-5 (좀비 감염피해)",
          color: "#84cc16",
          size: 15,
          life: 1.2,
        });
      }
    }

    // 출혈 도트데미지 업데이트 (3초간 1초씩 5HP 감소)
    if (g.player.bleedTimer && g.player.bleedTimer > 0) {
      g.player.bleedTimer -= delta;
      g.player.bleedTick = (g.player.bleedTick || 0) + delta;
      if (g.player.bleedTick >= 1000) {
        g.player.bleedTick -= 1000;
        damagePlayer(5);
        g.damageTexts.push({
          x: g.player.x + (Math.random() - 0.5) * 16,
          y: g.player.y - 25,
          text: "-5 (출혈)",
          color: "#ef4444",
          size: 15,
          life: 1.2,
        });
      }
    }

    // 보스 할퀴기 타격 연출(claw) 업데이트
    if (g.claws) {
      g.claws = g.claws.filter((c: any) => {
        c.timer -= delta;
        return c.timer > 0;
      });
    } else {
      g.claws = [];
    }

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

      // Check for BOSS spawning: robustly spawn every 60s (60, 120, 180, 240, 300, 360...) exactly when the milestone is reached
      if (g.player.timeElapsed >= g.nextBossSpawnTime && g.player.timeElapsed < 600) {
        spawnBoss();
        g.nextBossSpawnTime += 60;
      }

      // Check Final Boss spawning at 10 minutes (600s)
      if (g.player.timeElapsed === 600 && !g.finalBossSpawned) {
        spawnFinalBoss();
      }

      // Countdown timer for Final Boss active (3 minutes limit)
      if (g.finalBossActive) {
        g.finalBossTimer -= 1;
        if (g.finalBossTimer <= 0) {
          // Trigger the timeout cinematic sequence!
          const finalBoss = g.enemies.find((e: any) => e.type === "FINAL_BOSS");
          if (finalBoss && !g.cinematic) {
            g.cinematic = {
              type: "timeout",
              timer: 3000,
              maxTimer: 3000,
              bossId: finalBoss,
            };
            g.finalBossActive = false; // Stop timer countdown
            setBossHealth(null); // Hide health bar
          } else {
            // Fallback if final boss is already killed/not found
            endGame(false);
          }
          return;
        }
      }

      updateReactHUD();
    }

    // Enemy spawn controller based on time survived (적 개체수 완화로 생존율 향상)
    const spawnRate = Math.max(400, 1300 - Math.floor(g.player.timeElapsed / 10) * 65);
    if (g.timers.enemySpawn >= spawnRate) {
      g.timers.enemySpawn = 0;
      // Respect disableNormalSpawns toggle
      if (!g.disableNormalSpawns) {
        // Do not spawn infinite normal enemies during boss fights to avoid clustering
        if (g.enemies.filter(e => e.type === "BOSS").length === 0) {
          // Spawn more enemies simultaneously as elapsed time grows (개체수 최대치 완화)
          const baseSpawnCount = 1 + Math.floor(g.player.timeElapsed / 65);
          const spawnCount = Math.min(4, baseSpawnCount);
          for (let i = 0; i < spawnCount; i++) {
            spawnEnemies();
          }
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
            damage: (25 + guardianData.level * 15) * g.player.atkMultiplier * (guardianData.isEvo ? 2.2 : 1),
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

    // Boomerang (Returning rotating blades)
    if (g.skills.weapons[WeaponType.BOOMERANG]) {
      const boomData = g.skills.weapons[WeaponType.BOOMERANG];
      g.timers.boomerang = (g.timers.boomerang || 0) + delta;
      const rate = (boomData.isEvo ? 450 : 1500 - boomData.level * 180) * cdMultiplier;
      if (g.timers.boomerang >= rate) {
        g.timers.boomerang = 0;
        fireBoomerang(boomData);
      }
    }

    // Excalibur (Legendary holy swords dropping from sky)
    if (g.skills.weapons[WeaponType.EXCALIBUR]) {
      const excalData = g.skills.weapons[WeaponType.EXCALIBUR];
      g.timers.excalibur = (g.timers.excalibur || 0) + delta;
      const rate = (excalData.isEvo ? 800 : 2200 - excalData.level * 250) * cdMultiplier;
      if (g.timers.excalibur >= rate) {
        g.timers.excalibur = 0;
        fireExcalibur(excalData);
      }
    }

    // Black Hole (Legendary gravitational singularity)
    if (g.skills.weapons[WeaponType.BLACK_HOLE]) {
      const bhData = g.skills.weapons[WeaponType.BLACK_HOLE];
      g.timers.blackHole = (g.timers.blackHole || 0) + delta;
      
      // Reduce fire rate slightly to prevent too much spam (from 1400/3500 to 2200/4500)
      const rate = (bhData.isEvo ? 2200 : 4500 - bhData.level * 350) * cdMultiplier;
      if (g.timers.blackHole >= rate) {
        g.timers.blackHole = 0;
        fireBlackHole(bhData);
      }

      // EVO final stage: Spawn a giant devastating Super Black Hole every 30 seconds!
      if (bhData.isEvo) {
        g.timers.superBlackHole = (g.timers.superBlackHole || 0) + delta;
        if (g.timers.superBlackHole >= 30000) {
          g.timers.superBlackHole = 0;
          fireSuperBlackHole(bhData);
        }
      }
    }
  };

  // --- FIRE WEAPON FUNCTIONS ---

  const fireKunai = (wpnData: any) => {
    const g = gameState.current;
    const targetableEnemies = g.enemies.filter((e: any) => !e.isOutOfScreen);
    if (targetableEnemies.length === 0) return;

    // Find closest enemies
    const targets = [...targetableEnemies]
      .map((e) => {
        const dx = e.x - g.player.x;
        const dy = e.y - g.player.y;
        return { enemy: e, dist: dx * dx + dy * dy };
      })
      .sort((a, b) => a.dist - b.dist);

    const targetCount = wpnData.isEvo ? 6 : Math.min(targets.length, 1 + Math.floor(wpnData.level / 2));
    const baseEnemy = targets[0].enemy;
    const baseAngle = Math.atan2(baseEnemy.y - g.player.y, baseEnemy.x - g.player.x);

    for (let i = 0; i < targetCount; i++) {
      let angle = baseAngle;
      let angleOffset = 0;

      if (wpnData.isEvo) {
        // Evo kunai shoots a highly precise, dense frontal fan toward the absolute closest target
        angleOffset = (i - (targetCount - 1) / 2) * 0.10;
      } else {
        if (!targets[i]) break;
        const enemy = targets[i].enemy;
        angle = Math.atan2(enemy.y - g.player.y, enemy.x - g.player.x);
        angleOffset = (i - (targetCount - 1) / 2) * 0.15;
      }

      g.projectiles.push({
        type: "KUNAI",
        x: g.player.x,
        y: g.player.y,
        dx: Math.cos(angle + angleOffset),
        dy: Math.sin(angle + angleOffset),
        speed: wpnData.isEvo ? 13 : 7 + wpnData.level,
        size: wpnData.isEvo ? 16 : 8 + wpnData.level * 1.5,
        damage: (20 + wpnData.level * 10) * g.player.atkMultiplier * (wpnData.isEvo ? 2.5 : 1),
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
        damage: (35 + wpnData.level * 15) * g.player.atkMultiplier * (wpnData.isEvo ? 2.2 : 1),
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
        damage: (10 + wpnData.level * 4) * g.player.atkMultiplier * (wpnData.isEvo ? 2.0 : 1),
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
    const targetableEnemies = g.enemies.filter((e: any) => !e.isOutOfScreen);
    if (targetableEnemies.length === 0) return;

    // Pick random enemies to strike
    const count = wpnData.isEvo ? 6 : 1 + wpnData.level;
    for (let i = 0; i < count; i++) {
      if (targetableEnemies.length === 0) break;
      const idx = Math.floor(Math.random() * targetableEnemies.length);
      const enemy = targetableEnemies[idx];

      g.projectiles.push({
        type: "LIGHTNING",
        x: enemy.x,
        y: enemy.y,
        size: wpnData.isEvo ? 55 : 30 + wpnData.level * 4,
        damage: (75 + wpnData.level * 25) * g.player.atkMultiplier * (wpnData.isEvo ? 2.0 : 1),
        timer: 200, // Duration to show strike on screen
        isEvo: wpnData.isEvo,
      });

      // Apply instant damage
      const baseDmg = (75 + wpnData.level * 25) * g.player.atkMultiplier * (wpnData.isEvo ? 2.0 : 1);
      applyDamageToEnemy(enemy, baseDmg);

      // Chain lightning for EVO
      if (wpnData.isEvo) {
        // Strike another 2 nearest targets
        const chains = [...targetableEnemies]
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

    const targetableEnemies = g.enemies.filter((e: any) => !e.isOutOfScreen);

    if (playerSpeed > 0.1) {
      angle = Math.atan2(g.player.vy, g.player.vx);
    } else if (targetableEnemies.length > 0) {
      let closestEnemy = targetableEnemies[0];
      let minDist = Infinity;
      targetableEnemies.forEach((e: any) => {
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
        damage: (5 + wpnData.level * 1.5) * g.player.atkMultiplier * (wpnData.isEvo ? 1.6 : 1) * 0.5,
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
    let damage = 5;
    if (wpnData.level === 2) damage = 8;
    else if (wpnData.level === 3) damage = 12;
    else if (wpnData.level === 4) damage = 16;
    else if (wpnData.level >= 5) damage = 22;

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
      duration: 2500, // persists on ground for 2.5 seconds (reduced from 4.5 to avoid over-stacking)
      radius: radius,
      damage: isRainbowMode ? 40 : damage,
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
          duration: 2500, // persists on ground for 2.5 seconds
          radius: radius,
          damage: isRainbowMode ? 40 : damage,
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

  const fireBoomerang = (wpnData: any) => {
    const g = gameState.current;
    const count = wpnData.isEvo ? 6 : 1 + wpnData.level;
    for (let i = 0; i < count; i++) {
      const angle = (i * (Math.PI * 2)) / count + Math.random() * 0.2;
      g.projectiles.push({
        type: "BOOMERANG",
        x: g.player.x,
        y: g.player.y,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        speed: wpnData.isEvo ? 14 : 9 + wpnData.level * 0.5,
        size: wpnData.isEvo ? 24 : 14 + wpnData.level * 1.5,
        damage: (22 + wpnData.level * 12) * g.player.atkMultiplier * (wpnData.isEvo ? 2.5 : 1),
        timer: 0,
        life: 4000,
        isEvo: wpnData.isEvo,
      });
    }
    if (soundEnabledRef.current) soundEngine.playShoot();
  };

  const fireExcalibur = (wpnData: any) => {
    const g = gameState.current;
    const count = wpnData.isEvo ? 8 : 1 + wpnData.level;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 140;
      const targetX = g.player.x + Math.cos(angle) * dist;
      const targetY = g.player.y + Math.sin(angle) * dist;

      g.projectiles.push({
        type: "EXCALIBUR",
        x: targetX,
        y: targetY,
        dropOffset: 200,
        timer: 0,
        life: 800,
        radius: wpnData.isEvo ? 110 : 60 + wpnData.level * 8,
        damage: (90 + wpnData.level * 35) * g.player.atkMultiplier * (wpnData.isEvo ? 2.3 : 1),
        impacted: false,
        isEvo: wpnData.isEvo,
      });
    }
    if (soundEnabledRef.current) soundEngine.playShoot();
  };

  const fireBlackHole = (wpnData: any) => {
    const g = gameState.current;
    // Always fire exactly 1 black hole to reduce spam, as requested
    const angle = Math.random() * Math.PI * 2;
    g.projectiles.push({
      type: "BLACK_HOLE",
      x: g.player.x,
      y: g.player.y,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      speed: wpnData.isEvo ? 1.5 : 2.2,
      pullRadius: wpnData.isEvo ? 250 : 130 + wpnData.level * 15,
      damageRadius: wpnData.isEvo ? 85 : 45 + wpnData.level * 6,
      damage: (30 + wpnData.level * 15) * g.player.atkMultiplier * (wpnData.isEvo ? 2.5 : 1),
      life: wpnData.isEvo ? 5000 : 3500 + wpnData.level * 300,
      tickTimer: 0,
      isEvo: wpnData.isEvo,
    });
    if (soundEnabledRef.current) soundEngine.playShoot();
  };

  const fireSuperBlackHole = (wpnData: any) => {
    const g = gameState.current;
    
    // Create an immensely large and powerful stationary Singularity centered on the player
    g.projectiles.push({
      type: "SUPER_BLACK_HOLE",
      x: g.player.x,
      y: g.player.y,
      dx: 0,
      dy: 0,
      speed: 0,
      pullRadius: 520, // Devastating pull radius covering almost the whole screen
      damageRadius: 180, // High-damage area
      damage: (30 + wpnData.level * 15) * g.player.atkMultiplier * 15.0, // Deals massive 15x continuous damage!
      life: 7000, // Stays active for 7 seconds
      tickTimer: 0,
      isEvo: true,
    });

    g.damageTexts.push({
      x: g.player.x,
      y: g.player.y - 65,
      text: "🌌 초중력 특이점 붕괴 개시!!! 🌌",
      color: "#db2777",
      size: 18,
      life: 2.2,
    });

    if (soundEnabledRef.current) {
      soundEngine.playEvo();
    }
  };

  const applyDamageToEnemy = (enemy: any, amount: number, knockbackAmount: number = 5) => {
    if (enemy.isOutOfScreen) return; // Cannot damage out-of-screen/jumping enemies
    if (enemy.tombstoneTimer && enemy.tombstoneTimer > 0) return; // Cannot damage spawning enemies during tombstone phase
    if (enemy.isResurrecting) return; // Cannot damage during resurrection
    // Check for custom invulnerability (e.g. Anger-Issue Gorilla pattern 3)
    if (enemy.isInvulnerable) {
      if (Math.random() < 0.25) { // Prevents too much text spam
        gameState.current.damageTexts.push({
          x: enemy.x + (Math.random() - 0.5) * 12,
          y: enemy.y - 12,
          text: "무적!",
          color: "#fbbf24", // gold glowing text
          size: 14,
          life: 0.8,
        });
      }
      return;
    }

    // 패턴 3: 좀비 뚱돼지 체력 50% 이하일 시 피해를 30% 덜 받는다.
    let modifiedAmount = amount;
    if (enemy.name && enemy.name.includes("좀비 뚱돼지") && enemy.hp <= (enemy.maxHp || 110000) * 0.5) {
      modifiedAmount *= 0.7;
    }

    const isCrit = Math.random() < 0.15;
    const finalAmount = isCrit ? Math.floor(modifiedAmount * 1.5) : Math.floor(modifiedAmount);

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

    // Knockback (Prevent knockback for BOSS and FINAL_BOSS)
    const angle = Math.atan2(enemy.y - gameState.current.player.y, enemy.x - gameState.current.player.x);
    if (enemy.type !== "BOSS" && enemy.type !== "FINAL_BOSS") {
      enemy.x += Math.cos(angle) * knockbackAmount;
      enemy.y += Math.sin(angle) * knockbackAmount;
    }

    // Spark particles
    gameState.current.particles.push(...createExplosion(enemy.x, enemy.y, isCrit ? "#fbbf24" : "#f87171", 3));
  };

  // --- ENTITY UPDATE LOGICS ---

  const updateProjectiles = (delta: number) => {
    const g = gameState.current;
    
    // Reset black hole trapped state for all enemies before calculation
    g.enemies.forEach((e: any) => {
      e.isBlackHoleTrapped = false;
    });

    g.projectiles = g.projectiles.filter((p: any) => {
      if (p.type === "BOOMERANG") {
        p.timer = (p.timer || 0) + delta;
        if (p.timer < 550) {
          p.x += p.dx * p.speed * (delta / 16.6);
          p.y += p.dy * p.speed * (delta / 16.6);
        } else {
          const angleToPlayer = Math.atan2(g.player.y - p.y, g.player.x - p.x);
          p.x += Math.cos(angleToPlayer) * (p.speed * 1.35) * (delta / 16.6);
          p.y += Math.sin(angleToPlayer) * (p.speed * 1.35) * (delta / 16.6);
          if (p.timer > 700 && Math.hypot(g.player.x - p.x, g.player.y - p.y) < 35) {
            return false;
          }
        }
        p.life -= delta;

        if (!p.hitEnemies) p.hitEnemies = new Set();
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e.isOutOfScreen) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.size) {
            if (!p.hitEnemies.has(e.id)) {
              p.hitEnemies.add(e.id);
              applyDamageToEnemy(e, p.damage, p.isEvo ? 10 : 5);
            }
          }
        }
        if (p.timer > 550 && !p.clearedReturn) {
          p.clearedReturn = true;
          p.hitEnemies.clear();
        }
        return p.life > 0;
      }

      if (p.type === "EXCALIBUR") {
        p.timer = (p.timer || 0) + delta;
        if (p.timer < 200) {
          p.dropOffset = (200 - p.timer) * 1.25;
        } else if (!p.impacted) {
          p.impacted = true;
          p.dropOffset = 0;
          for (let i = 0; i < g.enemies.length; i++) {
            const e = g.enemies[i];
            if (e.isOutOfScreen) continue;
            if (Math.hypot(e.x - p.x, e.y - p.y) < p.radius) {
              applyDamageToEnemy(e, p.damage, 12);
            }
          }
        }
        p.life -= delta;
        return p.life > 0;
      }

      if (p.type === "BLACK_HOLE") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;
        p.tickTimer = (p.tickTimer || 0) + delta;
        const doDamage = p.tickTimer >= 220;
        if (doDamage) p.tickTimer = 0;

        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e.isOutOfScreen) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          
          const isBossLike = e.isBoss || e.type === "BOSS" || e.type === "MINI_BOSS" || e.type === "FINAL_BOSS";
          
          // Scaled pulling effect: smaller monsters get pulled mildly, large monsters (radius >= 24) & bosses are fully immune.
          let sizeFactor = 0;
          if (e.radius < 24 && !isBossLike) {
            sizeFactor = Math.max(0, 1 - (e.radius - 12) / 12);
          }

          // Pull force is significantly reduced to only hinder movement (0.015 multiplier instead of 0.08)
          if (dist < p.pullRadius && dist > 15 && sizeFactor > 0) {
            const pullForce = 0.015 * (1 - dist / p.pullRadius) * sizeFactor;
            e.x += (p.x - e.x) * pullForce * (delta / 16.6);
            e.y += (p.y - e.y) * pullForce * (delta / 16.6);
          }
          if (doDamage && dist < p.damageRadius) {
            applyDamageToEnemy(e, p.damage, 0);
          }
        }
        return p.life > 0;
      }

      if (p.type === "SUPER_BLACK_HOLE") {
        p.life -= delta;
        p.tickTimer = (p.tickTimer || 0) + delta;
        const doDamage = p.tickTimer >= 220;
        if (doDamage) p.tickTimer = 0;

        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e.isOutOfScreen) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          const isBossLike = e.isBoss || e.type === "BOSS" || e.type === "MINI_BOSS" || e.type === "FINAL_BOSS";

          if (dist < p.pullRadius) {
            if (!isBossLike) {
              // Extremely powerful pull for non-bosses to the center
              const pullForce = 0.09 * (1 - dist / p.pullRadius) + 0.04;
              e.x += (p.x - e.x) * pullForce * (delta / 16.6);
              e.y += (p.y - e.y) * pullForce * (delta / 16.6);

              // Captured enemies are completely trapped: they can't move and do NOT damage the player!
              e.isBlackHoleTrapped = true;
            }
          }

          if (doDamage && dist < p.damageRadius) {
            applyDamageToEnemy(e, p.damage, 0);
          }
        }
        return p.life > 0;
      }

      if (p.type === "GATLING") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        // Check monster collision
        for (let i = 0; i < g.enemies.length; i++) {
          const e = g.enemies[i];
          if (e.isOutOfScreen) continue;
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
          if (e.isOutOfScreen) continue;
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
          if (e.isOutOfScreen) continue;
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
          if (e.isOutOfScreen) continue;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.size / 2) {
            // Push enemies outward strongly
            const pushAngle = Math.atan2(e.y - g.player.y, e.x - g.player.x);
            if (e.type !== "BOSS" && e.type !== "FINAL_BOSS") {
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
            if (e.isOutOfScreen) continue;
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
            if (e.isOutOfScreen) continue;
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < p.radius + e.radius) {
              applyDamageToEnemy(e, p.damage, 0); // Disable knockback for poop
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
    const spawnedEnemiesThisFrame: any[] = [];

    g.enemies = g.enemies.filter((e: any) => {
      // Check death
      if (e.hp <= 0) {
        // 패턴 1: 좀비 뚱돼지 최초 1회 100% 체력으로 부활
        if (e.name && e.name.includes("좀비 뚱돼지") && !e.hasRevived) {
          if (!e.isResurrecting) {
            e.isResurrecting = true;
            e.resurrectTimer = 2200; // 2.2 seconds resurrection delay
            e.state = "RESURRECTING";
            e.drawWarningArea = null;

            // Generate initial dark smoke particles
            for (let k = 0; k < 15; k++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 2.5;
              g.particles.push({
                x: e.x,
                y: e.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                size: 6 + Math.random() * 8,
                color: "rgba(15, 23, 42, 0.4)", // Dark smoke
                life: 0.8,
                decay: 0.02,
              });
            }
          } else {
            // Tick resurrection timer
            e.resurrectTimer -= delta;

            // Spawn green smoke particles during regeneration
            if (Math.random() < 0.4) {
              const rx = e.x + (Math.random() - 0.5) * e.radius * 1.5;
              const ry = e.y + (Math.random() - 0.5) * e.radius * 1.5;
              g.particles.push({
                x: rx,
                y: ry,
                dx: (Math.random() - 0.5) * 0.8,
                dy: (Math.random() - 0.5) * 0.8,
                size: 8 + Math.random() * 12,
                color: "rgba(34, 197, 94, 0.35)", // light green smoke
                life: 0.8 + Math.random() * 0.4,
                decay: 0.02,
              });
            }

            if (e.resurrectTimer <= 0) {
              e.isResurrecting = false;
              e.hasRevived = true;
              e.hp = e.maxHp || 110000;
              e.state = "NORMAL";
              e.patternTimer = 0;

              g.damageTexts.push({
                x: e.x,
                y: e.y - 45,
                text: "🧟 불사 부활!! (HP 100%) 🧟",
                color: "#84cc16",
                size: 21,
                life: 2.5,
              });

              // Huge green smoke explosion on resurrection completion!
              for (let k = 0; k < 40; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.2 + Math.random() * 5.0;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * speed,
                  dy: Math.sin(angle) * speed,
                  size: 8 + Math.random() * 16,
                  color: "rgba(22, 163, 74, 0.7)", // vivid green zombie smoke
                  life: 1.2 + Math.random() * 0.6,
                  decay: 0.012,
                });
              }

              if (soundEnabledRef.current) {
                soundEngine.playBossAlert();
              }
            }
          }
          return true; // 죽지 않고 필드에 계속 유지
        }

        g.player.kills += 1;
        // Drop XP Gem
        spawnGem(e.x, e.y, e.type);

        // Mini bosses spawning on kills removed as requested

        if (e.type === "BOSS") {
          g.bossDefeated = true;
          setBossHealth(null);
          g.particles.push(...createExplosion(e.x, e.y, "#eab308", 40));
          soundEngine.playBossAlert();
          forceLevelUp(); // Level up 1 level as reward!
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
          upgradeRandomOwnedWeapon(); // upgrade 1 of currently held active weapon levels!
          
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
          if (!g.cinematic) {
            g.cinematic = {
              type: "victory",
              timer: 3000,
              maxTimer: 3000,
              bossId: e,
            };
            e.hp = 0; // Freeze HP at 0
            e.isInvulnerable = true; // No more damage
            setBossHealth(null); // Hide health bar
            g.projectiles = []; // 승리 시 플레이어 공격 투사체 전체 삭제
            g.damageTexts = [];
            return true; // Keep alive in list during cinematic
          } else {
            // Cinematic is running or ended
            if (g.cinematic.timer <= 0) {
              g.finalBossActive = false;
              g.finalBossDefeated = true;
              g.particles.push(...createExplosion(e.x, e.y, "#fbbf24", 100));
              
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
              return false; // Actually remove from list
            }
            return true; // Keep in list
          }
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
                damagePlayer(e.damage * 1.5);
                g.screenShake = 8;
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
                damagePlayer(e.damage * 1.8);
                g.screenShake = 12;
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
      } else if (e.type === "BOSS") {
        if (e.name && e.name.includes("돌격대장 원숭이")) {
          // Initialize states if not present
          if (e.state === undefined) e.state = "NORMAL";
          if (e.patternTimer === undefined) e.patternTimer = 0;
          if (e.halfHpTriggered === undefined) e.halfHpTriggered = false;

          // Check HP threshold for Pattern 2 (Half HP explosion)
          if (e.hp <= e.maxHp * 0.5 && !e.halfHpTriggered) {
            e.halfHpTriggered = true;
            e.state = "HALF_HP_PREPARING";
            e.halfHpTimer = 2000; // 2 seconds
            g.screenShake = 5;
            soundEngine.playBossAlert();
          }

          if (e.state === "HALF_HP_PREPARING") {
            // Keep completely still and count down
            e.halfHpTimer -= delta;
            
            // Store warning zone drawing data
            e.drawWarningArea = {
              radius: 280,
              type: "HALF_HP_PREPARING",
              timer: e.halfHpTimer,
            };

            if (e.halfHpTimer <= 0) {
              e.state = "NORMAL";
              e.patternTimer = 0;
              e.drawWarningArea = null;

              // 1. Deal massive damage to Player if within 280px
              if (dist < 280) {
                damagePlayer(45);
                g.screenShake = 15;
              }

              // 2. Clear all normal enemies in the 280px radius
              g.enemies.forEach((other: any) => {
                if (other !== e && other.type !== "BOSS" && other.type !== "FINAL_BOSS") {
                  const oDx = other.x - e.x;
                  const oDy = other.y - e.y;
                  const oDist = Math.hypot(oDx, oDy);
                  if (oDist < 280) {
                    other.hp = 0; // Destroy them!
                  }
                }
              });

              // 3. Spawn gorgeous explosion particles
              for (let i = 0; i < 48; i++) {
                const angle = (i * Math.PI * 2) / 48;
                const pSpeed = 2 + Math.random() * 5;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * pSpeed,
                  dy: Math.sin(angle) * pSpeed,
                  size: 4 + Math.random() * 6,
                  color: "#ef4444", // Red fiery particles
                  life: 0.8 + Math.random() * 0.4,
                  decay: 0.02,
                });
              }
            }
          } else if (e.state === "NORMAL") {
            e.patternTimer += delta;
            if (e.patternTimer >= 2500) {
              e.state = "AIMING";
              e.aimTimer = 1000; // 1 second aiming
            }

            // Normal chase movement
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
            e.drawWarningArea = null;
          } else if (e.state === "AIMING") {
            e.aimTimer -= delta;
            
            // Lock aiming line on the player
            e.drawWarningArea = {
              type: "AIMING",
              timer: e.aimTimer,
              aimX: g.player.x,
              aimY: g.player.y,
            };

            // Monkey stands still while aiming
            if (e.aimTimer <= 0) {
              e.state = "DASHING";
              e.dashTimer = 700; // 0.7 second dashing
              e.drawWarningArea = null;
              
              // Calculate dash direction vector
              const angle = Math.atan2(dy, dx);
              e.dashDx = Math.cos(angle);
              e.dashDy = Math.sin(angle);
              e.hasDealtDashDamage = false; // reset damage flag for this dash
            }
          } else if (e.state === "DASHING") {
            e.dashTimer -= delta;

            // Dash movement: high speed
            e.x += e.dashDx * e.speed * 4.5 * (delta / 16.6);
            e.y += e.dashDy * e.speed * 4.5 * (delta / 16.6);

            // Spawn dynamic dash ghost particles
            if (Math.random() < 0.4) {
              g.particles.push({
                x: e.x,
                y: e.y,
                dx: (Math.random() - 0.5) * 1,
                dy: (Math.random() - 0.5) * 1,
                size: e.radius * 0.8,
                color: "rgba(239, 68, 68, 0.3)",
                life: 0.3,
                decay: 0.05,
              });
            }

            // Deal custom damage if colliding with player during dash
            if (!e.hasDealtDashDamage && dist < g.player.radius + e.radius) {
              e.hasDealtDashDamage = true;
              damagePlayer(30);
              g.screenShake = 10;
            }

            if (e.dashTimer <= 0) {
              e.state = "NORMAL";
              e.patternTimer = 0;
            }
          }
        } else if (e.name && e.name.includes("분조장 고릴라")) {
          // Initialize states if not present
          if (e.state === undefined) e.state = "NORMAL";
          if (e.patternTimer === undefined) e.patternTimer = 0;
          if (e.lastEnrageHpTrigger === undefined) e.lastEnrageHpTrigger = e.maxHp;
          if (e.isInvulnerable === undefined) e.isInvulnerable = false;
          if (e.enrageTimer === undefined) e.enrageTimer = 0;

          // Check HP threshold for Pattern 3 (20% HP damage Invulnerability & Instant Pattern Trigger)
          if (e.hp <= e.lastEnrageHpTrigger - e.maxHp * 0.2) {
            const steps = Math.floor((e.lastEnrageHpTrigger - e.hp) / (e.maxHp * 0.2));
            if (steps > 0) {
              e.lastEnrageHpTrigger -= steps * (e.maxHp * 0.2);
              e.isInvulnerable = true;
              e.enrageTimer = 5000; // 5 seconds invulnerable
              g.screenShake = 15;
              soundEngine.playBossAlert();
              g.damageTexts.push({
                x: e.x,
                y: e.y - 30,
                text: "⚡ 분조장 고릴라 폭주 (5초 무적!) ⚡",
                color: "#f43f5e",
                size: 16,
                life: 2.5,
              });

              // 만약 패턴1이나 패턴2를 사용하고 있지 않으면(즉 NORMAL 상태이면), 즉시 둘 중 하나 실행
              if (e.state === "NORMAL") {
                const isJump = Math.random() < 0.5;
                if (isJump) {
                  e.state = "GORILLA_JUMP_PREP";
                  e.jumpCount = 0;
                  e.jumpPrepTimer = 2000; // 2초간 멈춤
                } else {
                  e.state = "GORILLA_AIMING";
                  e.aimTimer = 1000; // 1초 조준
                  e.throwCount = 0;
                }
                e.drawWarningArea = null;
                e.patternTimer = 0;
              }
            }
          }

          // Count down enrage invulnerability timer
          if (e.isInvulnerable) {
            e.enrageTimer -= delta;
            if (e.enrageTimer <= 0) {
              e.isInvulnerable = false;
            }
          }

          // Active speed for Gorilla Boss (moves faster if enraged/invulnerable)
          const currentSpeed = e.isInvulnerable ? e.speed * 1.6 : e.speed;

          if (e.state === "NORMAL") {
            // Normal chase state, timer progresses faster if enraged (2.5x speed)
            e.patternTimer += delta * (e.isInvulnerable ? 2.5 : 1.0);
            if (e.patternTimer >= 2200) {
              // Choose random pattern
              const isJump = Math.random() < 0.5;
              if (isJump) {
                e.state = "GORILLA_JUMP_PREP";
                e.jumpCount = 0;
                e.jumpPrepTimer = 2000; // 2초 멈춤
              } else {
                e.state = "GORILLA_AIMING";
                e.aimTimer = 1000; // 1초 조준
                e.throwCount = 0;
              }
              e.drawWarningArea = null;
            }

            // Move toward player
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * currentSpeed * (delta / 16.6);
            e.y += Math.sin(angle) * currentSpeed * (delta / 16.6);
            e.drawWarningArea = null;

          } else if (e.state === "GORILLA_JUMP_PREP") {
            // 보스가 동안 멈추고 제자리에 대기
            e.jumpPrepTimer -= delta;
            e.isOutOfScreen = false; // 아직 하늘로 뛰지 않음
            e.drawWarningArea = null; // 대기 중에는 경고영역 없음

            if (e.jumpPrepTimer <= 0) {
              // 보스가 하늘로 뛰어올라 (잠시 사라짐)
              e.state = "GORILLA_JUMP_AIR";
              e.jumpAirTimer = 1000; // 1초 체공
              e.isOutOfScreen = true; // 하늘로 날아 사라짐

              // 하얀 연기 점프 이펙트 (White smoke jump effect)
              for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const pSpeed = 1 + Math.random() * 4;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * pSpeed,
                  dy: Math.sin(angle) * pSpeed,
                  size: 10 + Math.random() * 15, // 큰 연기 입자 크기
                  color: Math.random() < 0.5 ? "rgba(255, 255, 255, 0.75)" : "rgba(220, 225, 230, 0.65)",
                  life: 0.8 + Math.random() * 0.4,
                  decay: 0.02 + Math.random() * 0.02,
                });
              }

              // 플레이어 현재 위치에 보스 크기 만큼의 빨간 구역을 표시
              e.jumpTargetX = g.player.x;
              e.jumpTargetY = g.player.y;
              e.drawWarningArea = {
                type: "GORILLA_JUMP",
                targetX: e.jumpTargetX,
                targetY: e.jumpTargetY,
                radius: e.radius, // 보스 크기 만큼의 빨간 구역
                timer: 1000, // 1초 경고
              };
            }

          } else if (e.state === "GORILLA_JUMP_AIR") {
            // 하늘에 떠 있는 동안 (잠시 사라진 상태) 1초 타이머 카운트
            e.jumpAirTimer -= delta;
            e.isOutOfScreen = true; // 하늘에 떠 있어 렌더링에서 제외됨

            // 빨간 경고 영역 실시간 타이머 유지
            if (e.drawWarningArea) {
              e.drawWarningArea.timer = e.jumpAirTimer;
            }

            if (e.jumpAirTimer <= 0) {
              // 1초 뒤에 해당 표시를 향해 떨어지며 착지!
              e.x = e.jumpTargetX;
              e.y = e.jumpTargetY;
              e.isOutOfScreen = false; // 다시 나타남
              g.screenShake = 15; // 낙하 충격 화면 흔들림
              soundEngine.playBomb();

              // 해당 범위 공격해서 플레이어에게 큰 피해를 입힘
              const playerDist = Math.hypot(g.player.x - e.x, g.player.y - e.y);
              if (playerDist < e.radius + g.player.radius) {
                damagePlayer(55);
              }

              // 낙하 충격파 먼지 파티클 연출
              for (let i = 0; i < 35; i++) {
                const angle = (i * Math.PI * 2) / 35;
                const pSpeed = 3 + Math.random() * 5;
                g.particles.push({
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle) * pSpeed,
                  dy: Math.sin(angle) * pSpeed,
                  size: 3 + Math.random() * 6,
                  color: "#ef4444",
                  life: 0.7,
                  decay: 0.025,
                });
              }

              e.drawWarningArea = null;
              e.jumpCount += 1;

              // 총 3번 시행
              if (e.jumpCount < 3) {
                e.state = "GORILLA_JUMP_PREP";
                e.jumpPrepTimer = 500; // 이후 2번은 낙하 후 0.5초 뒤 바로 높이 도약하고 1초후 공격
              } else {
                e.state = "NORMAL";
                e.patternTimer = 0;
              }
            }

          } else if (e.state === "GORILLA_AIMING") {
            // 플레이어 위치를 1초간 조준 (빨간 선으로 표시)
            e.aimTimer -= delta;
            e.drawWarningArea = {
              type: "GORILLA_AIMING",
              aimX: g.player.x,
              aimY: g.player.y,
              timer: e.aimTimer,
            };

            if (e.aimTimer <= 0) {
              e.state = "GORILLA_THROWING";
              e.throwCount = 0;
              e.throwIntervalTimer = 0;
              
              // 조준 완료된 방향 벡터 고정
              const angle = Math.atan2(dy, dx);
              e.throwDx = Math.cos(angle);
              e.throwDy = Math.sin(angle);
              e.drawWarningArea = null;
            }

          } else if (e.state === "GORILLA_THROWING") {
            // 해당 방향으로 큰 바위를 빠르게 3번 던짐
            e.throwIntervalTimer -= delta;
            if (e.throwIntervalTimer <= 0) {
              // 크고 빠른 바위 투사체 생성
              g.projectiles.push({
                type: "ACID_BALL",
                isRock: true,
                x: e.x,
                y: e.y,
                dx: e.throwDx,
                dy: e.throwDy,
                speed: 11.0, // 고속 발사 (기존 6.5 -> 11.0)
                size: 30, // 큰 크기 (기존 16 -> 30)
                damage: e.damage * 1.5, // 강력한 데미지
                color: "#78350f", // 바위 갈색
                life: 2500,
              });

              if (soundEnabledRef.current) {
                soundEngine.playShoot();
              }

              e.throwCount += 1;
              e.throwIntervalTimer = 200; // 빠른 연사 간격 0.2초

              if (e.throwCount >= 3) {
                e.state = "NORMAL";
                e.patternTimer = 0;
              }
            }
          }
        } else if (e.name && e.name.includes("원거리 딜러 난쟁이")) {
          if (e.state === undefined) e.state = "NORMAL";
          if (e.patternTimer === undefined) e.patternTimer = 0;
          if (e.isEnraged === undefined) e.isEnraged = false;

          // 패턴 3: 피 50% 이하면 패턴 주기 속도 빨라지고 이동속도 상승
          if (e.hp <= e.maxHp * 0.5 && !e.isEnraged) {
            e.isEnraged = true;
            e.speed *= 1.45;
            g.screenShake = 12;
            soundEngine.playBossAlert();
            g.damageTexts.push({
              x: e.x,
              y: e.y - 35,
              text: "⚡ 난쟁이 광폭화! (조준/공격 및 이동속도 급가속) ⚡",
              color: "#ef4444",
              size: 16,
              life: 2.5,
            });
          }

          const currentSpeed = e.speed;

          if (e.state === "NORMAL") {
            e.patternTimer += delta * (e.isEnraged ? 1.6 : 1.0);
            if (e.patternTimer >= 2200) {
              const isPattern1 = Math.random() < 0.55;
              if (isPattern1) {
                e.state = "DWARF_AIM_1";
                e.aimTimer = e.isEnraged ? 600 : 1000; // 1초간 조준 (광폭화시 빨라짐)
              } else {
                e.state = "DWARF_AIM_2";
                e.aimTimer = e.isEnraged ? 450 : 800; // 0.8초간 조준
              }
              e.patternTimer = 0;
            }

            // 플레이어 추격
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * currentSpeed * (delta / 16.6);
            e.y += Math.sin(angle) * currentSpeed * (delta / 16.6);
            e.drawWarningArea = null;

          } else if (e.state === "DWARF_AIM_1") {
            e.aimTimer -= delta;
            e.drawWarningArea = {
              type: "AIMING",
              aimX: g.player.x,
              aimY: g.player.y,
            };

            if (e.aimTimer <= 0) {
              e.state = "DWARF_SHOOT_1";
              // 플레이어가 움직이는 방향에다가 칼 발사 벡터 계산
              let targetX = g.player.x + (g.player.vx || 0) * 18;
              let targetY = g.player.y + (g.player.vy || 0) * 18;
              const angle = Math.atan2(targetY - e.y, targetX - e.x);
              e.shootDx = Math.cos(angle);
              e.shootDy = Math.sin(angle);
              e.shootCount = 0;
              e.shootInterval = 0;
              e.drawWarningArea = null;
            }

          } else if (e.state === "DWARF_SHOOT_1") {
            e.shootInterval -= delta;
            if (e.shootInterval <= 0) {
              g.projectiles.push({
                type: "DWARF_KNIFE",
                x: e.x,
                y: e.y,
                dx: e.shootDx + (Math.random() - 0.5) * 0.14,
                dy: e.shootDy + (Math.random() - 0.5) * 0.14,
                speed: 10.5,
                size: 16,
                damage: e.damage * 1.3,
                color: "#06b6d4",
                life: 3000,
              });
              if (soundEnabledRef.current) soundEngine.playHit();
              e.shootCount += 1;
              e.shootInterval = e.isEnraged ? 60 : 95;
              if (e.shootCount >= 10) {
                e.state = "NORMAL";
                e.patternTimer = 0;
              }
            }

          } else if (e.state === "DWARF_AIM_2") {
            e.aimTimer -= delta;
            e.drawWarningArea = {
              type: "AIMING",
              aimX: g.player.x,
              aimY: g.player.y,
            };

            if (e.aimTimer <= 0) {
              e.state = "NORMAL";
              e.patternTimer = 0;
              e.drawWarningArea = null;
              const angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
              g.projectiles.push({
                type: "DWARF_GIANT_ARROW",
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: 13.0,
                size: 45, // 엄청 큰 화살
                damage: e.damage * 1.8,
                color: "#ef4444",
                isPoisonArrow: true,
                life: 4000,
              });
              if (soundEnabledRef.current) soundEngine.playShoot();
              g.screenShake = 6;
            }
          }
        } else if (e.name && e.name.includes("좀비 뚱돼지")) {
          if (e.isResurrecting) {
            e.drawWarningArea = null;
            return true;
          }
          // Initialize states if not present
          if (e.state === undefined) e.state = "NORMAL";
          if (e.patternTimer === undefined) e.patternTimer = 0;

          if (e.state === "NORMAL") {
            e.patternTimer += delta;
            // 3.5초마다 패턴 발동 (랜덤하게 패턴 2 또는 패턴 4 실행)
            if (e.patternTimer >= 3500) {
              e.patternTimer = 0;
              const choice = Math.random() < 0.5 ? "PATTERN_2_WARN" : "PATTERN_4_SCREAM";
              e.state = choice;
              if (choice === "PATTERN_2_WARN") {
                e.pattern2Timer = 2000; // 2초 경고
                e.pattern2Angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
              } else {
                e.pattern4Timer = 1500; // 1.5초 멈추고 포효
                g.screenShake = 12;
                soundEngine.playBossAlert();
                
                // Scream floating text above the boss
                g.damageTexts.push({
                  x: e.x,
                  y: e.y - 40,
                  text: "🧟 좀비 무리를 부르는 포효! 🧟",
                  color: "#22c55e",
                  size: 16,
                  life: 1.8,
                });

                // Scream shockwave particles
                for (let k = 0; k < 24; k++) {
                  const angle = (k * Math.PI * 2) / 24;
                  g.particles.push({
                    x: e.x,
                    y: e.y,
                    dx: Math.cos(angle) * 4.5,
                    dy: Math.sin(angle) * 4.5,
                    size: 8,
                    color: "rgba(34, 197, 94, 0.4)",
                    life: 0.6,
                    decay: 0.04,
                  });
                }
              }
            }

            // Normal chase
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
            e.drawWarningArea = null;

          } else if (e.state === "PATTERN_2_WARN") {
            // 2초동안 플레이어가 있는 곳에 보스를 중심으로 부채꼴 형태로 빨간 표시
            e.pattern2Timer -= delta;
            
            // Track player position to update angle dynamically during warning
            e.pattern2Angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
            
            e.drawWarningArea = {
              type: "FATTY_FAN_WARNING",
              angle: e.pattern2Angle,
              radius: 220, // 220px range
              spread: Math.PI * 2 / 3, // 120 degrees spread!
              timer: e.pattern2Timer,
            };

            if (e.pattern2Timer <= 0) {
              // Lock state to attack, initialize the first stage (Scratch first, then Dash)
              e.state = "PATTERN_2_ATTACK";
              e.pattern2AttackStage = 0;
              e.pattern2Phase = "SCRATCH_WARN";
              e.pattern2WarnTimer = 140; // 0.14s swift pre-indicator for each scratch
              e.pattern2Angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
              e.drawWarningArea = null;
            }

          } else if (e.state === "PATTERN_2_ATTACK") {
            // 그 후에 해당 방향으로 짧은 예고 부채꼴 표시 후 할퀴기 후 돌진 (총 2번만 돌진, 3번째 할퀴기는 돌진 없음)
            if (e.pattern2Phase === "SCRATCH_WARN") {
              e.pattern2WarnTimer -= delta;

              e.drawWarningArea = {
                type: "FATTY_FAN_WARNING",
                angle: e.pattern2Angle,
                radius: 190, // slightly shorter radius for successive quick swipes
                spread: Math.PI * 2 / 3, // 120 degrees spread
                timer: e.pattern2WarnTimer,
              };

              if (e.pattern2WarnTimer <= 0) {
                e.pattern2Phase = "SCRATCH_ATTACK";
              }

            } else if (e.pattern2Phase === "SCRATCH_ATTACK") {
              e.drawWarningArea = null;

              // Check if player is within range and within 120 degrees fan
              const pDist = Math.hypot(g.player.x - e.x, g.player.y - e.y);
              const pAngle = Math.atan2(g.player.y - e.y, g.player.x - e.x);

              let angleDiff = pAngle - e.pattern2Angle;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

              // within 190px range and 120 degrees spread (Math.PI/3 on either side)
              if (pDist <= 190 && Math.abs(angleDiff) <= (Math.PI / 3)) {
                damagePlayer(25); // Deal 25 damage per hit

                // Intense strike visual effects (강렬한 타격 연출!)
                g.screenShake = 18; // Massive shake

                g.claws = g.claws || [];
                g.claws.push({
                  x: g.player.x,
                  y: g.player.y,
                  angle: e.pattern2Angle,
                  timer: 450,
                  maxTimer: 450,
                });

                g.damageTexts.push({
                  x: g.player.x,
                  y: g.player.y - 30,
                  text: "💥 무자비한 할퀴기! 💥",
                  color: "#f43f5e",
                  size: 16,
                  life: 1.4,
                });

                if (soundEnabledRef.current) soundEngine.playHit();
                
                // Spawn blood burst impact particles
                for (let i = 0; i < 18; i++) {
                  const pAng = Math.random() * Math.PI * 2;
                  const pSpd = 2 + Math.random() * 6;
                  g.particles.push({
                    x: g.player.x,
                    y: g.player.y,
                    dx: Math.cos(pAng) * pSpd,
                    dy: Math.sin(pAng) * pSpd,
                    size: 3 + Math.random() * 5,
                    color: "#dc2626", // Blood red
                    life: 0.7,
                    decay: 0.03,
                  });
                }
              } else {
                // If we missed the player, still trigger a claw slash visual at boss's front
                g.claws = g.claws || [];
                g.claws.push({
                  x: e.x + Math.cos(e.pattern2Angle) * 60,
                  y: e.y + Math.sin(e.pattern2Angle) * 60,
                  angle: e.pattern2Angle,
                  timer: 350,
                  maxTimer: 350,
                });
              }

              // Only dash forward if we haven't completed 2 dashes (Stage 0 and Stage 1 dashes)
              if (e.pattern2AttackStage < 2) {
                e.pattern2Phase = "DASH";
                e.pattern2DashTimer = 150; // 0.15s ultra rapid dash
                e.pattern2DashDx = Math.cos(e.pattern2Angle);
                e.pattern2DashDy = Math.sin(e.pattern2Angle);
              } else {
                // Done with 3rd scratch attack, finish pattern (no dash for the last one)
                e.state = "NORMAL";
                e.patternTimer = 0;
                e.pattern2Phase = undefined;
              }

            } else if (e.pattern2Phase === "DASH") {
              e.pattern2DashTimer -= delta;

              // Move forward (increased speed multiplier to 5.5 for high-speed, long lunge)
              e.x += e.pattern2DashDx * e.speed * 5.5 * (delta / 16.6);
              e.y += e.pattern2DashDy * e.speed * 5.5 * (delta / 16.6);

              // Spawn dusty trailing particles
              if (Math.random() < 0.4) {
                g.particles.push({
                  x: e.x + (Math.random() - 0.5) * 16,
                  y: e.y + (Math.random() - 0.5) * 16,
                  dx: -e.pattern2DashDx * 1.5,
                  dy: -e.pattern2DashDy * 1.5,
                  size: 3 + Math.random() * 4,
                  color: "#475569",
                  life: 0.5,
                  decay: 0.05,
                });
              }

              if (e.pattern2DashTimer <= 0) {
                e.pattern2Phase = "RECOVERY";
                e.pattern2RecoveryTimer = 100; // ultra short recovery delay (from 180)
              }

            } else if (e.pattern2Phase === "RECOVERY") {
              e.pattern2RecoveryTimer -= delta;

              if (e.pattern2RecoveryTimer <= 0) {
                // Increment stage
                e.pattern2AttackStage++;
                e.pattern2Phase = "SCRATCH_WARN";
                e.pattern2WarnTimer = 140; // swift pre-indicator for next strike
                // Dynamic re-aiming towards the player's new position!
                e.pattern2Angle = Math.atan2(g.player.y - e.y, g.player.x - e.x);
              }
            }

          } else if (e.state === "PATTERN_4_SCREAM") {
            // 보스가 잠시 멈추고 소리를 지름.
            e.pattern4Timer -= delta;

            // Tremble slightly while screaming
            e.x += (Math.random() - 0.5) * 2;
            e.y += (Math.random() - 0.5) * 2;

            if (e.pattern4Timer <= 0) {
              e.state = "NORMAL";
              e.patternTimer = 0;

              // 이후 플레이어 주변에서 '좀비'가 생성됨.
              // Spawn 4 summoned zombies around the player with 1s tombstone delay
              for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI * 2) / 4 + Math.random() * 0.5;
                const dist = 120 + Math.random() * 60;
                const zx = g.player.x + Math.cos(angle) * dist;
                const zy = g.player.y + Math.sin(angle) * dist;

                spawnedEnemiesThisFrame.push({
                  type: "SUMMONED_ZOMBIE",
                  x: zx,
                  y: zy,
                  hp: 1200, // extremely sturdy summoned zombies (increased from 350)
                  maxHp: 1200,
                  damage: 12,
                  speed: 1.5,
                  radius: 15,
                  color: "#16a34a", // dark rotting green
                  tombstoneTimer: 1000, // 1 second tombstone rising phase
                  tombstoneExploded: false,
                });
              }
            }
          }
        } else {
          // Other Bosses (General or 4, 6, 8 min Bosses)
          e.shootTimer = (e.shootTimer || 0) + delta;
          const maxShootInterval = e.name && e.name.includes("정예") ? 1800 : 3000;
          
          if (e.shootTimer >= maxShootInterval) {
            e.shootTimer = 0;
            
            // Elite bosses shoot custom projectiles
            if (e.name && e.name.includes("정예 레이저 수호자")) {
              // 3 radial spreads
              for (let j = 0; j < 3; j++) {
                const baseAngle = Math.atan2(dy, dx) + (j - 1) * 0.25;
                g.projectiles.push({
                  type: "ACID_BALL",
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(baseAngle),
                  dy: Math.sin(baseAngle),
                  speed: 4.2,
                  size: 11,
                  damage: e.damage * 0.9,
                  color: e.color,
                  life: 3500,
                });
              }
            } else if (e.name && e.name.includes("정예 메탈 기어 골렘")) {
              // 8-directional projectile burst
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                g.projectiles.push({
                  type: "ACID_BALL",
                  x: e.x,
                  y: e.y,
                  dx: Math.cos(angle),
                  dy: Math.sin(angle),
                  speed: 3.5,
                  size: 12,
                  damage: e.damage * 0.8,
                  color: e.color,
                  life: 4000,
                });
              }
            } else if (e.name && e.name.includes("정예 차원 침략자")) {
              // Targeted fast projectile cascade
              for (let j = 0; j < 5; j++) {
                setTimeout(() => {
                  if (e.hp <= 0 || !g.enemies.includes(e)) return;
                  const currentDx = g.player.x - e.x;
                  const currentDy = g.player.y - e.y;
                  const angle = Math.atan2(currentDy, currentDx);
                  g.projectiles.push({
                    type: "ACID_BALL",
                    x: e.x,
                    y: e.y,
                    dx: Math.cos(angle),
                    dy: Math.sin(angle),
                    speed: 5.5,
                    size: 10,
                    damage: e.damage * 0.7,
                    color: e.color,
                    life: 3000,
                  });
                }, j * 120);
              }
            } else {
              // Normal boss shoot single standard projectile
              const angle = Math.atan2(dy, dx);
              g.projectiles.push({
                type: "ACID_BALL",
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: 3.0,
                size: 10,
                damage: e.damage * 0.7,
                color: e.color,
                life: 3000,
              });
            }
          }

          // Move toward player (if not trapped inside Super Black Hole and not resurrecting)
          if (!e.isBlackHoleTrapped && !e.isResurrecting) {
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          }
        }
      } else {
        // Move forward (or handle SUMMONED_ZOMBIE tombstone delay)
        if (e.type === "SUMMONED_ZOMBIE" && e.tombstoneTimer && e.tombstoneTimer > 0) {
          e.tombstoneTimer -= delta;
          if (e.tombstoneTimer <= 0 && !e.tombstoneExploded) {
            e.tombstoneExploded = true;
            // Spawn crumbly dirt/stone breaking particles!
            for (let i = 0; i < 15; i++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = 1 + Math.random() * 3;
              g.particles.push({
                x: e.x,
                y: e.y,
                dx: Math.cos(pAngle) * pSpeed,
                dy: Math.sin(pAngle) * pSpeed,
                size: 3 + Math.random() * 4,
                color: Math.random() < 0.5 ? "#64748b" : "#78350f", // grey or dirt brown
                life: 0.6,
                decay: 0.04,
              });
            }
          }
        } else {
          // Block movement if trapped inside Super Black Hole or resurrecting
          if (!e.isBlackHoleTrapped && !e.isResurrecting) {
            const angle = Math.atan2(dy, dx);
            e.x += Math.cos(angle) * e.speed * (delta / 16.6);
            e.y += Math.sin(angle) * e.speed * (delta / 16.6);
          }
        }
      }

      // Deal damage to Player on collision (only if not trapped inside the Super Black Hole and not resurrecting)
      if (dist < g.player.radius + e.radius && !e.isBlackHoleTrapped && !e.isResurrecting) {
        if (e.type === "SUMMONED_ZOMBIE" && e.tombstoneTimer && e.tombstoneTimer > 0) {
          // No damage during spawning tombstone phase
        } else {
          damagePlayer(e.damage * (delta / 1000));
          g.screenShake = 3;

          if (e.type === "SUMMONED_ZOMBIE") {
            // 접촉할 시 3초간 출혈 피해를 입힘.(출혈: 초당 5의 피해를 입힘)
            g.player.bleedTimer = 3000; // 3 seconds
            g.player.bleedTick = (g.player.bleedTick || 0); // maintain ticks
          }

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
        }
      }

      return true;
    });

    // 안전하게 이번 프레임에 소환된 적들을 추가
    if (spawnedEnemiesThisFrame.length > 0) {
      g.enemies.push(...spawnedEnemiesThisFrame);
    }

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
        name: normalBoss.name || "무법 파괴대왕 메카 보스",
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

    // Update enemy projectiles (acid ball, dwarf knife, dwarf giant arrow)
    g.projectiles = g.projectiles.filter((p: any) => {
      if (p.type === "ACID_BALL" || p.type === "DWARF_KNIFE" || p.type === "DWARF_GIANT_ARROW") {
        p.x += p.dx * p.speed * (delta / 16.6);
        p.y += p.dy * p.speed * (delta / 16.6);
        p.life -= delta;

        const dist = Math.hypot(g.player.x - p.x, g.player.y - p.y);
        if (dist < g.player.radius + p.size / 2) {
          damagePlayer(p.damage);
          g.screenShake = p.type === "DWARF_GIANT_ARROW" ? 10 : 4;
          if (p.isPoisonArrow && !g.player.isGodMode) {
            g.player.poisonTimer = 10000;
            g.player.poisonTick = 0;
            g.damageTexts.push({
              x: g.player.x,
              y: g.player.y - 35,
              text: "☠️ 맹독 출혈 화살 적중! (10초간 지속 데미지) ☠️",
              color: "#a855f7",
              size: 15,
              life: 2.5,
            });
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
    const baseMult = isEarly ? 8.5 : 3.5;
    const passiveXpMult = g.player.xpMultiplier || 1.0;
    const xpMult = baseMult * passiveXpMult;

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

  const spawnBoss = (minutesOverride?: number) => {
    const g = gameState.current;
    g.bossSpawned = true;

    // Spawn warning / screenshake
    g.screenShake = 10;
    soundEngine.playBossAlert();

    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.max(g.dimensions.width, g.dimensions.height) / 2 + 60;
    const bx = g.player.x + Math.cos(spawnAngle) * spawnDist;
    const by = g.player.y + Math.sin(spawnAngle) * spawnDist;

    const elapsed = g.player.timeElapsed;
    const minutes = minutesOverride !== undefined ? minutesOverride : (Math.round(elapsed / 60) || 1);
    
    let bossHp = 1500;
    let bossDamage = 40;
    let bossSpeed = 1.4;
    let bossRadius = 54;
    let bossColor = "#eab308";
    let bossName = "무법 파괴대왕 메카 보스";

    // Precise health mapping per user specifications (1 to 9 minutes)
    if (minutes === 1) {
      bossHp = 1500;
      bossDamage = 40;
      bossSpeed = 1.3;
      bossRadius = 54;
      bossColor = "#eab308";
      bossName = "🤖 무법 파괴대왕 메카 보스 (1분)";
    } else if (minutes === 2) {
      bossHp = 10000;
      bossDamage = 45;
      bossSpeed = 1.8;
      bossRadius = 60;
      bossColor = "#ef4444";
      bossName = "🐒 [2분 정예보스] 돌격대장 원숭이";
    } else if (minutes === 3) {
      bossHp = 15000;
      bossDamage = 50;
      bossSpeed = 1.35;
      bossRadius = 54;
      bossColor = "#f59e0b";
      bossName = "🤖 무법 파괴대왕 메카 보스 (3분)";
    } else if (minutes === 4) {
      bossHp = 30000;
      bossDamage = 55;
      bossSpeed = 1.5;
      bossRadius = 65;
      bossColor = "#ec4899"; // Distinct hot pink/magenta for anger-issue gorilla
      bossName = "🦍 [4분 정예보스] 분조장 고릴라";
    } else if (minutes === 5) {
      bossHp = 40000;
      bossDamage = 60;
      bossSpeed = 1.4;
      bossRadius = 54;
      bossColor = "#d97706";
      bossName = "🤖 무법 파괴대왕 메카 보스 (5분)";
    } else if (minutes === 6) {
      bossHp = 65000;
      bossDamage = 65;
      bossSpeed = 1.4;
      bossRadius = 45;
      bossColor = "#06b6d4";
      bossName = "🏹 [6분 정예보스] 원거리 딜러 난쟁이";
    } else if (minutes === 7) {
      bossHp = 70000;
      bossDamage = 70;
      bossSpeed = 1.45;
      bossRadius = 54;
      bossColor = "#b45309";
      bossName = "🤖 무법 파괴대왕 메카 보스 (7분)";
    } else if (minutes === 8) {
      bossHp = 110000;
      bossDamage = 80;
      bossSpeed = 1.35;
      bossRadius = 75;
      bossColor = "#16a34a"; // zombie green
      bossName = "🧟 [8분 정예보스] 좀비 뚱돼지";
    } else if (minutes === 9) {
      bossHp = 120000;
      bossDamage = 90;
      bossSpeed = 1.5;
      bossRadius = 54;
      bossColor = "#78350f";
      bossName = "🤖 무법 파괴대왕 메카 보스 (9분)";
    } else {
      const scaleFactor = Math.max(1, minutes);
      bossHp = 120000 + (scaleFactor - 9) * 30000;
      bossDamage = 90 + (scaleFactor - 9) * 10;
      bossSpeed = 1.4;
      bossRadius = 54;
      bossColor = "#eab308";
      bossName = `🤖 무법 파괴대왕 메카 보스 (${scaleFactor}분)`;
    }

    g.enemies.push({
      type: "BOSS",
      x: bx,
      y: by,
      hp: bossHp,
      maxHp: bossHp,
      damage: bossDamage,
      speed: bossSpeed,
      radius: bossRadius,
      color: bossColor,
      name: bossName,
      shootTimer: 0,
      state: "NORMAL",
      patternTimer: 0,
      halfHpTriggered: false,
    });
  };

  const forceLevelUp = () => {
    const g = gameState.current;
    g.player.level += 1;
    g.player.maxXp = Math.floor(g.player.maxXp * 1.3) + 15;
    triggerLevelUpChoices();
    updateReactHUD();
  };

  const upgradeRandomOwnedWeapon = () => {
    const g = gameState.current;
    const ownedWeaponKeys = (Object.keys(g.skills.weapons) as WeaponType[]).filter(key => {
      const w = g.skills.weapons[key];
      return w && w.level < 5 && !w.isEvo;
    });

    if (ownedWeaponKeys.length > 0) {
      const randomKey = ownedWeaponKeys[Math.floor(Math.random() * ownedWeaponKeys.length)];
      const weapon = g.skills.weapons[randomKey];
      if (weapon) {
        weapon.level += 1;
        
        const weaponNames: Record<WeaponType, string> = {
          [WeaponType.KUNAI]: "쿠나이",
          [WeaponType.SOCCER_BALL]: "축구공",
          [WeaponType.GUARDIAN]: "수호자",
          [WeaponType.MOLOTOV]: "화염병",
          [WeaponType.LIGHTNING]: "번개 발사기",
          [WeaponType.GATLING]: "전설의 개틀링건",
          [WeaponType.POOP_SPRAY]: "똥 뿌리기",
          [WeaponType.BOOMERANG]: "부메랑",
          [WeaponType.EXCALIBUR]: "엑스칼리버",
          [WeaponType.BLACK_HOLE]: "블랙홀",
        };
        const name = weaponNames[randomKey] || randomKey;
        g.particles.push(...createLevelUpSparkles(g.player.x, g.player.y));
        
        g.damageTexts.push({
          x: g.player.x,
          y: g.player.y - 40,
          text: `🔥 ${name} Lvl ${weapon.level} 자동 강화!`,
          color: "#22d3ee",
          life: 2.0,
          size: 16,
          isCritical: true,
        });
        soundEngine.playLevelUp();
      }
    } else {
      g.player.gold += 300;
      g.damageTexts.push({
        x: g.player.x,
        y: g.player.y - 40,
        text: `💰 모든 무기 최고 레벨! +300골드`,
        color: "#fbbf24",
        life: 2.0,
        size: 14,
        isCritical: false,
      });
      soundEngine.playGem();
    }
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
    // Filter out existing FINAL_BOSS instances
    g.enemies = g.enemies.filter((e: any) => e.type !== "FINAL_BOSS");
    
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
      hp: 500000,
      maxHp: 500000,
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
    if (!victory && isGodModeState) {
      g.player.hp = g.player.maxHp;
      return;
    }
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

    // Apply Camera Zoom centered on the screen
    if (g.camera.zoom && g.camera.zoom !== 1.0) {
      ctx.translate(g.dimensions.width / 2, g.dimensions.height / 2);
      ctx.scale(g.camera.zoom, g.camera.zoom);
      ctx.translate(-g.dimensions.width / 2, -g.dimensions.height / 2);
    }

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

      // If enemy is out of screen (e.g. jumping in the air), skip body drawing.
      if (e.isOutOfScreen) {
        ctx.restore();
        return;
      }

      // Soft shadow under monster
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + e.radius - 2, e.radius * 0.9, e.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

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
        const isZombieBoss = e.name && e.name.includes("좀비 뚱돼지");

        if (isZombieBoss) {
          drawZombieHead(ctx, e.x, e.y, e.radius, !!e.isResurrecting);
        } else {
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
        }

        // 5. Demonic Angry Eyes with Glowing trail or Custom Gorilla Face
        if (!isZombieBoss) {
          if (e.name && e.name.includes("분조장 고릴라")) {
            // --- 화가 난 표정의 분조장 고릴라 그리기 ---
            // 1. 고릴라 주둥이/턱 부근 얼굴 영역 (Facial Mask)
            ctx.fillStyle = "#1e1b4b"; // 어두운 남색/검정 계열의 고릴라 피부색
            ctx.beginPath();
            ctx.arc(e.x, e.y + e.radius * 0.1, e.radius * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // 2. 찡그린 미간 주름 (Angry Forehead Wrinkles)
            ctx.strokeStyle = "#ef4444"; // 붉은 핏줄/화난 주름 연출
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            
            // 미간 중앙 가로 주름들
            ctx.beginPath();
            ctx.moveTo(e.x - e.radius * 0.2, e.y - e.radius * 0.3);
            ctx.lineTo(e.x + e.radius * 0.2, e.y - e.radius * 0.3);
            ctx.moveTo(e.x - e.radius * 0.15, e.y - e.radius * 0.22);
            ctx.lineTo(e.x + e.radius * 0.15, e.y - e.radius * 0.22);
            ctx.stroke();

            // 3. 치켜뜬 성난 고릴라 눈 (Super Angry Glowing Eyes)
            // 눈 테두리 (검정)
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(e.x - e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.18, 0, Math.PI * 2);
            ctx.arc(e.x + e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.18, 0, Math.PI * 2);
            ctx.fill();

            // 눈 내부 불타는 붉은색/노란색 그라데이션 광기
            ctx.fillStyle = "#f43f5e"; // Rose 500
            ctx.beginPath();
            ctx.ellipse(e.x - e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.15, e.radius * 0.08, -Math.PI / 8, 0, Math.PI * 2);
            ctx.ellipse(e.x + e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.15, e.radius * 0.08, Math.PI / 8, 0, Math.PI * 2);
            ctx.fill();

            // 이글거리는 노란 눈동자
            ctx.fillStyle = "#fbbf24"; // Amber 400
            ctx.beginPath();
            ctx.arc(e.x - e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.06, 0, Math.PI * 2);
            ctx.arc(e.x + e.radius * 0.28, e.y - e.radius * 0.12, e.radius * 0.06, 0, Math.PI * 2);
            ctx.fill();

            // 4. 강하게 찌푸린 눈썹 (Strong Angry Eyebrows)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 5;
            ctx.beginPath();
            // 왼쪽 눈썹 (바깥에서 중앙 아래로 급경사)
            ctx.moveTo(e.x - e.radius * 0.5, e.y - e.radius * 0.28);
            ctx.lineTo(e.x - e.radius * 0.12, e.y - e.radius * 0.14);
            // 오른쪽 눈썹
            ctx.moveTo(e.x + e.radius * 0.5, e.y - e.radius * 0.28);
            ctx.lineTo(e.x + e.radius * 0.12, e.y - e.radius * 0.14);
            ctx.stroke();

            // 5. 큼직한 고릴라 콧구멍 (Gorilla Flared Nostrils)
            ctx.fillStyle = "#090514";
            ctx.beginPath();
            ctx.ellipse(e.x - e.radius * 0.08, e.y + e.radius * 0.1, e.radius * 0.08, e.radius * 0.05, -Math.PI/6, 0, Math.PI * 2);
            ctx.ellipse(e.x + e.radius * 0.08, e.y + e.radius * 0.1, e.radius * 0.08, e.radius * 0.05, Math.PI/6, 0, Math.PI * 2);
            ctx.fill();

            // 콧구멍 찡그린 선들
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x - e.radius * 0.12, e.y + e.radius * 0.02);
            ctx.lineTo(e.x, e.y + e.radius * 0.08);
            ctx.lineTo(e.x + e.radius * 0.12, e.y + e.radius * 0.02);
            ctx.stroke();

            // 6. 극도로 화난 입과 사나운 송곳니 (Roaring Mouth & Fangs)
            // 벌린 거대한 입 모양 (으르렁거리는 타원형)
            ctx.fillStyle = "#090514"; // 입속 어둠
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(e.x, e.y + e.radius * 0.38, e.radius * 0.38, e.radius * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 빨간 혀
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.ellipse(e.x, e.y + e.radius * 0.46, e.radius * 0.22, e.radius * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();

            // 뾰족하고 거대한 송곳니 그리기 (Fangs)
            ctx.fillStyle = "#ffffff";
            const drawGorillaFang = (fx: number, fy: number, sizeW: number, sizeH: number, isUpper: boolean) => {
              ctx.beginPath();
              ctx.moveTo(fx - sizeW / 2, fy);
              ctx.lineTo(fx + sizeW / 2, fy);
              ctx.lineTo(fx, isUpper ? fy + sizeH : fy - sizeH);
              ctx.closePath();
              ctx.fill();
            };

            // 윗니 송곳니 (양옆 크게 2개)
            drawGorillaFang(e.x - e.radius * 0.24, e.y + e.radius * 0.24, e.radius * 0.1, e.radius * 0.15, true);
            drawGorillaFang(e.x + e.radius * 0.24, e.y + e.radius * 0.24, e.radius * 0.1, e.radius * 0.15, true);
            // 아랫니 송곳니 (가운데 크게 2개 올라옴)
            drawGorillaFang(e.x - e.radius * 0.12, e.y + e.radius * 0.5, e.radius * 0.08, e.radius * 0.14, false);
            drawGorillaFang(e.x + e.radius * 0.12, e.y + e.radius * 0.5, e.radius * 0.08, e.radius * 0.14, false);

            // 소형 이빨 가이드 (자잘하게 채우기)
            drawGorillaFang(e.x - e.radius * 0.04, e.y + e.radius * 0.24, e.radius * 0.06, e.radius * 0.08, true);
            drawGorillaFang(e.x + e.radius * 0.04, e.y + e.radius * 0.24, e.radius * 0.06, e.radius * 0.08, true);
          } else {
            if (g.cinematic && g.cinematic.type === "victory" && e === g.cinematic.bossId) {
              // --- DIZZY DEFEATED VICTORY EXPRESSION (X - X) ---
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 4.5;
              ctx.lineCap = "round";

              // Left X eye
              ctx.beginPath();
              ctx.moveTo(e.x - e.radius * 0.35, e.y - e.radius * 0.25);
              ctx.lineTo(e.x - e.radius * 0.15, e.y - e.radius * 0.05);
              ctx.moveTo(e.x - e.radius * 0.15, e.y - e.radius * 0.25);
              ctx.lineTo(e.x - e.radius * 0.35, e.y - e.radius * 0.05);
              ctx.stroke();

              // Right X eye
              ctx.beginPath();
              ctx.moveTo(e.x + e.radius * 0.15, e.y - e.radius * 0.25);
              ctx.lineTo(e.x + e.radius * 0.35, e.y - e.radius * 0.05);
              ctx.moveTo(e.x + e.radius * 0.35, e.y - e.radius * 0.25);
              ctx.lineTo(e.x + e.radius * 0.15, e.y - e.radius * 0.05);
              ctx.stroke();

              // Dizzy/Defeated squiggly mouth
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 3;
              ctx.beginPath();
              const mouthY = e.y + e.radius * 0.25;
              ctx.moveTo(e.x - e.radius * 0.2, mouthY);
              ctx.bezierCurveTo(e.x - e.radius * 0.1, mouthY - 8, e.x + e.radius * 0.1, mouthY + 8, e.x + e.radius * 0.2, mouthY);
              ctx.stroke();
            } else {
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
            }
          }
        }

        // Draw custom invulnerability shield if active (Gorilla Pattern 3)
        if (e.isInvulnerable) {
          ctx.save();
          const shieldPulse = Math.sin(Date.now() / 80) * 8;
          ctx.strokeStyle = "rgba(251, 191, 36, 0.95)"; // golden yellow
          ctx.lineWidth = 4 + Math.sin(Date.now() / 50) * 1.5;
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius * 1.25 + shieldPulse, 0, Math.PI * 2);
          ctx.stroke();

          // Translucent interior grid / overlay
          ctx.fillStyle = "rgba(251, 191, 36, 0.08)";
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius * 1.25 + shieldPulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
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

        // Draw tombstone if spawning SUMMONED_ZOMBIE
        if (e.type === "SUMMONED_ZOMBIE" && e.tombstoneTimer && e.tombstoneTimer > 0) {
          ctx.save();
          // Tombstone rising effect based on remaining timer (grows/fades in)
          const ratio = Math.min(1.0, (1000 - e.tombstoneTimer) / 1000); // 0.0 to 1.0
          ctx.globalAlpha = ratio;
          ctx.fillStyle = "#64748b"; // slate-grey headstone
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          const tw = e.radius * 1.5;
          const th = e.radius * 2.2 * ratio; // rise up from bottom
          
          // Draw tombstone shape (arch top, flat bottom)
          ctx.beginPath();
          ctx.moveTo(e.x - tw / 2, e.y + e.radius); // bottom-left
          ctx.lineTo(e.x - tw / 2, e.y + e.radius - th * 0.9); // up left side
          ctx.quadraticCurveTo(e.x, e.y + e.radius - th * 1.5, e.x + tw / 2, e.y + e.radius - th * 0.9); // arch top
          ctx.lineTo(e.x + tw / 2, e.y + e.radius); // down right side
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw RIP cross on headstone
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 2;
          ctx.beginPath();
          // vertical line of cross
          ctx.moveTo(e.x, e.y + e.radius - th * 0.7);
          ctx.lineTo(e.x, e.y + e.radius - th * 0.1);
          // horizontal line of cross
          ctx.moveTo(e.x - tw * 0.2, e.y + e.radius - th * 0.55);
          ctx.lineTo(e.x + tw * 0.2, e.y + e.radius - th * 0.55);
          ctx.stroke();

          // Draw some dirt/earth at base
          ctx.fillStyle = "#78350f"; // brown dirt
          ctx.beginPath();
          ctx.ellipse(e.x, e.y + e.radius, tw * 0.7, th * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          if (e.type === "SUMMONED_ZOMBIE") {
            drawZombieHead(ctx, e.x, e.y, e.radius, false);
          } else {
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
        }
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

    // 5-2. Draw Boss & Enemy Attack Warning Zones (모든 몬스터 본체 렌더링 후 최상위에 표시하여 가려짐 방지)
    g.enemies.forEach((e: any) => {
      // 1) Out of screen GORILLA_JUMP indicator
      if (e.isOutOfScreen && e.drawWarningArea && e.drawWarningArea.type === "GORILLA_JUMP") {
        ctx.save();
        const flashIntensity = Math.abs(Math.sin(Date.now() / 100));
        ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + flashIntensity * 0.35})`;
        ctx.beginPath();
        ctx.arc(e.drawWarningArea.targetX, e.drawWarningArea.targetY, e.drawWarningArea.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 30, 30, ${0.8 + flashIntensity * 0.2})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(e.drawWarningArea.targetX, e.drawWarningArea.targetY, e.drawWarningArea.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(e.drawWarningArea.targetX - 15, e.drawWarningArea.targetY);
        ctx.lineTo(e.drawWarningArea.targetX + 15, e.drawWarningArea.targetY);
        ctx.moveTo(e.drawWarningArea.targetX, e.drawWarningArea.targetY - 15);
        ctx.lineTo(e.drawWarningArea.targetX, e.drawWarningArea.targetY + 15);
        ctx.stroke();
        ctx.restore();
      }

      // 2) Charging or Slam Prep warning circle & dash line
      if (e.state === "CHARGING" || e.state === "SLAM_PREP") {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 20, 20, 0.85)";
        ctx.fillStyle = "rgba(255, 20, 20, 0.18)";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 2 + Math.sin(Date.now() / 40) * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (e.patternType === "DASH" && e.dashDx !== undefined) {
          ctx.strokeStyle = "rgba(255, 10, 10, 0.85)";
          ctx.lineWidth = 5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + e.dashDx * 300, e.y + e.dashDy * 300);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // 3) Custom drawWarningArea (Aiming Laser, Gorilla Aiming, Gorilla Jump, Half HP Giant Slam)
      if (e.drawWarningArea && !e.isOutOfScreen) {
        ctx.save();
        if (e.drawWarningArea.type === "AIMING" || e.drawWarningArea.type === "GORILLA_AIMING") {
          ctx.strokeStyle = "rgba(255, 0, 0, 0.95)";
          ctx.lineWidth = 4.5;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.drawWarningArea.aimX, e.drawWarningArea.aimY);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255, 0, 0, 0.45)";
          ctx.beginPath();
          ctx.arc(e.drawWarningArea.aimX, e.drawWarningArea.aimY, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.drawWarningArea.aimX, e.drawWarningArea.aimY, 18, 0, Math.PI * 2);
          ctx.stroke();
        } else if (e.drawWarningArea.type === "GORILLA_JUMP") {
          const flashIntensity = Math.abs(Math.sin(Date.now() / 100));
          ctx.fillStyle = `rgba(255, 30, 30, ${0.25 + flashIntensity * 0.35})`;
          ctx.beginPath();
          ctx.arc(e.drawWarningArea.targetX, e.drawWarningArea.targetY, e.drawWarningArea.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255, 0, 0, ${0.8 + flashIntensity * 0.2})`;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.arc(e.drawWarningArea.targetX, e.drawWarningArea.targetY, e.drawWarningArea.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(e.drawWarningArea.targetX - 15, e.drawWarningArea.targetY);
          ctx.lineTo(e.drawWarningArea.targetX + 15, e.drawWarningArea.targetY);
          ctx.moveTo(e.drawWarningArea.targetX, e.drawWarningArea.targetY - 15);
          ctx.lineTo(e.drawWarningArea.targetX, e.drawWarningArea.targetY + 15);
          ctx.stroke();
        } else if (e.drawWarningArea.type === "HALF_HP_PREPARING") {
          const flashIntensity = Math.abs(Math.sin(Date.now() / 120));
          ctx.fillStyle = `rgba(255, 0, 0, ${0.22 + flashIntensity * 0.28})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.drawWarningArea.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255, 10, 10, ${0.7 + flashIntensity * 0.3})`;
          ctx.lineWidth = 4.5;
          ctx.setLineDash([12, 6]);
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.drawWarningArea.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 13px sans-serif";
          ctx.textAlign = "center";
          const secsLeft = Math.max(0, e.drawWarningArea.timer / 1000).toFixed(1);
          ctx.fillText(`🚨 광역 지진 발동 대기: ${secsLeft}초 🚨`, e.x, e.y - e.radius - 25);
        } else if (e.drawWarningArea.type === "FATTY_FAN_WARNING") {
          const flashIntensity = Math.abs(Math.sin(Date.now() / 100));
          const { angle, radius, spread } = e.drawWarningArea;
          const startAngle = angle - spread / 2;
          const endAngle = angle + spread / 2;

          ctx.fillStyle = `rgba(239, 68, 68, ${0.18 + flashIntensity * 0.22})`; // red fan fill
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.arc(e.x, e.y, radius, startAngle, endAngle);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + flashIntensity * 0.3})`; // red outer arc
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(e.x, e.y, radius, startAngle, endAngle);
          ctx.stroke();

          // Border lines connecting boss to arc
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(startAngle) * radius, e.y + Math.sin(startAngle) * radius);
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(endAngle) * radius, e.y + Math.sin(endAngle) * radius);
          ctx.stroke();
        }
        ctx.restore();
      }
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

      if (p.type === "BOOMERANG") {
        ctx.translate(p.x, p.y);
        ctx.rotate((p.timer || 0) * 0.025);
        ctx.strokeStyle = p.isEvo ? "#ec4899" : "#06b6d4";
        ctx.lineWidth = p.isEvo ? 4.5 : 3;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = p.isEvo ? 12 : 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 1.6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-p.size * 0.8, 0);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.moveTo(0, -p.size * 0.8);
        ctx.lineTo(0, p.size * 0.8);
        ctx.stroke();
      }

      if (p.type === "EXCALIBUR") {
        ctx.translate(p.x, p.y - (p.dropOffset || 0));
        ctx.strokeStyle = p.isEvo ? "#ec4899" : "#eab308";
        ctx.fillStyle = p.isEvo ? "#fbcfe8" : "#fef08a";
        ctx.shadowColor = p.isEvo ? "#db2777" : "#ca8a04";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.moveTo(0, 35);
        ctx.lineTo(-12, -22);
        ctx.lineTo(12, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillRect(-20, -28, 40, 6);
        ctx.fillRect(-6, -50, 12, 22);

        if (p.impacted) {
          ctx.strokeStyle = (p.isEvo ? "rgba(236, 72, 153, " : "rgba(234, 179, 8, ") + Math.max(0, p.life / 800) + ")";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, p.dropOffset || 0, p.radius * (1 - p.life / 800), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (p.type === "BLACK_HOLE") {
        ctx.translate(p.x, p.y);
        ctx.rotate((p.life || 0) * -0.012);
        ctx.strokeStyle = p.isEvo ? "#ec4899" : "#8b5cf6";
        ctx.lineWidth = 4;
        ctx.shadowColor = p.isEvo ? "#f472b6" : "#c084fc";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, p.damageRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#030712";
        ctx.beginPath();
        ctx.arc(0, 0, p.damageRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.isEvo ? "#fbcfe8" : "#d8b4fe";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, p.damageRadius * 0.85, i * 2.1, i * 2.1 + 1.2);
          ctx.stroke();
        }
      }

      if (p.type === "SUPER_BLACK_HOLE") {
        ctx.translate(p.x, p.y);
        ctx.rotate((p.life || 0) * -0.01);
        
        // 1. Draw outer gravitational warning wave / distortion field
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.lineWidth = 14;
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 35;
        ctx.beginPath();
        const waveRadius = p.pullRadius * (0.88 + Math.sin((p.life || 0) * 0.003) * 0.06);
        ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Draw outer nebula gas glow
        const gradient = ctx.createRadialGradient(0, 0, p.damageRadius * 0.3, 0, 0, p.damageRadius * 1.8);
        gradient.addColorStop(0, "rgba(2, 6, 23, 0.95)");
        gradient.addColorStop(0.3, "rgba(79, 70, 229, 0.35)");
        gradient.addColorStop(0.7, "rgba(219, 39, 119, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.damageRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw event horizon line
        ctx.strokeStyle = "#db2777";
        ctx.lineWidth = 7;
        ctx.shadowColor = "#f472b6";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, p.damageRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Draw accretion disk swirls (4 beautiful cosmic arms)
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, p.damageRadius * 1.25, i * (Math.PI / 2), i * (Math.PI / 2) + 1.15);
          ctx.stroke();
        }

        // 5. Singularity core (absolute pitch black abyss)
        ctx.fillStyle = "#020617";
        ctx.shadowColor = "#db2777";
        ctx.shadowBlur = 55;
        ctx.beginPath();
        ctx.arc(0, 0, p.damageRadius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

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
        if (p.isRock) {
          // Draw boulder / stone with a beautiful crack and shading
          ctx.fillStyle = "#78350f"; // Dark brown
          ctx.strokeStyle = "#451a03"; // Darker outline
          ctx.lineWidth = 1.5;
          ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
          ctx.shadowBlur = 5;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Add a simple stone crack line for visual flair
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size / 4, p.y - p.size / 4);
          ctx.lineTo(p.x + p.size / 6, p.y + p.size / 6);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (p.type === "DWARF_KNIFE") {
        const angle = Math.atan2(p.dy, p.dx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = "#0891b2";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(p.size, 0);
        ctx.lineTo(-p.size * 0.6, -p.size * 0.4);
        ctx.lineTo(-p.size * 0.6, p.size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      if (p.type === "DWARF_GIANT_ARROW") {
        const angle = Math.atan2(p.dy, p.dx);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#7f1d1d";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#dc2626";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(p.size, 0);
        ctx.lineTo(0, -p.size * 0.45);
        ctx.lineTo(p.size * 0.2, 0);
        ctx.lineTo(0, p.size * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(-p.size * 0.8, -4, p.size, 8);
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

    // Draw Boss Claw Slash Effects
    if (g.claws) {
      g.claws.forEach((claw: any) => {
        ctx.save();
        ctx.translate(claw.x, claw.y);
        ctx.rotate(claw.angle);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
        ctx.lineWidth = 6 * (claw.timer / claw.maxTimer);
        ctx.globalAlpha = claw.timer / claw.maxTimer;
        ctx.lineCap = "round";
        
        // Add red glow effect to the slash marks for heavy impact feel
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15;

        const length = 120;
        const spacing = 18;
        for (let i = -1; i <= 1; i++) {
          const offset = i * spacing;
          ctx.beginPath();
          ctx.moveTo(-length / 2, offset - 15);
          ctx.quadraticCurveTo(0, offset + 15, length / 2, offset - 15);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

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

    // 10. Draw Off-screen Boss indicators in Screen Space
    const W = g.dimensions.width;
    const H = g.dimensions.height;

    // Player screen position
    const px = g.player.x - g.camera.x;
    const py = g.player.y - g.camera.y;

    g.enemies.forEach((e: any) => {
      const isBoss = e.type === "BOSS" || e.type === "MINI_BOSS" || e.type === "FINAL_BOSS";
      if (!isBoss) return;

      // Boss screen position
      const bx = e.x - g.camera.x;
      const by = e.y - g.camera.y;

      // Margin from screen borders
      const margin = 28;

      // Check if Boss is off-screen (with margin)
      const isOffScreen = bx < margin || bx > W - margin || by < margin || by > H - margin;

      if (isOffScreen) {
        // Calculate vector from player to boss
        const dx = bx - px;
        const dy = by - py;
        const angle = Math.atan2(dy, dx);

        // Find intersection point on the screen margin boundaries
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let tX = Infinity;
        let tY = Infinity;

        if (cos > 0) {
          tX = (W - margin - px) / cos;
        } else if (cos < 0) {
          tX = (margin - px) / cos;
        }

        if (sin > 0) {
          tY = (H - margin - py) / sin;
        } else if (sin < 0) {
          tY = (margin - py) / sin;
        }

        const t = Math.min(tX, tY);
        const edgeX = px + cos * t;
        const edgeY = py + sin * t;

        // Draw indicator arrow
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);

        // Arrow style based on boss type
        // The strength order: BOSS (weakest) < MINI_BOSS (medium) < FINAL_BOSS (strongest)
        let mainColor = "#eab308"; // BOSS: Golden Yellow
        let label = "BOSS";
        let arrowStyle = "standard";

        if (e.type === "FINAL_BOSS") {
          mainColor = "#ef4444"; // FINAL_BOSS: Crimson Red
          arrowStyle = "triple-chevron";
          label = "⚠️ FINAL ⚠️";
        } else if (e.type === "MINI_BOSS") {
          // MINI_BOSS: Neon Pink/Magenta/Purple
          mainColor = e.color || "#ec4899";
          arrowStyle = "double-chevron";
          label = "ELITE";
        }

        // Draw glowing aura / base circle
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Reset shadow for the nested elements to keep them crisp
        ctx.shadowBlur = 0;

        // Draw Arrowhead pointing outwards (pointing to the right in the rotated space)
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        if (arrowStyle === "standard") {
          // Medium single triangle pointing right (rotated towards boss)
          ctx.moveTo(8, 0);
          ctx.lineTo(-4, -6);
          ctx.lineTo(-1, 0);
          ctx.lineTo(-4, 6);
        } else if (arrowStyle === "double-chevron") {
          // Double triangle chevrons pointing right
          ctx.moveTo(9, 0);
          ctx.lineTo(1, -7);
          ctx.lineTo(4, 0);
          ctx.lineTo(1, 7);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(2, 0);
          ctx.lineTo(-6, -7);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 7);
        } else if (arrowStyle === "triple-chevron") {
          // Heavy triple chevron pointing right (extremely dangerous look)
          ctx.moveTo(11, 0);
          ctx.lineTo(4, -8);
          ctx.lineTo(7, 0);
          ctx.lineTo(4, 8);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-2, -8);
          ctx.lineTo(1, 0);
          ctx.lineTo(-2, 8);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-1, 0);
          ctx.lineTo(-8, -8);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-8, 8);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Draw small text label above or below the arrow in non-rotated screen-space
        ctx.save();
        ctx.font = `bold 9px "JetBrains Mono", monospace`;
        ctx.fillStyle = mainColor;
        ctx.textAlign = "center";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        
        // Calculate offset for text based on position
        let textOffsetY = 24;
        if (edgeY > H - 40) {
          textOffsetY = -24; // Draw above if at the bottom of the screen
        }
        ctx.fillText(label, edgeX, edgeY + textOffsetY);

        // Distance indicator to boss
        const distPx = Math.round(Math.hypot(e.x - g.player.x, e.y - g.player.y));
        ctx.fillStyle = "#cbd5e1"; // light slate gray
        ctx.font = `bold 8px "JetBrains Mono", monospace`;
        ctx.fillText(`${distPx}m`, edgeX, edgeY + textOffsetY + (textOffsetY > 0 ? 9 : -9));

        ctx.restore();
      }
    });
  };

  // --- DEVELOPER MODE CONTROLS ---
  const toggleGodMode = () => {
    const g = gameState.current;
    const nextVal = !isGodModeState;
    g.player.isGodMode = nextVal;
    if (nextVal) {
      g.player.hp = g.player.maxHp;
    }
    setIsGodModeState(nextVal);
    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devAdjustTime = (secondsChange: number) => {
    const g = gameState.current;
    const oldTime = g.player.timeElapsed;
    g.player.timeElapsed = Math.max(0, g.player.timeElapsed + secondsChange);
    const actualChange = g.player.timeElapsed - oldTime;

    // Decrease limit time if final boss is active
    if (g.finalBossActive) {
      g.finalBossTimer = Math.max(0, g.finalBossTimer - actualChange);
    }

    // Core fix: Align nextBossSpawnTime to avoid spawning historical or duplicate bosses on time skip
    g.nextBossSpawnTime = Math.ceil((g.player.timeElapsed + 1) / 60) * 60;

    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devSetTimeExact = (seconds: number) => {
    const g = gameState.current;
    const oldTime = g.player.timeElapsed;
    g.player.timeElapsed = Math.max(0, seconds);
    const actualChange = g.player.timeElapsed - oldTime;

    // Decrease limit time if final boss is active
    if (g.finalBossActive) {
      g.finalBossTimer = Math.max(0, g.finalBossTimer - actualChange);
    }

    // Core fix: Align nextBossSpawnTime to avoid spawning historical or duplicate bosses on time skip
    g.nextBossSpawnTime = Math.ceil((g.player.timeElapsed + 1) / 60) * 60;

    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devSetWeaponLevel = (id: WeaponType, level: number, isEvo: boolean) => {
    const g = gameState.current;
    g.skills.weapons[id] = { level, isEvo };
    g.activeWeaponEvolutions[id] = isEvo;
    
    // Clear active GUARDIAN projectiles so they recreate with the new level settings
    if (id === WeaponType.GUARDIAN) {
      g.projectiles = g.projectiles.filter((p: any) => p.type !== "GUARDIAN");
    }
    
    soundEngine.playEvo();
    g.particles.push(...createLevelUpSparkles(g.player.x, g.player.y));
    updateReactHUD();
  };

  const devGiveAllWeaponsMax = (isEvo: boolean) => {
    const g = gameState.current;
    Object.values(WeaponType).forEach((id) => {
      g.skills.weapons[id] = { level: 5, isEvo };
      g.activeWeaponEvolutions[id] = isEvo;
    });
    // Clear active GUARDIAN projectiles so they recreate with correct max level settings
    g.projectiles = g.projectiles.filter((p: any) => p.type !== "GUARDIAN");
    soundEngine.playEvo();
    g.particles.push(...createLevelUpSparkles(g.player.x, g.player.y));
    updateReactHUD();
  };

  const devClearAllWeapons = () => {
    const g = gameState.current;
    g.skills.weapons = {} as Record<WeaponType, { level: number; isEvo: boolean }>;
    Object.values(WeaponType).forEach((id) => {
      g.activeWeaponEvolutions[id] = false;
    });
    // Clear ALL projectiles to avoid any lingering orbital or active projectiles
    g.projectiles = [];
    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devKillAllRegularEnemies = () => {
    const g = gameState.current;
    g.enemies = g.enemies.filter(e => e.type === "BOSS");
    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devSpawnBossExact = (minutes: number) => {
    const g = gameState.current;
    // Guarantee exactly 1 boss by removing existing bosses
    g.enemies = g.enemies.filter((e: any) => e.type !== "BOSS" && e.type !== "FINAL_BOSS");
    // Do not adjust game time as per user instructions, just spawn the specific boss
    spawnBoss(minutes);
    soundEngine.playEvo();
    updateReactHUD();
  };

  const devSpawnFinalBoss = () => {
    const g = gameState.current;
    // Guarantee exactly 1 final boss by removing existing bosses
    g.enemies = g.enemies.filter((e: any) => e.type !== "BOSS" && e.type !== "FINAL_BOSS");
    // Do not adjust game time as per user instructions, just spawn the final boss directly
    spawnFinalBoss();
    soundEngine.playEvo();
    updateReactHUD();
  };

  const toggleLevelLock = () => {
    const next = !isLevelLocked;
    setIsLevelLocked(next);
    gameState.current.levelLock = next;
    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const toggleNormalSpawns = () => {
    const next = !isNormalSpawnsDisabled;
    setIsNormalSpawnsDisabled(next);
    gameState.current.disableNormalSpawns = next;
    soundEngine.playUpgradeSelect();
    updateReactHUD();
  };

  const devSetHugeShield = () => {
    const g = gameState.current;
    g.player.maxShield = 10000;
    g.player.shield = 10000;
    g.player.lastDamageTime = Date.now();
    soundEngine.playEvo();
    updateReactHUD();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-none select-none" />

      {/* Final Boss Countdown Timer */}
      {finalBossTimeLeft !== null && (
        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-40 bg-rose-950/95 border border-rose-500/40 px-4 py-1.5 rounded-full text-xs font-black text-rose-200 tracking-wider shadow-lg animate-pulse flex items-center space-x-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>최종보스 처치 제한시간: {Math.floor(finalBossTimeLeft / 60)}분 {(finalBossTimeLeft % 60).toString().padStart(2, "0")}초</span>
        </div>
      )}

      {/* Top HUD: Time, Kills, XP progress bar */}
      <div className="absolute top-20 left-4 right-4 z-30 pointer-events-none select-none font-sans flex flex-col space-y-2">
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

      {/* Bottom Floating Health & Shield bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-xs px-4">
        <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/30 backdrop-blur-md shadow-2xl flex flex-col space-y-2">
          {/* Health Bar */}
          <div className="flex flex-col space-y-1">
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

          {/* Shield Bar */}
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold">
              <span>나노 전술 보호막</span>
              <span className="font-mono text-cyan-400 font-black">
                {inGameShield} / {inGameMaxShield}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 flex">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-75 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                style={{ width: `${Math.max(0, Math.min(100, (inGameShield / inGameMaxShield) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOSS HEALTH INDICATOR BAR (shown on screen top-center if boss is active) */}
      {bossHealth && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-xs px-2 animate-scale-up">
          <div className="bg-slate-950/60 border border-red-500/20 p-2 rounded-xl backdrop-blur-sm shadow-[0_0_12px_rgba(239,68,68,0.15)] flex flex-col space-y-1">
            <div className="flex justify-between items-center text-[10px] text-red-200 font-extrabold tracking-wide">
              <span className="flex items-center space-x-1 max-w-[60%] truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mr-1" />
                <span className="truncate">{bossHealth.name}</span>
              </span>
              <span className="font-mono text-[9px] bg-red-500/10 border border-red-500/10 px-1.5 py-0.5 rounded text-red-400 font-bold">
                {bossHealth.current.toLocaleString()} / {bossHealth.max.toLocaleString()}
              </span>
            </div>
            <div className="relative w-full h-1.5 bg-slate-900 border border-slate-800/40 rounded-full overflow-hidden p-px flex">
              {/* Slow-catchup trailing damage bar */}
              <div
                className="absolute top-px left-px bottom-px rounded-full bg-red-400/35 transition-all duration-500 ease-out"
                style={{ width: `calc(${(bossHealth.current / bossHealth.max) * 100}% - 2px)` }}
              />
              {/* Main health bar */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                style={{ width: `${(bossHealth.current / bossHealth.max) * 100}%` }}
              />
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

            {/* Currently Possessed Abilities Panel (Compact version inside reinforcement modal) */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 mb-3 space-y-2 shadow-inner text-left shrink-0">
              <div className="flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
                <span className="text-slate-400">💼 현재 보유한 장비 및 무기</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {equippedWeapons.length + equippedPassives.length}/12
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Weapons Group */}
                <div className="space-y-1">
                  <div className="text-[8px] font-extrabold text-sky-400 border-b border-sky-950/50 pb-0.5 uppercase tracking-wider">무기 슬롯 ({equippedWeapons.length}/6)</div>
                  <div className="grid grid-cols-6 gap-0.5">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const weapon = equippedWeapons[idx];
                      return (
                        <div
                          key={`eq-w-re-${idx}`}
                          className={`aspect-square rounded border flex flex-col items-center justify-center relative ${
                            weapon 
                              ? weapon.isEvo 
                                ? "bg-amber-950/40 border-amber-500/50" 
                                : "bg-slate-950 border-sky-900" 
                              : "bg-slate-950/30 border-slate-900/40 border-dashed"
                          }`}
                        >
                          {weapon ? (
                            <>
                              {renderSkillIcon(weapon.id, "w-3 h-3")}
                              <span className={`absolute -bottom-0.5 -right-0.5 text-[6px] font-mono font-black px-0.5 rounded-[1px] border ${
                                weapon.isEvo 
                                  ? "bg-amber-500 border-amber-400 text-slate-950 scale-75" 
                                  : "bg-slate-800 border-slate-700 text-slate-300 scale-75"
                              }`}>
                                {weapon.isEvo ? "E" : `${weapon.level}`}
                              </span>
                            </>
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-slate-800/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passives Group */}
                <div className="space-y-1">
                  <div className="text-[8px] font-extrabold text-emerald-400 border-b border-emerald-950/50 pb-0.5 uppercase tracking-wider">지원 장비 ({equippedPassives.length}/6)</div>
                  <div className="grid grid-cols-6 gap-0.5">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const passive = equippedPassives[idx];
                      return (
                        <div
                          key={`eq-p-re-${idx}`}
                          className={`aspect-square rounded border flex flex-col items-center justify-center relative ${
                            passive 
                              ? "bg-slate-950 border-emerald-900" 
                              : "bg-slate-950/30 border-slate-900/40 border-dashed"
                          }`}
                        >
                          {passive ? (
                            <>
                              {renderSkillIcon(passive.id, "w-3 h-3")}
                              <span className="absolute -bottom-0.5 -right-0.5 text-[6px] font-mono font-black px-0.5 rounded-[1px] border bg-slate-800 border-slate-700 text-emerald-400 scale-75">
                                {passive.level}
                              </span>
                            </>
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-slate-800/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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

      {/* GOD MODE ACTIVE FLOATING BANNER */}
      {isGodModeState && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border border-emerald-500/40 px-3 py-1 rounded-full text-[9px] font-black text-emerald-200 tracking-widest shadow-lg flex items-center space-x-1 pointer-events-none animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>무적 상태 (GOD MODE ACTIVE)</span>
        </div>
      )}

      {/* DEVELOPER MODE FLOATING TRIGGER BUTTON */}
      {isDevEnv && (
        <div className="absolute top-16 left-4 z-40 pointer-events-auto">
          <button
            onClick={() => {
              setShowDevPanel(prev => !prev);
              soundEngine.playUpgradeSelect();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider shadow-lg border transition-all duration-200 active:scale-95 ${
              showDevPanel
                ? "bg-rose-500 border-rose-400 text-white shadow-rose-950/40"
                : "bg-slate-900/85 border-slate-850 text-rose-400 hover:bg-slate-800"
            }`}
          >
            <span className="animate-pulse">🛠️</span>
            <span>개발툴 {showDevPanel ? "닫기" : "열기"}</span>
          </button>
        </div>
      )}

      {/* DEVELOPER MODE MAIN CONTROLLER PANEL */}
      {isDevEnv && showDevPanel && (
        <div className="absolute inset-x-3 top-14 bottom-3 max-h-[calc(100%-4.2rem)] z-45 bg-slate-950/95 border-2 border-rose-500/40 rounded-2xl p-3.5 flex flex-col space-y-3 shadow-[0_0_30px_rgba(244,63,94,0.2)] backdrop-blur-md overflow-y-auto font-sans text-white text-left animate-fade-in pointer-events-auto">
          <div className="flex justify-between items-center border-b border-rose-500/20 pb-2 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">🛠️</span>
              <div>
                <h3 className="text-xs font-black text-rose-400 tracking-wide">기밀 개발자 디버그 센터</h3>
                <p className="text-[8px] text-slate-400">구글 AI Studio 전용 디버그 도구</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDevPanel(false);
                soundEngine.playUpgradeSelect();
              }}
              className="w-5 h-5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Section 1: God Mode Toggle */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-2 shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">패턴 관측용 무적 상태</span>
                <h4 className="text-xs font-bold text-white">플레이어 무적 (God Mode)</h4>
              </div>
              <button
                onClick={toggleGodMode}
                className={`w-20 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all duration-200 uppercase active:scale-95 border ${
                  isGodModeState
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-950/20"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {isGodModeState ? "무적 ON" : "무적 OFF"}
              </button>
            </div>
            <p className="text-[8px] text-slate-400 leading-normal">
              활성화 시, 체력이 매 프레임 최대로 회복되어 보스 패턴의 안전한 분석 및 디버깅을 지원합니다.
            </p>
          </div>

          {/* Section 2: Time Control */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-2.5 text-left shrink-0">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">시간 가속 / 시뮬레이터</span>
              <h4 className="text-xs font-bold text-white">경과 시간 조정</h4>
            </div>

            {/* Current Game Time display */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-900/60 flex justify-between items-center font-mono">
              <span className="text-[9px] text-slate-400">현재 전투 경과 시간:</span>
              <span className="text-xs font-black text-rose-400">
                {Math.floor(inGameTime / 60).toString().padStart(2, "0")}분 {(inGameTime % 60).toString().padStart(2, "0")}초 ({inGameTime}초)
              </span>
            </div>

            {/* Incremental presets */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => devAdjustTime(10)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-1 rounded text-[9px] font-bold font-mono text-slate-300 cursor-pointer"
              >
                +10초
              </button>
              <button
                onClick={() => devAdjustTime(60)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-1 rounded text-[9px] font-bold font-mono text-slate-300 cursor-pointer"
              >
                +1분
              </button>
              <button
                onClick={() => devAdjustTime(-60)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-1 rounded text-[9px] font-bold font-mono text-slate-300 cursor-pointer"
              >
                -1분
              </button>
              <button
                onClick={() => devAdjustTime(-10)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-1 rounded text-[9px] font-bold font-mono text-slate-300 cursor-pointer"
              >
                -10초
              </button>
            </div>

            {/* Milestone Jumps */}
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">주요 전투 국면 바로가기:</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => devSetTimeExact(235)}
                  className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/40 py-1 rounded text-[8px] font-black text-rose-300 cursor-pointer"
                >
                  3분 55초 (고릴라 직전)
                </button>
                <button
                  onClick={() => devSetTimeExact(595)}
                  className="bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/40 py-1 rounded text-[8px] font-black text-purple-300 cursor-pointer"
                >
                  9분 55초 (최종보스 직전)
                </button>
                <button
                  onClick={() => devSetTimeExact(10)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-850 py-1 rounded text-[8px] font-bold text-slate-400 cursor-pointer"
                >
                  초기화 (10초)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Weapon / Evolution Selection */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-2.5 shrink-0">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">무장 및 전술 고속 배치</span>
              <h4 className="text-xs font-bold text-white">원하는 무기 레벨 5 & 진화(Evo)</h4>
            </div>

            {/* Quick Bulk commands */}
            <div className="grid grid-cols-3 gap-1.5 pb-1">
              <button
                onClick={() => devGiveAllWeaponsMax(false)}
                className="bg-sky-950/40 hover:bg-sky-950/60 border border-sky-900/30 py-1.5 rounded-lg text-[8px] font-black text-sky-300 cursor-pointer"
              >
                모든 무기 Lv.5 획득
              </button>
              <button
                onClick={() => devGiveAllWeaponsMax(true)}
                className="bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/40 py-1.5 rounded-lg text-[8px] font-black text-amber-300 cursor-pointer"
              >
                모든 무기 초월진화
              </button>
              <button
                onClick={devClearAllWeapons}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 py-1.5 rounded-lg text-[8px] font-black text-slate-400 cursor-pointer"
              >
                무장 초기화
              </button>
            </div>

            {/* Weapons list with level buttons */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {[
                { id: WeaponType.KUNAI, name: "쿠나이 (지배자)" },
                { id: WeaponType.SOCCER_BALL, name: "양자축구공" },
                { id: WeaponType.GUARDIAN, name: "수호자 (방패)" },
                { id: WeaponType.MOLOTOV, name: "화염병" },
                { id: WeaponType.LIGHTNING, name: "번개 발사기" },
                { id: WeaponType.GATLING, name: "전설의 개틀링건" },
                { id: WeaponType.POOP_SPRAY, name: "분노의 똥 뿌리기" },
                { id: WeaponType.BOOMERANG, name: "부메랑" },
                { id: WeaponType.EXCALIBUR, name: "전설의 성검 엑스칼리버" },
                { id: WeaponType.BLACK_HOLE, name: "초중력 블랙홀 포" },
              ].map((w) => {
                const current = equippedWeapons.find((x) => x.id === w.id);
                const currentLevelText = current
                  ? current.isEvo
                    ? "EVO"
                    : `Lv.${current.level}`
                  : "미보유";

                return (
                  <div key={w.id} className="bg-slate-950/80 p-2 rounded-lg border border-slate-900/60 flex items-center justify-between text-left">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-slate-900 rounded border border-slate-800 flex items-center justify-center scale-90">
                        {renderSkillIcon(w.id, "w-3.5 h-3.5")}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-white">{w.name}</div>
                        <span className={`text-[8px] font-bold ${current ? "text-emerald-400" : "text-slate-500"}`}>
                          상태: {currentLevelText}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => devSetWeaponLevel(w.id, 5, false)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-sky-500 text-sky-400 text-[8px] font-black px-2 py-1 rounded transition-all active:scale-95 cursor-pointer"
                      >
                        Lv.5 부여
                      </button>
                      <button
                        onClick={() => devSetWeaponLevel(w.id, 5, true)}
                        className="bg-amber-950/40 hover:bg-amber-950/60 border border-amber-900/30 text-amber-400 text-[8px] font-black px-2 py-1 rounded transition-all active:scale-95 cursor-pointer"
                      >
                        즉시 진화
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Monster Spawner & Helpers */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-2.5 text-left shrink-0">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">실전 전술 필드 제어</span>
              <h4 className="text-xs font-bold text-white">필드 몬스터 및 보스 스폰 제어</h4>
            </div>

            {/* Test Helpers (Level Lock, Spawn Toggle, Protect Shield) */}
            <div className="grid grid-cols-3 gap-1.5 pb-1">
              <button
                onClick={toggleLevelLock}
                className={`py-1 rounded text-[8px] font-black transition-all border ${
                  isLevelLocked
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950/20"
                    : "bg-slate-950 text-slate-400 border-slate-850"
                }`}
              >
                {isLevelLocked ? "🔒 레벨 고정 ON" : "🔓 레벨 고정 OFF"}
              </button>
              <button
                onClick={toggleNormalSpawns}
                className={`py-1 rounded text-[8px] font-black transition-all border ${
                  isNormalSpawnsDisabled
                    ? "bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-950/20"
                    : "bg-slate-950 text-slate-400 border-slate-850"
                }`}
              >
                {isNormalSpawnsDisabled ? "🚫 잡몹 생성 차단" : "👾 잡몹 생성 활성"}
              </button>
              <button
                onClick={devSetHugeShield}
                className="bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-900/40 py-1 rounded text-[8px] font-black text-cyan-300 transition-all active:scale-95 cursor-pointer"
              >
                🛡️ 보호막 10000
              </button>
            </div>

            {/* Specific Elite Boss Summons */}
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">정예 보스 개별 소환 (1마리 보장):</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => devSpawnBossExact(2)}
                  className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 py-1.5 rounded text-[8px] font-extrabold text-rose-300 cursor-pointer"
                >
                  🐒 2분 보스 (돌격대장 원숭이) 소환
                </button>
                <button
                  onClick={() => devSpawnBossExact(4)}
                  className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 py-1.5 rounded text-[8px] font-extrabold text-rose-300 cursor-pointer"
                >
                  🦍 4분 보스 (분조장 고릴라) 소환
                </button>
                <button
                  onClick={() => devSpawnBossExact(6)}
                  className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 py-1.5 rounded text-[8px] font-extrabold text-rose-300 cursor-pointer"
                >
                  🏹 6분 보스 (원거리 딜러 난쟁이) 소환
                </button>
                <button
                  onClick={() => devSpawnBossExact(8)}
                  className="bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 py-1.5 rounded text-[8px] font-extrabold text-rose-300 cursor-pointer"
                >
                  🧟 8분 보스 (좀비 뚱돼지) 소환
                </button>
              </div>
            </div>

            {/* Final Boss / Wipe */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={devSpawnFinalBoss}
                className="bg-purple-900 hover:bg-purple-800 border border-purple-700 py-1.5 rounded text-[8px] font-black text-purple-100 uppercase tracking-wider cursor-pointer"
              >
                🌌 최종 보스 (10분) 소환
              </button>
              <button
                onClick={devKillAllRegularEnemies}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 py-1.5 rounded text-[8px] font-bold text-slate-300 cursor-pointer"
              >
                일반 잡몹 일괄 처치
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
