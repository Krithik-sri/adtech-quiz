export interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
}

export interface PowerupInventory {
  fiftyFifty: number;
  doubleBid: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  xp: number; // Renamed from score
  streak: number;
  level: number;
  answers: { questionId: number; isCorrect: boolean; timeTaken: number }[];
  isFinished: boolean;
  gameStarted: boolean;
  powerups: PowerupInventory;
  hiddenOptions: number[]; // Indices of options hidden by 50/50
  activeMultiplier: boolean; // Is Double Bid active for current Q?
}

export enum GamePhase {
  WELCOME = 'WELCOME',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}