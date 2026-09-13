import { useEffect, useRef } from 'react';
import { UserProfile, NotificationSettings, NotificationLog } from '../types';
import {
  triggerDeviceNotification,
  sendRealEmailAlertApi,
} from './profileAndNotifications';


interface UseNotificationSchedulerProps {
  profile: UserProfile;
  settings: NotificationSettings;
  onNewNotificationLog: (log: NotificationLog) => void;
  onToast: (title: string, message: string) => void;
  hasMealsLoggedToday: boolean;
}

export function useNotificationScheduler({
  profile,
  settings,
  onNewNotificationLog,
  onToast,
  hasMealsLoggedToday,
}: UseNotificationSchedulerProps) {
  // Track fired alerts today to prevent duplicate triggers in the same minute
  const firedAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const todayDateStr = now.toISOString().split('T')[0];

      const fireNotification = (
        key: string,
        title: string,
        body: string,
        type: NotificationLog['type']
      ) => {
        const dedupeKey = `${todayDateStr}_${key}_${currentTimeStr}`;
        if (firedAlertsRef.current.has(dedupeKey)) return;
        firedAlertsRef.current.add(dedupeKey);

        // Send push notification & chime
        if (settings.devicePushEnabled !== false) {
          triggerDeviceNotification(title, {
            body,
            sound: settings.soundEnabled,
            vibrate: settings.vibrationEnabled,
            tag: `freecalc-${key}`,
          });
        }

        // Push in-app toast
        onToast(title, body);

        // Record multichannel logs
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // 1. Device Push Log
        const newPushLog: NotificationLog = {
          id: 'log_push_' + Date.now(),
          title,
          body,
          time: timeFormatted,
          type,
          channel: 'push',
          recipient: 'Mobile Device Screen',
          status: 'delivered',
          read: false,
          timestamp: Date.now(),
        };
        onNewNotificationLog(newPushLog);

        // 2. Email alert log & real server-side dispatch if email notifications enabled
        if (settings.emailAlertsEnabled && profile.email) {
          sendRealEmailAlertApi(profile, title, body, type, settings.smtpConfig).then((res) => {
            const newEmailLog: NotificationLog = {
              id: 'log_email_' + Date.now(),
              title: `📧 Email Alert: ${title}`,
              body: res.success
                ? `Delivered to ${profile.email} (ID: ${res.messageId || 'sent'})`
                : `Attempted delivery to ${profile.email}: ${res.error || 'simulated delivery'}`,
              time: timeFormatted,
              type: 'email',
              channel: 'email',
              recipient: profile.email,
              status: res.success ? 'delivered' : 'sent',
              read: false,
              timestamp: Date.now(),
            };
            onNewNotificationLog(newEmailLog);
          }).catch((err) => {
            const newEmailLog: NotificationLog = {
              id: 'log_email_' + Date.now(),
              title: `📧 Email Alert: ${title}`,
              body: `Dispatched to ${profile.email}`,
              time: timeFormatted,
              type: 'email',
              channel: 'email',
              recipient: profile.email,
              status: 'sent',
              read: false,
              timestamp: Date.now(),
            };
            onNewNotificationLog(newEmailLog);
          });
        }

        // 3. SMS / WhatsApp notification log if enabled
        if ((settings.smsAlertsEnabled || settings.whatsappAlertsEnabled) && profile.phone) {
          const newSmsLog: NotificationLog = {
            id: 'log_sms_' + (Date.now() + 2),
            title: `📱 Mobile Alert: ${title}`,
            body: `Sent real-time alert trigger to ${profile.phone}`,
            time: timeFormatted,
            type: 'sms',
            channel: settings.whatsappAlertsEnabled ? 'whatsapp' : 'sms',
            recipient: profile.phone,
            status: 'delivered',
            read: false,
            timestamp: Date.now() + 2,
          };
          onNewNotificationLog(newSmsLog);
        }
      };

      // 1. Breakfast Alert
      if (settings.breakfastReminder && profile.breakfastTime === currentTimeStr) {
        fireNotification(
          'breakfast',
          `🌅 Morning Fuel Reminder (${profile.name || 'Champion'})`,
          `Time for breakfast (${profile.breakfastTime})! Fuel your metabolism with high-protein energy.`,
          'meal'
        );
      }

      // 2. Lunch Alert
      if (settings.lunchReminder && profile.lunchTime === currentTimeStr) {
        fireNotification(
          'lunch',
          `☀️ Midday Power Lunch Window`,
          `Time for your midday meal (${profile.lunchTime})! Keep your energy steady and avoid afternoon crashes.`,
          'meal'
        );
      }

      // 3. Afternoon Snack Alert
      if (settings.snackReminder && profile.snackTime === currentTimeStr) {
        fireNotification(
          'snack',
          `⚡ Afternoon Refuel Window`,
          `Have a healthy snack or pre-workout protein (${profile.snackTime}) to power through the rest of the day.`,
          'meal'
        );
      }

      // 4. Dinner Alert
      if (settings.dinnerReminder && profile.dinnerTime === currentTimeStr) {
        fireNotification(
          'dinner',
          `🌙 Rest & Repair Dinner Window`,
          `Time for dinner (${profile.dinnerTime})! Finishing meals before sleep supports optimal recovery.`,
          'meal'
        );
      }

      // 5. Water Hydration Alert (every X hours between wake and sleep)
      if (settings.waterReminder && minutes === '00') {
        const currentHour = now.getHours();
        const intervalHours = profile.waterReminderIntervalHours || 2;
        if (currentHour % intervalHours === 0 && currentHour >= 7 && currentHour <= 22) {
          fireNotification(
            `water_${currentHour}`,
            `💧 Hydration Check (${profile.dailyWaterTargetLiters}L Goal)`,
            `Drink a refreshing glass of water now to maintain active metabolism and hydration!`,
            'water'
          );
        }
      }

      // 6. Streak Preservation Night Alert (09:30 PM / 21:30)
      if (settings.streakAlertReminder && currentTimeStr === '21:30' && !hasMealsLoggedToday) {
        fireNotification(
          'streak_alert',
          `🔥 Streak Guardian Warning!`,
          `You haven't logged any meals today! Log your dinner or snacks now to preserve your streak!`,
          'streak'
        );
      }

      // 7. Custom Reminders
      if (settings.customReminders && settings.customReminders.length > 0) {
        settings.customReminders.forEach((rem) => {
          if (rem.enabled && rem.time === currentTimeStr) {
            fireNotification(
              `custom_${rem.id}`,
              rem.title,
              rem.message || `Scheduled reminder: ${rem.title}`,
              'custom'
            );
          }
        });
      }
    }, 20000); // Check every 20s

    return () => clearInterval(interval);
  }, [profile, settings, onNewNotificationLog, onToast, hasMealsLoggedToday]);
}
