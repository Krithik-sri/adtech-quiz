import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, QuizState, User, Question } from './types';
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
    powerups: { fiftyFifty: 0, doubleBid: 0 },
    hiddenOptions: [],
    activeMultiplier: false,
  });

  // Space Shooter Integration State
  const [isQuizActive, setIsQuizActive] = useState(false);
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
      powerups: { fiftyFifty: 0, doubleBid: 0 },
      hiddenOptions: [],
      activeMultiplier: false,
    });
    setIsQuizActive(false);
    setGameBuff('NONE');
    setPhase(GamePhase.PLAYING);
  };

  // Triggered by SpaceShooterGame
  const triggerQuestion = useCallback(() => {
    // Pick next question if available, else random from pool
    setIsQuizActive(true);
    // Ensure we don't go out of bounds immediately, loop questions if needed
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

    // --- BUFF / DEBUFF LOGIC ---
    if (isCorrect) {
        setGameBuff('OVERCLOCK');
        setTimeout(() => setGameBuff('NONE'), 10000); // 10s Buff
        setAiTip("");
    } else {
        setGameBuff('LAG');
        setTimeout(() => setGameBuff('NONE'), 10000); // 10s Debuff
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
    setSelectedOption(null);
    setShowExplanation(false);
    setAiTip("");
    setIsQuizActive(false);
    
    // Move to next question index for next time
    setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
  };

  const handleGameOver = (finalScore: number) => {
    // Combine Game Score (approx 10% conversion) + Quiz XP
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
  
  // Calculated derived stats for Results screen
  const sessionAccuracy = state.answers.length > 0 
    ? Math.round((state.answers.filter(a => a.isCorrect).length / state.answers.length) * 100) 
    : 0;

  // Background is always visible except when playing, where Game handles it (or we can keep it underneath if opaque)
  // For SpaceShooter, we usually want a specific canvas, so we hide FluidBackground in PLAYING
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
          <DashboardScreen user={user} onStartGame={startGame} />
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
                isPaused={isQuizActive}
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

            {!isQuizActive && (
                <div className="absolute top-8 right-8 text-right pointer-events-none">
                    <button onClick={() => setPhase(GamePhase.WELCOME)} className="pointer-events-auto text-xs text-gray-500 hover:text-white uppercase tracking-widest underline">Abort Mission</button>
                </div>
            )}
            
            {!isQuizActive && state.streak === 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 font-mono text-xs pointer-events-none animate-pulse">
                    [WASD] MOVE • [SPACE] FIRE
                </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}