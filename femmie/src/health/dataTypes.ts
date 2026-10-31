import type { HealthDataType } from '../types/health';

export const HEALTH_DATA_TYPES: HealthDataType[] = [
  // ── Read ────────────────────────────────────────────────────────────────────
  {
    id: 'sleep',
    label: 'Sleep',
    direction: 'read',
    icon: '🌙',
    unit: 'hours',
    iosType: 'HKCategoryTypeIdentifierSleepAnalysis',
    androidType: 'SleepSession',
  },
  {
    id: 'hrv',
    label: 'Heart rate variability',
    direction: 'read',
    icon: '💓',
    unit: 'ms',
    iosType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    androidType: 'HeartRateVariabilityRmssd',
  },
  {
    id: 'resting_heart_rate',
    label: 'Resting heart rate',
    direction: 'read',
    icon: '❤️',
    unit: 'bpm',
    iosType: 'HKQuantityTypeIdentifierRestingHeartRate',
    androidType: 'RestingHeartRate',
  },
  {
    id: 'weight',
    label: 'Weight',
    direction: 'read',
    icon: '⚖️',
    unit: 'kg',
    iosType: 'HKQuantityTypeIdentifierBodyMass',
    androidType: 'Weight',
  },
  {
    id: 'workouts',
    label: 'Workouts',
    direction: 'read',
    icon: '🏃',
    unit: '',
    iosType: 'HKWorkoutTypeIdentifier',
    androidType: 'ExerciseSession',
  },

  // ── Write ────────────────────────────────────────────────────────────────────
  {
    id: 'cycle_start',
    label: 'Menstrual cycle',
    direction: 'write',
    icon: '📅',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierMenstrualFlow',
    androidType: 'MenstruationFlow',
  },
  {
    id: 'ovulation',
    label: 'Ovulation',
    direction: 'write',
    icon: '🥚',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierOvulationTestResult',
    androidType: 'OvulationTest',
  },
  {
    id: 'sexual_activity',
    label: 'Sexual activity',
    direction: 'write',
    icon: '🔒',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierSexualActivity',
    androidType: 'SexualActivity',
  },
];

export const DATA_TYPE_MAP = new Map(HEALTH_DATA_TYPES.map((t) => [t.id, t]));
export const READ_TYPES = HEALTH_DATA_TYPES.filter((t) => t.direction === 'read');
export const WRITE_TYPES = HEALTH_DATA_TYPES.filter((t) => t.direction === 'write');
