import React from 'react';

interface CyberStatProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export const CyberStat: React.FC<CyberStatProps> = ({ label, value, subtext }) => (
  <div className="relative p-4 group">
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">{label}</div>
    <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
    {subtext && <div className="text-[10px] text-gold-500/70 font-mono mt-1">{subtext}</div>}
  </div>
);