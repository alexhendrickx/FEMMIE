/**
 * Unified health bridge — delegates to HealthKit (iOS) or Health Connect (Android).
 * All methods return null / false instead of throwing on unavailability or permission denial.
 */
import { Platform } from 'react-native';
import {
  requestHealthKitPermissions,
  readFromHealthKit,
  writeToHealthKit,
} from './healthKit';
import {
  requestHealthConnectPermissions,
  readFromHealthConnect,
  writeToHealthConnect,
} from './healthConnect';
import type { HealthReadResult, PermissionStatus } from '../types/health';

export const platformLabel = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

export async function requestPermissions(): Promise<PermissionStatus> {
  if (Platform.OS === 'ios') return requestHealthKitPermissions();
  if (Platform.OS === 'android') return requestHealthConnectPermissions();
  return 'unavailable';
}

export async function readData(
  dataTypeId: string,
  startDate: Date,
  endDate: Date,
): Promise<HealthReadResult | null> {
  if (Platform.OS === 'ios') return readFromHealthKit(dataTypeId, startDate, endDate);
  if (Platform.OS === 'android') return readFromHealthConnect(dataTypeId, startDate, endDate);
  return null;
}

export async function writeData(
  dataTypeId: string,
  value: number | string,
  date: Date,
): Promise<boolean> {
  if (Platform.OS === 'ios') return writeToHealthKit(dataTypeId, value, date);
  if (Platform.OS === 'android') return writeToHealthConnect(dataTypeId, value, date);
  return false;
}

/** Pull the last 7 days of data for a given read type */
export async function syncReadType(dataTypeId: string): Promise<HealthReadResult | null> {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return readData(dataTypeId, start, end);
}
