import { StreakData, StreakDayInfo } from '../types';

const STORAGE_KEY = 'macro_fuel_streak_data_v1';

export interface MealSlotRecommendation {
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  suggestedTime: string; // e.g. "07:30 AM - 09:30 AM"
  calorieTargetPct: number;
  recommendedCalories: number;
  description: string;
  timingTip: string;
  foodSuggestions: string[];
}

export function getMealSlotRecommendations(totalDailyCalories: number = 2000): MealSlotRecommendation[] {
  const cal = Math.max(1200, totalDailyCalories);
  return [
    {
      category: 'breakfast',
      title: 'Morning Fuel (Breakfast)',
      suggestedTime: '07:30 AM – 09:30 AM',
      calorieTargetPct: 25,
      recommendedCalories: Math.round(cal * 0.25),
      description: 'Jumpstart metabolism with complex carbs and protein to prevent mid-morning glucose dips.',
      timingTip: 'Optimal within 1–2 hours of waking up to break overnight fasting and fuel alertness.',
      foodSuggestions: [
        'Oatmeal + Whey/Plant Protein + Berries',
        '3 Scrambled Eggs + 2 Whole Wheat Toast + Avocado',
        'Greek Yogurt Bowl + Chia Seeds + Sliced Banana',
        'Paneer / Tofu Bhurji + Multigrain Roti',
      ],
    },
    {
      category: 'lunch',
      title: 'Midday Power (Lunch)',
      suggestedTime: '12:30 PM – 02:00 PM',
      calorieTargetPct: 35,
      recommendedCalories: Math.round(cal * 0.35),
      description: 'Your largest thermal energy block. Balanced macronutrients support sustained afternoon focus.',
      timingTip: 'Keep roughly 4–5 hours after breakfast to maintain steady insulin sensitivity and energy.',
      foodSuggestions: [
        'Grilled Chicken Breast / Tofu + Brown Rice + Steamed Broccoli',
        'Dal Tadka / Chickpeas + 2 Rotis + Mixed Vegetable Salad',
        'Quinoa Superfood Bowl + Salmon / Paneer + Olive Oil',
        'Turkey / Seitan Wrap + Hummus + Mixed Greens',
      ],
    },
    {
      category: 'snack',
      title: 'Afternoon Refuel (Snack)',
      suggestedTime: '04:30 PM – 05:30 PM',
      calorieTargetPct: 15,
      recommendedCalories: Math.round(cal * 0.15),
      description: 'Bridge the energy gap between lunch and dinner. High in fiber or clean protein.',
      timingTip: 'Ideal 60–90 minutes before evening workouts or commute to prevent ravenous evening snacking.',
      foodSuggestions: [
        'Handful of Raw Almonds + Green Apple',
        'Protein Shake / Smoothie + Handful of Walnuts',
        'Roasted Makhana / Edamame + Black Coffee / Green Tea',
        'Cottage Cheese / Boiled Eggs + Cucumber Slices',
      ],
    },
    {
      category: 'dinner',
      title: 'Rest & Repair (Dinner)',
      suggestedTime: '07:30 PM – 09:00 PM',
      calorieTargetPct: 25,
      recommendedCalories: Math.round(cal * 0.25),
      description: 'Lean protein and slow-digesting nutrients to support overnight muscle recovery and deep sleep.',
      timingTip: 'Finish at least 2.5–3 hours prior to sleep for optimal digestion and circadian rhythm.',
      foodSuggestions: [
        'Baked Fish / Sautéed Tofu + Asparagus + Sweet Potato',
        'Grilled Chicken Salad + Seeds + Light Vinaigrette',
        'Vegetable Paneer Curry / Lentils + 1 Roti + Clear Soup',
        'Egg White Omelet + Sautéed Spinach + Mushrooms',
      ],
    },
  ];
}

export function getAutoMealCategory(currentTime?: Date): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const now = currentTime || new Date();
  const hours = now.getHours();

  if (hours >= 5 && hours < 11) return 'breakfast';
  if (hours >= 11 && hours < 16) return 'lunch';
  if (hours >= 16 && hours < 19) return 'snack';
  return 'dinner';
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getDefaultStreakData(): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastLoggedDate: null,
    loggedDates: [],
    freezeTokens: 1,
    totalDaysLogged: 0,
    history: [],
  };
}

export function loadStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStreakData();
    const parsed: StreakData = JSON.parse(raw);

    // Validate streak status against today
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (parsed.lastLoggedDate) {
      if (parsed.lastLoggedDate === today || parsed.lastLoggedDate === yesterday) {
        // Streak is still intact
        return parsed;
      } else {
        // More than 1 day skipped: streak is broken but history is retained
        const daysMissed = getDaysDifference(parsed.lastLoggedDate, today);
        if (daysMissed > 1) {
          return {
            ...parsed,
            currentStreak: 0, // Reset current streak, will increment to 1 on next log
          };
        }
      }
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load streak data:', e);
    return getDefaultStreakData();
  }
}

export function saveStreakData(data: StreakData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save streak data:', e);
  }
}

/**
 * Restarts the active streak count to 0 and clears logged dates/history so the weekly tracking calendar resets
 */
export function restartCurrentStreak(
  currentData: StreakData,
  keepBestRecord: boolean = true,
  clearHistoryDates: boolean = true
): StreakData {
  const updated: StreakData = {
    ...currentData,
    currentStreak: 0,
    longestStreak: keepBestRecord ? currentData.longestStreak : 0,
    lastLoggedDate: null,
    loggedDates: clearHistoryDates ? [] : currentData.loggedDates || [],
    history: clearHistoryDates ? [] : currentData.history || [],
    totalDaysLogged: clearHistoryDates ? 0 : (currentData.loggedDates || []).length,
  };
  saveStreakData(updated);
  return updated;
}

/**
 * Performs a complete clean wipe of all streak data, history, and records
 */
export function resetEntireStreakData(): StreakData {
  const fresh = getDefaultStreakData();
  saveStreakData(fresh);
  return fresh;
}

/**
 * Manually adjusts streak count to a specific value and populates consecutive past dates
 */
export function setCustomStreakDays(
  currentData: StreakData,
  days: number
): StreakData {
  const safeDays = Math.max(0, Math.min(999, Math.round(days)));
  
  // Generate consecutive date strings leading up to today
  const newLoggedDates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < safeDays; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    newLoggedDates.push(`${year}-${month}-${day}`);
  }
  newLoggedDates.sort();

  const updated: StreakData = {
    ...currentData,
    currentStreak: safeDays,
    longestStreak: Math.max(currentData.longestStreak, safeDays),
    lastLoggedDate: safeDays > 0 ? getTodayDateString() : null,
    loggedDates: newLoggedDates,
    totalDaysLogged: newLoggedDates.length,
  };
  saveStreakData(updated);
  return updated;
}

/**
 * Toggles today's logged status in the streak tracker
 */
export function toggleTodayStreakLog(
  currentData: StreakData
): StreakData {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const loggedSet = new Set(currentData.loggedDates || []);

  if (loggedSet.has(today)) {
    // Unlog today
    loggedSet.delete(today);
    const updatedLoggedDates = Array.from(loggedSet).sort();
    
    // Recalculate streak without today
    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // start from yesterday

    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const s = `${y}-${m}-${d}`;
      if (loggedSet.has(s)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const updated: StreakData = {
      ...currentData,
      currentStreak: streak,
      lastLoggedDate: loggedSet.has(yesterday) ? yesterday : null,
      loggedDates: updatedLoggedDates,
      totalDaysLogged: updatedLoggedDates.length,
    };
    saveStreakData(updated);
    return updated;
  } else {
    // Log today
    loggedSet.add(today);
    const updatedLoggedDates = Array.from(loggedSet).sort();
    
    let newStreak = currentData.currentStreak;
    if (currentData.lastLoggedDate === yesterday) {
      newStreak = currentData.currentStreak + 1;
    } else {
      newStreak = 1;
    }

    const updated: StreakData = {
      ...currentData,
      currentStreak: newStreak,
      longestStreak: Math.max(currentData.longestStreak, newStreak),
      lastLoggedDate: today,
      loggedDates: updatedLoggedDates,
      totalDaysLogged: updatedLoggedDates.length,
    };
    saveStreakData(updated);
    return updated;
  }
}

/**
 * Updates streak when a meal is logged on a specific day
 */
export function recordMealLogToStreak(
  currentData: StreakData,
  calories: number = 0
): { updatedData: StreakData; streakIncreased: boolean; isNewDay: boolean } {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const loggedDatesSet = new Set(currentData.loggedDates || []);
  const isAlreadyLoggedToday = loggedDatesSet.has(today);

  let newCurrentStreak = currentData.currentStreak;
  let streakIncreased = false;

  if (!isAlreadyLoggedToday) {
    // If last logged yesterday, continue streak
    if (currentData.lastLoggedDate === yesterday) {
      newCurrentStreak = currentData.currentStreak + 1;
      streakIncreased = true;
    } else if (currentData.lastLoggedDate === today) {
      newCurrentStreak = Math.max(1, currentData.currentStreak);
    } else {
      // First day or streak was broken
      newCurrentStreak = 1;
      streakIncreased = true;
    }
  }

  const newLongestStreak = Math.max(currentData.longestStreak, newCurrentStreak);
  loggedDatesSet.add(today);
  const updatedLoggedDates = Array.from(loggedDatesSet).sort();

  // Update history
  const history = [...(currentData.history || [])];
  const existingDayIndex = history.findIndex((h) => h.date === today);

  if (existingDayIndex >= 0) {
    history[existingDayIndex] = {
      ...history[existingDayIndex],
      calories: history[existingDayIndex].calories + calories,
      mealsCount: history[existingDayIndex].mealsCount + 1,
    };
  } else {
    history.push({
      date: today,
      calories: calories,
      mealsCount: 1,
    });
  }

  const updatedData: StreakData = {
    ...currentData,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastLoggedDate: today,
    loggedDates: updatedLoggedDates,
    totalDaysLogged: updatedLoggedDates.length,
    history,
  };

  saveStreakData(updatedData);

  return {
    updatedData,
    streakIncreased,
    isNewDay: !isAlreadyLoggedToday,
  };
}

/**
 * Returns past 7 days breakdown for the weekly streak visualizer
 */
export function getPast7DaysStreak(streakData: StreakData): StreakDayInfo[] {
  const result: StreakDayInfo[] = [];
  const loggedSet = new Set(streakData.loggedDates || []);
  const todayStr = getTodayDateString();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isToday = dateStr === todayStr;
    const isLogged = loggedSet.has(dateStr);

    const historyEntry = (streakData.history || []).find((h) => h.date === dateStr);

    result.push({
      date: dateStr,
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      isToday,
      isLogged,
      calories: historyEntry?.calories,
    });
  }

  return result;
}

export interface StreakMilestone {
  days: number;
  title: string;
  badge: string;
  description: string;
  unlocked: boolean;
}

export function getStreakMilestones(currentStreak: number): {
  milestones: StreakMilestone[];
  nextMilestone: StreakMilestone | null;
  progressToNext: number; // 0 - 100
} {
  const list: Omit<StreakMilestone, 'unlocked'>[] = [
    {
      days: 3,
      title: '3-Day Starter',
      badge: '⚡',
      description: 'Built initial momentum and habit awareness.',
    },
    {
      days: 7,
      title: '7-Day Habit',
      badge: '🔥',
      description: 'One full continuous week of macro tracking.',
    },
    {
      days: 14,
      title: '14-Day Consistency Pro',
      badge: '🏆',
      description: 'Solidified dietary discipline over 2 weeks.',
    },
    {
      days: 30,
      title: '30-Day Nutrition Master',
      badge: '👑',
      description: 'Achieved elite monthly tracking excellence.',
    },
    {
      days: 60,
      title: '60-Day Titan',
      badge: '💎',
      description: 'Two months of unbreakable dedication.',
    },
  ];

  const milestones: StreakMilestone[] = list.map((m) => ({
    ...m,
    unlocked: currentStreak >= m.days,
  }));

  const next = milestones.find((m) => !m.unlocked) || null;

  let progress = 100;
  if (next) {
    const prevMilestoneDays = list
      .filter((m) => m.days < next.days)
      .slice(-1)[0]?.days || 0;

    const needed = next.days - prevMilestoneDays;
    const achieved = Math.max(0, currentStreak - prevMilestoneDays);
    progress = Math.min(100, Math.round((achieved / needed) * 100));
  }

  return {
    milestones,
    nextMilestone: next,
    progressToNext: progress,
  };
}
