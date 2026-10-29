/**
 * iOS HealthKit wrapper.
 * Uses react-native-health (works in Expo with expo-dev-client).
 * Install: npx expo install react-native-health
 * Requires entitlement: com.apple.developer.healthkit in app.json plugins.
 */
import { Platform } from 'react-native';
import type { HealthReadResult, HealthSample, PermissionStatus } from '../types/health';
import { READ_TYPES, WRITE_TYPES } from './dataTypes';

// Lazy-require so the module is never imported on Android
function getAppleHealthKit() {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-health').default as typeof import('react-native-health').default;
  } catch {
    // Module not installed or entitlement missing — degrade gracefully
    return null;
  }
}

const READ_PERMISSIONS = READ_TYPES.map((t) => t.iosType);
const WRITE_PERMISSIONS = WRITE_TYPES.map((t) => t.iosType);

export async function requestHealthKitPermissions(): Promise<PermissionStatus> {
  const HK = getAppleHealthKit();
  if (!HK) return 'unavailable';

  return new Promise((resolve) => {
    HK.initHealthKit(
      { permissions: { read: READ_PERMISSIONS, write: WRITE_PERMISSIONS } } as any,
      (err: any) => {
        if (err) {
          resolve(err.message?.includes('entitlement') ? 'unavailable' : 'denied');
        } else {
          resolve('granted');
        }
      },
    );
  });
}

export async function readFromHealthKit(
  dataTypeId: string,
  startDate: Date,
  endDate: Date,
): Promise<HealthReadResult | null> {
  const HK = getAppleHealthKit();
  if (!HK) return null;

  const options = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 100,
    ascending: false,
  };

  try {
    switch (dataTypeId) {
      case 'sleep':
        return await readSleep(HK, options);
      case 'hrv':
        return await readQuantity(HK, 'getHeartRateVariabilitySamples', dataTypeId, 'ms', options);
      case 'resting_heart_rate':
        return await readQuantity(HK, 'getRestingHeartRateSamples', dataTypeId, 'bpm', options);
      case 'weight':
        return await readQuantity(HK, 'getWeightSamples', dataTypeId, 'kg', options);
      case 'workouts':
        return await readWorkouts(HK, options);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function writeToHealthKit(
  dataTypeId: string,
  value: number | string,
  date: Date,
): Promise<boolean> {
  const HK = getAppleHealthKit();
  if (!HK) return false;

  try {
    switch (dataTypeId) {
      case 'cycle_start':
        return await writeMenstrualFlow(HK, value as number, date);
      case 'ovulation':
        return await writeOvulation(HK, date);
      case 'sexual_activity':
        return await writeSexualActivity(HK, date);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function readQuantity(
  HK: any,
  method: string,
  dataTypeId: string,
  unit: string,
  options: any,
): Promise<HealthReadResult> {
  return new Promise((resolve) => {
    HK[method](options, (err: any, results: any[]) => {
      if (err || !results) { resolve({ dataTypeId, samples: [] }); return; }
      const samples: HealthSample[] = results.map((r) => ({
        dataTypeId,
        value: r.value ?? r.quantity,
        unit,
        startDate: r.startDate,
        endDate: r.endDate,
        source: r.sourceName,
      }));
      resolve({ dataTypeId, samples });
    });
  });
}

function readSleep(HK: any, options: any): Promise<HealthReadResult> {
  return new Promise((resolve) => {
    HK.getSleepSamples(options, (err: any, results: any[]) => {
      if (err || !results) { resolve({ dataTypeId: 'sleep', samples: [] }); return; }
      const samples: HealthSample[] = results.map((r) => ({
        dataTypeId: 'sleep',
        value: (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 3_600_000,
        unit: 'hours',
        startDate: r.startDate,
        endDate: r.endDate,
        source: r.sourceName,
      }));
      resolve({ dataTypeId: 'sleep', samples });
    });
  });
}

function readWorkouts(HK: any, options: any): Promise<HealthReadResult> {
  return new Promise((resolve) => {
    HK.getSamples({ ...options, type: 'Workout' }, (err: any, results: any[]) => {
      if (err || !results) { resolve({ dataTypeId: 'workouts', samples: [] }); return; }
      const samples: HealthSample[] = results.map((r) => ({
        dataTypeId: 'workouts',
        value: r.activityName ?? 'Workout',
        unit: '',
        startDate: r.startDate,
        endDate: r.endDate,
        source: r.sourceName,
      }));
      resolve({ dataTypeId: 'workouts', samples });
    });
  });
}

function writeMenstrualFlow(HK: any, flowLevel: number, date: Date): Promise<boolean> {
  return new Promise((resolve) => {
    HK.saveMenstrualCycleSample(
      { value: flowLevel, startDate: date.toISOString(), endDate: date.toISOString() },
      (err: any) => resolve(!err),
    );
  });
}

function writeOvulation(HK: any, date: Date): Promise<boolean> {
  return new Promise((resolve) => {
    HK.saveOvulationTestSample(
      { value: 2 /* positive */, startDate: date.toISOString(), endDate: date.toISOString() },
      (err: any) => resolve(!err),
    );
  });
}

function writeSexualActivity(HK: any, date: Date): Promise<boolean> {
  return new Promise((resolve) => {
    HK.saveSexualActivitySample(
      { protectionUsed: false, startDate: date.toISOString(), endDate: date.toISOString() },
      (err: any) => resolve(!err),
    );
  });
}
