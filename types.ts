export interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
}

export interface CategoryStat {
  correct: number;
  total: number;
}

export interface User {
  username: string;
  totalXp: number;
  currentLevel: number;
  highestStreak: number;
  gamesPlayed: number;
  categoryStats: Record<string, CategoryStat>;
}

export interface PowerupInventory {
  fiftyFifty: number;
  doubleBid: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  xp: number; // Session XP
  streak: number;
  level: number;
  answers: { questionId: number; isCorrect: boolean; timeTaken: number; category: string }[];
  isFinished: boolean;
  gameStarted: boolean;
  powerups: PowerupInventory;
  hiddenOptions: number[]; // Indices of options hidden by 50/50
  activeMultiplier: boolean; // Is Double Bid active for current Q?
}

export enum GamePhase {
  AUTH = 'AUTH',
  WELCOME = 'WELCOME',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}