import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, QuizState } from './types';
import { quizQuestions } from './data';
import { GlassCard } from './components/GlassCard';
import { FluidBackground } from './components/FluidBackground';
import { getAIExplanation } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

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
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];
const LEVEL_TITLES = [
  "Intern", 
  "Media Planner", 
  "Ad Ops Specialist", 
  "Programmatic Trader", 
  "VP of Sales", 
  "AdTech Tycoon"
];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WELCOME);
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

  const currentQ = quizQuestions[state.currentQuestionIndex];
  const COLORS = ['#10B981', '#EF4444']; 

  const getLevelInfo = (xp: number) => {
    let level = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    }
    return {
      level,
      title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
      nextThreshold: LEVEL_THRESHOLDS[level] || 999999
    };
  };

  const startGame = () => {
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
    
    const correct = currentQ.correctAnswer;
    const wrongIndices = currentQ.options.map((_, i) => i).filter(i => i !== correct);
    // Shuffle and pick 2
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
    setState(prev => ({
      ...prev,
      powerups: { ...prev.powerups, doubleBid: prev.powerups.doubleBid - 1 },
      activeMultiplier: true
    }));
  };

  const handleAnswer = useCallback(async (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowExplanation(true);

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
      answers: [...prev.answers, { questionId: currentQ.id, isCorrect, timeTaken: 0 }]
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

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setAiTip("");
    
    if (state.currentQuestionIndex < quizQuestions.length - 1) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        hiddenOptions: [],
        activeMultiplier: false
      }));
    } else {
      setPhase(GamePhase.RESULTS);
    }
  };

  const currentLevelInfo = getLevelInfo(state.xp);
  const prevThreshold = LEVEL_THRESHOLDS[currentLevelInfo.level - 1] || 0;
  const progressToNext = Math.min(100, Math.max(0, ((state.xp - prevThreshold) / (currentLevelInfo.nextThreshold - prevThreshold)) * 100));

  // --- RENDERS ---

  return (
    <>
      <FluidBackground phase={phase} />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
        
        {phase === GamePhase.WELCOME && (
          <div className="relative w-full max-w-5xl flex flex-col items-center">
            {/* Background ambient glow spots for depth */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gray-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

            <GlassCard className="w-full p-0 relative overflow-hidden border-0">
               {/* Technical Grid Pattern Overlay */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
               
               <div className="relative z-10 p-16 md:p-20 flex flex-col items-center text-center">
                  
                  {/* Status Bar */}
                  <div className="w-full flex justify-between items-center mb-12 text-xs font-mono tracking-[0.2em] text-gray-500 uppercase border-b border-gray-800 pb-4">
                     <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                        System Online
                     </div>
                     <div>v2.5.0_RELEASE</div>
                  </div>

                  {/* Hero Text */}
                  <div className="space-y-2 mb-10 transform hover:scale-[1.02] transition-transform duration-500">
                    <h1 className="text-6xl md:text-8xl font-thin text-white tracking-[0.2em] leading-none">
                      ADTECH
                    </h1>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-yellow-200 to-gold-500 tracking-tight leading-none drop-shadow-2xl">
                      MASTER
                    </h1>
                  </div>

                  <p className="max-w-2xl text-lg text-gray-400 font-light leading-relaxed mb-16">
                     Demonstrate proficiency in the programmatic ecosystem.
                     <br />
                     <span className="text-gold-500/80 font-mono text-sm mt-2 block">
                       Real-time Bidding • Attribution • Yield Optimization
                     </span>
                  </p>

                  {/* Feature Modules */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
                    <div className="bg-black/40 p-6 rounded-xl border border-white/5 hover:border-gold-500/30 transition-all group backdrop-blur-sm">
                       <div className="text-gold-500 mb-3 group-hover:scale-110 transition-transform duration-300 w-8 h-8 mx-auto"><TrophyIcon /></div>
                       <h3 className="font-bold text-gray-200 uppercase tracking-widest text-sm mb-2">Ranked Mode</h3>
                       <p className="text-xs text-gray-500 leading-relaxed">Compete for high-tier clearance levels.</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-white/5 hover:border-gold-500/30 transition-all group backdrop-blur-sm">
                       <div className="text-gold-500 mb-3 group-hover:scale-110 transition-transform duration-300 w-8 h-8 mx-auto"><LightningIcon /></div>
                       <h3 className="font-bold text-gray-200 uppercase tracking-widest text-sm mb-2">Powerups</h3>
                       <p className="text-xs text-gray-500 leading-relaxed">Deploy tactical aids during auctions.</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-white/5 hover:border-gold-500/30 transition-all group backdrop-blur-sm">
                       <div className="text-gold-500 mb-3 group-hover:scale-110 transition-transform duration-300 w-8 h-8 mx-auto"><BrainIcon /></div>
                       <h3 className="font-bold text-gray-200 uppercase tracking-widest text-sm mb-2">AI Oracle</h3>
                       <p className="text-xs text-gray-500 leading-relaxed">Neural network analysis of failures.</p>
                    </div>
                  </div>

                  {/* Main Action */}
                  <button 
                    onClick={startGame}
                    className="group relative px-16 py-6 bg-white text-black font-black text-xl uppercase tracking-[0.2em] rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Initialize Protocol
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                  
                  <div className="mt-8 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                     Secure Connection Established via Port 443
                  </div>

               </div>
            </GlassCard>
          </div>
        )}

        {phase === GamePhase.RESULTS && (
          <GlassCard className="max-w-6xl w-full space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-10">
              <div className="text-left space-y-3">
                 <h2 className="text-5xl font-bold text-white">Performance Report</h2>
                 <p className="text-gold-500 font-mono text-base tracking-wider uppercase">End of Fiscal Year</p>
              </div>
              <div className="text-right mt-8 md:mt-0">
                 <div className="text-base text-gray-400 uppercase tracking-widest mb-2">Final Clearance Level</div>
                 <div className="text-6xl font-black text-white">{currentLevelInfo.title}</div>
                 <div className="text-gold-500 text-3xl font-mono mt-3">{state.xp} XP Earned</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-black/30 rounded-2xl p-10 border border-white/5">
                <h3 className="text-base font-bold uppercase text-gray-400 mb-8 tracking-wider">Yield Accuracy</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[{ name: 'Correct', value: state.answers.filter(a => a.isCorrect).length }, { name: 'Incorrect', value: state.answers.filter(a => !a.isCorrect).length }]} 
                        cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value"
                      >
                        {state.answers.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isCorrect ? COLORS[0] : COLORS[1]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-black/30 rounded-2xl p-10 border border-white/5">
                <h3 className="text-base font-bold uppercase text-gray-400 mb-8 tracking-wider">Vertical Mastery</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.keys(quizQuestions.reduce((acc: any, q) => ({...acc, [q.category]: 1}), {})).map(cat => ({
                        name: cat,
                        Score: (state.answers.filter((a, i) => quizQuestions[i].category === cat && a.isCorrect).length / state.answers.filter((a, i) => quizQuestions[i].category === cat).length) * 100 || 0
                      }))}>
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', color: '#fff' }} />
                      <Bar dataKey="Score" fill="#eab308" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-8 mt-12">
              <button onClick={() => setPhase(GamePhase.WELCOME)} className="px-10 py-5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition uppercase text-base font-bold tracking-widest">Lobby</button>
              <button onClick={startGame} className="px-10 py-5 rounded-xl bg-gold-600 text-black hover:bg-gold-500 transition shadow-lg shadow-gold-900/20 uppercase text-base font-bold tracking-widest">New Campaign</button>
            </div>
          </GlassCard>
        )}

        {phase === GamePhase.PLAYING && (
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
              <div className="bg-graphite-800/90 backdrop-blur border border-gray-700 rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden shadow-lg">
                <div className="flex justify-between items-end mb-4 relative z-10">
                  <span className="text-base text-gray-400 uppercase tracking-widest font-bold">Level {currentLevelInfo.level}</span>
                  <span className="text-base text-gold-500 font-mono font-bold">{currentLevelInfo.title}</span>
                </div>
                <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden relative z-10 border border-gray-800">
                  <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progressToNext}%` }}></div>
                </div>
                <div className="text-right text-sm text-gray-500 mt-3 font-mono">{state.xp} / {currentLevelInfo.nextThreshold} XP</div>
              </div>

              {/* Right: Stats */}
              <div className="bg-graphite-800/90 backdrop-blur border border-gray-700 rounded-2xl p-8 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 uppercase tracking-wider mb-2">Win Streak</span>
                  <span className={`text-4xl font-black ${state.streak > 1 ? 'text-gold-500 animate-pulse' : 'text-gray-300'}`}>x{state.streak}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm text-gray-500 uppercase tracking-wider mb-2">Bid Request</span>
                  <span className="text-4xl font-black text-white">{state.currentQuestionIndex + 1}<span className="text-gray-600 text-xl">/{quizQuestions.length}</span></span>
                </div>
              </div>
            </div>

            <GlassCard className="w-full">
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
                {currentQ.options.map((option, index) => {
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
                })}
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
                    {state.currentQuestionIndex < quizQuestions.length - 1 ? 'Next Lot' : 'Finalize Report'}
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