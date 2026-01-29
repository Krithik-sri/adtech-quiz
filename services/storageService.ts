import { User, CategoryStat } from '../types';

const DB_KEY = 'adtech_master_db_v3'; // Bumped version for schema change
const CURRENT_USER_KEY = 'adtech_master_current_user';

interface Database {
  users: Record<string, User>;
}

const getDB = (): Database => {
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    const init: Database = { users: {} };
    localStorage.setItem(DB_KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(stored);
};

const saveDB = (db: Database) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const storageService = {
  login: (username: string): User => {
    const db = getDB();
    if (!db.users[username]) {
      db.users[username] = {
        username,
        totalXp: 0,
        currentLevel: 1,
        highestStreak: 0,
        gamesPlayed: 0,
        categoryStats: {}
      };
      saveDB(db);
    }
    // Migration check for older users without categoryStats
    if (!db.users[username].categoryStats) {
      db.users[username].categoryStats = {};
      saveDB(db);
    }
    
    localStorage.setItem(CURRENT_USER_KEY, username);
    return db.users[username];
  },

  getCurrentUser: (): User | null => {
    const username = localStorage.getItem(CURRENT_USER_KEY);
    if (!username) return null;
    const db = getDB();
    const user = db.users[username];
    if (user && !user.categoryStats) {
       user.categoryStats = {}; // runtime migration
    }
    return user || null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUserProgress: (sessionXp: number, streak: number, sessionAnswers: { category: string, isCorrect: boolean }[]) => {
    const username = localStorage.getItem(CURRENT_USER_KEY);
    if (!username) return;

    const db = getDB();
    const user = db.users[username];
    
    user.totalXp += sessionXp;
    user.highestStreak = Math.max(user.highestStreak, streak);
    user.gamesPlayed += 1;
    user.currentLevel = Math.floor(user.totalXp / 5000) + 1;

    // Update Category Stats
    if (!user.categoryStats) user.categoryStats = {};
    
    sessionAnswers.forEach(ans => {
      if (!user.categoryStats[ans.category]) {
        user.categoryStats[ans.category] = { correct: 0, total: 0 };
      }
      user.categoryStats[ans.category].total += 1;
      if (ans.isCorrect) {
        user.categoryStats[ans.category].correct += 1;
      }
    });

    saveDB(db);
    return user;
  }
};