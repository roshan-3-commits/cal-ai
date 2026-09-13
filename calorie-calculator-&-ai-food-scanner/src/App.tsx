import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CalculatorInputs,
  CalculationResult,
  LoggedMeal,
  MealCategory,
  NavPage,
  StreakData,
  ThemeMode,
  UserProfile,
  NotificationSettings,
  NotificationLog,
} from './types';
import {
  computeCalorieReport,
  parseInputsFromQuery,
  serializeInputsToQuery,
} from './utils/calculator';
import { loadStreakData, saveStreakData, recordMealLogToStreak, getAutoMealCategory } from './utils/streak';
import {
  loadUserProfile,
  saveUserProfile,
  loadNotificationSettings,
  saveNotificationSettings,
  loadNotificationLogs,
  saveNotificationLogs,
  syncProfileToCalculatorInputs,
  syncCalculatorInputsToProfile,
} from './utils/profileAndNotifications';
import { AnimatedBackground } from './components/AnimatedBackground';
import { useNotificationScheduler } from './utils/useNotificationScheduler';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CalculatorSection } from './components/CalculatorSection';
import { AIFoodScanner } from './components/AIFoodScanner';
import { DailyTracker } from './components/DailyTracker';
import { UserProfilePage } from './components/UserProfilePage';
import { MethodologyPage } from './components/MethodologyPage';
import { AboutPage } from './components/AboutPage';
import { FAQPage } from './components/FAQPage';
import { PrivacyTermsPage } from './components/PrivacyTermsPage';
import { ContactPage } from './components/ContactPage';
import { ToastProvider, useToast } from './components/Toast';
import {
  Calculator,
  Lock,
  Share2,
  Sparkles,
  ShieldCheck,
  Zap,
  Flame,
  User,
  BellRing,
} from 'lucide-react';

const DEFAULT_INPUTS: CalculatorInputs = {
  age: 30,
  gender: 'male',
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'sedentary',
  goal: 'maintain',
  targetWeightKg: '',
  formula: 'mifflin',
};

function MainAppContent() {
  const { toastCopy, toastMeal, toastSuccess, toastInfo } = useToast();
  const [activePage, setActivePage] = useState<NavPage>('calculator');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [shareCopied, setShareCopied] = useState(false);

  // Apply dark mode class to root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initialize inputs from URL query params or defaults
  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const parsed = parseInputsFromQuery(window.location.search);
      return { ...DEFAULT_INPUTS, ...parsed };
    }
    return DEFAULT_INPUTS;
  });

  // Calculate live report whenever inputs change
  const results = useMemo(() => computeCalorieReport(inputs), [inputs]);

  // Daily target state for the tracker
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    const report = computeCalorieReport(inputs);
    return report ? report.targetCalories : 1979;
  });
  const [targetLabel, setTargetLabel] = useState<string>(() => {
    const report = computeCalorieReport(inputs);
    return report ? report.activeGoalTier.title : 'Maintain';
  });

  // Persisted logged meals in local storage
  const [meals, setMeals] = useState<LoggedMeal[]>(() => {
    try {
      const saved = localStorage.getItem('freecalc_logged_meals');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      {
        id: 'init_1',
        name: 'Avocado Toast & Poached Egg (Scanner)',
        calories: 420,
        protein: 16,
        carbs: 38,
        fat: 23,
        time: '08:30 AM',
        source: 'scanner',
      },
    ];
  });

  // Persisted streak data
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());

  // Save streak data
  useEffect(() => {
    saveStreakData(streakData);
  }, [streakData]);

  // Persisted user profile
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());

  // Persisted notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadNotificationSettings()
  );

  // Persisted notification history logs
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() =>
    loadNotificationLogs()
  );

  // Save profile changes
  useEffect(() => {
    saveUserProfile(profile);
  }, [profile]);

  // Save notification settings changes
  useEffect(() => {
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  // Save notification logs changes
  useEffect(() => {
    saveNotificationLogs(notificationLogs);
  }, [notificationLogs]);

  // Handle incoming notification log addition
  const handleNewNotificationLog = useCallback((log: NotificationLog) => {
    setNotificationLogs((prev) => [log, ...prev]);
  }, []);

  // Handle in-app toast from notification scheduler
  const handleNotificationToast = useCallback(
    (title: string, message: string) => {
      toastInfo(title, message);
    },
    [toastInfo]
  );

  // Check if meals logged today
  const hasMealsLoggedToday = useMemo(() => {
    return meals.length > 0;
  }, [meals]);

  // Real-time time-to-time notification scheduler background engine
  useNotificationScheduler({
    profile,
    settings: notificationSettings,
    onNewNotificationLog: handleNewNotificationLog,
    onToast: handleNotificationToast,
    hasMealsLoggedToday,
  });

  // Handler to update profile and sync to calculator
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setInputs((prev) => syncProfileToCalculatorInputs(updatedProfile, prev));
    toastSuccess('Profile Updated', 'Biometrics & Meal Schedule saved and synced with calculator.');
  };

  // Handler to update notification settings
  const handleUpdateNotificationSettings = (updatedSettings: NotificationSettings) => {
    setNotificationSettings(updatedSettings);
  };

  // Handler to clear notification logs
  const handleClearNotificationLogs = () => {
    setNotificationLogs([]);
    toastInfo('Logs Cleared', 'Notification history has been cleared.');
  };

  // Save meals to local storage
  useEffect(() => {
    try {
      localStorage.setItem('freecalc_logged_meals', JSON.stringify(meals));
    } catch (e) {
      console.warn(e);
    }
  }, [meals]);

  // Sync inputs to browser URL query string
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryString = serializeInputsToQuery(inputs);
      const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, [inputs]);

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        toastCopy('Shareable URL Copied!', 'Your customized calorie and macro plan link is ready to share.');
        setTimeout(() => setShareCopied(false), 2500);
      });
    }
  };

  const handleScrollToCalculator = () => {
    if (activePage !== 'calculator') {
      setActivePage('calculator');
    }
    setTimeout(() => {
      const element = document.getElementById('calculator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleSetDailyTarget = (calories: number, label: string) => {
    setDailyTarget(calories);
    setTargetLabel(label);
    setActivePage('tracker');
    toastSuccess('Daily Target Updated', `Tracker goal set to ${calories} kcal (${label}).`);
  };

  const handleLogMeal = (mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    category?: MealCategory;
    portionSize?: string;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMeal: LoggedMeal = {
      id: 'meal_' + Date.now(),
      name: mealData.name,
      calories: mealData.calories,
      protein: Math.round(mealData.protein),
      carbs: Math.round(mealData.carbs),
      fat: Math.round(mealData.fat),
      category: mealData.category || getAutoMealCategory(),
      portionSize: mealData.portionSize,
      time: timeStr,
      source: 'scanner',
    };
    setMeals((prev) => [newMeal, ...prev]);
    toastMeal(mealData.name, mealData.calories);

    // Update streak
    const { updatedData, streakIncreased } = recordMealLogToStreak(streakData, mealData.calories);
    setStreakData(updatedData);
    if (streakIncreased) {
      toastSuccess('Streak Active! 🔥', `${updatedData.currentStreak}-day logging streak recorded!`);
    }

    setActivePage('tracker');
  };

  const handleAddManualMeal = (mealData: Omit<LoggedMeal, 'id' | 'time' | 'source'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMeal: LoggedMeal = {
      id: 'meal_' + Date.now(),
      ...mealData,
      category: mealData.category || getAutoMealCategory(),
      time: timeStr,
      source: 'manual',
    };
    setMeals((prev) => [newMeal, ...prev]);
    toastMeal(mealData.name, mealData.calories);

    // Update streak
    const { updatedData, streakIncreased } = recordMealLogToStreak(streakData, mealData.calories);
    setStreakData(updatedData);
    if (streakIncreased) {
      toastSuccess('Streak Active! 🔥', `${updatedData.currentStreak}-day logging streak recorded!`);
    }
  };

  const handleRemoveMeal = (id: string) => {
    const mealToDelete = meals.find((m) => m.id === id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (mealToDelete) {
      toastInfo('Item Removed', `"${mealToDelete.name}" removed from log.`);
    }
  };

  const handleClearAllMeals = () => {
    if (window.confirm('Clear all logged meals for today?')) {
      setMeals([]);
      toastInfo('Daily Log Reset', 'All meal entries for today have been cleared.');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col font-sans selection:bg-blue-500/30 relative ${
        isDark
          ? 'bg-ambient-dark text-slate-100'
          : 'bg-ambient-light text-slate-900'
      }`}
    >
      {/* Continuous Ambient Animated Background */}
      <AnimatedBackground isDark={isDark} />

      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        setTheme={setTheme}
        onOpenCalculator={handleScrollToCalculator}
        loggedMealsCount={meals.length}
        currentStreak={streakData.currentStreak}
        userAvatar={profile.avatar}
        userName={profile.name}
        userPhotoUrl={profile.photoUrl}
        notificationsEnabled={notificationSettings.enabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Page 1: Calculator (Hero + Live Two-Card Calculator Layout matching Screenshots 1, 2, 3) */}
        {activePage === 'calculator' && (
          <div className="space-y-12">
            {/* Hero Section matching Screenshot 1 & 3 */}
            <HeroSection
              theme={theme}
              onOpenCalculator={handleScrollToCalculator}
              onOpenMethodology={() => {
                setActivePage('methodology');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Side-by-Side Calculator Section matching Screenshot 2 */}
            <CalculatorSection
              inputs={inputs}
              setInputs={setInputs}
              result={results}
              onSetDailyTarget={handleSetDailyTarget}
              onScanFoodShortcut={() => {
                setActivePage('scanner');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenTracker={() => {
                setActivePage('tracker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShareLink={handleShareLink}
              shareCopied={shareCopied}
              theme={theme}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
              <div
                className={`p-6 rounded-3xl border transition space-y-2.5 ${
                  isDark
                    ? 'bg-[#101216]/80 border-[#1f242d] text-white'
                    : 'bg-white/90 border-slate-200 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Zero Data Collection</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No signup, no emails, no cookies. All calculations execute entirely inside your local browser sandbox.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl border transition space-y-2.5 ${
                  isDark
                    ? 'bg-[#101216]/80 border-[#1f242d] text-white'
                    : 'bg-white/90 border-slate-200 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Shareable URL Results</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Bookmark or share your custom calculation URL to instantly restore your exact metrics with zero storage overhead.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl border transition space-y-2.5 ${
                  isDark
                    ? 'bg-[#101216]/80 border-[#1f242d] text-white'
                    : 'bg-white/90 border-slate-200 text-slate-900 shadow-2xs'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">AI Food Scanner</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Snap or upload dish photos to estimate plate portions, calories, and macronutrient distributions in real time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page 2: AI Food Scanner */}
        {activePage === 'scanner' && (
          <AIFoodScanner theme={theme} onLogMeal={handleLogMeal} />
        )}

        {/* Page 3: Daily Tracker */}
        {activePage === 'tracker' && (
          <DailyTracker
            theme={theme}
            targetCalories={dailyTarget}
            targetLabel={targetLabel}
            meals={meals}
            streakData={streakData}
            onUpdateStreak={setStreakData}
            onAddManualMeal={handleAddManualMeal}
            onRemoveMeal={handleRemoveMeal}
            onClearAll={handleClearAllMeals}
            onSetCustomTarget={setDailyTarget}
            onOpenScanner={() => {
              setActivePage('scanner');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Page 4: User Profile & Time-to-Time Mobile Alerts */}
        {activePage === 'profile' && (
          <UserProfilePage
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            notificationSettings={notificationSettings}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            notificationLogs={notificationLogs}
            onClearNotificationLogs={handleClearNotificationLogs}
            theme={theme}
            onGoToCalculator={() => {
              setActivePage('calculator');
              handleScrollToCalculator();
            }}
            onGoToTracker={() => {
              setActivePage('tracker');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Page 4: Methodology */}
        {activePage === 'methodology' && (
          <MethodologyPage
            theme={theme}
            onGoToCalculator={() => {
              setActivePage('calculator');
              handleScrollToCalculator();
            }}
          />
        )}

        {/* Page 5: About */}
        {activePage === 'about' && (
          <AboutPage
            theme={theme}
            onGoToCalculator={() => {
              setActivePage('calculator');
              handleScrollToCalculator();
            }}
          />
        )}

        {/* Page 6: FAQ */}
        {activePage === 'faq' && <FAQPage theme={theme} />}

        {/* Page 7: Privacy & Terms */}
        {(activePage === 'privacy' || activePage === 'terms') && (
          <PrivacyTermsPage theme={theme} />
        )}

        {/* Page 8: Contact */}
        {activePage === 'contact' && (
          <ContactPage
            theme={theme}
            onGoToFAQ={() => {
              setActivePage('faq');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-12 mt-16 text-xs transition ${
          isDark
            ? 'bg-[#090a0d] border-[#181c24] text-slate-400'
            : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                  isDark ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                }`}
              >
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <span
                  className={`font-bold text-sm block ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Free Calorie Calculator
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Mifflin-St Jeor metabolic intelligence &amp; macro targets
                </span>
              </div>
            </div>

            {/* Navigation links in footer */}
            <div
              className={`flex flex-wrap items-center justify-center gap-5 font-semibold ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActivePage('calculator');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Calculator
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('scanner');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                AI Food Scanner
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('tracker');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Daily Log
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Profile &amp; Alerts
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('methodology');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Methodology
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                About
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('faq');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('privacy');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Privacy &amp; Terms
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePage('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={isDark ? 'hover:text-white transition' : 'hover:text-slate-950 transition'}
              >
                Contact
              </button>
            </div>
          </div>

          <div
            className={`pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] ${
              isDark ? 'border-[#181c24] text-slate-500' : 'border-slate-100 text-slate-400'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-left">
              <p>© 2026 Free Calorie Calculator • Zero Tracking</p>
              <span className="hidden sm:inline">•</span>
              <p>
                Created by{' '}
                <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  Roshan Lokhande
                </strong>{' '}
                (Roll No: 266597, A3 | Dept. of IT, K.B.P. College Vashi)
              </p>
            </div>
            <p className="text-center md:text-right">For educational &amp; dietary planning purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
