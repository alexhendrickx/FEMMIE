import * as Notifications from 'expo-notifications';

const BEDTIME_REMINDER_ID = 'femmie-bedtime-reminder';

export async function scheduleBedtimeReminder(
  hour: number,
  minute: number,
): Promise<void> {
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
      hour,
      minute,
    },
  });
}

export async function cancelBedtimeReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_REMINDER_ID).catch(() => {});
}
