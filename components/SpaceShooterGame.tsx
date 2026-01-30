
import React, { useEffect, useRef } from 'react';
import { UpgradeType } from '../types';
import { GameEngine } from './game/GameEngine';
import { GameRenderer } from './game/GameRenderer';

interface SpaceShooterGameProps {
  onGameOver: (score: number) => void;
  onTriggerQuestion: () => void;
  activeBuff: 'NONE' | 'OVERCLOCK' | 'LAG';
  isPaused: boolean;
  activeUpgrades: UpgradeType[];
}

export const SpaceShooterGame: React.FC<SpaceShooterGameProps> = ({ 
  onGameOver, 
  onTriggerQuestion, 
  activeBuff, 
  isPaused,
  activeUpgrades
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  // Game Logic Instance
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Initialize Game Logic once
  useEffect(() => {
    if (!engineRef.current) {
        engineRef.current = new GameEngine(onGameOver, onTriggerQuestion);
    }
  }, [onGameOver, onTriggerQuestion]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!rendererRef.current) {
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimize by disabling alpha channel on backbuffer if possible
        if (ctx) rendererRef.current = new GameRenderer(ctx);
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (engineRef.current) {
        // Center player on resize if at 0,0
        if (engineRef.current.player.x === 0 && engineRef.current.player.y === 0) {
            engineRef.current.player.x = canvas.width / 2;
            engineRef.current.player.y = canvas.height / 2;
        }
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
        if (engineRef.current) engineRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (engineRef.current) engineRef.current.keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      const safeDt = Math.min(dt, 50); 
      lastTimeRef.current = timestamp;

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer) {
          if (!isPaused) {
            engine.update(safeDt, {
                width: canvas.width,
                height: canvas.height,
                activeBuff,
                activeUpgrades
            });
          }

          // LAG EFFECT RENDERING
          if (activeBuff === 'LAG' && !isPaused) {
             // Red/Blue Shift
             const ctx = canvas.getContext('2d')!;
             ctx.save();
             ctx.translate(-3, 0);
             ctx.globalCompositeOperation = 'screen';
             renderer.draw(
                 canvas.width, canvas.height, 
                 { player: engine.player, bullets: engine.bullets, enemies: engine.enemies, particles: engine.particles, texts: engine.floatingTexts },
                 { width: canvas.width, height: canvas.height, activeBuff, activeUpgrades },
                 { budget: engine.budget, questionTimer: engine.questionTimer, shake: engine.shake },
                 true
             );
             ctx.restore();
             // Normal draw call will happen below
          }

          renderer.draw(
             canvas.width, canvas.height, 
             { player: engine.player, bullets: engine.bullets, enemies: engine.enemies, particles: engine.particles, texts: engine.floatingTexts },
             { width: canvas.width, height: canvas.height, activeBuff, activeUpgrades },
             { budget: engine.budget, questionTimer: engine.questionTimer, shake: engine.shake },
             false
          );
      }
      
      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [isPaused, activeBuff, activeUpgrades]);

  return <canvas ref={canvasRef} className="block w-full h-full cursor-none" />;
};
