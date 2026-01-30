
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

export type UpgradeType = 
  | 'SPREAD_SHOT' 
  | 'RAPID_FIRE' 
  | 'YIELD_OPTIMIZER' 
  | 'FIREWALL' 
  | 'AUTOBIDDER' 
  | 'BLOATWARE'        // Trap: Slows movement
  | 'MANAGED_SERVICE'  // Trap: High CPM cost
  | 'TRAFFIC_BOOSTER'; // Trap: More bots

export interface Upgrade {
  id: UpgradeType;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY' | 'SPONSORED';
  icon: string;
  maxStacks?: number; // If defined, can only have this many. Default is unlimited.
}

export interface QuizState {
  currentQuestionIndex: number;
  xp: number; // Session XP
  streak: number;
  level: number;
  answers: { questionId: number; isCorrect: boolean; timeTaken: number; category: string }[];
  isFinished: boolean;
  gameStarted: boolean;
  activeUpgrades: UpgradeType[]; // New: Track collected upgrades
  activeMultiplier: boolean; 
}

export enum GamePhase {
  AUTH = 'AUTH',
  WELCOME = 'WELCOME',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}
