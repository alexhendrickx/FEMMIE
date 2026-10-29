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
    androidType: 'SleepSessionRecord',
  },
  {
    id: 'hrv',
    label: 'Heart rate variability',
    direction: 'read',
    icon: '💓',
    unit: 'ms',
    iosType: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    androidType: 'HeartRateVariabilityRecord',
  },
  {
    id: 'resting_heart_rate',
    label: 'Resting heart rate',
    direction: 'read',
    icon: '❤️',
    unit: 'bpm',
    iosType: 'HKQuantityTypeIdentifierRestingHeartRate',
    androidType: 'RestingHeartRateRecord',
  },
  {
    id: 'weight',
    label: 'Weight',
    direction: 'read',
    icon: '⚖️',
    unit: 'kg',
    iosType: 'HKQuantityTypeIdentifierBodyMass',
    androidType: 'WeightRecord',
  },
  {
    id: 'workouts',
    label: 'Workouts',
    direction: 'read',
    icon: '🏃',
    unit: '',
    iosType: 'HKWorkoutTypeIdentifier',
    androidType: 'ExerciseSessionRecord',
  },

  // ── Write ────────────────────────────────────────────────────────────────────
  {
    id: 'cycle_start',
    label: 'Menstrual cycle',
    direction: 'write',
    icon: '📅',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierMenstrualFlow',
    androidType: 'MenstruationFlowRecord',
  },
  {
    id: 'ovulation',
    label: 'Ovulation',
    direction: 'write',
    icon: '🥚',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierOvulationTestResult',
    androidType: 'OvulationTestRecord',
  },
  {
    id: 'sexual_activity',
    label: 'Sexual activity',
    direction: 'write',
    icon: '🔒',
    unit: '',
    iosType: 'HKCategoryTypeIdentifierSexualActivity',
    androidType: 'SexualActivityRecord',
  },
];

export const DATA_TYPE_MAP = new Map(HEALTH_DATA_TYPES.map((t) => [t.id, t]));
export const READ_TYPES = HEALTH_DATA_TYPES.filter((t) => t.direction === 'read');
export const WRITE_TYPES = HEALTH_DATA_TYPES.filter((t) => t.direction === 'write');
