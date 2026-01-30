export const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 5000, 10000];
export const LEVEL_TITLES = ["Intern", "Media Planner", "Ad Ops Specialist", "Programmatic Trader", "VP of Sales", "AdTech Tycoon"];

export const getLevelInfo = (xp: number) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  if (level > LEVEL_TITLES.length) level = LEVEL_TITLES.length;
  
  return { 
    level, 
    title: LEVEL_TITLES[level - 1], 
    nextThreshold: LEVEL_THRESHOLDS[level] || 999999 
  };
};