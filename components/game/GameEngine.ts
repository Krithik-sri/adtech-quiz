
import { GameObject, FloatingText, GameConfig } from './types';
import { CONSTANTS } from './constants';

export class GameEngine {
  public player: GameObject;
  public bullets: GameObject[] = [];
  public enemies: GameObject[] = [];
  public particles: GameObject[] = [];
  public floatingTexts: FloatingText[] = [];
  
  public budget: number = 2000;
  public score: number = 0;
  public questionTimer: number = 0;
  public shake: number = 0;
  public gameOver: boolean = false;
  
  private lastShotTime: number = 0;

  // Input State
  public keys: { [key: string]: boolean } = {};

  // Callbacks
  private onGameOver: (score: number) => void;
  private onTriggerQuestion: () => void;

  constructor(onGameOver: (score: number) => void, onTriggerQuestion: () => void) {
    this.onGameOver = onGameOver;
    this.onTriggerQuestion = onTriggerQuestion;
    this.reset();
  }

  reset() {
    this.player = {
        id: 'player',
        x: 0, y: 0, 
        vx: 0, vy: 0, 
        rotation: -Math.PI / 2, 
        radius: 12, 
        hp: 100, maxHp: 100, 
        color: '#eab308', 
        type: 'PLAYER',
        iframeTimer: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.budget = 2000;
    this.score = 0;
    this.questionTimer = 0;
    this.gameOver = false;
  }

  update(dt: number, config: GameConfig) {
    if (this.gameOver) return;

    const timeScale = dt / 16.67;
    const { width, height, activeBuff, activeUpgrades } = config;
    const isOverclock = activeBuff === 'OVERCLOCK';
    const isLag = activeBuff === 'LAG';

    // Shake Decay
    if (this.shake > 0) {
        this.shake *= 0.9;
        if (this.shake < 0.5) this.shake = 0;
    }

    // --- PLAYER MOVEMENT ---
    const hasBloatware = activeUpgrades.includes('BLOATWARE');
    const moveSpeedMult = hasBloatware ? 0.75 : 1.0; 

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
        this.player.rotation -= (isLag ? 0.04 : CONSTANTS.ROTATION_SPEED) * timeScale;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
        this.player.rotation += (isLag ? 0.04 : CONSTANTS.ROTATION_SPEED) * timeScale;
    }

    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
        let thrust = isLag ? CONSTANTS.THRUST_POWER * 0.6 : isOverclock ? CONSTANTS.THRUST_POWER * 1.5 : CONSTANTS.THRUST_POWER;
        thrust *= moveSpeedMult;

        this.player.vx += Math.cos(this.player.rotation) * thrust * timeScale;
        this.player.vy += Math.sin(this.player.rotation) * thrust * timeScale;

        // Exhaust Particles (Optimized: Reduced rate)
        if (Math.random() < 0.3) {
            const exhaustX = this.player.x - Math.cos(this.player.rotation) * 15;
            const exhaustY = this.player.y - Math.sin(this.player.rotation) * 15;
            this.spawnParticles(exhaustX, exhaustY, isOverclock ? '#eab308' : '#fbbf24', 1, 0.5);
        }
    }

    // Physics
    this.player.vx *= CONSTANTS.DRAG;
    this.player.vy *= CONSTANTS.DRAG;
    const speed = Math.sqrt(this.player.vx*this.player.vx + this.player.vy*this.player.vy);
    const currentMaxSpeed = CONSTANTS.MAX_SPEED * moveSpeedMult;
    
    if (speed > currentMaxSpeed) {
        this.player.vx = (this.player.vx / speed) * currentMaxSpeed;
        this.player.vy = (this.player.vy / speed) * currentMaxSpeed;
    }

    this.player.x += this.player.vx * timeScale;
    this.player.y += this.player.vy * timeScale;

    // Boundary Wrap
    if (this.player.x < 0) this.player.x = width;
    if (this.player.x > width) this.player.x = 0;
    if (this.player.y < 0) this.player.y = height;
    if (this.player.y > height) this.player.y = 0;

    if (this.player.iframeTimer && this.player.iframeTimer > 0) {
        this.player.iframeTimer -= dt;
    }

    // --- SHOOTING ---
    const hasManagedService = activeUpgrades.includes('MANAGED_SERVICE');
    const shootCost = hasManagedService ? CONSTANTS.BASE_SHOOT_COST * 2 : CONSTANTS.BASE_SHOOT_COST;

    if (this.keys['Space']) {
        const now = Date.now();
        let fireRate = isOverclock ? 80 : 250;
        if (activeUpgrades.includes('RAPID_FIRE')) fireRate *= 0.5;

        if (now - this.lastShotTime > fireRate) {
            if (this.budget >= shootCost) {
                this.spawnBullet(activeBuff, activeUpgrades);
                this.budget -= shootCost;
                this.lastShotTime = now;
                if (isOverclock) this.shake += 2;
            } else {
                 // RESTORED: Visual feedback for low budget
                 this.spawnText(this.player.x, this.player.y - 30, "NO BUDGET!", '#ef4444');
                 this.lastShotTime = now; // Prevent spamming text every frame
            }
        }
    }

    // --- BULLETS & ENEMIES UPDATE ---
    this.updateBullets(timeScale, width, height, activeUpgrades);
    this.updateEnemies(timeScale, width, height, activeUpgrades, isOverclock);
    this.updateParticles(timeScale);
    this.updateTexts(timeScale);

    // --- COLLISIONS ---
    this.checkCollisions(activeUpgrades, isOverclock);

    // --- SPAWNING ---
    this.handleSpawning(width, height, isOverclock, activeUpgrades);

    // --- TIMER & GAME OVER ---
    this.questionTimer += dt;
    if (this.questionTimer > CONSTANTS.QUESTION_INTERVAL) {
        this.questionTimer = 0;
        this.onTriggerQuestion();
    }

    if (this.budget <= 0) {
        this.budget = 0;
        this.gameOver = true;
        this.onGameOver(this.score);
    }
    
    if (this.player.hp <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.spawnParticles(this.player.x, this.player.y, '#ef4444', 50, 10);
        setTimeout(() => this.onGameOver(this.score), 500);
    }
  }

  private updateBullets(timeScale: number, w: number, h: number, upgrades: string[]) {
    const hasAutobidder = upgrades.includes('AUTOBIDDER');
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        
        // Homing
        if (hasAutobidder && this.enemies.length > 0) {
            let nearest: GameObject | null = null;
            let minDst = 40000; // Range check squared (200px)
            
            for(const e of this.enemies) {
                const dst = Math.pow(e.x - b.x, 2) + Math.pow(e.y - b.y, 2);
                if (dst < minDst) {
                    minDst = dst;
                    nearest = e;
                }
            }

            if (nearest) {
                const dx = nearest.x - b.x;
                const dy = nearest.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const currentSpeed = 12;
                const targetVx = (dx / dist) * currentSpeed;
                const targetVy = (dy / dist) * currentSpeed;
                const steerFactor = 0.1 * timeScale;
                b.vx += (targetVx - b.vx) * steerFactor;
                b.vy += (targetVy - b.vy) * steerFactor;
            }
        }

        b.x += b.vx * timeScale;
        b.y += b.vy * timeScale;

        if (b.x < -50 || b.x > w + 50 || b.y < -50 || b.y > h + 50) {
            this.bullets.splice(i, 1);
        }
    }
  }

  private updateEnemies(timeScale: number, w: number, h: number, upgrades: string[], isOverclock: boolean) {
     for (const e of this.enemies) {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        const acc = e.type === 'ENEMY_BOT' ? 0.08 : 0.05;
        e.vx += dirX * acc * timeScale;
        e.vy += dirY * acc * timeScale;
        
        e.vx *= 0.98;
        e.vy *= 0.98;
        e.x += e.vx * timeScale;
        e.y += e.vy * timeScale;

        e.rotation += (e.type === 'ENEMY_BOT' ? 0.2 : 0.05) * timeScale;

        if(e.x < -50) e.x = w + 50;
        else if(e.x > w + 50) e.x = -50;
        if(e.y < -50) e.y = h + 50;
        else if(e.y > h + 50) e.y = -50;
     }
  }

  private updateParticles(timeScale: number) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * timeScale;
          p.y += p.vy * timeScale;
          p.vx *= 0.95;
          p.vy *= 0.95;
          p.life = (p.life || 1) - 0.03 * timeScale;
          if (p.life <= 0) {
              this.particles.splice(i, 1);
          }
      }
  }

  private updateTexts(timeScale: number) {
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const t = this.floatingTexts[i];
          t.y += t.vy * timeScale;
          t.life -= 0.02 * timeScale;
          if (t.life <= 0) this.floatingTexts.splice(i, 1);
      }
  }

  private checkCollisions(upgrades: string[], isOverclock: boolean) {
      // Bullets vs Enemies
      for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          let hit = false;
          for (const e of this.enemies) {
              if (this.checkCircleCollide(b, e)) {
                  hit = true;
                  this.spawnParticles(b.x, b.y, e.color, 4, 3);
                  
                  if (e.type === 'ENEMY_PREMIUM') {
                      e.hp -= 10;
                      if (e.hp <= 0) {
                          const multiplier = upgrades.includes('YIELD_OPTIMIZER') ? 1.5 : 1.0;
                          const reward = Math.floor(150 * multiplier);
                          this.budget += reward;
                          this.score += reward;
                          this.shake += 5;
                          this.spawnParticles(e.x, e.y, e.color, 15, 6);
                          this.spawnText(e.x, e.y, `+$${reward} CPM`, '#eab308');
                          this.removeEnemy(e);
                      } else {
                          this.score += 10;
                      }
                  } else {
                      // BOT
                      e.hp -= 10;
                      if (e.hp <= 0) {
                          this.budget -= 300;
                          this.shake += 10;
                          this.spawnParticles(e.x, e.y, '#ef4444', 20, 8);
                          this.spawnText(e.x, e.y, `FRAUD! -$300`, '#ef4444');
                          this.removeEnemy(e);
                      }
                  }
                  break; // Bullet hits one enemy
              }
          }
          if (hit) this.bullets.splice(i, 1);
      }

      // Player vs Enemies
      for (const e of this.enemies) {
          if (this.checkCircleCollide(this.player, e)) {
              if (isOverclock) {
                  this.removeEnemy(e);
                  this.shake += 8;
                  this.spawnParticles(e.x, e.y, '#eab308', 20, 8);
                  this.budget += 200;
                  this.spawnText(e.x, e.y, "RAMMING BONUS!", '#fff');
              } else if (!this.player.iframeTimer || this.player.iframeTimer <= 0) {
                  let damage = e.type === 'ENEMY_BOT' ? 30 : 20;
                  if (upgrades.includes('FIREWALL')) damage *= 0.5;
                  
                  this.player.hp -= damage;
                  this.player.iframeTimer = 1500;
                  
                  // Knockback
                  const dx = this.player.x - e.x;
                  const dy = this.player.y - e.y;
                  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                  this.player.vx += (dx/dist) * 15;
                  this.player.vy += (dy/dist) * 15;

                  this.shake += 15;
                  this.spawnParticles(this.player.x, this.player.y, '#ef4444', 20, 6);
                  this.spawnText(this.player.x, this.player.y - 20, `CRITICAL ERROR! -${damage} HP`, '#ef4444');
                  this.budget -= 100;
              }
          }
      }
  }

  private handleSpawning(w: number, h: number, isOverclock: boolean, upgrades: string[]) {
      const hasTrafficBooster = upgrades.includes('TRAFFIC_BOOSTER');
      let maxEnemies = isOverclock ? 12 : 8;
      let spawnRate = 0.03;

      if (hasTrafficBooster) {
          maxEnemies = Math.floor(maxEnemies * 1.5);
          spawnRate = 0.06;
      }

      if (this.enemies.length < maxEnemies && Math.random() < spawnRate) {
          this.spawnEnemy(w, h, hasTrafficBooster);
      }
  }

  private spawnBullet(buff: string, upgrades: string[]) {
      const isSpread = buff === 'OVERCLOCK' || upgrades.includes('SPREAD_SHOT');
      const speed = 12;
      const p = this.player;

      const createB = (angleOffset: number) => {
          const angle = p.rotation + angleOffset;
          this.bullets.push({
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
  }

  private spawnEnemy(w: number, h: number, trafficBooster: boolean) {
      let x, y;
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = Math.random() * w; y = -50; }
      else if (edge === 1) { x = w + 50; y = Math.random() * h; }
      else if (edge === 2) { x = Math.random() * w; y = h + 50; }
      else { x = -50; y = Math.random() * h; }

      const botChance = trafficBooster ? 0.7 : 0.3;
      const isBot = Math.random() < botChance;

      this.enemies.push({
          id: Math.random().toString(),
          x, y,
          vx: 0, vy: 0,
          radius: 20,
          rotation: Math.random() * Math.PI,
          hp: isBot ? 20 : 30,
          color: isBot ? '#ef4444' : (Math.random() > 0.5 ? '#f472b6' : '#a78bfa'),
          type: isBot ? 'ENEMY_BOT' : 'ENEMY_PREMIUM'
      });
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speedMultiplier: number) {
      // Limit total particles to prevent lag
      if (this.particles.length > 200) this.particles.splice(0, 20);

      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * speedMultiplier * 2;
          this.particles.push({
              id: Math.random().toString(),
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: Math.random() * 3 + 1,
              rotation: 0,
              hp: 1,
              color,
              type: 'PARTICLE',
              life: 1.0 + Math.random() * 0.5
          });
      }
  }

  private spawnText(x: number, y: number, text: string, color: string) {
      this.floatingTexts.push({
          id: Math.random().toString(),
          x, y, text, color,
          life: 1.0,
          vy: -1 - Math.random()
      });
  }

  private removeEnemy(e: GameObject) {
      const idx = this.enemies.indexOf(e);
      if (idx !== -1) this.enemies.splice(idx, 1);
  }

  private checkCircleCollide(c1: GameObject, c2: GameObject) {
      const dx = c1.x - c2.x;
      const dy = c1.y - c2.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      return dist < (c1.radius + c2.radius);
  }
}
