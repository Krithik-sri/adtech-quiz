import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GamePhase, QuizState, User, Question } from './types';
import { quizQuestions as initialQuestions } from './data';
import { GlassCard } from './components/GlassCard';
import { FluidBackground } from './components/FluidBackground';
import { getAIExplanation } from './services/geminiService';
import { storageService } from './services/storageService';
import { ResponsiveContainer, Tooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

// --- Icons ---
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
  </svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

// Leveling Config
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 5000, 10000];
const LEVEL_TITLES = [
  "Intern", 
  "Media Planner", 
  "Ad Ops Specialist", 
  "Programmatic Trader", 
  "VP of Sales", 
  "AdTech Tycoon"
];

// Helper Component for Cyberpunk Stats
const CyberStat = ({ label, value, subtext }: { label: string, value: string | number, subtext?: string }) => (
  <div className="relative p-4 group">
    {/* Bracket Borders */}
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gray-600 group-hover:border-gold-500 transition-colors"></div>
    
    <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">{label}</div>
    <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
    {subtext && <div className="text-[10px] text-gold-500/70 font-mono mt-1">{subtext}</div>}
  </div>
);

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  
  // Interaction Trigger for background animation
  const [interactionTrigger, setInteractionTrigger] = useState(0);
  
  // Game State
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    xp: 0,
    streak: 0,
    level: 1,
    answers: [],
    isFinished: false,
    gameStarted: false,
    powerups: { fiftyFifty: 2, doubleBid: 2 },
    hiddenOptions: [],
    activeMultiplier: false,
  });
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiTip, setAiTip] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Load user on mount
  useEffect(() => {
    const existingUser = storageService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
      setPhase(GamePhase.WELCOME);
    }
  }, []);

  const handleInteraction = () => {
    setInteractionTrigger(prev => prev + 1);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    handleInteraction();
    const loggedInUser = storageService.login(usernameInput.trim());
    setUser(loggedInUser);
    setPhase(GamePhase.WELCOME);
  };

  const currentQ = questions[state.currentQuestionIndex];

  const getLevelInfo = (xp: number) => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    }
    // Cap level
    if (level > LEVEL_TITLES.length) level = LEVEL_TITLES.length;
    
    return {
      level,
      title: LEVEL_TITLES[level - 1],
      nextThreshold: LEVEL_THRESHOLDS[level] || 999999
    };
  };

  // --- Derived Stats for Dashboard ---
  const dashboardStats = useMemo(() => {
    if (!user) return null;
    
    const nextLevel = getLevelInfo(user.totalXp);
    const currentLevelBaseXP = LEVEL_THRESHOLDS[nextLevel.level - 1] || 0;
    const nextLevelTargetXP = nextLevel.nextThreshold;
    
    const range = nextLevelTargetXP - currentLevelBaseXP;
    const progressInLevel = user.totalXp - currentLevelBaseXP;
    
    const progressPercent = range > 0 
        ? Math.min(100, Math.max(0, (progressInLevel / range) * 100)) 
        : 100;

    // Calculate Global Accuracy
    let totalCorrect = 0;
    let totalAttempts = 0;
    if (user.categoryStats) {
      Object.values(user.categoryStats).forEach(stat => {
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
      nextXP: nextLevelTargetXP - user.totalXp
    };
  }, [user]);

  const startGame = () => {
    handleInteraction();
    // Shuffle questions logic
    const shuffled = [...initialQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);

    setState({
      currentQuestionIndex: 0,
      xp: 0,
      streak: 0,
      level: 1,
      answers: [],
      isFinished: false,
      gameStarted: true,
      powerups: { fiftyFifty: 2, doubleBid: 2 },
      hiddenOptions: [],
      activeMultiplier: false,
    });
    setPhase(GamePhase.PLAYING);
  };

  const activateFiftyFifty = () => {
    if (state.powerups.fiftyFifty <= 0 || state.hiddenOptions.length > 0 || selectedOption !== null) return;
    handleInteraction();
    
    const correct = currentQ.correctAnswer;
    const wrongIndices = currentQ.options.map((_, i) => i).filter(i => i !== correct);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    const toHide = shuffled.slice(0, 2);

    setState(prev => ({
      ...prev,
      powerups: { ...prev.powerups, fiftyFifty: prev.powerups.fiftyFifty - 1 },
      hiddenOptions: toHide
    }));
  };

  const activateDoubleBid = () => {
    if (state.powerups.doubleBid <= 0 || state.activeMultiplier || selectedOption !== null) return;
    handleInteraction();
    setState(prev => ({
      ...prev,
      powerups: { ...prev.powerups, doubleBid: prev.powerups.doubleBid - 1 },
      activeMultiplier: true
    }));
  };

  const handleAnswer = useCallback(async (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    handleInteraction();

    const isCorrect = optionIndex === currentQ.correctAnswer;
    const newStreak = isCorrect ? state.streak + 1 : 0;
    
    // XP Calculation
    let baseXP = 100;
    if (state.activeMultiplier) baseXP *= 2;
    const streakBonus = isCorrect ? (newStreak * 20) : 0;
    const earnedXP = isCorrect ? baseXP + streakBonus : 0;

    const newTotalXP = state.xp + earnedXP;
    const { level } = getLevelInfo(newTotalXP);

    setState(prev => ({
      ...prev,
      xp: newTotalXP,
      level,
      streak: newStreak,
      answers: [...prev.answers, { 
        questionId: currentQ.id, 
        isCorrect, 
        timeTaken: 0,
        category: currentQ.category 
      }]
    }));

    if (!isCorrect) {
      setLoadingAi(true);
      const explanation = await getAIExplanation(
        currentQ.category,
        `User chose "${currentQ.options[optionIndex]}" but the correct answer is "${currentQ.options[currentQ.correctAnswer]}". Question: ${currentQ.question}`
      );
      setAiTip(explanation);
      setLoadingAi(false);
    } else {
      setAiTip("");
    }
  }, [currentQ, state.streak, state.xp, state.activeMultiplier]);

  const finishGame = () => {
    handleInteraction();
    
    let finalXP = state.xp;
    // PERFECT RUN BONUS: If user got ALL questions correct, ensure they level up.
    // We check if number of correct answers equals total questions.
    const correctAnswersCount = state.answers.filter(a => a.isCorrect).length;
    const isPerfectRun = correctAnswersCount === questions.length && questions.length > 0;

    if (isPerfectRun && user) {
        const currentTotalXP = user.totalXp + finalXP;
        const levelInfo = getLevelInfo(currentTotalXP);
        // If there is a next level
        if (levelInfo.nextThreshold < 999999) {
            const xpNeededForNext = levelInfo.nextThreshold - currentTotalXP;
            // Add what's needed plus a 50 XP buffer
            if (xpNeededForNext > 0) {
                finalXP += (xpNeededForNext + 50);
            }
        }
    }

    // Update State to show correct boosted XP in results
    setState(prev => ({...prev, xp: finalXP}));

    if (user) {
      storageService.updateUserProgress(finalXP, state.streak, state.answers);
      const updatedUser = storageService.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    }
    setPhase(GamePhase.RESULTS);
  };

  const nextQuestion = async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setAiTip("");
    handleInteraction();
    
    if (state.currentQuestionIndex < questions.length - 1) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        hiddenOptions: [],
        activeMultiplier: false
      }));
    } else {
      finishGame();
    }
  };

  const currentLevelInfo = getLevelInfo(state.xp);
  
  const hudLevelInfo = user ? getLevelInfo(user.totalXp + state.xp) : getLevelInfo(state.xp);
  const hudPrevThreshold = LEVEL_THRESHOLDS[hudLevelInfo.level - 1] || 0;
  const hudRange = hudLevelInfo.nextThreshold - hudPrevThreshold;
  const hudProgress = (user ? (user.totalXp + state.xp) : state.xp) - hudPrevThreshold;
  const progressToNext = hudRange > 0 ? Math.min(100, Math.max(0, (hudProgress / hudRange) * 100)) : 100;

  // Prepare Radar Data
  const radarData = user ? Object.keys(user.categoryStats || {}).map(cat => ({
    subject: cat,
    A: user.categoryStats[cat].total > 0 ? (user.categoryStats[cat].correct / user.categoryStats[cat].total) * 100 : 0,
    fullMark: 100,
  })) : [];
  
  const displayRadarData = radarData.length > 2 ? radarData : [
      { subject: 'Basics', A: 40, fullMark: 100 },
      { subject: 'Tech', A: 30, fullMark: 100 },
      { subject: 'Buying', A: 20, fullMark: 100 },
      { subject: 'Data', A: 50, fullMark: 100 },
      { subject: 'Privacy', A: 10, fullMark: 100 },
  ];

  // --- RENDERS ---

  return (
    <>
      {/* Global Background (Fixed Z-0) */}
      <FluidBackground trigger={interactionTrigger} />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
        
        {phase === GamePhase.AUTH && (
           <GlassCard noGlow={true} className="max-w-md w-full text-center p-10">
             <div className="mb-8">
               <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Identify</h2>
               <p className="text-gray-400 text-sm">Enter your callsign to access the exchange.</p>
             </div>
             <form onSubmit={handleLogin} className="space-y-6">
               <input 
                 type="text" 
                 value={usernameInput}
                 onChange={(e) => setUsernameInput(e.target.value)}
                 placeholder="AGENT NAME"
                 className="w-full bg-black/50 border border-gray-700 rounded-xl px-6 py-4 text-white text-center font-mono text-lg focus:border-gold-500 focus:outline-none transition-colors placeholder:text-gray-700"
               />
               <button 
                 type="submit"
                 disabled={!usernameInput.trim()}
                 className="w-full py-4 bg-gold-600 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Connect
               </button>
             </form>
           </GlassCard>
        )}

        {phase === GamePhase.WELCOME && user && dashboardStats && (
          <div className="relative w-full max-w-7xl flex flex-col items-center animate-in fade-in duration-700">
            {/* Main Dashboard Card - Translucent to show global grid */}
            <GlassCard className="w-full p-0 relative overflow-hidden border-0 bg-black/20 backdrop-blur-md">
               
               <div className="relative z-10 p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1: Identity & Rank */}
                  <div className="flex flex-col gap-6">
                      <div className="border border-gray-800 bg-black/40 p-6 rounded-sm relative overflow-hidden backdrop-blur-sm">
                          <div className="absolute top-0 right-0 p-2 opacity-50"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Operator ID</div>
                          <h1 className="text-4xl font-black text-white uppercase tracking-tighter truncate">{user.username}</h1>
                          <div className="mt-4 flex items-center gap-2 text-gold-500 font-mono text-xs">
                             <span className="px-1 bg-gold-500/10 border border-gold-500/30">SECURE</span>
                             <span>{new Date().toLocaleDateString()}</span>
                          </div>
                      </div>

                      <div className="border border-gray-800 bg-black/40 p-6 rounded-sm flex-1 flex flex-col justify-center backdrop-blur-sm">
                          <div className="flex justify-between items-end mb-4">
                              <div>
                                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Clearance Level</div>
                                  <div className="text-xl font-bold text-white uppercase">{dashboardStats.title}</div>
                              </div>
                              <div className="text-3xl font-black text-gray-700 font-mono">0{dashboardStats.level}</div>
                          </div>
                          
                          <div className="relative h-2 bg-gray-900 w-full rounded-sm overflow-hidden mb-2">
                              <div className="absolute top-0 left-0 h-full bg-gold-500" style={{ width: `${dashboardStats.percent}%` }}></div>
                          </div>
                          <div className="text-right text-[10px] font-mono text-gray-500 uppercase">{dashboardStats.nextXP} XP to promotion</div>
                      </div>
                  </div>

                  {/* Column 2: Tactical Metrics (Grid) */}
                  <div className="grid grid-cols-2 gap-4">
                      <CyberStat label="Total XP" value={user.totalXp.toLocaleString()} />
                      <CyberStat label="Missions" value={user.gamesPlayed} subtext="COMPLETED" />
                      <CyberStat label="Accuracy" value={`${dashboardStats.accuracy}%`} subtext="GLOBAL AVG" />
                      <CyberStat label="Top Streak" value={user.highestStreak} subtext="CONSECUTIVE" />
                      
                      <button 
                        onClick={startGame}
                        className="col-span-2 group relative h-24 mt-2 bg-white text-black font-black text-2xl uppercase tracking-[0.1em] overflow-hidden transition-all hover:bg-gold-500"
                      >
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-black/10"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/10"></div>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          Initialize
                          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </span>
                        {/* Scanline effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine"></div>
                      </button>
                  </div>

                  {/* Column 3: Neural Lattice (Radar) */}
                  <div className="bg-black/40 border border-gray-800 p-4 rounded-sm relative flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm">
                      {/* Decorative Circular Elements */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                          <div className="w-64 h-64 border border-gold-500/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
                          <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full"></div>
                      </div>

                      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                        <BrainIcon />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Lattice</span>
                      </div>

                      <div className="w-full h-[280px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={displayRadarData}>
                            <PolarGrid stroke="#333" strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Proficiency"
                                dataKey="A"
                                stroke="#eab308"
                                strokeWidth={2}
                                fill="#eab308"
                                fillOpacity={0.4}
                                isAnimationActive={true}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                                itemStyle={{ color: '#eab308' }}
                            />
                            </RadarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
               </div>
               
               {/* Footer System Log */}
               <div className="border-t border-gray-800 bg-black/60 p-3 font-mono text-[10px] text-gray-500 uppercase flex justify-between items-center relative z-10 backdrop-blur-md">
                  <div className="flex gap-4">
                     <span className="animate-pulse text-emerald-500">● SYSTEM ONLINE</span>
                     <span>Latency: 12ms</span>
                     <span>Encryption: AES-256</span>
                  </div>
                  <button onClick={() => {storageService.logout(); setPhase(GamePhase.AUTH);}} className="hover:text-red-500 transition-colors">
                     [ TERMINATE SESSION ]
                  </button>
               </div>
            </GlassCard>
          </div>
        )}

        {phase === GamePhase.RESULTS && (
          <GlassCard className="max-w-4xl w-full space-y-12 bg-black/40 backdrop-blur-md">
            <div className="flex flex-col items-center text-center border-b border-gray-700 pb-10">
                 <h2 className="text-5xl font-bold text-white mb-4">Mission Debrief</h2>
                 <p className="text-gold-500 font-mono text-base tracking-wider uppercase">Performance Assessment Complete</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
                    <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Session XP</div>
                    <div className="text-4xl font-bold text-white text-shadow-gold">{state.xp}</div>
                    {(state.answers.filter(a => a.isCorrect).length === questions.length) && (
                        <div className="text-xs text-emerald-400 mt-2 font-mono">[ PERFECT RUN BONUS ]</div>
                    )}
                </div>
                 <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
                    <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Accuracy</div>
                    <div className="text-4xl font-bold text-white">
                        {Math.round((state.answers.filter(a => a.isCorrect).length / state.answers.length) * 100) || 0}%
                    </div>
                </div>
                 <div className="bg-black/30 border border-gray-800 p-8 rounded-xl text-center">
                    <div className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">New Rank</div>
                    <div className="text-2xl font-bold text-gold-500 truncate">{hudLevelInfo.title}</div>
                </div>
            </div>

            <div className="flex justify-center gap-8 mt-12">
              <button onClick={() => { handleInteraction(); setPhase(GamePhase.WELCOME); }} className="px-10 py-5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition uppercase text-base font-bold tracking-widest">Return to Base</button>
              <button onClick={startGame} className="px-10 py-5 rounded-xl bg-gold-600 text-black hover:bg-gold-500 transition shadow-lg shadow-gold-900/20 uppercase text-base font-bold tracking-widest">Next Mission</button>
            </div>
          </GlassCard>
        )}

        {phase === GamePhase.PLAYING && currentQ && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            
            <div className="w-full flex justify-start mb-6">
                <button
                    onClick={() => setPhase(GamePhase.WELCOME)}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Return to Lobby
                </button>
            </div>

            {/* Top HUD */}
            <div className="w-full grid grid-cols-2 gap-8 mb-12">
              {/* Left: Level & XP */}
              <div className="bg-graphite-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden shadow-lg">
                <div className="flex justify-between items-end mb-4 relative z-10">
                  <span className="text-base text-gray-400 uppercase tracking-widest font-bold">Level {hudLevelInfo.level}</span>
                  <span className="text-base text-gold-500 font-mono font-bold">{hudLevelInfo.title}</span>
                </div>
                <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden relative z-10 border border-gray-800">
                  <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progressToNext}%` }}></div>
                </div>
                <div className="text-right text-sm text-gray-500 mt-3 font-mono">{state.xp} Session XP</div>
              </div>

              {/* Right: Stats */}
              <div className="bg-graphite-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-8 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wider mb-2">Win Streak</span>
                  <span className={`text-4xl font-black ${state.streak > 1 ? 'text-gold-500 animate-pulse' : 'text-gray-300'}`}>x{state.streak}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm text-gray-500 uppercase tracking-wider mb-2">Bid Request</span>
                  <span className="text-4xl font-black text-white">{state.currentQuestionIndex + 1}<span className="text-gray-600 text-xl">/{questions.length}</span></span>
                </div>
              </div>
            </div>

            <GlassCard className="w-full bg-black/40 backdrop-blur-md">
              <div className="mb-12 flex justify-between items-start">
                <div className="w-full">
                  <span className="inline-block px-4 py-2 rounded-md bg-gray-800 text-sm font-bold tracking-widest text-gray-400 uppercase border border-gray-700 mb-8">{currentQ.category}</span>
                  <h2 className="text-3xl md:text-4xl font-bold leading-relaxed text-gray-100">{currentQ.question}</h2>
                </div>
              </div>

              {/* Powerups Bar */}
              <div className="flex gap-6 mb-12">
                <button 
                  disabled={state.powerups.fiftyFifty === 0 || state.hiddenOptions.length > 0 || selectedOption !== null}
                  onClick={activateFiftyFifty}
                  className={`flex-1 flex items-center justify-center gap-4 py-5 rounded-xl border text-base font-bold uppercase tracking-wider transition-all
                    ${state.powerups.fiftyFifty > 0 && selectedOption === null ? 'border-gray-600 bg-gray-800 hover:border-gold-500/50 hover:bg-gray-700 text-gray-300 shadow-lg' : 'border-gray-800 bg-black/40 text-gray-600 cursor-not-allowed opacity-50'}
                  `}
                >
                  <EyeSlashIcon />
                  50/50 <span className="text-gold-500">({state.powerups.fiftyFifty})</span>
                </button>
                <button 
                  disabled={state.powerups.doubleBid === 0 || state.activeMultiplier || selectedOption !== null}
                  onClick={activateDoubleBid}
                  className={`flex-1 flex items-center justify-center gap-4 py-5 rounded-xl border text-base font-bold uppercase tracking-wider transition-all
                    ${state.activeMultiplier ? 'border-gold-500 bg-gold-900/20 text-gold-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 
                      state.powerups.doubleBid > 0 && selectedOption === null ? 'border-gray-600 bg-gray-800 hover:border-gold-500/50 hover:bg-gray-700 text-gray-300 shadow-lg' : 'border-gray-800 bg-black/40 text-gray-600 cursor-not-allowed opacity-50'}
                  `}
                >
                  <LightningIcon />
                  Double Bid <span className="text-gold-500">({state.powerups.doubleBid})</span>
                </button>
              </div>

              <div className="space-y-6">
                {currentQ.options && currentQ.options.length > 0 ? (
                    currentQ.options.map((option, index) => {
                    if (state.hiddenOptions.includes(index)) {
                      return (
                        <div key={index} className="w-full p-8 rounded-xl border border-transparent bg-black/20 text-gray-800 flex justify-center items-center select-none">
                          <span className="text-sm uppercase tracking-widest font-bold">Filtered by Algorithm</span>
                        </div>
                      );
                    }

                    let btnClass = "w-full p-8 rounded-xl text-left border transition-all duration-300 group relative overflow-hidden ";
                    
                    if (selectedOption === null) {
                      btnClass += "bg-gradient-to-r from-gray-800 to-gray-800/50 border-gray-700 hover:border-gray-500 hover:from-gray-700 hover:pl-10 text-gray-300";
                    } else {
                      if (index === currentQ.correctAnswer) {
                        btnClass += "bg-emerald-900/30 border-emerald-500/50 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.15)]";
                      } else if (index === selectedOption) {
                        btnClass += "bg-red-900/30 border-red-500/50 text-red-200";
                      } else {
                        btnClass += "bg-black/40 border-transparent opacity-30";
                      }
                    }

                    return (
                      <button
                        key={index}
                        disabled={selectedOption !== null}
                        onClick={() => handleAnswer(index)}
                        className={btnClass}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <span className="font-medium tracking-wide text-xl">{option}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                    <div className="text-red-500">Error: Options data unavailable.</div>
                )}
              </div>

              {showExplanation && (
                <div className="mt-12 pt-10 border-t border-gray-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`p-10 rounded-2xl border-l-4 ${selectedOption === currentQ.correctAnswer ? 'bg-emerald-900/10 border-emerald-500' : 'bg-red-900/10 border-red-500'}`}>
                    <h4 className={`font-bold mb-4 uppercase tracking-widest text-base flex items-center gap-4 ${selectedOption === currentQ.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`}>
                      {selectedOption === currentQ.correctAnswer ? 'Auction Won' : 'Bid Lost'}
                      {state.activeMultiplier && selectedOption === currentQ.correctAnswer && <span className="text-gold-500 ml-2 border border-gold-500/30 px-3 py-1 rounded-full bg-gold-900/20 text-xs">2x Multiplier</span>}
                    </h4>
                    <p className="text-lg text-gray-300 leading-9">
                      {currentQ.explanation}
                    </p>

                    {selectedOption !== currentQ.correctAnswer && (
                      <div className="mt-8 pt-8 border-t border-gray-700/50">
                        {loadingAi ? (
                          <div className="flex items-center gap-3 text-gold-500 text-sm animate-pulse font-mono">
                            <BrainIcon />
                            <span>Querying Knowledge Base...</span>
                          </div>
                        ) : aiTip ? (
                          <div className="bg-black/40 p-6 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2 mb-3 text-gold-500 text-xs font-bold uppercase tracking-widest">
                              <BrainIcon /> AI Analysis
                            </div>
                            <p className="text-base text-gray-300 italic font-light leading-loose">"{aiTip}"</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={nextQuestion}
                    className="mt-10 w-full py-6 bg-gray-200 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    {state.currentQuestionIndex < questions.length - 1 ? 'Next Lot' : 'Finalize Report'}
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}