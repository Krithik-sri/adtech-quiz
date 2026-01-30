import React from 'react';
import { GlassCard } from './GlassCard';
import { getLevelInfo } from '../utils/leveling';

interface ResultsScreenProps {
  xp: number;
  accuracy: number;
  totalXp: number;
  onHome: () => void;
  onRestart: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ xp, accuracy, totalXp, onHome, onRestart }) => {
  const hudLevelInfo = getLevelInfo(totalXp); // This totalXp should already include the session xp

  return (
    <GlassCard className="max-w-4xl w-full space-y-12 bg-black/40 backdrop-blur-md">
      <div className="flex flex-col items-center text-center border-b border-gray-700 pb-10">
           <h2 className="text-5xl font-bold text-white mb-4">Mission Debrief</h2>
           <p className="text-gold-500 font-mono text-base tracking-wider uppercase">Performance Assessment Complete</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
              <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Session XP</div>
              <div className="text-4xl font-bold text-white text-shadow-gold">{xp}</div>
          </div>
           <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
              <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Accuracy</div>
              <div className="text-4xl font-bold text-white">
                  {accuracy}%
              </div>
          </div>
           <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
              <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">New Rank</div>
              <div className="text-2xl font-bold text-gold-500 truncate">{hudLevelInfo.title}</div>
          </div>
      </div>
      <div className="flex justify-center gap-8 mt-12">
        <button onClick={onHome} className="px-10 py-5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition uppercase text-base font-bold tracking-widest">Return to Base</button>
        <button onClick={onRestart} className="px-10 py-5 rounded-xl bg-gold-600 text-black hover:bg-gold-500 transition shadow-lg shadow-gold-900/20 uppercase text-base font-bold tracking-widest">Next Mission</button>
      </div>
    </GlassCard>
  );
};