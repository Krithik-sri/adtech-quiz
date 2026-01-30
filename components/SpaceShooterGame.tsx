
import React, { useEffect, useRef } from 'react';
import { UpgradeType } from '../types';

interface SpaceShooterGameProps {
  onGameOver: (score: number) => void;
  onTriggerQuestion: () => void;
  activeBuff: 'NONE' | 'OVERCLOCK' | 'LAG';
  isPaused: boolean;
  activeUpgrades: UpgradeType[];
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  radius: number;
  hp: number;
  maxHp?: number;
  color: string;
  type: 'PLAYER' | 'ENEMY_PREMIUM' | 'ENEMY_BOT' | 'BULLET' | 'PARTICLE';
  iframeTimer?: number;
  life?: number; // For particles
  maxLife?: number;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export const SpaceShooterGame: React.FC<SpaceShooterGameProps> = ({ 
  onGameOver, 
  onTriggerQuestion, 
  activeBuff, 
  isPaused,
  activeUpgrades
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const budgetRef = useRef(2000); // Start with $2000 Budget
  const scoreRef = useRef(0); // Track total revenue for high score purposes
  const gameOverRef = useRef(false);
  const frameIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const questionTimerRef = useRef(0);
  const shakeRef = useRef(0); 
  const QUESTION_INTERVAL = 20000;

  // Physics Constants
  const DRAG = 0.98; 
  const THRUST_POWER = 0.35; 
  const ROTATION_SPEED = 0.08;
  const MAX_SPEED = 9;
  const BASE_SHOOT_COST = 5;

  // Entities
  const playerRef = useRef<GameObject>({
    id: 'player',
    x: 0, y: 0, 
    vx: 0, vy: 0, 
    rotation: -Math.PI / 2, 
    radius: 12, 
    hp: 100, maxHp: 100, 
    color: '#eab308', 
    type: 'PLAYER',
    iframeTimer: 0
  });

  const bulletsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const particlesRef = useRef<GameObject[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastShotTimeRef = useRef(0);

  // Initialize Game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (playerRef.current.x === 0 && playerRef.current.y === 0) {
        playerRef.current.x = canvas.width / 2;
        playerRef.current.y = canvas.height / 2;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const handleKeyDown = (e: KeyboardEvent) => keysRef.current[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      const safeDt = Math.min(dt, 50); 
      lastTimeRef.current = timestamp;

      if (!isPaused && !gameOverRef.current) {
        update(safeDt, canvas.width, canvas.height);
      }
      
      const ctx = canvas.getContext('2d')!;
      
      // LAG EFFECT
      if (activeBuff === 'LAG' && !isPaused) {
        ctx.save();
        ctx.translate(-3, 0);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        draw(ctx, canvas.width, canvas.height, true); 
        ctx.restore();

        ctx.save();
        ctx.translate(3, 0);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        draw(ctx, canvas.width, canvas.height, true);
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      }

      draw(ctx, canvas.width, canvas.height, false);
      
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

  const addShake = (amount: number) => {
    shakeRef.current = Math.min(shakeRef.current + amount, 20);
  };

  const spawnText = (x: number, y: number, text: string, color: string = '#fff') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x, y, text, color,
      life: 1.0,
      vy: -1 - Math.random() // Float up
    });
  };

  // --- UPDATE LOGIC ---
  const update = (dt: number, width: number, height: number) => {
    const player = playerRef.current;
    const timeScale = dt / 16.67;
    const isOverclock = activeBuff === 'OVERCLOCK';
    const isLag = activeBuff === 'LAG';
    
    // --- TRAP LOGIC: BLOATWARE (Slow Movement) ---
    const hasBloatware = activeUpgrades.includes('BLOATWARE');
    const moveSpeedMult = hasBloatware ? 0.75 : 1.0; 
    
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
    if (shakeRef.current < 0.5) shakeRef.current = 0;

    // Movement
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      player.rotation -= (isLag ? 0.04 : ROTATION_SPEED) * timeScale;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      player.rotation += (isLag ? 0.04 : ROTATION_SPEED) * timeScale;
    }

    const thrusting = keysRef.current['ArrowUp'] || keysRef.current['KeyW'];
    if (thrusting) {
      let thrust = isLag ? THRUST_POWER * 0.6 : isOverclock ? THRUST_POWER * 1.5 : THRUST_POWER;
      thrust *= moveSpeedMult; 

      player.vx += Math.cos(player.rotation) * thrust * timeScale;
      player.vy += Math.sin(player.rotation) * thrust * timeScale;
      
      if (Math.random() < 0.6) {
        const exhaustX = player.x - Math.cos(player.rotation) * 15;
        const exhaustY = player.y - Math.sin(player.rotation) * 15;
        spawnParticles(exhaustX, exhaustY, isOverclock ? '#eab308' : '#fbbf24', 1, 0.5);
      }
    }

    player.vx *= DRAG;
    player.vy *= DRAG;
    const speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
    const currentMaxSpeed = MAX_SPEED * moveSpeedMult;

    if (speed > currentMaxSpeed) {
      player.vx = (player.vx / speed) * currentMaxSpeed;
      player.vy = (player.vy / speed) * currentMaxSpeed;
    }

    player.x += player.vx * timeScale;
    player.y += player.vy * timeScale;

    // Wrap
    if (player.x < 0) player.x = width;
    if (player.x > width) player.x = 0;
    if (player.y < 0) player.y = height;
    if (player.y > height) player.y = 0;

    if (player.iframeTimer && player.iframeTimer > 0) {
      player.iframeTimer -= dt;
    }

    // --- TRAP LOGIC: MANAGED_SERVICE (High Cost) ---
    const hasManagedService = activeUpgrades.includes('MANAGED_SERVICE');
    const shootCost = hasManagedService ? BASE_SHOOT_COST * 2 : BASE_SHOOT_COST;

    // Shooting
    if (keysRef.current['Space']) {
      const now = Date.now();
      let fireRate = isOverclock ? 80 : 250;
      if (activeUpgrades.includes('RAPID_FIRE')) fireRate *= 0.5; // 50% faster

      if (now - lastShotTimeRef.current > fireRate) {
        if (budgetRef.current >= shootCost) {
            spawnBullet();
            budgetRef.current -= shootCost;
            lastShotTimeRef.current = now;
            if (isOverclock) addShake(2);
        } else {
             spawnText(player.x, player.y - 30, "NO BUDGET!", '#ef4444');
        }
      }
    }

    // --- BULLET LOGIC (AUTOBIDDER) ---
    const hasAutobidder = activeUpgrades.includes('AUTOBIDDER');

    bulletsRef.current.forEach(b => {
      // Homing Logic
      if (hasAutobidder && enemiesRef.current.length > 0) {
        // Find nearest enemy
        let nearest = enemiesRef.current[0];
        let minDst = 99999;
        enemiesRef.current.forEach(e => {
            const dst = Math.pow(e.x - b.x, 2) + Math.pow(e.y - b.y, 2);
            if (dst < minDst) {
                minDst = dst;
                nearest = e;
            }
        });

        if (minDst < 40000) { // Only home in if relatively close (200px)
            const dx = nearest.x - b.x;
            const dy = nearest.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Current Velocity Vector
            const currentSpeed = 12; // Approximation
            
            // Desired Vector
            const targetVx = (dx / dist) * currentSpeed;
            const targetVy = (dy / dist) * currentSpeed;
            
            // Steer
            const steerFactor = 0.1 * timeScale;
            b.vx += (targetVx - b.vx) * steerFactor;
            b.vy += (targetVy - b.vy) * steerFactor;
        }
      }

      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;
      
      // Cleanup offscreen bullets
      if (b.x < -50 || b.x > width + 50 || b.y < -50 || b.y > height + 50) {
        b.hp = 0;
      }
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.hp > 0);

    // --- TRAP LOGIC: TRAFFIC_BOOSTER (More Enemies, More Bots) ---
    const hasTrafficBooster = activeUpgrades.includes('TRAFFIC_BOOSTER');
    let maxEnemies = isOverclock ? 12 : 8;
    let spawnRate = 0.03;
    
    if (hasTrafficBooster) {
        maxEnemies = Math.floor(maxEnemies * 1.5);
        spawnRate = 0.06;
    }

    if (enemiesRef.current.length < maxEnemies && Math.random() < spawnRate) {
      spawnEnemy(width, height, hasTrafficBooster);
    }

    enemiesRef.current.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const distToPlayer = Math.sqrt(dx*dx + dy*dy);
      
      const dirX = dx / distToPlayer;
      const dirY = dy / distToPlayer;

      const acc = e.type === 'ENEMY_BOT' ? 0.08 : 0.05; 
      e.vx += dirX * acc * timeScale;
      e.vy += dirY * acc * timeScale;

      enemiesRef.current.forEach(other => {
        if (e === other) return;
        const odx = e.x - other.x;
        const body = e.y - other.y;
        const odist = Math.sqrt(odx*odx + body*body);
        if (odist < 40 && odist > 0) {
            e.vx += (odx/odist) * 0.1 * timeScale;
            e.vy += (body/body) * 0.1 * timeScale;
        }
      });

      e.vx *= 0.98; 
      e.vy *= 0.98;
      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
      
      if (e.type === 'ENEMY_BOT') {
          e.rotation += 0.2 * timeScale; 
      } else {
          e.rotation += 0.05 * timeScale;
      }

      if(e.x < -50) e.x = width + 50;
      if(e.x > width + 50) e.x = -50;
      if(e.y < -50) e.y = height + 50;
      if(e.y > height + 50) e.y = -50;
    });

    // --- COLLISIONS ---

    // Bullets Hit Enemies
    bulletsRef.current.forEach(b => {
      enemiesRef.current.forEach(e => {
        if (checkCircleCollide(b, e)) {
          b.hp = 0;
          spawnParticles(b.x, b.y, e.color, 4, 3);
          
          if (e.type === 'ENEMY_PREMIUM') {
              e.hp -= 10;
              if (e.hp <= 0) {
                const multiplier = activeUpgrades.includes('YIELD_OPTIMIZER') ? 1.5 : 1.0;
                const reward = Math.floor(150 * multiplier);
                budgetRef.current += reward;
                scoreRef.current += reward;
                addShake(5);
                spawnParticles(e.x, e.y, e.color, 15, 6);
                spawnText(e.x, e.y, `+$${reward} CPM`, '#eab308');
              } else {
                scoreRef.current += 10;
              }
          } else {
              // HIT A BOT!
              e.hp -= 10; 
              if (e.hp <= 0) {
                  // Penalty for killing bots
                  budgetRef.current -= 300; 
                  addShake(10);
                  spawnParticles(e.x, e.y, '#ef4444', 20, 8);
                  spawnText(e.x, e.y, `FRAUD! -$300`, '#ef4444');
              }
          }
        }
      });
    });

    // Player Hits Enemies
    enemiesRef.current.forEach(e => {
      if (checkCircleCollide(player, e)) {
        if (isOverclock) {
             e.hp = 0;
             addShake(8);
             spawnParticles(e.x, e.y, '#eab308', 20, 8);
             budgetRef.current += 200;
             spawnText(e.x, e.y, "RAMMING BONUS!", '#fff');
        } else if (!player.iframeTimer || player.iframeTimer <= 0) {
             // DAMAGE
             let damage = e.type === 'ENEMY_BOT' ? 30 : 20;
             if (activeUpgrades.includes('FIREWALL')) damage *= 0.5;
             
             player.hp -= damage; 
             player.iframeTimer = 1500; 
             
             // Strong knockback
             const dx = player.x - e.x;
             const dy = player.y - e.y;
             const dist = Math.sqrt(dx*dx + dy*dy) || 1;
             player.vx += (dx/dist) * 15;
             player.vy += (dy/dist) * 15;
             
             addShake(15);
             spawnParticles(player.x, player.y, '#ef4444', 20, 6);
             spawnText(player.x, player.y - 20, `CRITICAL ERROR! -${damage} HP`, '#ef4444');
             
             // Also lose budget on hit (Data Breach)
             budgetRef.current -= 100;

             if (player.hp <= 0) {
                 gameOverRef.current = true;
                 spawnParticles(player.x, player.y, '#ef4444', 50, 10);
                 setTimeout(() => onGameOver(scoreRef.current), 500);
             }
        }
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

    // GAME OVER CONDITIONS
    if (budgetRef.current <= 0) {
        budgetRef.current = 0;
        gameOverRef.current = true;
        spawnText(player.x, player.y, "BANKRUPTCY!", '#ef4444');
        setTimeout(() => onGameOver(scoreRef.current), 500);
    }

    // Particles/Text cleanup
    particlesRef.current.forEach(p => {
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vx *= 0.95; 
      p.vy *= 0.95;
      p.life = (p.life || 1) - 0.03 * timeScale;
    });
    particlesRef.current = particlesRef.current.filter(p => (p.life || 0) > 0);

    floatingTextsRef.current.forEach(t => {
      t.y += t.vy * timeScale;
      t.life -= 0.02 * timeScale;
    });
    floatingTextsRef.current = floatingTextsRef.current.filter(t => t.life > 0);

    // Timer
    questionTimerRef.current += dt;
    if (questionTimerRef.current > QUESTION_INTERVAL) {
      questionTimerRef.current = 0;
      onTriggerQuestion();
    }
  };

  // --- RENDERING ---
  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, isGhostPass: boolean) => {
    if (!isGhostPass) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.save();
    
    if (shakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * shakeRef.current;
      const dy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(dx, dy);
    }

    // Grid
    if (!isGhostPass) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offset = (Date.now() / 50) % 50;
        for (let x = 0; x <= width; x += 100) { ctx.moveTo(x, offset); ctx.lineTo(x, height); }
        for (let y = offset; y <= height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();
    }

    // Damage Flash
    const player = playerRef.current;
    if (player.iframeTimer && player.iframeTimer > 1200 && !isGhostPass) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(-20, -20, width+40, height+40);
    }

    // Player
    if (!player.iframeTimer || player.iframeTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.rotation);

      if (activeBuff === 'OVERCLOCK') {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#eab308';
      }

      ctx.fillStyle = activeBuff === 'LAG' ? '#ef4444' : player.color;
      ctx.beginPath();
      // Tech-Ship Shape
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, 10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();

      // Engine Glow
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) {
        ctx.fillStyle = activeBuff === 'OVERCLOCK' ? '#fff' : '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-20 - Math.random()*10, 5);
        ctx.lineTo(-30 - Math.random()*15, 0);
        ctx.lineTo(-20 - Math.random()*10, -5);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.shadowBlur = 0;

    // Bullets
    ctx.fillStyle = activeBuff === 'OVERCLOCK' ? '#eab308' : '#fff';
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Enemies
    enemiesRef.current.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation);
      
      if (e.type === 'ENEMY_BOT') {
          // BOT: Glitchy Square
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(-15, -15, 30, 30);
          ctx.moveTo(-15, -15);
          ctx.lineTo(15, 15);
          ctx.moveTo(15, -15);
          ctx.lineTo(-15, 15);
          ctx.stroke();
          
          ctx.fillStyle = '#ef4444';
          ctx.globalAlpha = 0.1;
          ctx.fill();
      } else {
          // PREMIUM: Triangle/Diamond
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(0, e.radius);
          ctx.lineTo(-e.radius, 0);
          ctx.lineTo(0, -e.radius);
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = e.color;
          ctx.globalAlpha = 0.2;
          ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.restore();
    });

    // Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life || 0;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.rect(pt.x, pt.y, pt.radius, pt.radius);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    floatingTextsRef.current.forEach(t => {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore(); 

    if (!isGhostPass) {
        drawHUD(ctx, width, height);
    }
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Top Left: Budget & HP
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = budgetRef.current < 500 ? '#ef4444' : '#eab308';
    ctx.fillText(`BUDGET: $${Math.floor(budgetRef.current).toLocaleString()}`, 20, 40);
    
    // Health Bar
    const player = playerRef.current;
    const maxHp = player.maxHp || 100;
    const hp = Math.max(0, player.hp);
    const hpPercent = hp / maxHp;

    ctx.fillStyle = 'rgba(31, 41, 55, 0.8)';
    ctx.fillRect(20, 55, 200, 8);
    
    const barColor = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(20, 55, 200 * hpPercent, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`INTEGRITY ${Math.ceil(hp)}%`, 225, 62);

    // Active Upgrades List (Left Middle)
    if (activeUpgrades.length > 0) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('MODULES ONLINE:', 20, 90);
        
        let xOff = 20;
        let yOff = 105;
        activeUpgrades.forEach((u) => {
            const isBad = ['BLOATWARE', 'MANAGED_SERVICE', 'TRAFFIC_BOOSTER'].includes(u);
            ctx.fillStyle = isBad ? '#ef4444' : '#eab308';
            const txt = `[${u}]`;
            ctx.fillText(txt, xOff, yOff);
            xOff += ctx.measureText(txt).width + 10;
            if (xOff > 400) { xOff = 20; yOff += 15; }
        });
    }

    // Top Center: Timer Bar
    const timeRatio = questionTimerRef.current / QUESTION_INTERVAL;
    const barWidth = 300;
    const barX = (width - barWidth) / 2;
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX, 15, barWidth, 6);
    
    const color = timeRatio > 0.8 ? '#ef4444' : '#eab308';
    ctx.fillStyle = color;
    ctx.fillRect(barX, 15, barWidth * timeRatio, 6);

    // --- BOTTOM HUD (New) ---
    // Console Log at bottom left
    const bottomY = height - 20;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`SYS.COORD: ${Math.floor(player.x)}:${Math.floor(player.y)}`, 20, bottomY);
    ctx.fillText(`ENGINES: ${Math.floor(Math.sqrt(player.vx*player.vx + player.vy*player.vy) * 10)}%`, 140, bottomY);
    ctx.fillText(`V.1.0.4 [SECURE]`, 240, bottomY);

    if (activeBuff === 'OVERCLOCK') {
        ctx.fillStyle = '#eab308';
        ctx.fillText('>> OVERCLOCK ENGAGED', 20, bottomY - 15);
    } else if (activeBuff === 'LAG') {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('>> NETWORK INSTABILITY', 20, bottomY - 15);
    }

    // Crosshair in center
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(width/2 - 20, height/2);
    ctx.lineTo(width/2 + 20, height/2);
    ctx.moveTo(width/2, height/2 - 20);
    ctx.lineTo(width/2, height/2 + 20);
    ctx.stroke();
  };

  // --- HELPERS ---
  const spawnBullet = () => {
    const p = playerRef.current;
    const isSpread = activeBuff === 'OVERCLOCK' || activeUpgrades.includes('SPREAD_SHOT');
    const speed = 12;
    
    const createB = (angleOffset: number) => {
      const angle = p.rotation + angleOffset;
      bulletsRef.current.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(p.rotation) * 20,
        y: p.y + Math.sin(p.rotation) * 20,
        vx: p.vx + Math.cos(angle) * speed,
        vy: p.vy + Math.sin(angle) * speed,
        radius: 3,
        rotation: 0,
        hp: 1,
        color: '#fff',
        type: 'BULLET'
      });
    };

    createB(0);
    if (isSpread) {
        createB(-0.2);
        createB(0.2);
    }
  };

  const spawnEnemy = (w: number, h: number, trafficBooster: boolean) => {
    let x, y;
    const edge = Math.floor(Math.random() * 4); 
    if (edge === 0) { x = Math.random() * w; y = -50; }
    else if (edge === 1) { x = w + 50; y = Math.random() * h; }
    else if (edge === 2) { x = Math.random() * w; y = h + 50; }
    else { x = -50; y = Math.random() * h; }
    
    // Normal Bot chance 30%. With Traffic Booster (bad upgrade), 70% chance.
    const botChance = trafficBooster ? 0.7 : 0.3;
    const isBot = Math.random() < botChance;

    enemiesRef.current.push({
      id: Math.random().toString(),
      x, y, 
      vx: 0, vy: 0, 
      radius: 20, 
      rotation: Math.random() * Math.PI,
      hp: isBot ? 20 : 30, maxHp: 30,
      color: isBot ? '#ef4444' : (Math.random() > 0.5 ? '#f472b6' : '#a78bfa'),
      type: isBot ? 'ENEMY_BOT' : 'ENEMY_PREMIUM'
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number, speedMultiplier: number) => {
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * speedMultiplier * 2;
      particlesRef.current.push({
        id: Math.random().toString(),
        x, y, 
        vx: Math.cos(angle) * speed, 
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1,
        rotation: 0,
        hp: 1.0, 
        color,
        type: 'PARTICLE',
        life: 1.0 + Math.random() * 0.5
      });
    }
  };

  const checkCircleCollide = (c1: GameObject, c2: GameObject) => {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (c1.radius + c2.radius);
  };

  return <canvas ref={canvasRef} className="block w-full h-full cursor-none" />;
};
