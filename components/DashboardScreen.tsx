import React, { useMemo } from 'react';
import { User, CategoryStat } from '../types';
import { GlassCard } from './GlassCard';
import { CyberStat } from './CyberStat';
import { getLevelInfo, LEVEL_THRESHOLDS } from '../utils/leveling';
import { ResponsiveContainer, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface DashboardScreenProps {
  user: User;
  onStartGame: () => void;
}

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onStartGame }) => {
  const stats = useMemo(() => {
    const nextLevel = getLevelInfo(user.totalXp);
    const currentLevelBaseXP = LEVEL_THRESHOLDS[nextLevel.level - 1] || 0;
    const range = nextLevel.nextThreshold - currentLevelBaseXP;
    const progressInLevel = user.totalXp - currentLevelBaseXP;
    const progressPercent = range > 0 ? Math.min(100, Math.max(0, (progressInLevel / range) * 100)) : 100;

    let totalCorrect = 0;
    let totalAttempts = 0;
    if (user.categoryStats) {
      Object.values(user.categoryStats).forEach((stat: CategoryStat) => { 
        totalCorrect += stat.correct; 
        totalAttempts += stat.total; 
      });
    }
    const globalAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return { 
      title: nextLevel.title, 
      level: nextLevel.level, 
      percent: progressPercent, 
      accuracy: globalAccuracy, 
      nextXP: nextLevel.nextThreshold - user.totalXp 
    };
  }, [user]);

  const radarData = Object.keys(user.categoryStats || {}).map(cat => ({
    subject: cat,
    A: user.categoryStats[cat].total > 0 ? (user.categoryStats[cat].correct / user.categoryStats[cat].total) * 100 : 0,
    fullMark: 100,
  }));

  const displayRadarData = radarData.length > 2 ? radarData : [ 
    { subject: 'Basics', A: 40, fullMark: 100 }, 
    { subject: 'Tech', A: 30, fullMark: 100 }, 
    { subject: 'Buying', A: 20, fullMark: 100 }, 
    { subject: 'Data', A: 50, fullMark: 100 }, 
    { subject: 'Privacy', A: 10, fullMark: 100 }
  ];

  return (
    <div className="relative w-full max-w-7xl flex flex-col items-center animate-in fade-in duration-700">
      <GlassCard className="w-full p-0 relative overflow-hidden border-0 bg-black/20 backdrop-blur-md">
        <div className="relative z-10 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Identity Column */}
          <div className="flex flex-col gap-6">
              <div className="border border-gold-500/20 bg-gray-900/40 p-6 rounded-sm relative overflow-hidden backdrop-blur-sm shadow-inner">
                  <div className="absolute top-0 right-0 p-2 opacity-50"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Operator ID</div>
                  <h1 className="text-4xl font-black text-white uppercase tracking-tighter truncate">{user.username}</h1>
                  <div className="mt-4 flex items-center gap-2 text-gold-500 font-mono text-xs"><span className="px-1 bg-gold-500/10 border border-gold-500/30">SECURE</span><span>{new Date().toLocaleDateString()}</span></div>
              </div>
              <div className="border border-gold-500/20 bg-gray-900/40 p-6 rounded-sm flex-1 flex flex-col justify-center backdrop-blur-sm shadow-inner">
                  <div className="flex justify-between items-end mb-4">
                      <div><div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Clearance Level</div><div className="text-xl font-bold text-white uppercase">{stats.title}</div></div>
                      <div className="text-3xl font-black text-gray-700 font-mono">0{stats.level}</div>
                  </div>
                  <div className="relative h-2 bg-gray-900 w-full rounded-sm overflow-hidden mb-2"><div className="absolute top-0 left-0 h-full bg-gold-500" style={{ width: `${stats.percent}%` }}></div></div>
                  <div className="text-right text-[10px] font-mono text-gray-500 uppercase">{stats.nextXP} XP to promotion</div>
              </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
              <CyberStat label="Total XP" value={user.totalXp.toLocaleString()} />
              <CyberStat label="Missions" value={user.gamesPlayed} subtext="COMPLETED" />
              <CyberStat label="Accuracy" value={`${stats.accuracy}%`} subtext="GLOBAL AVG" />
              <CyberStat label="Top Streak" value={user.highestStreak} subtext="CONSECUTIVE" />
              <button onClick={onStartGame} className="col-span-2 group relative h-24 mt-2 bg-white text-black font-black text-2xl uppercase tracking-[0.1em] overflow-hidden transition-all hover:bg-gold-500">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10"></div><div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">Initialize <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine"></div>
              </button>
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-900/40 border border-gold-500/20 p-4 rounded-sm relative flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm shadow-inner">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10"><BrainIcon /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Lattice</span></div>
              <div className="w-full h-[280px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayRadarData}>
                    <PolarGrid stroke="#333" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Proficiency" dataKey="A" stroke="#eab308" strokeWidth={2} fill="#eab308" fillOpacity={0.4} isAnimationActive={true} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#eab308' }} />
                    </RadarChart>
                </ResponsiveContainer>
              </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};