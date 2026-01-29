import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    // Outer wrapper for the "shiny border" effect
    <div className={`relative rounded-3xl p-[1px] overflow-hidden group ${className}`}>
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-400 to-gray-700 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Inner Content Card */}
      <div className="relative h-full bg-graphite-800/90 backdrop-blur-md rounded-3xl p-10 shadow-2xl ring-1 ring-white/5">
        {/* Inner subtle noise/gloss */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 h-full flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
};