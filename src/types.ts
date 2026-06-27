export enum WeaponType {
  KUNAI = "KUNAI", // Auto-target closest, high rate
  SOCCER_BALL = "SOCCER_BALL", // Bounces around, high damage
  GUARDIAN = "GUARDIAN", // Spinning tops around player (knockback)
  MOLOTOV = "MOLOTOV", // Puddles of fire
  LIGHTNING = "LIGHTNING", // Lightning bolts from above
  GATLING = "GATLING", // Super rapid fire tracer bullets
}

export enum PassiveType {
  ATTACK_BOOST = "ATTACK_BOOST", // ATK power +10% per level
  MAGNET = "MAGNET", // Collection range +20% per level
  SPEED_BOOST = "SPEED_BOOST", // Movement speed +10% per level
  HP_BOOST = "HP_BOOST", // Max HP +10% per level
  COOLDOWN_REDUCE = "COOLDOWN_REDUCE", // Attack cooldown -8% per level
}

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "passive";
  skillId: WeaponType | PassiveType;
  level: number;
  icon: string;
  isEvo: boolean;
  isLegendary?: boolean;
}

export interface PlayerStats {
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  speed: number;
  atk: number;
  magnet: number;
  cooldownReduce: number; // multiplier, e.g., 1.0 -> 0.8
  gold: number;
  kills: number;
}

// Permanent upgrades in the lobby shop using gold
export interface PermanentUpgrades {
  atkLevel: number;
  hpLevel: number;
  speedLevel: number;
  magnetLevel: number;
  startingGold: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  joystickEnabled: boolean;
}
