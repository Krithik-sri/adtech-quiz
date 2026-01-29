import React, { useEffect, useRef } from 'react';

interface FluidBackgroundProps {
  trigger?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  pulseSpeed: number;
}

export const FluidBackground: React.FC<FluidBackgroundProps> = ({ 
  trigger = 0, 
  className = "fixed inset-0 z-0 pointer-events-none" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTriggerRef = useRef(trigger);

  // Initialize Particles
  const initParticles = (width: number, height: number) => {
    const particleCount = Math.floor((width * height) / 15000); // Responsive count
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1, // 1px to 4px squares
        speedY: Math.random() * 0.5 + 0.2, // Slow upward drift
        opacity: Math.random() * 0.5 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }
    return particles;
  };

  useEffect(() => {
    // On trigger (interaction), add a burst of speed temporarily or add new particles
    if (trigger !== lastTriggerRef.current) {
      // Speed up existing particles momentarily
      particlesRef.current.forEach(p => p.y -= 20); // Jump up
      lastTriggerRef.current = trigger;
    }
  }, [trigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particlesRef.current = initParticles(width, height);
    };
    
    // Initial setup
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Deep Black Background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // --- STATIC GRID ---
      // Draw a subtle, thin 2D grid
      const gridSize = 50;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.15)'; // Very faint gold
      
      ctx.beginPath();
      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // --- PARTICLES ---
      ctx.fillStyle = '#eab308'; // Tailwind yellow-500 (Gold)
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#eab308';

      particlesRef.current.forEach(p => {
        // Update position
        p.y -= p.speedY;
        
        // Pulse opacity
        p.opacity += p.pulseSpeed;
        if (p.opacity > 0.8 || p.opacity < 0.1) p.pulseSpeed *= -1;

        // Reset if off screen
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.globalAlpha = p.opacity;
        ctx.fillRect(p.x, p.y, p.size, p.size); // Tech squares
      });
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Vignette Overlay
      const radGrad = ctx.createRadialGradient(width/2, height/2, height * 0.4, width/2, height/2, height);
      radGrad.addColorStop(0, 'transparent');
      radGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0,0,width,height);

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    }
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};