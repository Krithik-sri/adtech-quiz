import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  noGlow?: boolean;
  contentClassName?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', noGlow = false, contentClassName }) => {
  return (
    // Tech-Card Wrapper
    <div className={`relative group ${className}`}>
      
      {/* 1. Glow Effect behind card - Enhanced */}
      {!noGlow && (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-gold-600/50 via-transparent to-gold-600/50 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
      )}
      
      {/* 2. Main Card Body 
          - Increased opacity for better readability (bg-black/70 instead of 60)
          - Added neon border (gold-500/20) instead of white/10
          - Added subtle box shadow for "edge glow" effect
      */}
      <div className={`relative h-full ${noGlow ? 'bg-black/90' : 'bg-black/70'} backdrop-blur-xl rounded-xl border border-gold-500/30 shadow-[0_0_15px_-3px_rgba(234,179,8,0.15)] p-1 md:p-1 overflow-hidden`}>
        
        {/* 3. Scanline/Grid Texture Overlay */}
        {!noGlow && (
            <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `linear-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(234, 179, 8, 0.1) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            ></div>
        )}

        {/* 4. Tech Corners (Decorative) */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold-500 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold-500 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold-500 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold-500 rounded-br-lg"></div>

        {/* Content Container */}
        <div className={`relative z-10 h-full ${contentClassName || 'p-8 md:p-10'}`}>
            {children}
        </div>
      </div>
    </div>
  );
};