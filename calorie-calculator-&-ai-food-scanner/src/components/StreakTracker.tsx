import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoggedMeal, MealCategory, StreakData, ThemeMode } from '../types';
import {
  getPast7DaysStreak,
  getStreakMilestones,
  getTodayDateString,
  getMealSlotRecommendations,
  recordMealLogToStreak,
  restartCurrentStreak,
  resetEntireStreakData,
  setCustomStreakDays,
  toggleTodayStreakLog,
} from '../utils/streak';
import {
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Award,
  Info,
  Clock,
  Utensils,
  Sunrise,
  Sun,
  Sunset,
  Coffee,
  Plus,
  Trash2,
  ScanLine,
  Activity,
  HeartPulse,
  Lightbulb,
  Check,
  Lock,
  ChevronRight,
  TrendingUp,
  Layers,
  RotateCcw,
  RefreshCw,
  Sliders,
  AlertTriangle,
  X,
  Crosshair,
  Mic,
  Volume2,
  VolumeX,
  BookOpen,
  Compass,
} from 'lucide-react';

interface StreakTrackerProps {
  streakData: StreakData;
  onUpdateStreak: (updated: StreakData) => void;
  theme?: ThemeMode;
  targetCalories?: number;
  meals?: LoggedMeal[];
  onOpenScanner?: () => void;
  onOpenAddModal?: (presetCategory?: MealCategory) => void;
  onRemoveMeal?: (id: string) => void;
  onClearMeals?: () => void;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  streakData,
  onUpdateStreak,
  theme = 'dark',
  targetCalories = 2000,
  meals = [],
  onOpenScanner,
  onOpenAddModal,
  onRemoveMeal,
  onClearMeals,
}) => {
  const isDark = theme === 'dark';
  const todayStr = getTodayDateString();
  const isLoggedToday = (streakData.loggedDates || []).includes(todayStr);

  // Pulse animation state when a meal is logged
  const [justLogged, setJustLogged] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const prevMealsCountRef = useRef(meals.length);

  useEffect(() => {
    if (meals.length > prevMealsCountRef.current) {
      setJustLogged(true);
      setPulseKey((k) => k + 1);
      const timer = setTimeout(() => {
        setJustLogged(false);
      }, 1600);
      prevMealsCountRef.current = meals.length;
      return () => clearTimeout(timer);
    }
    prevMealsCountRef.current = meals.length;
  }, [meals.length]);

  // Active view tab: 'meals' | 'insights' | 'milestones'
  const [activeTab, setActiveTab] = useState<'meals' | 'insights' | 'milestones'>('meals');

  // Real-time clock for circadian highlighting
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const past7Days = getPast7DaysStreak(streakData);
  const todayFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const { milestones, nextMilestone, progressToNext } = getStreakMilestones(
    streakData.currentStreak
  );

  // Weekly consistency percentage
  const loggedInPast7 = past7Days.filter((d) => d.isLogged).length;
  const weeklyConsistency = Math.round((loggedInPast7 / 7) * 100);

  // Meal timing slot recommendations based on target calories
  const mealSlots = getMealSlotRecommendations(targetCalories);

  // Total daily intake calculations (guaranteed non-NaN)
  const totalCaloriesLogged = Math.round(meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0));
  const totalProteinLogged = Math.round(meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0));
  const totalCarbsLogged = Math.round(meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0));
  const totalFatLogged = Math.round(meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0));

  const safeTargetCalories = Math.max(1, Number(targetCalories) || 2000);
  const caloriesPercent = Math.min(100, Math.round((totalCaloriesLogged / safeTargetCalories) * 100));

  // Determine current active slot based on real-time hour
  const currentHour = currentTime.getHours();
  const timeFormatted = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getActiveSlotId = (): MealCategory => {
    if (currentHour >= 5 && currentHour < 11) return 'breakfast';
    if (currentHour >= 11 && currentHour < 16) return 'lunch';
    if (currentHour >= 16 && currentHour < 19) return 'snack';
    return 'dinner';
  };

  const activeSlotId = getActiveSlotId();

  // Streak Level Determination
  const getStreakLevel = (streak: number) => {
    if (streak >= 60) return { title: 'Legend Titan', level: 6, color: 'text-rose-400', badge: '👑' };
    if (streak >= 30) return { title: 'Nutrition Master', level: 5, color: 'text-amber-400', badge: '💎' };
    if (streak >= 14) return { title: 'Consistency Pro', level: 4, color: 'text-purple-400', badge: '⚡' };
    if (streak >= 7) return { title: 'Habit Builder', level: 3, color: 'text-blue-400', badge: '🔥' };
    if (streak >= 3) return { title: 'Ignition Spark', level: 2, color: 'text-emerald-400', badge: '🌱' };
    return { title: 'Apprentice Tracker', level: 1, color: 'text-slate-400', badge: '🎯' };
  };

  const currentLevel = getStreakLevel(streakData.currentStreak);

  // Voice Protocol State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const handleSpeakProtocol = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const speechText = `Daily Protocol Status. Current streak is ${streakData.currentStreak} days. Active meal window is ${activeSlotId}. You have logged ${totalCaloriesLogged} out of ${safeTargetCalories} kilocalories today. Adherence is ${weeklyConsistency} percent.`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Streak Management & Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTab, setResetTab] = useState<'restart' | 'custom' | 'factory'>('restart');
  const [customDays, setCustomDays] = useState<number>(streakData.currentStreak || 1);
  const [alsoClearMeals, setAlsoClearMeals] = useState<boolean>(true);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isResetModalOpen) {
      setCustomDays(streakData.currentStreak || 1);
      setActionSuccessNotice(null);
    }
  }, [isResetModalOpen, streakData.currentStreak]);

  const handleRestartStreak = (keepBest: boolean = true) => {
    const updated = restartCurrentStreak(streakData, keepBest, true);
    onUpdateStreak(updated);
    if (alsoClearMeals && onClearMeals) {
      onClearMeals();
    }
    setActionSuccessNotice('Streak and 7-day history reset to Day 0. Ready for your next meal log!');
    setTimeout(() => {
      setIsResetModalOpen(false);
      setActionSuccessNotice(null);
    }, 1200);
  };

  const handleSetCustomDays = (val: number) => {
    const updated = setCustomStreakDays(streakData, val);
    onUpdateStreak(updated);
    setActionSuccessNotice(`Streak & 7-day calendar synchronized to ${val} consecutive day${val === 1 ? '' : 's'}!`);
    setTimeout(() => {
      setIsResetModalOpen(false);
      setActionSuccessNotice(null);
    }, 1200);
  };

  const handleFactoryReset = () => {
    const updated = resetEntireStreakData();
    onUpdateStreak(updated);
    if (onClearMeals) {
      onClearMeals();
    }
    setActionSuccessNotice('Complete factory reset finished. All streak dates and history have been cleared.');
    setTimeout(() => {
      setIsResetModalOpen(false);
      setActionSuccessNotice(null);
    }, 1200);
  };

  const handleToggleToday = () => {
    const updated = toggleTodayStreakLog(streakData);
    onUpdateStreak(updated);
    if (!isLoggedToday) {
      setJustLogged(true);
      setPulseKey((k) => k + 1);
      setTimeout(() => setJustLogged(false), 1600);
    }
  };

  const handleManualCheckIn = () => {
    if (!isLoggedToday) {
      const { updatedData } = recordMealLogToStreak(streakData, 0);
      onUpdateStreak(updatedData);
      setJustLogged(true);
      setPulseKey((k) => k + 1);
      setTimeout(() => setJustLogged(false), 1600);
    }
  };

  // Group meals by category
  const mealsByCategory: Record<MealCategory, LoggedMeal[]> = {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
  };

  meals.forEach((meal) => {
    let cat: MealCategory = meal.category || 'lunch';
    if (!meal.category && meal.time) {
      const isAm = meal.time.toLowerCase().includes('am');
      const parts = meal.time.split(':');
      const hour = parseInt(parts[0], 10);
      if (isAm && hour >= 5 && hour <= 11) cat = 'breakfast';
      else if (!isAm && (hour === 12 || hour <= 4)) cat = 'lunch';
      else if (!isAm && (hour >= 4 && hour < 7)) cat = 'snack';
      else if (!isAm && hour >= 7) cat = 'dinner';
    }
    mealsByCategory[cat].push(meal);
  });

  return (
    <div
      id="streak-tracker-section"
      className="rounded-3xl p-4 sm:p-6 lg:p-7 border border-[#171c26] bg-[#07090e] text-white shadow-2xl space-y-6 relative font-sans overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. HERO STREAK HEADER CARD WITH COSMIC CELESTIAL GLOW                     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#1b2230] bg-gradient-to-r from-[#0b0e15] via-[#0d121c] to-[#0a0d14] shadow-xl">
        {/* Right Cosmic Nebula / Particle Artwork Effect */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-80 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-transparent blur-3xl" />
          <div className="absolute right-10 bottom-0 w-60 h-60 rounded-full bg-gradient-to-tl from-amber-500/20 via-orange-600/10 to-transparent blur-2xl" />
          {/* Subtle starry particles */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/15 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Column: Streak Tag, Giant Counter, Target Subtitle, Live Clock */}
          <div className="space-y-2">
            {/* Top Pill: Streak Active 🔥 */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161c28] border border-[#232d3f] text-xs font-bold text-slate-200 shadow-xs">
              <span>Streak Active</span>
              <span className="text-amber-400">🔥</span>
            </div>

            {/* Huge Display: 2 Days */}
            <div className="flex items-baseline gap-3">
              <motion.h1
                key={`streak-disp-${streakData.currentStreak}-${pulseKey}`}
                animate={
                  justLogged
                    ? {
                        scale: [1, 1.15, 0.95, 1.05, 1],
                        textShadow: [
                          '0 0 0 rgba(245, 158, 11, 0)',
                          '0 0 30px rgba(245, 158, 11, 0.9)',
                          '0 0 0 rgba(245, 158, 11, 0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl font-black tracking-tight text-white"
              >
                {streakData.currentStreak} Day{streakData.currentStreak === 1 ? '' : 's'}
              </motion.h1>
            </div>

            {/* Subtitle: Crosshair Icon + Consecutive Streak */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>Consecutive Streak</span>
            </div>

            {/* Live Clock & Active Window */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time: <strong className="text-slate-200">{timeFormatted}</strong></span>
              <span>•</span>
              <span>Window: <strong className="text-amber-400 capitalize">{activeSlotId}</strong></span>
            </div>
          </div>

          {/* Right Column: Sleek Buttons (Scan Food with AI & Speak Protocol) */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-5 py-3 rounded-2xl bg-[#09151f] hover:bg-[#0d1e2c] border border-cyan-500/50 text-cyan-300 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-950/40 cursor-pointer group transform hover:scale-[1.02]"
              >
                <ScanLine className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition" />
                <span>Scan Food with AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSpeakProtocol}
              className={`px-5 py-3 rounded-2xl border font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transform hover:scale-[1.02] ${
                isSpeaking
                  ? 'bg-teal-500/25 border-teal-400 text-teal-200 shadow-teal-500/20'
                  : 'bg-[#071718] hover:bg-[#0c2425] border-teal-500/40 text-teal-300 shadow-teal-950/40'
              }`}
              title="Listen to live daily streak and nutrition protocol"
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-teal-300 animate-pulse" />
              ) : (
                <Mic className="w-4 h-4 text-teal-400" />
              )}
              <span>{isSpeaking ? 'Mute Protocol' : 'Speak Protocol'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 4 CORE METRIC CARDS ROW                                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Current Streak */}
        <div
          onClick={() => setIsResetModalOpen(true)}
          className="p-4 rounded-2xl border border-[#19202c] bg-[#0c1017] hover:border-emerald-500/40 transition flex flex-col justify-between min-h-[110px] cursor-pointer group"
          title="Click to restart or manage streak"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {streakData.currentStreak}
            </span>
            <span className="text-xs text-slate-400 font-semibold">days</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Keep logging daily
          </div>
        </div>

        {/* Card 2: Best Record */}
        <div className="p-4 rounded-2xl border border-[#19202c] bg-[#0c1017] hover:border-amber-500/40 transition flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Best Record</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {streakData.longestStreak}
            </span>
            <span className="text-xs text-slate-400 font-semibold">days</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            All-time consistency
          </div>
        </div>

        {/* Card 3: Today's Fuel (Guaranteed Clean Number without NaN) */}
        <div className="p-4 rounded-2xl border border-[#19202c] bg-[#0c1017] hover:border-cyan-500/40 transition flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Today's Fuel</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">
              {totalCaloriesLogged}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              / {safeTargetCalories} kcal
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {meals.length} item{meals.length === 1 ? '' : 's'} tracked
          </div>
        </div>

        {/* Card 4: 7-Day Adherence */}
        <div className="p-4 rounded-2xl border border-[#19202c] bg-[#0c1017] hover:border-teal-500/40 transition flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>7-Day Adherence</span>
            <Target className="w-4 h-4 text-teal-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {weeklyConsistency}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({loggedInPast7}/7)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Weekly score
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEGMENTED NAVIGATION TABS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl border border-[#1a2230] bg-[#0a0d13]">
        <button
          type="button"
          onClick={() => setActiveTab('meals')}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'meals'
              ? 'bg-[#151c27] text-white border border-[#27354a] shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span>Meal Plans &amp; Food Entries</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-[#151c27] text-white border border-[#27354a] shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Smart &amp; Science Guide</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'milestones'
              ? 'bg-[#151c27] text-white border border-[#27354a] shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Milestones &amp; Trophies</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT 1: REAL-TIME MEAL WINDOWS & 2x2 CARDS                      */}
      {/* ========================================================================= */}
      {activeTab === 'meals' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                REAL-TIME MEAL WINDOWS &amp; FOOD ENTRIES
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Clock className="w-3 h-3" />
                <span>ACTIVE WINDOW</span>
              </span>
            </div>

            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Food with AI</span>
              </button>
            )}
          </div>

          {/* 2x2 Grid of Meal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {mealSlots.map((slot) => {
              const isCurrentActive = activeSlotId === slot.category;
              const loggedInSlot = mealsByCategory[slot.category] || [];
              const slotCaloriesLogged = Math.round(loggedInSlot.reduce((s, m) => s + (Number(m.calories) || 0), 0));
              const slotProteinLogged = Math.round(loggedInSlot.reduce((s, m) => s + (Number(m.protein) || 0), 0));
              const slotCarbsLogged = Math.round(loggedInSlot.reduce((s, m) => s + (Number(m.carbs) || 0), 0));
              const slotFatLogged = Math.round(loggedInSlot.reduce((s, m) => s + (Number(m.fat) || 0), 0));

              const slotRecCalories = Number(slot.recommendedCalories) || 500;
              const slotPercentage = Math.min(100, Math.round((slotCaloriesLogged / slotRecCalories) * 100));

              // Custom Titles & Subtitles matching the screenshot archetype
              const headerTitle =
                slot.category === 'breakfast'
                  ? 'Morning Fuel'
                  : slot.category === 'lunch'
                  ? 'Midday Power'
                  : slot.category === 'snack'
                  ? 'Afternoon Refuel'
                  : 'Rest & Repair';

              const headerSub =
                slot.category === 'breakfast'
                  ? 'Breakfast'
                  : slot.category === 'lunch'
                  ? 'Lunch'
                  : slot.category === 'snack'
                  ? 'Snack'
                  : 'Dinner';

              const customTimingTip =
                slot.category === 'breakfast'
                  ? 'Eat within 1–2 hrs of waking up to boost metabolism and fuel alertness.'
                  : slot.category === 'lunch'
                  ? '4–6 hrs after breakfast to maintain energy levels.'
                  : slot.category === 'snack'
                  ? '60–90 mins before workout or to beat slumps.'
                  : 'Finish 2.5–3 hrs before sleep for better recovery.';

              // Icon definition
              const SlotIcon =
                slot.category === 'breakfast'
                  ? Sunrise
                  : slot.category === 'lunch'
                  ? Sun
                  : slot.category === 'snack'
                  ? Zap
                  : Sunset;

              return (
                <div
                  key={slot.category}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                    isCurrentActive
                      ? 'bg-[#0d121a] border-amber-500/40 ring-1 ring-amber-500/30 shadow-xl'
                      : 'bg-[#0b0e14] border-[#181f2b] hover:border-[#263145]'
                  }`}
                >
                  {/* Card Top: Icon, Titles, and Calorie Target */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          slot.category === 'snack'
                            ? 'bg-amber-500/15 text-amber-400'
                            : slot.category === 'dinner'
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        <SlotIcon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                            {headerTitle}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 block">
                          {headerSub}
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Calorie Budget & Active Pill */}
                    <div className="text-right">
                      {isCurrentActive && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-1">
                          ACTIVE NOW
                        </span>
                      )}
                      <div className="text-xs sm:text-sm font-black text-slate-200">
                        <span>{slotCaloriesLogged}</span>
                        <span className="text-slate-400 font-normal"> / {slotRecCalories} kcal</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        Target: {slot.calorieTargetPct}% daily Budget
                      </span>
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{slot.suggestedTime}</span>
                  </div>

                  {/* Progress Bar with left and right indicators */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 rounded-full bg-[#18202c] overflow-hidden">
                      <div
                        style={{ width: `${slotPercentage}%` }}
                        className={`h-full transition-all duration-500 ${
                          slotPercentage > 105
                            ? 'bg-rose-500'
                            : slotPercentage >= 80
                            ? 'bg-emerald-400'
                            : 'bg-amber-400'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>{slotCaloriesLogged} / {slotRecCalories} kcal</span>
                      <span>{slotPercentage}%</span>
                    </div>
                  </div>

                  {/* Science Tip */}
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {customTimingTip}
                  </p>

                  {/* Logged Foods List (if any) */}
                  {loggedInSlot.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#1a2230]">
                      <span className="text-[11px] font-bold uppercase text-slate-400 block">
                        Logged Foods ({loggedInSlot.length}):
                      </span>
                      {loggedInSlot.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-[#121721] border border-[#1f2838] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{item.name}</span>
                            <span className="text-[11px] text-amber-400 font-semibold">
                              {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                            </span>
                          </div>
                          {onRemoveMeal && (
                            <button
                              type="button"
                              onClick={() => onRemoveMeal(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Button */}
                  {onOpenAddModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAddModal(slot.category)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#131924] hover:bg-[#1a2333] border border-[#212c3e] hover:border-slate-500 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>+ Add {headerSub}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT 2: SMART & SCIENCE GUIDE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'insights' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl border border-[#1a2333] bg-[#0c1017] space-y-4">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>Circadian Rhythm &amp; Nutrient Timing Protocol</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-[#111622] border border-[#1c2638] space-y-2">
                <span className="font-black text-amber-400 block text-sm">1. Metabolic Ignition</span>
                <p className="text-slate-400 leading-relaxed">
                  Consuming high-protein meals early fuels thermogenesis, regulates blood glucose, and prevents evening overconsumption.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#111622] border border-[#1c2638] space-y-2">
                <span className="font-black text-cyan-400 block text-sm">2. Afternoon Stability</span>
                <p className="text-slate-400 leading-relaxed">
                  A structured midday lunch and pre-workout snack stabilize insulin sensitivity and maintain peak cognitive alertness.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#111622] border border-[#1c2638] space-y-2">
                <span className="font-black text-teal-400 block text-sm">3. Nocturnal Recovery</span>
                <p className="text-slate-400 leading-relaxed">
                  Finishing dinner 3 hours prior to sleep optimizes growth hormone release and deep restorative sleep cycles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT 3: MILESTONES & TROPHIES                                   */}
      {/* ========================================================================= */}
      {activeTab === 'milestones' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl border border-[#1a2333] bg-[#0c1017] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-black text-sm sm:text-base text-white">
                  Current Level: {currentLevel.badge} {currentLevel.title}
                </h4>
                <p className="text-xs text-slate-400">
                  Unlock permanent habit badges as your streak compounds over time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#141a26] border border-[#222c3d] text-slate-300 hover:text-amber-400 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Manage Streak</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {milestones.map((m) => (
                <div
                  key={m.days}
                  className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition ${
                    m.unlocked
                      ? 'bg-amber-500/15 border-amber-400/40 text-white'
                      : 'bg-[#111622] border-[#1c2638] text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-2xl">{m.badge}</div>
                  <div className="font-bold text-xs text-white">{m.title}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">{m.days} Days</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. BOTTOM 7 DAYS HISTORY STRIP WITH CIRCULAR ADHERENCE RING               */}
      {/* ========================================================================= */}
      <div className="pt-3 border-t border-[#161c28] space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="uppercase tracking-wider font-extrabold text-slate-300">
            7 DAYS HISTORY
          </span>
          <span className="font-semibold text-slate-400">
            {loggedInPast7} of 7 days logged ({weeklyConsistency}%)
          </span>
        </div>

        {/* Days Row & Circular Gauge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="grid grid-cols-7 gap-2 flex-1">
            {past7Days.map((day) => {
              if (day.isToday) {
                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={handleToggleToday}
                    title={`Today (${day.date}): Click to toggle meal log`}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[82px] sm:min-h-[92px] cursor-pointer group hover:scale-[1.03] select-none ${
                      day.isLogged
                        ? 'bg-[#151c27] border-amber-500/80 text-white ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/10'
                        : 'bg-[#0f141d] border-2 border-dashed border-amber-400/80 text-white'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs font-black uppercase text-amber-400">
                      {day.dayName}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-white">
                      {day.dayNumber}
                    </div>
                    <div className="mt-auto">
                      {day.isLogged ? (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-amber-400 text-amber-400 flex items-center justify-center text-[9px] font-black animate-pulse">
                          !
                        </div>
                      )}
                    </div>
                  </button>
                );
              }

              // Past days: static history view
              return (
                <div
                  key={day.date}
                  title={`${day.dayName} ${day.dayNumber} (${day.date}): ${
                    day.isLogged ? 'Logged' : 'Missed / Rest day'
                  }`}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[82px] sm:min-h-[92px] select-none ${
                    day.isLogged
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                      : 'bg-[#0b0e14] border-[#161c28] text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-[10px] sm:text-xs font-black uppercase text-slate-400">
                    {day.dayName}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-300">
                    {day.dayNumber}
                  </div>
                  <div className="mt-auto">
                    {day.isLogged ? (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black bg-emerald-500 text-slate-950 mx-auto">
                        ✓
                      </div>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600/60 mx-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Circular Gauge (matching image) */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-700"
                strokeDasharray={`${weeklyConsistency}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-black text-white">
              {weeklyConsistency}%
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Timing • Portion • Consistency • Results</span>
          </div>

          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="text-[11px] text-slate-400 hover:text-amber-400 underline transition cursor-pointer"
          >
            Restart / Manage Streak
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. RESTART & MANAGE STREAK MODAL DIALOG                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResetModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-[#222b3a] bg-[#0f141d] p-6 sm:p-7 shadow-2xl space-y-5 text-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      Restart &amp; Manage Streak
                    </h3>
                    <p className="text-xs text-slate-400">
                      Choose how you want to restart, synchronize, or reset your streak history.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl border border-[#252f40] bg-[#141a26] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Current Streak</span>
                  <strong className="text-amber-400 text-base font-black">
                    {streakData.currentStreak} Days
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">All-Time Longest</span>
                  <strong className="text-amber-500 text-base font-black">
                    {streakData.longestStreak} Days
                  </strong>
                </div>
              </div>

              <AnimatePresence>
                {actionSuccessNotice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{actionSuccessNotice}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab Selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetTab('restart')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    resetTab === 'restart'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart (0)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetTab('custom')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    resetTab === 'custom'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Set Days</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetTab('factory')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    resetTab === 'factory'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Wipe All</span>
                </button>
              </div>

              {/* Tab 1: Restart to 0 */}
              {resetTab === 'restart' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-2xl border border-[#222a38] bg-[#121722] space-y-2.5 text-xs text-slate-300">
                    <div className="font-black text-amber-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Clean Restart (0 Days)</span>
                    </div>
                    <p className="leading-relaxed">
                      Resets your active streak counter back to <strong>0 days</strong> and clears past checkmarks so you start completely fresh today.
                    </p>

                    {onClearMeals && (
                      <div className="pt-2 border-t border-slate-700/40">
                        <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={alsoClearMeals}
                            onChange={(e) => setAlsoClearMeals(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                          />
                          <span className="text-slate-300">
                            Also clear today's logged meals list
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestartStreak(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Restart to 0 Days</span>
                  </button>
                </div>
              )}

              {/* Tab 2: Custom Days */}
              {resetTab === 'custom' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-2xl border border-[#222a38] bg-[#121722] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Target Streak Days:</span>
                      <span className="text-lg font-black text-amber-400">{customDays} Days</span>
                    </div>

                    <div className="flex items-center gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => setCustomDays((d) => Math.max(1, d - 1))}
                        className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-24 text-center py-1.5 px-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomDays((d) => Math.min(365, d + 1))}
                        className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSetCustomDays(customDays)}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Set Streak to {customDays} Days</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Factory Wipe */}
              {resetTab === 'factory' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-2 text-xs text-rose-200">
                    <div className="font-black text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Factory Reset Tracker</span>
                    </div>
                    <p className="leading-relaxed">
                      This will wipe all streak records, best records, unlocked trophies, and history.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleFactoryReset}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Wipe All Data &amp; Reset</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
