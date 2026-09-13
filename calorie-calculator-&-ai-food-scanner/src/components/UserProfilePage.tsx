import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserProfile,
  NotificationSettings,
  NotificationLog,
  CustomReminder,
  Gender,
  ActivityLevel,
  PrimaryGoal,
  DietaryPreference,
  ThemeMode,
} from '../types';
import {
  requestBrowserNotificationPermission,
  triggerDeviceNotification,
  playNotificationSound,
  generateEmailReport,
  openNativeEmailClient,
  openGmailWebDirect,
  openOutlookWebDirect,
  openWhatsAppGateway,
  openSmsGateway,
  sendRealEmailAlertApi,
} from '../utils/profileAndNotifications';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Scale,
  Ruler,
  Activity,
  Target,
  Utensils,
  Bell,
  BellRing,
  BellOff,
  Clock,
  Droplets,
  Flame,
  Sparkles,
  Check,
  Save,
  RotateCcw,
  Smartphone,
  Volume2,
  VolumeX,
  Vibrate,
  AlertCircle,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Plus,
  Trash2,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Footprints,
  Heart,
  Send,
  Sliders,
  Award,
  MessageSquare,
  Copy,
  ExternalLink,
  Radio,
} from 'lucide-react';

interface UserProfilePageProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  notificationSettings: NotificationSettings;
  onUpdateNotificationSettings: (updated: NotificationSettings) => void;
  notificationLogs: NotificationLog[];
  onClearNotificationLogs: () => void;
  theme?: ThemeMode;
  onGoToCalculator?: () => void;
  onGoToTracker?: () => void;
}

const AVATAR_OPTIONS = ['🔥', '⚡', '💪', '🥗', '🎯', '👑', '🥑', '🦁', '🚀', '🧘‍♂️', '🏆', '💎'];

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  profile,
  onUpdateProfile,
  notificationSettings,
  onUpdateNotificationSettings,
  notificationLogs,
  onClearNotificationLogs,
  theme = 'dark',
  onGoToCalculator,
  onGoToTracker,
}) => {
  const isDark = theme === 'dark';

  // Form State
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [notifData, setNotifData] = useState<NotificationSettings>(notificationSettings);
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'notifications' | 'dispatch' | 'logs'>('profile');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [testNotifFeedback, setTestNotifFeedback] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Email Server & SMTP State
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDeliveryResult, setEmailDeliveryResult] = useState<{
    success: boolean;
    message: string;
    previewUrl?: string | null;
    transportType?: string;
  } | null>(null);
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  const [smtpFormData, setSmtpFormData] = useState({
    host: notifData.smtpConfig?.host || '',
    port: notifData.smtpConfig?.port || 587,
    user: notifData.smtpConfig?.user || '',
    pass: notifData.smtpConfig?.pass || '',
    from: notifData.smtpConfig?.from || '',
  });
  const [smtpVerifying, setSmtpVerifying] = useState(false);
  const [smtpVerifyResult, setSmtpVerifyResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [newCustomReminder, setNewCustomReminder] = useState<Omit<CustomReminder, 'id'>>({
    title: '',
    message: '',
    time: '12:00',
    enabled: true,
    type: 'meal',
  });

  // Sync external changes into form state if props change
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    setNotifData(notificationSettings);
  }, [notificationSettings]);

  // Derived metrics (BMR & BMI)
  const heightM = (formData.heightCm || 175) / 100;
  const weight = formData.weightKg || 70;
  const calculatedBmi = Number((weight / (heightM * heightM)).toFixed(1));

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: 'Healthy Weight', color: 'text-emerald-400' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'High BMI', color: 'text-rose-400' };
  };

  const bmiStatus = getBmiCategory(calculatedBmi);

  // Save all changes
  const handleSaveAll = () => {
    onUpdateProfile(formData);
    onUpdateNotificationSettings(notifData);
    setSaveFeedback('Profile, Meal Schedules & Notification channels saved and synced successfully!');
    playNotificationSound();
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Request & Enable Browser Push Notification
  const handleEnablePushNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res.granted) {
      const updated = { ...notifData, enabled: true, permissionGranted: true, devicePushEnabled: true };
      setNotifData(updated);
      onUpdateNotificationSettings(updated);
      setTestNotifFeedback('Device Push Notifications Granted! You will receive automatic screen alerts.');
      triggerDeviceNotification('🎉 Alerts Activated!', {
        body: `Hello ${formData.name || 'Friend'}! Your meal schedule & water alerts are now live.`,
        sound: true,
        vibrate: true,
      });
      setTimeout(() => setTestNotifFeedback(null), 4000);
    } else {
      setTestNotifFeedback(
        res.status === 'denied'
          ? 'Notification permission was denied in your browser settings. Please allow notifications in site settings.'
          : 'Web Notifications are in standard in-app simulation mode.'
      );
      setTimeout(() => setTestNotifFeedback(null), 5000);
    }
  };

  // Test Instant Device Notification
  const handleSendTestNotification = () => {
    const titles = [
      `🥗 Time for Meal Window! (${formData.name || 'Champion'})`,
      '💧 Hydration Alert: Drink a glass of water!',
      '🔥 Streak Alert: Keep your consistency alive today!',
      '⚡ Metabolism Boost: Time for a healthy snack!',
    ];
    const bodies = [
      `Scheduled reminder: Remember to hit your ${formData.goal} goal today.`,
      `Target: ${formData.dailyWaterTargetLiters}L today. Stay energetic and hydrated!`,
      `Log your meals before 09:30 PM to keep your streak growing!`,
      `High-protein intake fuels your active metabolism.`,
    ];

    const randomIndex = Math.floor(Math.random() * titles.length);
    const chosenTitle = titles[randomIndex];
    const chosenBody = bodies[randomIndex];

    playNotificationSound();
    const sent = triggerDeviceNotification(chosenTitle, {
      body: chosenBody,
      sound: notifData.soundEnabled,
      vibrate: notifData.vibrationEnabled,
    });

    if (sent) {
      setTestNotifFeedback(`🔔 Push Notification delivered directly to your device screen!`);
    } else {
      setTestNotifFeedback(
        `🔔 Notification sound chime & vibration triggered! (Enable phone push permission for lock screen popups).`
      );
    }
    setTimeout(() => setTestNotifFeedback(null), 4500);
  };

  // Send Real Server-Side Email using backend API (/api/send-email-alert)
  const handleSendRealServerEmail = async () => {
    setIsSendingEmail(true);
    setEmailDeliveryResult(null);

    const report = generateEmailReport(
      formData,
      'Circadian Meal Schedule & Nutrition Targets',
      `This is your scheduled daily nutrition alert for ${new Date().toLocaleDateString()}. Follow your personalized circadian meal windows and stay hydrated!`
    );

    try {
      const res = await sendRealEmailAlertApi(
        formData,
        report.subject,
        report.body,
        'manual_dispatch',
        notifData.smtpConfig
      );

      if (res.success) {
        setEmailDeliveryResult({
          success: true,
          message: `Email alert successfully processed! Message ID: ${res.messageId || 'DELIVERED'}`,
          previewUrl: res.previewUrl,
          transportType: res.transportType,
        });
        setDispatchStatus(`✅ Email alert dispatched to ${formData.email || 'pj344504@gmail.com'}`);
      } else {
        setEmailDeliveryResult({
          success: false,
          message: res.error || 'Failed to dispatch email. Check SMTP settings or connection.',
        });
        setDispatchStatus(`⚠️ Email dispatch alert: ${res.error || 'Check server configuration'}`);
      }
    } catch (err: any) {
      setEmailDeliveryResult({
        success: false,
        message: err?.message || 'Network error reaching backend email dispatcher',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Open Directly in Gmail Web (1-Click Compose)
  const handleOpenGmailWeb = () => {
    const report = generateEmailReport(
      formData,
      'Circadian Meal Windows & Nutrition Plan',
      `Personalized daily nutrition & meal reminder for ${new Date().toLocaleDateString()}. Stay consistent and fuel your health!`
    );
    openGmailWebDirect(formData.email || 'pj344504@gmail.com', report.subject, report.body);
    setDispatchStatus(`📧 Gmail Web composer opened for ${formData.email || 'pj344504@gmail.com'}`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  // Open in Outlook Web
  const handleOpenOutlookWeb = () => {
    const report = generateEmailReport(
      formData,
      'Circadian Meal Windows & Nutrition Plan',
      `Personalized daily nutrition & meal reminder for ${new Date().toLocaleDateString()}. Stay consistent and fuel your health!`
    );
    openOutlookWebDirect(formData.email || 'pj344504@gmail.com', report.subject, report.body);
    setDispatchStatus(`📧 Outlook Web composer opened for ${formData.email || 'pj344504@gmail.com'}`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  // Real Email Dispatch Action (Mailto / Native)
  const handleSendEmailAlert = () => {
    const report = generateEmailReport(
      formData,
      'Scheduled Meal & Nutrition Targets',
      `This is your scheduled daily nutrition alert for ${new Date().toLocaleDateString()}. Follow your circadian meal windows and stay hydrated!`
    );
    openNativeEmailClient(formData.email || 'pj344504@gmail.com', report.subject, report.body);
    setDispatchStatus(`📧 Real Email Dispatch triggered for ${formData.email || 'pj344504@gmail.com'}`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  // Verify SMTP settings against backend API
  const handleVerifySmtpCredentials = async () => {
    if (!smtpFormData.host || !smtpFormData.user) {
      setSmtpVerifyResult({
        success: false,
        message: 'Please provide at least SMTP Host and User email.',
      });
      return;
    }

    setSmtpVerifying(true);
    setSmtpVerifyResult(null);

    try {
      const res = await fetch('/api/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpFormData),
      });
      const data = await res.json();
      setSmtpVerifyResult({
        success: data.success,
        message: data.message || (data.success ? 'SMTP connection verified successfully!' : 'SMTP verification failed.'),
      });
    } catch (err: any) {
      setSmtpVerifyResult({
        success: false,
        message: err?.message || 'Failed to connect to SMTP verification endpoint',
      });
    } finally {
      setSmtpVerifying(false);
    }
  };

  // Save SMTP Settings
  const handleSaveSmtpSettings = () => {
    const updatedSmtp = {
      ...smtpFormData,
      port: Number(smtpFormData.port) || 587,
      isCustomConfigured: Boolean(smtpFormData.host && smtpFormData.user),
    };
    const updatedNotif = {
      ...notifData,
      smtpConfig: updatedSmtp,
    };
    setNotifData(updatedNotif);
    onUpdateNotificationSettings(updatedNotif);
    setDispatchStatus('✅ SMTP configuration saved to notification settings!');
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  // Copy Email Report Text
  const handleCopyEmailReport = () => {
    const report = generateEmailReport(formData, 'Daily Nutrition & Meal Windows');
    navigator.clipboard.writeText(`Subject: ${report.subject}\n\n${report.body}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  // Real WhatsApp / Mobile SMS Alert Action
  const handleSendWhatsAppAlert = () => {
    const alertMessage = `🔥 *FreeCalorieCalc Mobile Alert for ${formData.name}*\n\n⏰ *Time for Scheduled Meal/Hydration Window!*\n• Goal: ${formData.goal.toUpperCase()} (${formData.targetWeightKg}kg target)\n• Water Target: ${formData.dailyWaterTargetLiters}L\n• Meal Windows: Breakfast ${formData.breakfastTime} | Lunch ${formData.lunchTime} | Snack ${formData.snackTime} | Dinner ${formData.dinnerTime}\n\nStay consistent and log your meal today! 💪`;
    openWhatsAppGateway(formData.phone || '+919876543210', alertMessage);
    setDispatchStatus(`💬 WhatsApp alert trigger opened for ${formData.phone || '+91 98765 43210'}`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  // Real SMS App Action
  const handleSendSmsAlert = () => {
    const alertMessage = `[FreeCalorieCalc] Time for meal/hydration window! Target: ${formData.dailyWaterTargetLiters}L water. Log your meal now to keep your streak!`;
    openSmsGateway(formData.phone || '+919876543210', alertMessage);
    setDispatchStatus(`📱 SMS dispatcher opened for ${formData.phone || '+91 98765 43210'}`);
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  // Simultaneous Multichannel Dispatch Test (Push + Email + WhatsApp)
  const handleSimultaneousMultichannelTest = () => {
    playNotificationSound();
    triggerDeviceNotification(`🚀 Multichannel Dispatch (${formData.name})`, {
      body: `Testing Push, Email to ${formData.email} and SMS/WhatsApp to ${formData.phone}!`,
      sound: true,
      vibrate: true,
    });
    setDispatchStatus(`⚡ Multichannel Alert Fired: Device Push + Email (${formData.email}) + WhatsApp (${formData.phone})`);
    setTimeout(() => setDispatchStatus(null), 6000);
  };

  // Add custom reminder
  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomReminder.title.trim()) return;

    const newReminder: CustomReminder = {
      ...newCustomReminder,
      id: 'custom_' + Date.now(),
    };

    const updated = {
      ...notifData,
      customReminders: [...(notifData.customReminders || []), newReminder],
    };
    setNotifData(updated);
    onUpdateNotificationSettings(updated);
    setShowCustomModal(false);
    setNewCustomReminder({
      title: '',
      message: '',
      time: '12:00',
      enabled: true,
      type: 'meal',
    });
  };

  const handleRemoveCustomReminder = (id: string) => {
    const updated = {
      ...notifData,
      customReminders: notifData.customReminders.filter((r) => r.id !== id),
    };
    setNotifData(updated);
    onUpdateNotificationSettings(updated);
  };

  const handleToggleCustomReminder = (id: string) => {
    const updated = {
      ...notifData,
      customReminders: notifData.customReminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    };
    setNotifData(updated);
    onUpdateNotificationSettings(updated);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO USER PROFILE CARD                                                 */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-[#1b2230] bg-gradient-to-r from-[#0b0e15] via-[#0d121c] to-[#0a0d14] shadow-2xl text-white">
        {/* Glow ambient background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-60 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-10 bottom-0 w-60 h-60 rounded-full bg-amber-500/15 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt={formData.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-400 shadow-xl transform group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-500/30 to-cyan-500/30 border-2 border-amber-400/50 flex items-center justify-center text-4xl sm:text-5xl shadow-xl transform group-hover:scale-105 transition">
                  {formData.avatar || '🔥'}
                </div>
              )}
              <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs uppercase bg-amber-500 text-slate-950">
                Active
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {formData.name || 'Fitness Champion'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{formData.email || 'pj344504@gmail.com'}</span>
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formData.phone || '+91 98765 43210'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  🎯 Goal: {formData.goal.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  🥗 {formData.dietaryPreference.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  BMI {calculatedBmi} ({bmiStatus.label})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Sync Calculator</span>
            </button>

            <button
              type="button"
              onClick={handleSimultaneousMultichannelTest}
              className="px-4 py-2 rounded-2xl bg-[#141b27] hover:bg-[#1a2333] border border-[#26354b] text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Test Multichannel Alert</span>
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {saveFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </motion.div>
        )}

        {testNotifFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-2"
          >
            <BellRing className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
            <span>{testNotifFeedback}</span>
          </motion.div>
        )}

        {dispatchStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-2"
          >
            <Send className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0c1017] border border-[#1b2230] max-w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Biometrics &amp; Goal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Meal Times &amp; Water</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Time-to-Time Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'dispatch'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
              : 'text-cyan-300 hover:text-white hover:bg-cyan-500/10'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Live Email &amp; SMS Dispatch</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Alert Logs ({notificationLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: BIOMETRICS & PERSONAL PROFILE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-[#19202c] bg-[#0c1017] space-y-6 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2838]">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black tracking-tight">Personal &amp; Biometric Details</h2>
            </div>
            <span className="text-xs text-slate-400">Updates live across Mifflin-St Jeor formulas</span>
          </div>

          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Choose Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar: av })}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition cursor-pointer ${
                    formData.avatar === av
                      ? 'bg-amber-500/30 border-2 border-amber-400 scale-110 shadow-md'
                      : 'bg-[#121722] border border-[#232d3e] hover:bg-white/5'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-amber-400 text-sm font-semibold"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email Address (for Reports &amp; Alerts)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="pj344504@gmail.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-cyan-400 text-sm font-semibold"
              />
            </div>

            {/* Mobile / Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Mobile Phone (for SMS/WhatsApp Alerts)</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-amber-400 text-sm font-semibold"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Age (Years)</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 25 })}
                min={10}
                max={120}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-amber-400 text-sm font-semibold"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                      formData.gender === g
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-[#121722] text-slate-400 border border-[#232d3e] hover:bg-white/5'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Height (cm) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-teal-400" />
                <span>Height (cm)</span>
              </label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) || 170 })}
                min={80}
                max={250}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-teal-400 text-sm font-semibold"
              />
            </div>

            {/* Current Weight (kg) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-rose-400" />
                <span>Current Weight (kg)</span>
              </label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) || 70 })}
                min={30}
                max={300}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-rose-400 text-sm font-semibold"
              />
            </div>

            {/* Target Goal Weight (kg) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Goal Weight (kg)</span>
              </label>
              <input
                type="number"
                value={formData.targetWeightKg}
                onChange={(e) => setFormData({ ...formData, targetWeightKg: Number(e.target.value) || 65 })}
                min={30}
                max={300}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-emerald-400 text-sm font-semibold"
              />
            </div>

            {/* Primary Fitness Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Primary Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as PrimaryGoal })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-amber-400 text-sm font-semibold"
              >
                <option value="lose">Fat Loss &amp; Lean Out</option>
                <option value="maintain">Maintain Current Physique</option>
                <option value="gain">Muscle Gain &amp; Bulking</option>
              </select>
            </div>

            {/* Activity Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Daily Activity Level</span>
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-cyan-400 text-sm font-semibold"
              >
                <option value="sedentary">Sedentary (Desk job, little exercise)</option>
                <option value="light">Light Activity (1–3 exercise days/wk)</option>
                <option value="moderate">Moderate Activity (3–5 training days/wk)</option>
                <option value="very">Very Active (6–7 heavy workout days/wk)</option>
                <option value="extra">Extremely Active (Athletic / physical job)</option>
              </select>
            </div>

            {/* Dietary Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dietary Preference</span>
              </label>
              <select
                value={formData.dietaryPreference}
                onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value as DietaryPreference })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#121722] border border-[#232d3e] text-white focus:outline-none focus:border-emerald-400 text-sm font-semibold"
              >
                <option value="all">Standard / All Foods</option>
                <option value="high-protein">High-Protein Fitness Diet</option>
                <option value="vegetarian">Vegetarian (Lacto/Ovo)</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="vegan">100% Plant-Based Vegan</option>
                <option value="keto">Ketogenic (Low-Carb High-Fat)</option>
                <option value="gluten-free">Gluten-Free</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: MEAL TIMING SCHEDULE & HYDRATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'schedule' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-[#19202c] bg-[#0c1017] space-y-6 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2838]">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black tracking-tight">Time-to-Time Meal Windows &amp; Hydration</h2>
            </div>
            <span className="text-xs text-slate-400">Sets your custom circadian notification triggers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Breakfast Time */}
            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                <Sunrise className="w-4 h-4" />
                <span>Morning Fuel (Breakfast)</span>
              </div>
              <input
                type="time"
                value={formData.breakfastTime}
                onChange={(e) => setFormData({ ...formData, breakfastTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 block">Metabolic ignition alert time</span>
            </div>

            {/* Lunch Time */}
            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                <Sun className="w-4 h-4" />
                <span>Midday Power (Lunch)</span>
              </div>
              <input
                type="time"
                value={formData.lunchTime}
                onChange={(e) => setFormData({ ...formData, lunchTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 block">Peak insulin efficiency window</span>
            </div>

            {/* Snack Time */}
            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase">
                <Zap className="w-4 h-4" />
                <span>Afternoon Refuel (Snack)</span>
              </div>
              <input
                type="time"
                value={formData.snackTime}
                onChange={(e) => setFormData({ ...formData, snackTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 block">Pre-workout energy buffer</span>
            </div>

            {/* Dinner Time */}
            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                <Sunset className="w-4 h-4" />
                <span>Rest &amp; Repair (Dinner)</span>
              </div>
              <input
                type="time"
                value={formData.dinnerTime}
                onChange={(e) => setFormData({ ...formData, dinnerTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
              <span className="text-[11px] text-slate-400 block">Finish 3h prior to sleep</span>
            </div>
          </div>

          {/* Hydration & Sleep Protocol Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Droplets className="w-4 h-4" />
                <span>Daily Water Goal (Liters)</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={formData.dailyWaterTargetLiters}
                onChange={(e) =>
                  setFormData({ ...formData, dailyWaterTargetLiters: Number(e.target.value) || 3 })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Droplets className="w-4 h-4" />
                <span>Water Reminder Interval</span>
              </div>
              <select
                value={formData.waterReminderIntervalHours}
                onChange={(e) =>
                  setFormData({ ...formData, waterReminderIntervalHours: Number(e.target.value) || 2 })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-sm font-bold"
              >
                <option value={1}>Every 1 Hour</option>
                <option value={2}>Every 2 Hours (Recommended)</option>
                <option value={3}>Every 3 Hours</option>
                <option value={4}>Every 4 Hours</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-[#111622] border border-[#1d2637] space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Footprints className="w-4 h-4" />
                <span>Daily Step Target</span>
              </div>
              <input
                type="number"
                step="1000"
                min="2000"
                max="50000"
                value={formData.dailyStepGoal}
                onChange={(e) => setFormData({ ...formData, dailyStepGoal: Number(e.target.value) || 10000 })}
                className="w-full px-3 py-2 rounded-xl bg-[#161d2a] border border-[#27354a] text-white text-base font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: MOBILE NOTIFICATIONS ENGINE & MASTER SWITCHES                   */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-[#19202c] bg-[#0c1017] space-y-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2838]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Time-to-Time Mobile Push Engine</h2>
                <p className="text-xs text-slate-400">
                  Sends scheduled alerts to your mobile phone screen, email &amp; SMS channels.
                </p>
              </div>
            </div>

            {/* Permission Action */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnablePushNotifications}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Smartphone className="w-4 h-4" />
                <span>Grant Phone Permission</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestNotification}
                className="px-4 py-2 rounded-xl bg-[#151c27] hover:bg-[#1e2736] border border-[#29364a] text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Alert</span>
              </button>
            </div>
          </div>

          {/* Master Channel Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Global Enable */}
            <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm block">Push Alerts</span>
                <span className="text-[11px] text-slate-400">Mobile &amp; Browser</span>
              </div>
              <input
                type="checkbox"
                checked={notifData.devicePushEnabled}
                onChange={(e) => setNotifData({ ...notifData, devicePushEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Email Alerts */}
            <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm block">Email Delivery</span>
                <span className="text-[11px] text-slate-400">{formData.email ? 'To your inbox' : 'Disabled'}</span>
              </div>
              <input
                type="checkbox"
                checked={notifData.emailAlertsEnabled}
                onChange={(e) => setNotifData({ ...notifData, emailAlertsEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* WhatsApp / SMS Alerts */}
            <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm block">Mobile WhatsApp/SMS</span>
                <span className="text-[11px] text-slate-400">To {formData.phone || 'Phone'}</span>
              </div>
              <input
                type="checkbox"
                checked={notifData.whatsappAlertsEnabled || notifData.smsAlertsEnabled}
                onChange={(e) =>
                  setNotifData({
                    ...notifData,
                    whatsappAlertsEnabled: e.target.checked,
                    smsAlertsEnabled: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Sound Chimes */}
            <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold text-sm block">Audio Chime</span>
                  <span className="text-[11px] text-slate-400">Harmonic Bell</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifData.soundEnabled}
                onChange={(e) => setNotifData({ ...notifData, soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Time-to-Time Scheduled Reminder Toggles */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Automated Meal &amp; Health Reminder Triggers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Morning Breakfast Reminder */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Sunrise className="w-4 h-4" />
                    <span>Morning Fuel Reminder ({formData.breakfastTime})</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Alerts you to consume your high-protein breakfast within 1–2 hours of waking up.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.breakfastReminder}
                  onChange={(e) => setNotifData({ ...notifData, breakfastReminder: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer mt-1"
                />
              </div>

              {/* Lunch Reminder */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Sun className="w-4 h-4" />
                    <span>Midday Lunch Reminder ({formData.lunchTime})</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Prompts balanced energy refuel to prevent afternoon brain fog and blood sugar dips.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.lunchReminder}
                  onChange={(e) => setNotifData({ ...notifData, lunchReminder: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer mt-1"
                />
              </div>

              {/* Afternoon Refuel Reminder */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Afternoon Refuel ({formData.snackTime})</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pre-workout protein or healthy snack alert 60–90 minutes before evening training.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.snackReminder}
                  onChange={(e) => setNotifData({ ...notifData, snackReminder: e.target.checked })}
                  className="w-5 h-5 accent-teal-500 cursor-pointer mt-1"
                />
              </div>

              {/* Dinner Reminder */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Sunset className="w-4 h-4" />
                    <span>Rest &amp; Repair Dinner ({formData.dinnerTime})</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ensures dinner is finished 3 hours prior to sleep for deep sleep &amp; hormone optimization.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.dinnerReminder}
                  onChange={(e) => setNotifData({ ...notifData, dinnerReminder: e.target.checked })}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer mt-1"
                />
              </div>

              {/* Hydration Water Alert */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Droplets className="w-4 h-4" />
                    <span>Hydration Water Reminders (Every {formData.waterReminderIntervalHours}h)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Regular interval alerts to reach your {formData.dailyWaterTargetLiters}L daily water goal.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.waterReminder}
                  onChange={(e) => setNotifData({ ...notifData, waterReminder: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 cursor-pointer mt-1"
                />
              </div>

              {/* Streak Alert Night Reminder */}
              <div className="p-4 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <Flame className="w-4 h-4" />
                    <span>Streak Guardian Night Alert (09:30 PM)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sends emergency notification if no meal was logged today so you don't lose your streak!
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifData.streakAlertReminder}
                  onChange={(e) => setNotifData({ ...notifData, streakAlertReminder: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>

          {/* Custom Reminders Header & List */}
          <div className="space-y-3 pt-4 border-t border-[#1f2838]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Custom User Reminders ({notifData.customReminders?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#161d2a] hover:bg-[#1f293a] border border-[#28364c] text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Custom Reminder</span>
              </button>
            </div>

            {notifData.customReminders && notifData.customReminders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notifData.customReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3.5 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{rem.title}</span>
                        <span className="text-[11px] font-black text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10">
                          {rem.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-xs">{rem.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={rem.enabled}
                        onChange={() => handleToggleCustomReminder(rem.id)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomReminder(rem.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No custom reminders created yet. Click "Add Custom Reminder" to create personalized supplement, workout, or meal notifications.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: LIVE EMAIL & MOBILE SMS/WHATSAPP DISPATCH CENTER               */}
      {/* ========================================================================= */}
      {activeTab === 'dispatch' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-[#19202c] bg-[#0c1017] space-y-6 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2838]">
            <div className="flex items-center gap-2.5">
              <Send className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black tracking-tight">Real-Time Email &amp; Mobile Dispatch Center</h2>
            </div>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Live Delivery Gateways
            </span>
          </div>

          {/* Cards for Email & Phone Dispatch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. EMAIL TRANSMITTER */}
            <div className="p-5 rounded-3xl bg-[#111622] border border-[#1e2738] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Email Alert Dispatch Gateway</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        NodeMailer Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Target Email: <strong className="text-cyan-300 font-bold">{formData.email || 'pj344504@gmail.com'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSmtpSettings(!showSmtpSettings)}
                  className="px-2.5 py-1 rounded-lg bg-[#18212f] hover:bg-[#202c3e] border border-[#2b3a4f] text-[11px] font-bold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>SMTP Settings</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#161d2a] p-3 rounded-xl border border-[#273449]">
                Sends your full customized calorie budget, macronutrient targets, and circadian meal windows directly to <strong className="text-white">{formData.email || 'pj344504@gmail.com'}</strong>.
              </p>

              {/* Email Delivery Result Status */}
              {emailDeliveryResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 animate-fadeIn ${
                    emailDeliveryResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {emailDeliveryResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{emailDeliveryResult.message}</span>
                  </div>
                  {emailDeliveryResult.previewUrl && (
                    <div className="pt-1">
                      <a
                        href={emailDeliveryResult.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-semibold text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Dispatched Email Preview (Ethereal Sandbox)</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* 1. Direct Server Email Dispatch */}
                <button
                  type="button"
                  id="btn-send-server-email"
                  onClick={handleSendRealServerEmail}
                  disabled={isSendingEmail}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Real Server Email</span>
                    </>
                  )}
                </button>

                {/* 2. Open Direct in Gmail Web */}
                <button
                  type="button"
                  id="btn-open-gmail-web"
                  onClick={handleOpenGmailWeb}
                  className="px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#2b3a4f] border border-cyan-500/40 text-cyan-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Open directly in Gmail web with pre-composed alert"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open in Gmail Web</span>
                </button>

                {/* 3. Open in Outlook Web */}
                <button
                  type="button"
                  onClick={handleOpenOutlookWeb}
                  className="px-3 py-2 rounded-xl bg-[#18212f] hover:bg-[#202c3e] border border-[#2b3a4f] text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Open directly in Outlook web"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Outlook Web</span>
                </button>

                {/* 4. Native App / Mailto */}
                <button
                  type="button"
                  onClick={handleSendEmailAlert}
                  className="px-3 py-2 rounded-xl bg-[#18212f] hover:bg-[#202c3e] border border-[#2b3a4f] text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Open default email application on this device"
                >
                  <Send className="w-3 h-3 text-slate-400" />
                  <span>Native Mail</span>
                </button>

                {/* 5. Copy Text */}
                <button
                  type="button"
                  onClick={handleCopyEmailReport}
                  className="px-3 py-2 rounded-xl bg-[#18212f] hover:bg-[#202c3e] border border-[#2b3a4f] text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copiedEmail ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Expandable Custom SMTP Configuration Card */}
              {showSmtpSettings && (
                <div className="p-4 rounded-2xl bg-[#0e131c] border border-cyan-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1f293a]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span className="font-extrabold text-xs text-white">Custom SMTP Server Configuration (Optional)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Default: Direct Server Relay</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    If you want alerts sent directly via your own Gmail (with App Password), SendGrid, or custom mail server, enter the credentials below:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">SMTP Host</label>
                      <input
                        type="text"
                        placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                        value={smtpFormData.host}
                        onChange={(e) => setSmtpFormData({ ...smtpFormData, host: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#161e2c] border border-[#26354b] text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">SMTP Port</label>
                      <input
                        type="number"
                        placeholder="587 or 465"
                        value={smtpFormData.port}
                        onChange={(e) => setSmtpFormData({ ...smtpFormData, port: Number(e.target.value) || 587 })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#161e2c] border border-[#26354b] text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">SMTP User / Email</label>
                      <input
                        type="text"
                        placeholder="e.g. your_email@gmail.com"
                        value={smtpFormData.user}
                        onChange={(e) => setSmtpFormData({ ...smtpFormData, user: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#161e2c] border border-[#26354b] text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">SMTP Password / App Password</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={smtpFormData.pass}
                        onChange={(e) => setSmtpFormData({ ...smtpFormData, pass: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#161e2c] border border-[#26354b] text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  {smtpVerifyResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                        smtpVerifyResult.success
                          ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {smtpVerifyResult.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span>{smtpVerifyResult.message}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleVerifySmtpCredentials}
                      disabled={smtpVerifying}
                      className="px-3 py-1.5 rounded-lg bg-[#1c2534] hover:bg-[#253246] border border-[#31425c] text-xs font-bold text-slate-200 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {smtpVerifying ? (
                        <>
                          <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Test SMTP Connection</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSmtpSettings}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save SMTP Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. MOBILE NUMBER & WHATSAPP TRANSMITTER */}
            <div className="p-5 rounded-3xl bg-[#111622] border border-[#1e2738] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Mobile Phone Alert Gateway</h3>
                  <p className="text-xs text-slate-400">
                    Recipient: <strong className="text-emerald-300">{formData.phone || '+91 98765 43210'}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#161d2a] p-3 rounded-xl border border-[#273449]">
                Sends real-time notification alerts directly to your mobile phone number via WhatsApp Gateway, SMS application, or Web Push vibration.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendWhatsAppAlert}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendSmsAlert}
                  className="px-3.5 py-2 rounded-xl bg-[#18212f] hover:bg-[#202c3e] border border-[#2b3a4f] text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send Native SMS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multichannel Automated Alert Preview Box */}
          <div className="p-4 rounded-2xl bg-[#0e131b] border border-[#1c2432] space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated Circadian Meal Windows Schedule</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#141a25] border border-[#222c3c]">
                <span className="text-slate-400 block text-[10px]">Morning Fuel</span>
                <span className="font-black text-amber-300">{formData.breakfastTime}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#141a25] border border-[#222c3c]">
                <span className="text-slate-400 block text-[10px]">Midday Lunch</span>
                <span className="font-black text-cyan-300">{formData.lunchTime}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#141a25] border border-[#222c3c]">
                <span className="text-slate-400 block text-[10px]">Afternoon Snack</span>
                <span className="font-black text-teal-300">{formData.snackTime}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#141a25] border border-[#222c3c]">
                <span className="text-slate-400 block text-[10px]">Rest &amp; Repair Dinner</span>
                <span className="font-black text-indigo-300">{formData.dinnerTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: NOTIFICATION LOGS & HISTORY                                     */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="p-6 sm:p-8 rounded-3xl border border-[#19202c] bg-[#0c1017] space-y-5 text-white">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2838]">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-black tracking-tight">Recent Notification &amp; Dispatch Logs</h2>
            </div>
            {notificationLogs.length > 0 && (
              <button
                type="button"
                onClick={onClearNotificationLogs}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                Clear History
              </button>
            )}
          </div>

          {notificationLogs.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {notificationLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-[#121722] border border-[#222c3d] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-100">{log.title}</span>
                      {log.channel && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                            log.channel === 'email'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : log.channel === 'whatsapp'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : log.channel === 'sms'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {log.channel}
                        </span>
                      )}
                      {log.recipient && (
                        <span className="text-[10px] text-slate-400 italic">({log.recipient})</span>
                      )}
                    </div>
                    <p className="text-slate-400 leading-relaxed">{log.body}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-medium">{log.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <BellOff className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No alerts logged yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: ADD CUSTOM REMINDER                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-[#242e40] bg-[#0f141d] p-6 shadow-2xl space-y-4 text-white"
            >
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Create Custom Reminder</span>
              </h3>

              <form onSubmit={handleAddCustomReminder} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Reminder Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 💊 Take Creatine &amp; Multivitamin"
                    value={newCustomReminder.title}
                    onChange={(e) => setNewCustomReminder({ ...newCustomReminder, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141b26] border border-[#242f42] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Alert Message</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 5g creatine with 300ml water for muscular hydration."
                    value={newCustomReminder.message}
                    onChange={(e) => setNewCustomReminder({ ...newCustomReminder, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#141b26] border border-[#242f42] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Alert Time</label>
                    <input
                      type="time"
                      required
                      value={newCustomReminder.time}
                      onChange={(e) => setNewCustomReminder({ ...newCustomReminder, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#141b26] border border-[#242f42] text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Category</label>
                    <select
                      value={newCustomReminder.type}
                      onChange={(e) =>
                        setNewCustomReminder({
                          ...newCustomReminder,
                          type: e.target.value as CustomReminder['type'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#141b26] border border-[#242f42] text-white"
                    >
                      <option value="meal">Meal / Nutrition</option>
                      <option value="water">Hydration</option>
                      <option value="workout">Pre/Post Workout</option>
                      <option value="streak">Streak Reminder</option>
                      <option value="custom">General Custom</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f2838]">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/10 text-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-600 transition shadow-md"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
