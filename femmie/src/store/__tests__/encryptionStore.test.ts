jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(), removeItem: jest.fn() },
}));

import { migrateEncryptionState } from '../encryptionStore';

it('v0 → v1 drops the never-wired sync fields and keeps key material', () => {
  const v0 = { keyMaterial: null, cloudSyncEnabled: true, lastSyncAt: '2026-11-01T00:00:00Z' };
  expect(migrateEncryptionState(v0)).toEqual({ keyMaterial: null });
});

it('tolerates an empty persisted blob', () => {
  expect(migrateEncryptionState(undefined)).toEqual({ keyMaterial: null });
});
