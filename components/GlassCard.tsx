import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  noGlow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', noGlow = false }) => {
  return (
    // Tech-Card Wrapper
    <div className={`relative group ${className}`}>
      
      {/* 1. Glow Effect behind card - Optional */}
      {!noGlow && (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-gold-600/40 via-transparent to-gold-600/40 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
      )}
      
      {/* 2. Main Card Body 
          - If noGlow is true, we use a darker, more opaque background (bg-black/90) to reduce 'glow' from behind.
          - Otherwise, we use the standard translucent bg-black/60.
      */}
      <div className={`relative h-full ${noGlow ? 'bg-black/90' : 'bg-black/60'} backdrop-blur-xl rounded-xl border border-white/10 p-1 md:p-1 overflow-hidden`}>
        
        {/* 3. Scanline/Grid Texture Overlay - Only show if glow is enabled */}
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
        <div className="relative z-10 p-8 md:p-10 h-full">
            {children}
        </div>
      </div>
    </div>
  );
};