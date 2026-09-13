import {
  UserProfile,
  NotificationSettings,
  NotificationLog,
  CustomReminder,
  CalculatorInputs,
} from '../types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Pradeep Joshi',
  email: 'pj344504@gmail.com',
  phone: '+91 98765 43210',
  age: 28,
  gender: 'male',
  heightCm: 175,
  weightKg: 72,
  targetWeightKg: 68,
  activityLevel: 'moderate',
  goal: 'lose',
  dietaryPreference: 'high-protein',
  dailyWaterTargetLiters: 3.5,
  dailyStepGoal: 10000,
  avatar: '🔥',
  breakfastTime: '08:00',
  lunchTime: '13:00',
  snackTime: '17:00',
  dinnerTime: '20:00',
  wakeTime: '06:30',
  sleepTime: '23:00',
  waterReminderIntervalHours: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  emailAlertsEnabled: true,
  smsAlertsEnabled: true,
  whatsappAlertsEnabled: true,
  devicePushEnabled: true,
  breakfastReminder: true,
  lunchReminder: true,
  snackReminder: true,
  dinnerReminder: true,
  waterReminder: true,
  streakAlertReminder: true,
  nightReviewReminder: true,
  dailyEmailSummary: true,
  customReminders: [
    {
      id: 'rem_pre_workout',
      title: '⚡ Pre-Workout Fuel & Hydration',
      message: 'Take your amino/pre-workout meal and 500ml water 45 mins before training!',
      time: '16:30',
      enabled: true,
      type: 'workout',
    },
    {
      id: 'rem_post_dinner_walk',
      title: '🚶‍♂️ 10-Minute Digestion Stroll',
      message: 'A short 10-minute walk lowers post-meal glucose spike by up to 22%.',
      time: '20:45',
      enabled: true,
      type: 'custom',
    },
  ],
  permissionGranted: false,
};

const PROFILE_STORAGE_KEY = 'freecalc_user_profile';
const NOTIF_SETTINGS_KEY = 'freecalc_notification_settings';
const NOTIF_LOGS_KEY = 'freecalc_notification_logs';

/**
 * Load user profile from localStorage or default
 */
export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_PROFILE, ...parsed };
    }
  } catch (e) {
    console.warn('Error loading user profile:', e);
  }
  return DEFAULT_USER_PROFILE;
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = { ...profile, updatedAt: Date.now() };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving user profile:', e);
  }
}

/**
 * Sync profile metrics into calculator inputs
 */
export function syncProfileToCalculatorInputs(
  profile: UserProfile,
  existingInputs: CalculatorInputs
): CalculatorInputs {
  return {
    ...existingInputs,
    age: profile.age || existingInputs.age,
    gender: profile.gender || existingInputs.gender,
    heightCm: profile.heightCm || existingInputs.heightCm,
    weightKg: profile.weightKg || existingInputs.weightKg,
    activityLevel: profile.activityLevel || existingInputs.activityLevel,
    goal: profile.goal || existingInputs.goal,
    targetWeightKg: profile.targetWeightKg || existingInputs.targetWeightKg,
  };
}

/**
 * Sync calculator inputs into profile metrics
 */
export function syncCalculatorInputsToProfile(
  inputs: CalculatorInputs,
  existingProfile: UserProfile
): UserProfile {
  return {
    ...existingProfile,
    age: typeof inputs.age === 'number' ? inputs.age : existingProfile.age,
    gender: inputs.gender || existingProfile.gender,
    heightCm: typeof inputs.heightCm === 'number' ? inputs.heightCm : existingProfile.heightCm,
    weightKg: typeof inputs.weightKg === 'number' ? inputs.weightKg : existingProfile.weightKg,
    activityLevel: inputs.activityLevel || existingProfile.activityLevel,
    goal: inputs.goal || existingProfile.goal,
    targetWeightKg:
      typeof inputs.targetWeightKg === 'number' ? inputs.targetWeightKg : existingProfile.targetWeightKg,
    updatedAt: Date.now(),
  };
}

/**
 * Load notification settings
 */
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY);
    const hasPermission =
      typeof Notification !== 'undefined' && Notification.permission === 'granted';
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
        permissionGranted: hasPermission || parsed.permissionGranted,
      };
    }
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      permissionGranted: hasPermission,
    };
  } catch (e) {
    console.warn('Error loading notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

/**
 * Save notification settings
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error saving notification settings:', e);
  }
}

/**
 * Load notification logs
 */
export function loadNotificationLogs(): NotificationLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIF_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error loading notification logs:', e);
  }
  return [
    {
      id: 'log_welcome',
      title: '🎯 Multichannel Dispatch Engine Online',
      body: 'Time-to-time alerts configured for Push, Email (pj344504@gmail.com) and Mobile SMS/WhatsApp.',
      time: 'Just now',
      type: 'system',
      channel: 'multichannel',
      recipient: 'All Channels',
      status: 'delivered',
      read: false,
      timestamp: Date.now(),
    },
  ];
}

/**
 * Save notification logs
 */
export function saveNotificationLogs(logs: NotificationLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep max 50 recent logs
    const trimmed = logs.slice(0, 50);
    localStorage.setItem(NOTIF_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Error saving notification logs:', e);
  }
}

/**
 * Request Web Notification permission from user
 */
export async function requestBrowserNotificationPermission(): Promise<{
  granted: boolean;
  status: NotificationPermission | 'unsupported';
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, status: 'unsupported' };
  }

  try {
    if (Notification.permission === 'granted') {
      return { granted: true, status: 'granted' };
    }

    const permission = await Notification.requestPermission();
    return {
      granted: permission === 'granted',
      status: permission,
    };
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return { granted: false, status: 'denied' };
  }
}

/**
 * Play a soothing gentle chime synth tone for mobile / browser notification
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime: 2 gentle sine tones
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now); // D6
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.15); // E6

    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (e) {
    // AudioContext autoplay restrictions might silently ignore, which is fine
  }
}

/**
 * Trigger real browser / device push notification
 */
export function triggerDeviceNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    sound?: boolean;
    vibrate?: boolean;
  }
): boolean {
  if (typeof window === 'undefined') return false;

  // Sound playback if requested
  if (options.sound !== false) {
    playNotificationSound();
  }

  // Device vibration if supported (Mobile phones)
  if (options.vibrate !== false && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 180]);
    } catch (e) {
      // Ignore vibration errors
    }
  }

  // Web Notification API (System Mobile Notification / Desktop tray)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'freecalc-alert',
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn('Native notification spawn failed, fallback active:', e);
    }
  }

  return false;
}

/**
 * Format phone number to international clean format for WhatsApp / SMS URL
 */
export function formatPhoneNumberForGateway(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '919876543210';
  if (digits.length === 10) return `91${digits}`; // Default India prefix if 10 digits
  return digits;
}

/**
 * Generate rich email message body for user
 */
export function generateEmailReport(profile: UserProfile, title: string, customMessage?: string) {
  const subject = `🔥 [FreeCalorieCalc Alert] ${title} - ${profile.name || 'User'}`;
  const body = `Hi ${profile.name || 'Champion'},

Here is your scheduled FreeCalorieCalc alert:

${customMessage || title}

---------------------------------------------------
📊 YOUR PROFILE & TARGETS:
• Primary Goal: ${profile.goal.toUpperCase()} (${profile.targetWeightKg} kg target)
• Current Weight: ${profile.weightKg} kg (Height: ${profile.heightCm} cm)
• Dietary Plan: ${profile.dietaryPreference.toUpperCase()}
• Daily Water Target: ${profile.dailyWaterTargetLiters} Liters
• Daily Step Goal: ${profile.dailyStepGoal.toLocaleString()} steps

⏰ YOUR SCHEDULED MEAL WINDOWS:
• Breakfast (Morning Fuel): ${profile.breakfastTime}
• Lunch (Midday Power): ${profile.lunchTime}
• Snack (Afternoon Refuel): ${profile.snackTime}
• Dinner (Rest & Repair): ${profile.dinnerTime}

Stay consistent and keep your streak strong today!
- FreeCalorieCalc Smart Notification Engine
`;

  return { subject, body };
}

/**
 * Open native Email client or mailto dispatcher
 */
export function openNativeEmailClient(toEmail: string, subject: string, body: string) {
  if (typeof window === 'undefined') return;
  const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

/**
 * Open Gmail directly in browser with prefilled recipient, subject and body
 */
export function openGmailWebDirect(toEmail: string, subject: string, body: string) {
  if (typeof window === 'undefined') return;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    toEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Open Outlook Web directly in browser with prefilled fields
 */
export function openOutlookWebDirect(toEmail: string, subject: string, body: string) {
  if (typeof window === 'undefined') return;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
    toEmail
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(outlookUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Send real backend email alert using the server API endpoint (/api/send-email-alert)
 */
export async function sendRealEmailAlertApi(
  profile: UserProfile,
  subject: string,
  messageText: string,
  alertType: string = 'meal_alert',
  smtpConfig?: any
): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string | null;
  transportType?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/send-email-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.email || 'pj344504@gmail.com',
        userName: profile.name || 'Champion',
        subject: subject || `🔥 [FreeCalorieCalc] Daily Alert for ${profile.name || 'Champion'}`,
        text: messageText,
        alertType,
        smtpConfig,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f1f5f9; padding: 28px; border-radius: 16px; max-width: 580px; margin: 0 auto; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 32px;">🔥</span>
              <h1 style="color: #f59e0b; margin: 8px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">FreeCalorieCalc</h1>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Accurate Circadian Meal & Nutrition Alert</p>
            </div>
            
            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin-bottom: 18px;">
              <h2 style="color: #38bdf8; font-size: 17px; margin: 0 0 10px 0;">Hello ${profile.name || 'Friend'}!</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0;">
                ${messageText}
              </p>
            </div>

            <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #1e293b;">
              <h3 style="color: #fbbf24; font-size: 13px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">🎯 Your Active Targets</h3>
              <table style="width: 100%; font-size: 13px; color: #cbd5e1; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Primary Goal:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #38bdf8; text-align: right;">${profile.goal.toUpperCase()} (${profile.targetWeightKg}kg)</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Daily Water Target:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #60a5fa; text-align: right;">${profile.dailyWaterTargetLiters} Liters</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Daily Step Goal:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #c084fc; text-align: right;">${profile.dailyStepGoal.toLocaleString()} steps</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Breakfast / Lunch:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #34d399; text-align: right;">${profile.breakfastTime} / ${profile.lunchTime}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94a3b8;">Snack / Dinner:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #fbbf24; text-align: right;">${profile.snackTime} / ${profile.dinnerTime}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
              This notification was delivered to <strong style="color: #cbd5e1;">${profile.email}</strong> by FreeCalorieCalc Notification Engine.<br/>
              Log your meals daily to keep your streak alive!
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('sendRealEmailAlertApi error:', err);
    return {
      success: false,
      error: err?.message || 'Network error reaching backend email dispatcher',
    };
  }
}


/**
 * Open WhatsApp alert gateway directly to user's phone number
 */
export function openWhatsAppGateway(phone: string, text: string) {
  if (typeof window === 'undefined') return;
  const cleanNumber = formatPhoneNumberForGateway(phone);
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Open native SMS app directly to user's phone number
 */
export function openSmsGateway(phone: string, text: string) {
  if (typeof window === 'undefined') return;
  const cleanNumber = phone.replace(/[^0-9+]/g, '');
  const smsUrl = `sms:${cleanNumber}?body=${encodeURIComponent(text)}`;
  window.location.href = smsUrl;
}
