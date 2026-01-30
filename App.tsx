
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, QuizState, User, Question, UpgradeType } from './types';
import { quizQuestions as initialQuestions } from './data';
import { FluidBackground } from './components/FluidBackground';
import { SpaceShooterGame } from './components/SpaceShooterGame';
import { getAIExplanation } from './services/geminiService';
import { storageService } from './services/storageService';

// Import modular components
import { AuthScreen } from './components/AuthScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { QuizOverlay } from './components/QuizOverlay';
import { UpgradeOverlay } from './components/UpgradeOverlay';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.AUTH);
  const [user, setUser] = useState<User | null>(null);
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
    activeUpgrades: [],
    activeMultiplier: false,
  });

  // Space Shooter Integration State
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [gameBuff, setGameBuff] = useState<'NONE' | 'OVERCLOCK' | 'LAG'>('NONE');
  
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

  const handleLogin = (username: string) => {
    const loggedInUser = storageService.login(username);
    setUser(loggedInUser);
    setPhase(GamePhase.WELCOME);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setPhase(GamePhase.AUTH);
  };

  const startGame = () => {
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
      activeUpgrades: [],
      activeMultiplier: false,
    });
    setIsQuizActive(false);
    setShowUpgrades(false);
    setGameBuff('NONE');
    setPhase(GamePhase.PLAYING);
  };

  const triggerQuestion = useCallback(() => {
    setIsQuizActive(true);
    if (state.currentQuestionIndex >= questions.length) {
        setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
        setState(prev => ({ ...prev, currentQuestionIndex: 0 }));
    }
  }, [questions.length, state.currentQuestionIndex]);

  const handleAnswer = useCallback(async (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowExplanation(true);
    
    const currentQ = questions[state.currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctAnswer;
    const newStreak = isCorrect ? state.streak + 1 : 0;
    
    // XP Calculation
    const earnedXP = isCorrect ? 500 : 0; // High XP for questions
    const newTotalXP = state.xp + earnedXP;

    setState(prev => ({
      ...prev,
      xp: newTotalXP,
      streak: newStreak,
      answers: [...prev.answers, { questionId: currentQ.id, isCorrect, timeTaken: 0, category: currentQ.category }]
    }));

    if (isCorrect) {
        // Instead of immediate resume, trigger Upgrade Overlay
        setGameBuff('OVERCLOCK');
        setAiTip("");
    } else {
        setGameBuff('LAG');
        setTimeout(() => setGameBuff('NONE'), 10000); 
        setLoadingAi(true);
        const explanation = await getAIExplanation(
            currentQ.category,
            `User chose "${currentQ.options[optionIndex]}" but correct is "${currentQ.options[currentQ.correctAnswer]}". Q: ${currentQ.question}`
        );
        setAiTip(explanation);
        setLoadingAi(false);
    }

  }, [questions, state]);

  const closeQuestionModal = () => {
    // If correct, go to upgrades, otherwise resume
    const currentQ = questions[state.currentQuestionIndex];
    const wasCorrect = selectedOption === currentQ.correctAnswer;

    setSelectedOption(null);
    setShowExplanation(false);
    setAiTip("");
    
    // Increment index
    setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));

    if (wasCorrect) {
      setIsQuizActive(false); // Hide quiz immediately
      setShowUpgrades(true); // Show upgrades
    } else {
      setIsQuizActive(false); // Resume game immediately
    }
  };

  const handleUpgradeSelect = (upgrade: UpgradeType) => {
    setState(prev => ({
      ...prev,
      activeUpgrades: [...prev.activeUpgrades, upgrade]
    }));
    setShowUpgrades(false);
  };

  const handleGameOver = (finalScore: number) => {
    const totalSessionXP = state.xp + Math.floor(finalScore / 10);
    setState(prev => ({ ...prev, xp: totalSessionXP }));
    if (user) {
      storageService.updateUserProgress(totalSessionXP, state.streak, state.answers);
      const updatedUser = storageService.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    }
    setPhase(GamePhase.RESULTS);
  };

  const currentQ = questions[state.currentQuestionIndex] || questions[0];
  const sessionAccuracy = state.answers.length > 0 
    ? Math.round((state.answers.filter(a => a.isCorrect).length / state.answers.length) * 100) 
    : 0;

  // Pause game if Quiz OR Upgrades are active
  const isGamePaused = isQuizActive || showUpgrades;

  return (
    <>
      {phase !== GamePhase.PLAYING && <FluidBackground trigger={interactionTrigger} />}
      
      <div 
        className={`relative z-10 min-h-screen flex flex-col items-center justify-center ${phase === GamePhase.PLAYING ? 'p-0 overflow-hidden' : 'p-8 md:p-12 overflow-y-auto'}`} 
        onClick={() => setInteractionTrigger(prev => prev + 1)}
      >
        
        {phase === GamePhase.AUTH && (
           <AuthScreen onLogin={handleLogin} />
        )}

        {phase === GamePhase.WELCOME && user && (
          <DashboardScreen 
            user={user} 
            onStartGame={startGame} 
            onLogout={handleLogout} 
          />
        )}

        {phase === GamePhase.RESULTS && user && (
          <ResultsScreen 
            xp={state.xp} 
            accuracy={sessionAccuracy} 
            totalXp={user.totalXp} 
            onHome={() => setPhase(GamePhase.WELCOME)} 
            onRestart={startGame} 
          />
        )}

        {phase === GamePhase.PLAYING && (
          <div className="relative w-full h-screen overflow-hidden bg-black">
            
            <SpaceShooterGame 
                onGameOver={handleGameOver} 
                onTriggerQuestion={triggerQuestion} 
                activeBuff={gameBuff}
                isPaused={isGamePaused}
                activeUpgrades={state.activeUpgrades}
            />

            {isQuizActive && currentQ && (
              <QuizOverlay 
                question={currentQ}
                selectedOption={selectedOption}
                showExplanation={showExplanation}
                aiTip={aiTip}
                loadingAi={loadingAi}
                onAnswer={handleAnswer}
                onClose={closeQuestionModal}
              />
            )}

            {showUpgrades && (
              <UpgradeOverlay 
                  onSelect={handleUpgradeSelect} 
                  activeUpgrades={state.activeUpgrades}
              />
            )}

            {/* Always visible Terminate Session */}
            <div className="absolute top-6 right-6 z-50">
                <button 
                  onClick={() => setPhase(GamePhase.WELCOME)} 
                  className="group flex items-center gap-2 bg-black/40 backdrop-blur-sm border border-red-900/40 hover:border-red-500/80 px-4 py-2 rounded-sm transition-all"
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-red-500 font-mono uppercase tracking-widest group-hover:text-red-400">Abort Mission</span>
                </button>
            </div>
            
            {/* Always visible Controls Hint */}
            <div className="absolute bottom-8 left-8 z-40 text-gray-500 font-mono text-[10px] pointer-events-none select-none">
                <div className="flex flex-col gap-1.5 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border border-gray-600 flex items-center justify-center rounded-[2px]">W</span>
                    <span className="w-4 h-4 border border-gray-600 flex items-center justify-center rounded-[2px]">A</span>
                    <span className="w-4 h-4 border border-gray-600 flex items-center justify-center rounded-[2px]">S</span>
                    <span className="w-4 h-4 border border-gray-600 flex items-center justify-center rounded-[2px]">D</span>
                    <span className="tracking-wider">THRUST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 h-4 border border-gray-600 flex items-center justify-center rounded-[2px] text-[8px]">SPACE</span>
                    <span className="tracking-wider">BID REQUEST ($5 CPM)</span>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
