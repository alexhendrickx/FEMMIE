/**
 * Android Health Connect wrapper.
 * Uses react-native-health-connect (official Google library bridge).
 * Install: npx expo install react-native-health-connect
 * Requires: Health Connect app installed on device (Android 9+, pre-installed on Android 14+).
 */
import { Platform } from 'react-native';
import type { HealthReadResult, HealthSample, PermissionStatus } from '../types/health';
import { READ_TYPES, WRITE_TYPES } from './dataTypes';

function getHealthConnect() {
  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-health-connect') as typeof import('react-native-health-connect');
  } catch {
    return null;
  }
}

const READ_PERMISSIONS = READ_TYPES.map((t) => ({
  accessType: 'read' as const,
  recordType: t.androidType,
}));
const WRITE_PERMISSIONS = WRITE_TYPES.map((t) => ({
  accessType: 'write' as const,
  recordType: t.androidType,
}));

export async function requestHealthConnectPermissions(): Promise<PermissionStatus> {
  const HC = getHealthConnect();
  if (!HC) return 'unavailable';

  try {
    const available = await HC.initialize();
    if (!available) return 'unavailable';

    const granted = await HC.requestPermission([...READ_PERMISSIONS, ...WRITE_PERMISSIONS]);
    const allGranted = [...READ_PERMISSIONS, ...WRITE_PERMISSIONS].every((p) =>
      granted.some((g: any) => g.recordType === p.recordType && g.accessType === p.accessType),
    );
    return allGranted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function readFromHealthConnect(
  dataTypeId: string,
  startDate: Date,
  endDate: Date,
): Promise<HealthReadResult | null> {
  const HC = getHealthConnect();
  if (!HC) return null;

  const timeRangeFilter = {
    operator: 'between' as const,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };

  try {
    switch (dataTypeId) {
      case 'sleep': {
        const { records } = await HC.readRecords('SleepSessionRecord', { timeRangeFilter });
        const samples: HealthSample[] = records.map((r: any) => ({
          dataTypeId: 'sleep',
          value: (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3_600_000,
          unit: 'hours',
          startDate: r.startTime,
          endDate: r.endTime,
        }));
        return { dataTypeId: 'sleep', samples };
      }
      case 'hrv': {
        const { records } = await HC.readRecords('HeartRateVariabilityRmssdRecord', { timeRangeFilter });
        const samples: HealthSample[] = records.map((r: any) => ({
          dataTypeId: 'hrv',
          value: r.heartRateVariabilityMillis,
          unit: 'ms',
          startDate: r.time,
          endDate: r.time,
        }));
        return { dataTypeId: 'hrv', samples };
      }
      case 'resting_heart_rate': {
        const { records } = await HC.readRecords('RestingHeartRateRecord', { timeRangeFilter });
        const samples: HealthSample[] = records.map((r: any) => ({
          dataTypeId: 'resting_heart_rate',
          value: r.beatsPerMinute,
          unit: 'bpm',
          startDate: r.time,
          endDate: r.time,
        }));
        return { dataTypeId: 'resting_heart_rate', samples };
      }
      case 'weight': {
        const { records } = await HC.readRecords('WeightRecord', { timeRangeFilter });
        const samples: HealthSample[] = records.map((r: any) => ({
          dataTypeId: 'weight',
          value: r.weight.inKilograms,
          unit: 'kg',
          startDate: r.time,
          endDate: r.time,
        }));
        return { dataTypeId: 'weight', samples };
      }
      case 'workouts': {
        const { records } = await HC.readRecords('ExerciseSessionRecord', { timeRangeFilter });
        const samples: HealthSample[] = records.map((r: any) => ({
          dataTypeId: 'workouts',
          value: r.exerciseType ?? 'Workout',
          unit: '',
          startDate: r.startTime,
          endDate: r.endTime,
        }));
        return { dataTypeId: 'workouts', samples };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function writeToHealthConnect(
  dataTypeId: string,
  value: number | string,
  date: Date,
): Promise<boolean> {
  const HC = getHealthConnect();
  if (!HC) return false;

  try {
    switch (dataTypeId) {
      case 'cycle_start':
        await HC.insertRecords([{
          recordType: 'MenstruationFlowRecord',
          flow: value as number,
          time: date.toISOString(),
        }]);
        return true;
      case 'ovulation':
        await HC.insertRecords([{
          recordType: 'OvulationTestRecord',
          result: 'positive',
          time: date.toISOString(),
        }]);
        return true;
      case 'sexual_activity':
        await HC.insertRecords([{
          recordType: 'SexualActivityRecord',
          protectionUsed: 'unknown',
          time: date.toISOString(),
        }]);
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}
