import React, { useState, useRef, useEffect } from "react";

interface JoystickProps {
  onMove: (angle: number | null, force: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 50;

  const handleStart = (clientX: number, clientY: number, id: number | null) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;
      setBasePosition({ x: relativeX, y: relativeY });
      setPosition({ x: relativeX, y: relativeY });
      setActive(true);
      touchIdRef.current = id;
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    const deltaX = currentX - basePosition.x;
    const deltaY = currentY - basePosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let finalX = currentX;
    let finalY = currentY;
    let force = distance / maxRadius;

    if (distance > maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      finalX = basePosition.x + Math.cos(angle) * maxRadius;
      finalY = basePosition.y + Math.sin(angle) * maxRadius;
      force = 1;
    }

    setPosition({ x: finalX, y: finalY });

    const angleRad = Math.atan2(finalY - basePosition.y, finalX - basePosition.x);
    onMove(angleRad, force);
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    setBasePosition({ x: 0, y: 0 });
    touchIdRef.current = null;
    onMove(null, 0);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (active) return;
    const touch = e.changedTouches[0];
    handleStart(touch.clientX, touch.clientY, touch.identifier);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!active || touchIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchIdRef.current) {
        handleMove(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY, null);
  };

  useEffect(() => {
    const globalMove = (e: MouseEvent) => {
      if (active && touchIdRef.current === null) {
        handleMove(e.clientX, e.clientY);
      }
    };
    const globalUp = () => {
      if (active && touchIdRef.current === null) {
        handleEnd();
      }
    };

    window.addEventListener("mousemove", globalMove);
    window.addEventListener("mouseup", globalUp);

    return () => {
      window.removeEventListener("mousemove", globalMove);
      window.removeEventListener("mouseup", globalUp);
    };
  }, [active, basePosition]);

  return (
    <div
      ref={containerRef}
      id="joystick-zone"
      className="absolute inset-0 select-none touch-none z-10"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={onMouseDown}
    >
      {active && (
        <>
          {/* Base */}
          <div
            id="joystick-base"
            className="absolute rounded-full border-4 border-slate-400 bg-slate-900/40 backdrop-blur-[2px] transition-transform duration-75 flex items-center justify-center shadow-lg"
            style={{
              width: `${maxRadius * 2}px`,
              height: `${maxRadius * 2}px`,
              left: `${basePosition.x - maxRadius}px`,
              top: `${basePosition.y - maxRadius}px`,
            }}
          >
            {/* Center ring marker */}
            <div className="w-6 h-6 rounded-full border border-slate-500/50 bg-slate-500/20" />
          </div>

          {/* Thumb stick */}
          <div
            id="joystick-stick"
            className="absolute rounded-full border border-emerald-400 bg-gradient-to-tr from-emerald-600 to-emerald-400 cursor-pointer shadow-xl flex items-center justify-center transition-all duration-75 hover:scale-105"
            style={{
              width: "48px",
              height: "48px",
              left: `${position.x - 24}px`,
              top: `${position.y - 24}px`,
            }}
          >
            {/* Inner aesthetic core */}
            <div className="w-4 h-4 rounded-full bg-white/40 shadow-inner" />
          </div>
        </>
      )}

      {/* Guide text if idle */}
      {!active && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center animate-pulse">
          <div className="text-white/60 text-xs font-sans tracking-wide bg-slate-950/60 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            화면을 드래그하여 이동 (조이스틱)
          </div>
        </div>
      )}
    </div>
  );
};
