import React, { useState, useEffect } from "react";
import {
  MainMenu,
  Shop,
  LevelUpChooser,
  PauseOverlay,
  GameOverOverlay,
  ActiveSkillsHUD,
} from "./components/MainOverlay";
import { GameCanvas } from "./components/GameCanvas";
import { Joystick } from "./components/Joystick";
import {
  PermanentUpgrades,
  UpgradeCard,
  WeaponType,
  PassiveType,
} from "./types";
import { soundEngine } from "./audio";
import { Pause, RotateCcw, Volume2, VolumeX, Shield, Swords, Sparkles } from "lucide-react";

export default function App() {
  // Screen views: "MENU" | "SHOP" | "GAME"
  const [currentScreen, setCurrentScreen] = useState<"MENU" | "SHOP" | "GAME">("MENU");

  // Persistent user stats
  const [gold, setGold] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0); // survived time (seconds)
  const [highestKills, setHighestKills] = useState<number>(0);

  // Permanent lobby upgrade states
  const [permanentUpgrades, setPermanentUpgrades] = useState<PermanentUpgrades>({
    atkLevel: 0,
    hpLevel: 0,
    speedLevel: 0,
    magnetLevel: 0,
    startingGold: 0,
  });

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active game play session states
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [levelUpChoices, setLevelUpChoices] = useState<UpgradeCard[] | null>(null);
  const [levelUpSelectedCard, setLevelUpSelectedCard] = useState<UpgradeCard | null>(null);

  // Active equips (synced from Canvas for display overlay HUD)
  const [equippedWeapons, setEquippedWeapons] = useState<{ id: WeaponType; level: number; isEvo: boolean }[]>([]);
  const [equippedPassives, setEquippedPassives] = useState<{ id: PassiveType; level: number }[]>([]);

  // Joystick controller states
  const [joystickAngle, setJoystickAngle] = useState<number | null>(null);
  const [joystickForce, setJoystickForce] = useState<number>(0);
  const [gameId, setGameId] = useState<number>(0);

  // Active final results state
  const [gameOverStats, setGameOverStats] = useState<{
    victory: boolean;
    timeSurvived: number;
    kills: number;
    levelReached: number;
    goldEarned: number;
  } | null>(null);

  // Load persistent stats from LocalStorage
  useEffect(() => {
    const savedGold = localStorage.getItem("tang_gold");
    const savedHighScore = localStorage.getItem("tang_highscore");
    const savedKills = localStorage.getItem("tang_kills");
    const savedUpgrades = localStorage.getItem("tang_upgrades");
    const savedSound = localStorage.getItem("tang_sound");

    if (savedGold) setGold(parseInt(savedGold));
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    if (savedKills) setHighestKills(parseInt(savedKills));
    if (savedSound) {
      const parsed = savedSound === "true";
      setSoundEnabled(parsed);
      soundEngine.enabled = parsed;
    }
    if (savedUpgrades) {
      try {
        setPermanentUpgrades(JSON.parse(savedUpgrades));
      } catch (e) {
        console.error("Failed to parse saved upgrades", e);
      }
    }
  }, []);

  // Sync sounds
  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    soundEngine.enabled = newVal;
    localStorage.setItem("tang_sound", newVal.toString());
  };

  // Permanent Lobby Upgrade Actions
  const handleUpgrade = (type: keyof PermanentUpgrades) => {
    const currentLevel = permanentUpgrades[type];
    const cost = (currentLevel + 1) * 300;

    if (gold >= cost && currentLevel < 5) {
      const updatedUpgrades = {
        ...permanentUpgrades,
        [type]: currentLevel + 1,
      };
      const newGold = gold - cost;

      setGold(newGold);
      setPermanentUpgrades(updatedUpgrades);

      localStorage.setItem("tang_gold", newGold.toString());
      localStorage.setItem("tang_upgrades", JSON.stringify(updatedUpgrades));
    }
  };

  const handleResetUpgrades = () => {
    // Refund gold
    let refundAmount = 0;
    Object.entries(permanentUpgrades).forEach(([key, lvl]) => {
      // Sum costs of level 1 to level lvl
      const levelNum = lvl as number;
      for (let i = 0; i < levelNum; i++) {
        refundAmount += (i + 1) * 300;
      }
    });

    const resetUpgrades = {
      atkLevel: 0,
      hpLevel: 0,
      speedLevel: 0,
      magnetLevel: 0,
      startingGold: 0,
    };

    const newGold = gold + refundAmount;
    setGold(newGold);
    setPermanentUpgrades(resetUpgrades);

    localStorage.setItem("tang_gold", newGold.toString());
    localStorage.setItem("tang_upgrades", JSON.stringify(resetUpgrades));
  };

  // Start a fresh active game play session
  const handleStartGame = () => {
    setIsPaused(false);
    setLevelUpChoices(null);
    setLevelUpSelectedCard(null);
    setGameOverStats(null);
    setJoystickAngle(null);
    setJoystickForce(0);
    setCurrentScreen("GAME");
    setGameId((prev) => prev + 1);
  };

  const handleGameOver = (stats: {
    victory: boolean;
    timeSurvived: number;
    kills: number;
    levelReached: number;
    goldEarned: number;
  }) => {
    // Save results
    const newGold = gold + stats.goldEarned;
    setGold(newGold);
    localStorage.setItem("tang_gold", newGold.toString());

    if (stats.timeSurvived > highScore) {
      setHighScore(stats.timeSurvived);
      localStorage.setItem("tang_highscore", stats.timeSurvived.toString());
    }

    if (stats.kills > highestKills) {
      setHighestKills(stats.kills);
      localStorage.setItem("tang_kills", stats.kills.toString());
    }

    setGameOverStats(stats);
  };

  // Joystick Input callback
  const handleJoystickMove = (angle: number | null, force: number) => {
    setJoystickAngle(angle);
    setJoystickForce(force);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background aesthetic circles/glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Premium Portrait Container Frame */}
      <div className="w-full max-w-md h-[100dvh] md:h-[840px] md:max-h-[92vh] bg-slate-950 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-300 md:rounded-[40px] md:border-[10px] md:border-slate-900">
        
        {/* VIEW 1: Main Menu Landing screen */}
        {currentScreen === "MENU" && (
          <MainMenu
            gold={gold}
            highScore={highScore}
            highestKills={highestKills}
            onStartGame={handleStartGame}
            onOpenShop={() => setCurrentScreen("SHOP")}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* VIEW 2: Upgrades Research Shop screen */}
        {currentScreen === "SHOP" && (
          <Shop
            gold={gold}
            upgrades={permanentUpgrades}
            onUpgrade={handleUpgrade}
            onReset={handleResetUpgrades}
            onClose={() => setCurrentScreen("MENU")}
          />
        )}

        {/* VIEW 3: Active Combat Scene screen */}
        {currentScreen === "GAME" && (
          <div className="relative w-full h-full flex flex-col bg-slate-950">
            
            {/* Top Play bar: controls & equips HUD */}
            <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center pointer-events-none">
              
              {/* Back out button / Pause button */}
              <button
                onClick={() => {
                  soundEngine.playUpgradeSelect();
                  setIsPaused(true);
                }}
                className="pointer-events-auto w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center justify-center text-white hover:bg-slate-800 transition-all active:scale-90 shadow-lg"
              >
                <Pause className="w-4 h-4 fill-white" />
              </button>

              {/* Quick Mute Toggle */}
              <button
                onClick={handleToggleSound}
                className="pointer-events-auto w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex items-center justify-center text-white hover:bg-slate-800 transition-all active:scale-90 shadow-lg"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>

            {/* Core HTML5 Canvas Game Frame Wrapper */}
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <GameCanvas
                key={gameId}
                permanentUpgrades={permanentUpgrades}
                soundEnabled={soundEnabled}
                joystickAngle={joystickAngle}
                joystickForce={joystickForce}
                onLevelUp={(choices) => setLevelUpChoices(choices)}
                onGameOver={handleGameOver}
                isPaused={isPaused}
                levelUpSelectedCard={levelUpSelectedCard}
                setLevelUpSelectedCard={setLevelUpSelectedCard}
                isEndlessMode={true}
              />

              {/* On-screen touch virtual joystick controller */}
              <Joystick onMove={handleJoystickMove} />
            </div>

            {/* OVERLAY: Level Up Supply Card Selector */}
            {levelUpChoices && !gameOverStats && (
              <LevelUpChooser
                cards={levelUpChoices}
                onSelectCard={(card) => {
                  setLevelUpSelectedCard(card);
                  setLevelUpChoices(null);
                }}
              />
            )}

            {/* OVERLAY: Tactical Action Pause screen */}
            {isPaused && !levelUpChoices && !gameOverStats && (
              <PauseOverlay
                onResume={() => setIsPaused(false)}
                onRestart={handleStartGame}
                onQuit={() => setCurrentScreen("MENU")}
              />
            )}

            {/* OVERLAY: Mission Complete/Failed Game Over Summary */}
            {gameOverStats && (
              <GameOverOverlay
                victory={gameOverStats.victory}
                timeSurvived={gameOverStats.timeSurvived}
                kills={gameOverStats.kills}
                levelReached={gameOverStats.levelReached}
                goldEarned={gameOverStats.goldEarned}
                onRetry={handleStartGame}
                onHome={() => setCurrentScreen("MENU")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
