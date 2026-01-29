import React, { useEffect, useRef } from 'react';

interface FluidBackgroundProps {
  phase?: string;
}

export const FluidBackground: React.FC<FluidBackgroundProps> = ({ phase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store waves in a ref to persist across renders without re-triggering effects
  const interactionWaves = useRef<{x: number, y: number, time: number, type: string}[]>([]);
  const prevPhase = useRef<string | undefined>(phase);

  useEffect(() => {
    // Trigger a large wave when phase changes
    if (phase !== prevPhase.current) {
      interactionWaves.current.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        time: 0,
        type: 'phase'
      });
      prevPhase.current = phase;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let time = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Liquid Config
    const lines = 16; // Reduced from 35 to increase vertical spacing
    const step = height / lines;
    
    const animate = () => {
      // Clear with dark background
      ctx.fillStyle = '#050505'; 
      ctx.fillRect(0, 0, width, height);

      time += 0.008; // Slow continuous flow

      // Process interaction ripples
      // Filter out old waves (lifespan ~4.0 units)
      interactionWaves.current = interactionWaves.current.filter(w => w.time < 5);
      interactionWaves.current.forEach(w => w.time += 0.03);

      // Draw horizontal liquid layers from top to bottom
      // Using 'source-over' painters algorithm (drawing back to front)
      for (let i = 0; i < lines; i++) {
        const yBase = i * step + step / 2;
        
        ctx.beginPath();
        const pointCount = Math.ceil(width / 30); 
        
        // Draw the wave curve
        for (let j = 0; j <= pointCount; j++) {
          const x = (j / pointCount) * width;
          
          // Base idle movement: overlapping sine waves
          const noise = 
            Math.sin(x * 0.0015 + time + i * 0.4) * 20 + 
            Math.cos(x * 0.004 - time * 0.5) * 10;

          let yOffset = noise;

          // Apply interaction ripples
          for (const w of interactionWaves.current) {
            const dx = x - w.x;
            const dy = yBase - w.y; // approximate Y distance
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Ripple expansion parameters
            const speed = 300; 
            const waveRadius = w.time * speed;
            const rippleWidth = 150;
            
            // Only calculate if within the active ring of the ripple
            if (Math.abs(dist - waveRadius) < rippleWidth) {
               // Normalized position within the ripple ring (-1 to 1)
               const relativePos = (dist - waveRadius) / rippleWidth;
               
               // Cosine pulse shape
               const pulse = Math.cos(relativePos * Math.PI) * 0.5 + 0.5;
               
               // Decay over time
               const damping = Math.max(0, 1 - w.time / 5);
               
               // Amplitude based on type
               const amp = w.type === 'phase' ? 100 : 50;
               
               // Add ripple height
               yOffset += Math.sin(dist * 0.03 - w.time * 8) * amp * pulse * damping;
            }
          }

          const y = yBase + yOffset;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Close the path to fill the area below the curve
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        // Fill Gradient: Graphite look
        // Each layer gets slightly darker or lighter to distinguish them
        const gradient = ctx.createLinearGradient(0, yBase - 50, 0, yBase + 200);
        // Top of the wave (near the line)
        gradient.addColorStop(0, `rgba(${30 + i * 2}, ${30 + i * 2}, ${35 + i * 2}, 0.8)`);
        // Deep bottom
        gradient.addColorStop(1, 'rgba(5, 5, 5, 1)'); 

        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke: Silvery edge
        // Only draw the top line
        ctx.beginPath();
        for (let j = 0; j <= pointCount; j++) {
           // Re-calculate Y for stroke (optimization: could cache points but this is fast enough)
           const x = (j / pointCount) * width;
           const noise = Math.sin(x * 0.0015 + time + i * 0.4) * 20 + Math.cos(x * 0.004 - time * 0.5) * 10;
           let yOffset = noise;
           for (const w of interactionWaves.current) {
             const dx = x - w.x;
             const dy = yBase - w.y; 
             const dist = Math.sqrt(dx * dx + dy * dy);
             const waveRadius = w.time * 300;
             const rippleWidth = 150;
             if (Math.abs(dist - waveRadius) < rippleWidth) {
                const relativePos = (dist - waveRadius) / rippleWidth;
                const pulse = Math.cos(relativePos * Math.PI) * 0.5 + 0.5;
                const damping = Math.max(0, 1 - w.time / 5);
                const amp = w.type === 'phase' ? 100 : 50;
                yOffset += Math.sin(dist * 0.03 - w.time * 8) * amp * pulse * damping;
             }
           }
           const y = yBase + yOffset;
           if (j === 0) ctx.moveTo(x, y);
           else ctx.lineTo(x, y);
        }
        
        ctx.lineWidth = 1.5;
        // Silver color with opacity variation
        ctx.strokeStyle = `rgba(200, 200, 210, ${0.15 + (i / lines) * 0.2})`;
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };
    
    const animId = requestAnimationFrame(animate);

    const handleClick = (e: MouseEvent) => {
      // Add a click ripple
      interactionWaves.current.push({
        x: e.clientX,
        y: e.clientY,
        time: 0,
        type: 'click'
      });
    };

    window.addEventListener('mousedown', handleClick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleClick);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#050505' }}
    />
  );
};