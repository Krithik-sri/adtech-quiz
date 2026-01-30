
import React, { useMemo } from 'react';
import { Upgrade, UpgradeType } from '../types';
import { GlassCard } from './GlassCard';

interface UpgradeOverlayProps {
  onSelect: (upgrade: UpgradeType) => void;
  activeUpgrades: UpgradeType[];
}

const AVAILABLE_UPGRADES: Upgrade[] = [
  // --- GOOD UPGRADES ---
  {
    id: 'SPREAD_SHOT',
    name: 'Header Bidding Wrapper',
    description: 'Maximize demand. Fire 3 bid requests (bullets) in parallel.',
    rarity: 'RARE',
    icon: '⚡',
    maxStacks: 1
  },
  {
    id: 'RAPID_FIRE',
    name: 'Edge Caching',
    description: 'Reduce latency. +50% Bid Request Frequency.',
    rarity: 'COMMON',
    icon: '🔥',
    maxStacks: 3
  },
  {
    id: 'YIELD_OPTIMIZER',
    name: 'Dynamic Floor Price',
    description: 'Optimize yield. Earn +50% Revenue from verified impressions.',
    rarity: 'COMMON',
    icon: '💰',
    maxStacks: 5
  },
  {
    id: 'FIREWALL',
    name: 'IVT Scanner',
    description: 'Block invalid traffic. Reduces collision damage by 50%.',
    rarity: 'LEGENDARY',
    icon: '🛡️',
    maxStacks: 1
  },
  {
    id: 'AUTOBIDDER',
    name: 'Algorithmic Trading',
    description: 'AI-powered targeting. Bids automatically seek high-value users.',
    rarity: 'RARE',
    icon: '🎯',
    maxStacks: 1
  },

  // --- TRAP UPGRADES (DECEPTIVE ADS) ---
  {
    id: 'BLOATWARE',
    name: 'Marketing Cloud 360™',
    description: 'The ultimate all-in-one solution! Integrate everything! (High latency).',
    rarity: 'SPONSORED',
    icon: '☁️',
    maxStacks: 1
  },
  {
    id: 'MANAGED_SERVICE',
    name: 'Premium Managed Service',
    description: 'Sit back & relax. We handle your bidding strategy! (2x Tech Fee).',
    rarity: 'SPONSORED',
    icon: '👔',
    maxStacks: 1
  },
  {
    id: 'TRAFFIC_BOOSTER',
    name: 'Viral Traffic Surge',
    description: '10x your traffic instantly! No questions asked! (Low quality sources).',
    rarity: 'SPONSORED',
    icon: '🚀',
    maxStacks: 1
  }
];

export const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({ onSelect, activeUpgrades }) => {
  
  const options = useMemo(() => {
    // 1. Filter out upgrades we already have max stacks of
    const validUpgrades = AVAILABLE_UPGRADES.filter(u => {
      const currentCount = activeUpgrades.filter(active => active === u.id).length;
      return u.maxStacks ? currentCount < u.maxStacks : true;
    });

    // 2. Separate Goods and Traps
    const goods = validUpgrades.filter(u => u.rarity !== 'SPONSORED');
    const traps = validUpgrades.filter(u => u.rarity === 'SPONSORED');

    // 3. Select 3 Unique Cards
    const selected: Upgrade[] = [];
    const needed = 3;

    // 40% Chance to include a trap in the hand
    const includeTrap = Math.random() < 0.4 && traps.length > 0;
    
    // Shuffle arrays
    const shuffledGoods = [...goods].sort(() => 0.5 - Math.random());
    const shuffledTraps = [...traps].sort(() => 0.5 - Math.random());

    if (includeTrap && shuffledTraps.length > 0) {
      // Pick 1 trap
      selected.push(shuffledTraps[0]);
      // Fill rest with goods (if available)
      selected.push(...shuffledGoods.slice(0, Math.min(needed - 1, shuffledGoods.length)));
    } else {
      // All goods
      selected.push(...shuffledGoods.slice(0, Math.min(needed, shuffledGoods.length)));
    }

    // Shuffle the final hand so the trap isn't always in the same spot
    return selected.sort(() => 0.5 - Math.random());
  }, [activeUpgrades]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest mb-2">
            System Upgrade Available
          </h2>
          <p className="text-gold-500 font-mono">Select a protocol to install</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {options.map((upgrade, idx) => {
            const isSponsored = upgrade.rarity === 'SPONSORED';
            
            return (
              <button
                key={`${upgrade.id}-${idx}`}
                onClick={() => onSelect(upgrade.id)}
                className="group relative h-full focus:outline-none transition-transform hover:scale-[1.02] duration-300"
              >
                <GlassCard 
                  className={`h-full border-2 ${
                    isSponsored 
                      ? 'border-cyan-400/50 bg-cyan-900/10 shadow-[0_0_40px_rgba(34,211,238,0.2)]' 
                      : upgrade.rarity === 'LEGENDARY' 
                        ? 'border-gold-400 bg-gold-900/10 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                        : 'border-gray-800 hover:border-gold-500/50 hover:bg-gray-900/60'
                  }`}
                  contentClassName="p-8 flex flex-col items-center text-center h-full relative overflow-hidden"
                >
                  {/* Decorative "Shine" for sponsored */}
                  {isSponsored && (
                     <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 blur-3xl rounded-full pointer-events-none group-hover:bg-white/20 transition-colors"></div>
                  )}

                  {isSponsored && (
                    <div className="absolute top-0 right-0">
                        <div className="bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                            Suggested
                        </div>
                    </div>
                  )}

                  <div className={`text-7xl mb-6 transition-transform duration-300 drop-shadow-2xl ${isSponsored ? 'group-hover:rotate-12 scale-110' : 'group-hover:scale-110'}`}>
                    {upgrade.icon}
                  </div>
                  
                  <h3 className={`text-2xl font-black mb-3 leading-tight ${isSponsored ? 'text-cyan-400 italic' : 'text-white group-hover:text-gold-400'}`}>
                    {upgrade.name}
                  </h3>
                  
                  {/* Rarity Badge */}
                  <div className={`text-[10px] font-mono px-3 py-1 rounded-full mb-6 uppercase tracking-widest ${
                    isSponsored 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' 
                      : upgrade.rarity === 'LEGENDARY' 
                        ? 'bg-gold-500 text-black font-bold' 
                        : upgrade.rarity === 'RARE' 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {isSponsored ? 'Partner Deal' : upgrade.rarity}
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${isSponsored ? 'text-cyan-100/80' : 'text-gray-400'}`}>
                    {upgrade.description}
                  </p>
                  
                  {isSponsored && (
                    <div className="mt-4 text-[9px] text-cyan-500/50 uppercase tracking-widest border-t border-cyan-500/20 pt-2 w-full">
                      *By clicking you agree to 100% latency increase
                    </div>
                  )}

                  <div className="mt-auto pt-8 w-full">
                    <div className={`w-full py-3 font-bold uppercase text-xs tracking-[0.2em] rounded transition-all ${
                      isSponsored 
                        ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]' 
                        : 'bg-white text-black opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSponsored ? 'Accept Offer' : 'Install'}
                    </div>
                  </div>
                </GlassCard>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
