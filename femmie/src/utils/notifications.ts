import * as Notifications from 'expo-notifications';

const BEDTIME_REMINDER_ID = 'femmie-bedtime-reminder';
const REMINDER_HOUR = 21;
const REMINDER_MINUTE = 30;

export async function scheduleBedtimeReminder(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Cancel any existing bedtime reminder before scheduling a new one
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: BEDTIME_REMINDER_ID,
    content: {
      title: 'How was your day?',
      body: 'Take a moment to log how you felt today.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
    },
  });
}

export async function cancelBedtimeReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID).catch(() => {});
}
