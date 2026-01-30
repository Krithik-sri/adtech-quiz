
import { GameObject, FloatingText, GameConfig } from './types';
import { CONSTANTS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  draw(
    width: number,
    height: number,
    entities: {
      player: GameObject;
      bullets: GameObject[];
      enemies: GameObject[];
      particles: GameObject[];
      texts: FloatingText[];
    },
    config: GameConfig,
    gameState: { budget: number; questionTimer: number; shake: number },
    isGhostPass: boolean
  ) {
    const { ctx } = this;
    const { player, bullets, enemies, particles, texts } = entities;

    if (!isGhostPass) {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.save();

    // Shake
    if (gameState.shake > 0) {
      const dx = (Math.random() - 0.5) * gameState.shake;
      const dy = (Math.random() - 0.5) * gameState.shake;
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

    // Particles - OPTIMIZATION: Keep shadowBlur OFF for particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life || 0;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.radius, p.radius);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Bullets - Selective Glow
    ctx.shadowBlur = config.activeBuff === 'OVERCLOCK' ? 10 : 0;
    ctx.shadowColor = '#eab308';
    ctx.fillStyle = config.activeBuff === 'OVERCLOCK' ? '#eab308' : '#fff';
    ctx.beginPath();
    bullets.forEach(b => {
      ctx.moveTo(b.x + b.radius, b.y);
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // Enemies
    enemies.forEach(e => {
      this.drawEnemy(e);
    });

    // Player
    if (!player.iframeTimer || player.iframeTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
      this.drawPlayer(player, config.activeBuff);
    }

    // Floating Text
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    texts.forEach(t => {
      ctx.globalAlpha = t.life;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    if (!isGhostPass) {
      this.drawHUD(width, height, player, gameState, config.activeUpgrades, config.activeBuff);
    }
  }

  private drawPlayer(player: GameObject, buff: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);

    // RESTORED: Glow Effect for Player
    if (buff === 'OVERCLOCK') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#eab308';
    }

    ctx.fillStyle = buff === 'LAG' ? '#ef4444' : player.color;
    ctx.beginPath();
    // Tech-Ship Shape
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  private drawEnemy(e: GameObject) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rotation);
    
    if (e.type === 'ENEMY_BOT') {
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
        // RESTORED: Slight glow for premium enemies to make them pop
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        
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
        
        ctx.shadowBlur = 0; // Reset
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  private drawHUD(width: number, height: number, player: GameObject, state: any, upgrades: any[], buff: string) {
    const ctx = this.ctx;
    
    // Top Left: Budget
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = state.budget < 500 ? '#ef4444' : '#eab308';
    ctx.fillText(`BUDGET: $${Math.floor(state.budget).toLocaleString()}`, 20, 40);

    // Health
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

    // Upgrades
    if (upgrades.length > 0) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('MODULES ONLINE:', 20, 90);
        
        let xOff = 20;
        let yOff = 105;
        upgrades.forEach((u: string) => {
            const isBad = ['BLOATWARE', 'MANAGED_SERVICE', 'TRAFFIC_BOOSTER'].includes(u);
            ctx.fillStyle = isBad ? '#ef4444' : '#eab308';
            const txt = `[${u}]`;
            ctx.fillText(txt, xOff, yOff);
            xOff += ctx.measureText(txt).width + 10;
            if (xOff > 400) { xOff = 20; yOff += 15; }
        });
    }

    // Timer Bar
    const timeRatio = state.questionTimer / CONSTANTS.QUESTION_INTERVAL;
    const barWidth = 300;
    const barX = (width - barWidth) / 2;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX, 15, barWidth, 6);
    ctx.fillStyle = timeRatio > 0.8 ? '#ef4444' : '#eab308';
    ctx.fillRect(barX, 15, barWidth * timeRatio, 6);

    // Bottom Stats (Console Log)
    const bottomY = height - 20;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`SYS.COORD: ${Math.floor(player.x)}:${Math.floor(player.y)}`, 20, bottomY);
    ctx.fillText(`ENGINES: ${Math.floor(Math.sqrt(player.vx*player.vx + player.vy*player.vy) * 10)}%`, 140, bottomY);
    ctx.fillText(`V.1.0.5 [OPTIMIZED]`, 240, bottomY);

    if (buff === 'OVERCLOCK') {
        ctx.fillStyle = '#eab308';
        ctx.fillText('>> OVERCLOCK ENGAGED', 20, bottomY - 15);
    } else if (buff === 'LAG') {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('>> NETWORK INSTABILITY', 20, bottomY - 15);
    }
  }
}
