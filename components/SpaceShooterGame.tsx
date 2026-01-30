import React, { useEffect, useRef } from 'react';

interface SpaceShooterGameProps {
  onGameOver: (score: number) => void;
  onTriggerQuestion: () => void;
  activeBuff: 'NONE' | 'OVERCLOCK' | 'LAG';
  isPaused: boolean;
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
  type: 'PLAYER' | 'ENEMY' | 'BULLET' | 'PARTICLE';
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
  isPaused 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const frameIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const questionTimerRef = useRef(0);
  const shakeRef = useRef(0); // Screen shake intensity
  const QUESTION_INTERVAL = 20000;

  // Physics Constants
  const DRAG = 0.98; 
  const THRUST_POWER = 0.35; // Slight boost
  const ROTATION_SPEED = 0.08;
  const MAX_SPEED = 9;

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
      
      // LAG EFFECT: Chromatic Aberration (RGB Split)
      if (activeBuff === 'LAG' && !isPaused) {
        // Draw Red Channel Offset
        ctx.save();
        ctx.translate(-3, 0);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        draw(ctx, canvas.width, canvas.height, true); 
        ctx.restore();

        // Draw Blue Channel Offset
        ctx.save();
        ctx.translate(3, 0);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        draw(ctx, canvas.width, canvas.height, true);
        ctx.restore();
        
        // Reset for normal draw (Green/Main)
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
  }, [isPaused, activeBuff]);

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
    
    // Screen Shake Decay
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
    if (shakeRef.current < 0.5) shakeRef.current = 0;

    // Controls
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      player.rotation -= (isLag ? 0.04 : ROTATION_SPEED) * timeScale;
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      player.rotation += (isLag ? 0.04 : ROTATION_SPEED) * timeScale;
    }

    const thrusting = keysRef.current['ArrowUp'] || keysRef.current['KeyW'];
    if (thrusting) {
      const thrust = isLag ? THRUST_POWER * 0.6 : isOverclock ? THRUST_POWER * 1.5 : THRUST_POWER;
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
    if (speed > MAX_SPEED) {
      player.vx = (player.vx / speed) * MAX_SPEED;
      player.vy = (player.vy / speed) * MAX_SPEED;
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

    // Shooting
    if (keysRef.current['Space']) {
      const now = Date.now();
      const fireRate = isOverclock ? 80 : 250;
      if (now - lastShotTimeRef.current > fireRate) {
        spawnBullet();
        lastShotTimeRef.current = now;
        if (isOverclock) addShake(2);
      }
    }

    // Bullets
    bulletsRef.current.forEach(b => {
      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;
      if (b.x < -50 || b.x > width + 50 || b.y < -50 || b.y > height + 50) {
        b.hp = 0;
      }
    });
    bulletsRef.current = bulletsRef.current.filter(b => b.hp > 0);

    // Enemies
    const maxEnemies = isOverclock ? 12 : 6;
    if (enemiesRef.current.length < maxEnemies && Math.random() < 0.03) {
      spawnEnemy(width, height);
    }

    enemiesRef.current.forEach(e => {
      // Swarming behavior
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const distToPlayer = Math.sqrt(dx*dx + dy*dy);
      
      // Normalize
      const dirX = dx / distToPlayer;
      const dirY = dy / distToPlayer;

      // Accelerate towards player slightly
      e.vx += dirX * 0.05 * timeScale;
      e.vy += dirY * 0.05 * timeScale;

      // Separation
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

      // Friction
      e.vx *= 0.98; 
      e.vy *= 0.98;

      e.x += e.vx * timeScale;
      e.y += e.vy * timeScale;
      e.rotation += 0.05 * timeScale;

      // Wrap enemies
      if(e.x < -50) e.x = width + 50;
      if(e.x > width + 50) e.x = -50;
      if(e.y < -50) e.y = height + 50;
      if(e.y > height + 50) e.y = -50;
    });

    // Collisions
    bulletsRef.current.forEach(b => {
      enemiesRef.current.forEach(e => {
        if (checkCircleCollide(b, e)) {
          e.hp -= 10;
          b.hp = 0;
          scoreRef.current += 10; 
          spawnParticles(b.x, b.y, e.color, 4, 3);
          
          if (e.hp <= 0) {
            scoreRef.current += 100;
            addShake(5);
            spawnParticles(e.x, e.y, e.color, 15, 6);
            spawnText(e.x, e.y, "+$100 CPM", '#eab308');
          }
        }
      });
    });

    // Player Collision
    enemiesRef.current.forEach(e => {
      if (checkCircleCollide(player, e)) {
        if (isOverclock) {
             e.hp = 0;
             addShake(8);
             spawnParticles(e.x, e.y, '#eab308', 20, 8);
             scoreRef.current += 200;
             spawnText(e.x, e.y, "RAMMING BONUS!", '#fff');
        } else if (!player.iframeTimer || player.iframeTimer <= 0) {
             // DAMAGE LOGIC
             player.hp -= 20; 
             player.iframeTimer = 1500; // 1.5s invulnerability
             
             const dx = player.x - e.x;
             const dy = player.y - e.y;
             const dist = Math.sqrt(dx*dx + dy*dy) || 1;
             
             // Strong knockback
             player.vx += (dx/dist) * 12;
             player.vy += (dy/dist) * 12;
             
             addShake(15);
             spawnParticles(player.x, player.y, '#ef4444', 20, 6);
             spawnText(player.x, player.y - 20, "CRITICAL ERROR!", '#ef4444');
             
             if (player.hp <= 0) {
                 gameOverRef.current = true;
                 spawnParticles(player.x, player.y, '#ef4444', 50, 10);
                 setTimeout(() => onGameOver(scoreRef.current), 500);
             }
        }
      }
    });

    enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

    // Update Particles (Sparks)
    particlesRef.current.forEach(p => {
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vx *= 0.95; // High Drag for spark effect
      p.vy *= 0.95;
      p.life = (p.life || 1) - 0.03 * timeScale;
    });
    particlesRef.current = particlesRef.current.filter(p => (p.life || 0) > 0);

    // Update Floating Text
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
    // Clear only if main pass
    if (!isGhostPass) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.save();
    
    // Apply Shake
    if (shakeRef.current > 0) {
      const dx = (Math.random() - 0.5) * shakeRef.current;
      const dy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(dx, dy);
    }

    // Grid (Fainter on lag pass)
    if (!isGhostPass) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const offset = (Date.now() / 50) % 50;
        for (let x = 0; x <= width; x += 100) { ctx.moveTo(x, offset); ctx.lineTo(x, height); } // Moving grid vertically
        for (let y = offset; y <= height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();
    }

    // Damage Flash Overlay
    const player = playerRef.current;
    if (player.iframeTimer && player.iframeTimer > 1200 && !isGhostPass) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red flash
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
      
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      
      const r = e.radius;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.lineTo(0, -r);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = e.color;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.restore();
    });

    // Particles
    particlesRef.current.forEach(pt => {
      ctx.globalAlpha = pt.life || 0;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.rect(pt.x, pt.y, pt.radius, pt.radius); // Squares look more techy
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Floating Text (UI Layer - not affected by shake usually, but we want it to feel grounded)
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    floatingTextsRef.current.forEach(t => {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore(); // End Shake

    // HUD (Static)
    if (!isGhostPass) {
        drawHUD(ctx, width, height);
    }
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Score
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`REVENUE: $${Math.floor(scoreRef.current).toLocaleString()}`, 20, 40);
    
    // Health Bar
    const player = playerRef.current;
    const maxHp = player.maxHp || 100;
    const hp = Math.max(0, player.hp);
    const hpPercent = hp / maxHp;

    // Bar Background
    ctx.fillStyle = 'rgba(31, 41, 55, 0.8)'; // Gray-800
    ctx.fillRect(20, 55, 200, 8);
    
    // Bar Fill
    const barColor = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = barColor;
    ctx.fillRect(20, 55, 200 * hpPercent, 8);

    // Text Label
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = barColor;
    ctx.fillText(`INTEGRITY ${Math.ceil(hp)}%`, 225, 62);

    // Status
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = activeBuff === 'LAG' ? '#ef4444' : '#10b981';
    const statusText = activeBuff === 'LAG' ? 'CONNECTION UNSTABLE' : 'SYSTEM OPTIMAL';
    ctx.fillText(`STATUS: ${statusText}`, 20, 85);

    if (activeBuff !== 'NONE') {
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = activeBuff === 'OVERCLOCK' ? '#eab308' : '#ef4444';
        ctx.fillText(activeBuff === 'OVERCLOCK' ? '>> BANDWIDTH OVERCLOCK <<' : '>> PACKET LOSS DETECTED <<', 20, 105);
    }
    
    // Timer
    const timeRatio = questionTimerRef.current / QUESTION_INTERVAL;
    const barWidth = 300;
    const barX = (width - barWidth) / 2;
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX, 15, barWidth, 6);
    
    const color = timeRatio > 0.8 ? '#ef4444' : '#eab308';
    ctx.fillStyle = color;
    ctx.fillRect(barX, 15, barWidth * timeRatio, 6);
    
    if (timeRatio > 0.9) {
       ctx.fillStyle = '#ef4444';
       ctx.font = 'bold 14px "JetBrains Mono", monospace';
       ctx.textAlign = 'center';
       if (Math.floor(Date.now() / 200) % 2 === 0) {
           ctx.fillText('! FIREWALL BREACH IMMINENT !', width/2, 40);
       }
       ctx.textAlign = 'left';
    }
  };

  // --- HELPERS ---
  const spawnBullet = () => {
    const p = playerRef.current;
    const isSpread = activeBuff === 'OVERCLOCK';
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
        createB(-0.15);
        createB(0.15);
        createB(-0.3);
        createB(0.3);
    }
  };

  const spawnEnemy = (w: number, h: number) => {
    let x, y;
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    if (edge === 0) { x = Math.random() * w; y = -50; }
    else if (edge === 1) { x = w + 50; y = Math.random() * h; }
    else if (edge === 2) { x = Math.random() * w; y = h + 50; }
    else { x = -50; y = Math.random() * h; }

    const speed = 2 + Math.random() * 2;
    
    enemiesRef.current.push({
      id: Math.random().toString(),
      x, y, 
      vx: 0, vy: 0, 
      radius: 20, 
      rotation: Math.random() * Math.PI,
      hp: 30, maxHp: 30,
      color: Math.random() > 0.5 ? '#f472b6' : '#a78bfa',
      type: 'ENEMY'
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