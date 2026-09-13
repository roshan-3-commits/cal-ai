import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { NavPage, ThemeMode } from '../types';
import {
  Calculator,
  Sun,
  Moon,
  Sparkles,
  Menu,
  X,
  Utensils,
  BookOpen,
  Flame,
  User,
  BellRing,
  Dumbbell,
  Egg,
} from 'lucide-react';

interface NavbarProps {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  onOpenCalculator: () => void;
  loggedMealsCount?: number;
  currentStreak?: number;
  userAvatar?: string;
  userName?: string;
  userPhotoUrl?: string;
  notificationsEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  theme,
  setTheme,
  loggedMealsCount = 0,
  currentStreak = 0,
  userAvatar = '🔥',
  userName = 'Profile',
  userPhotoUrl,
  notificationsEnabled = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredPage, setHoveredPage] = useState<NavPage | null>(null);

  // Pulse animation on streak / meal updates
  const [isStreakPulsing, setIsStreakPulsing] = useState(false);
  const prevCountRef = useRef(loggedMealsCount);

  useEffect(() => {
    if (loggedMealsCount > prevCountRef.current) {
      setIsStreakPulsing(true);
      const t = setTimeout(() => setIsStreakPulsing(false), 1400);
      prevCountRef.current = loggedMealsCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = loggedMealsCount;
  }, [loggedMealsCount]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavClick = (page: NavPage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    if (page === 'calculator') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard shortcut listener for quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') handleNavClick('calculator');
      if (e.key === '2' || e.key.toLowerCase() === 's') handleNavClick('scanner');
      if (e.key === '3' || e.key.toLowerCase() === 'l') handleNavClick('tracker');
      if (e.key === '4' || e.key.toLowerCase() === 'p') handleNavClick('profile');
      if (e.key === '5') handleNavClick('methodology');
      if (e.key.toLowerCase() === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme]);

  const isDark = theme === 'dark';

  const navLinks: {
    page: NavPage;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    isFeatured?: boolean;
  }[] = [
    {
      page: 'calculator',
      label: 'Calculator',
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
    {
      page: 'scanner',
      label: 'AI Scanner',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      isFeatured: true,
    },
    {
      page: 'tracker',
      label: 'Daily Log',
      icon: <Utensils className="w-3.5 h-3.5" />,
      badge: loggedMealsCount > 0 ? `${loggedMealsCount}` : undefined,
    },
    {
      page: 'methodology',
      label: 'Methodology',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
  ];

  const isProfileActive = activePage === 'profile';

  return (
    <header className="sticky top-4 z-50 w-full px-3 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Left balance element / Cal AI brand logo */}
        <div className="hidden md:flex items-center gap-2 shrink-0 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleNavClick('calculator')}
            title="Cal AI - Smart Calorie & Nutrition Engine"
            className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 select-none ${
              isDark
                ? 'bg-[#0e131d]/90 hover:bg-[#151c2a] border-white/15 hover:border-emerald-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.45)]'
                : 'bg-white/90 hover:bg-slate-50 border-slate-200 hover:border-emerald-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Gym + Egg Fitness Badge */}
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:rotate-6">
              <Dumbbell className="w-3.5 h-3.5 text-white -rotate-12 transition-transform duration-300 group-hover:rotate-0" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center shadow-xs">
                <Egg className="w-2 h-2 text-slate-950 fill-slate-950" />
              </span>
            </div>

            {/* Cal AI Text Branding */}
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Cal
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs">
                AI
              </span>
            </div>
          </button>
        </div>

        {/* Centralized Glassmorphism Pill Bar */}
        <div className="mx-auto flex items-center justify-center">
          <div
            className={`pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full border transition-all duration-300 backdrop-blur-2xl shadow-xl ${
              isDark
                ? 'bg-[#0b0e14]/85 border-white/[0.14] text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.12)]'
                : 'bg-white/85 border-slate-200/90 text-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]'
            }`}
          >
            {/* Desktop Nav Items */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = activePage === item.page;

                if (item.isFeatured) {
                  return (
                    <button
                      key={item.page}
                      type="button"
                      onClick={() => handleNavClick(item.page)}
                      onMouseEnter={() => setHoveredPage(item.page)}
                      onMouseLeave={() => setHoveredPage(null)}
                      title="AI Meal & Nutrition Scanner"
                      className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white shadow-[0_2px_12px_rgba(245,158,11,0.35)] scale-[1.02]'
                          : isDark
                          ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-400/10'
                          : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100/60'
                      }`}
                    >
                      <span className={isActive ? 'animate-spin' : ''} style={{ animationDuration: '6s' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold tracking-tight uppercase ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : isDark
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-amber-200/70 text-amber-800'
                        }`}
                      >
                        AI
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.page}
                    type="button"
                    onClick={() => handleNavClick(item.page)}
                    onMouseEnter={() => setHoveredPage(item.page)}
                    onMouseLeave={() => setHoveredPage(null)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none ${
                      isActive
                        ? isDark
                          ? 'text-white bg-white/15 border border-white/20 shadow-[0_2px_10px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] scale-[1.02]'
                          : 'text-slate-950 bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] scale-[1.02]'
                        : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="transition-transform duration-200">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tracking-tight ${
                          isDark
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Streak Indicator Pill with Motion Pulse */}
            <motion.button
              type="button"
              onClick={() => handleNavClick('tracker')}
              animate={
                isStreakPulsing
                  ? {
                      scale: [1, 1.32, 0.95, 1.1, 1],
                      boxShadow: [
                        '0 0 0 rgba(245, 158, 11, 0)',
                        '0 0 16px rgba(245, 158, 11, 0.85)',
                        '0 0 0 rgba(245, 158, 11, 0)',
                      ],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              title={`Active Streak: ${currentStreak} days. Click to view streak tracker.`}
              className={`px-2.5 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none ${
                currentStreak > 0
                  ? isDark
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  currentStreak > 0
                    ? isStreakPulsing
                      ? 'text-amber-400 fill-amber-400 animate-flame-flare'
                      : 'text-amber-500 fill-amber-500 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <span className={isStreakPulsing ? 'text-amber-300 font-black' : ''}>{currentStreak}</span>
            </motion.button>

            {/* Divider */}
            <div
              className={`w-px h-4 mx-0.5 ${
                isDark ? 'bg-white/15' : 'bg-slate-200'
              }`}
            />

            {/* Theme Switcher Button */}
            <button
              type="button"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
              title={isDark ? 'Switch to Light Mode (Ctrl+T)' : 'Switch to Dark Mode (Ctrl+T)'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-300 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Mobile menu toggle for small screens */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`sm:hidden w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                isDark
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE: PROFILE CHIP                                                  */}
        {/* ========================================================================= */}
        <div className="shrink-0 pointer-events-auto flex items-center justify-end gap-2 lg:w-auto">
          {/* Standalone Profile Button */}
          <button
            type="button"
            id="standalone-profile-alerts-btn"
            onClick={() => handleNavClick('profile')}
            title="User Profile, Meal Timers & Real Email/SMS Alerts"
            className={`group relative pl-2 pr-3 sm:pr-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer select-none backdrop-blur-2xl shadow-xl ${
              isProfileActive
                ? isDark
                  ? 'bg-gradient-to-r from-amber-500/30 via-orange-500/25 to-cyan-500/20 text-white border-2 border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.35)] scale-105'
                  : 'bg-amber-100/90 border-2 border-amber-400 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.25)] scale-105'
                : isDark
                ? 'bg-[#0e131d]/90 hover:bg-[#151c2a] text-slate-200 border border-white/15 hover:border-amber-400/60 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:scale-105'
                : 'bg-white/90 hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-amber-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:scale-105'
            }`}
          >
            {/* Avatar with dynamic ring and pinging notification indicator */}
            <div className="relative">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt={userName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-emerald-400 shadow-xs transition-transform group-hover:scale-110"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-400/50 flex items-center justify-center text-sm shadow-xs transition-transform group-hover:scale-110">
                  {userAvatar || '🔥'}
                </span>
              )}
              {notificationsEnabled && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black/40 shadow-xs" />
                </span>
              )}
            </div>

            {/* Profile Name & Status */}
            <div className="flex flex-col text-left">
              <span className="font-extrabold tracking-tight text-xs leading-none text-white drop-shadow-xs">
                {userName && userName.length > 10 ? userName.split(' ')[0] : (userName || 'Profile')}
              </span>
              <span className="text-[9px] font-semibold leading-tight text-emerald-400 flex items-center gap-1 mt-0.5">
                <BellRing className="w-2.5 h-2.5 text-emerald-400" />
                <span>Alerts {notificationsEnabled ? 'Active' : 'Off'}</span>
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Pill Menu */}
      {mobileMenuOpen && (
        <div className="max-w-xs mx-auto mt-2 px-2 pointer-events-auto">
          <div
            className={`sm:hidden p-2.5 rounded-2xl border space-y-1.5 animate-fadeIn backdrop-blur-2xl shadow-xl ${
              isDark
                ? 'bg-[#0b0e14]/95 border-white/[0.12] text-white shadow-black/80'
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
            }`}
          >
            {/* Mobile Brand Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10">
              <button
                type="button"
                onClick={() => handleNavClick('calculator')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 flex items-center justify-center shadow-xs">
                  <Dumbbell className="w-3 h-3 text-white -rotate-12" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border border-slate-900 flex items-center justify-center shadow-xs">
                    <Egg className="w-1.5 h-1.5 text-slate-950 fill-slate-950" />
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black tracking-tight text-white">Cal</span>
                  <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500 text-white">AI</span>
                </div>
              </button>
              <span className="text-[9px] font-semibold text-slate-400">Smart Fitness</span>
            </div>

            {/* Top mobile profile link */}
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-between cursor-pointer border ${
                activePage === 'profile'
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                  : isDark
                  ? 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.08]'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{userAvatar || '🔥'}</span>
                <span>Profile &amp; Mobile Alerts</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  notificationsEnabled
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/30'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {notificationsEnabled ? 'ALERTS ON' : 'OFF'}
              </span>
            </button>

            {/* Other links */}
            {navLinks.map((item) => (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNavClick(item.page)}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                  activePage === item.page
                    ? isDark
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-slate-100 text-slate-950 font-bold border border-slate-200'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isDark
                        ? 'bg-emerald-500/25 text-emerald-300'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
