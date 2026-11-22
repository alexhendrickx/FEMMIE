/**
 * "Mute phase content" (F2-08) preference: reducer behaviour and encrypted persistence.
 * Mocks mirror src/services/__tests__/secureStorage.test.ts.
 */
const mockMem = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockMem.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void mockMem.set(k, v)),
    removeItem: jest.fn(async (k: string) => void mockMem.delete(k)),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

import { useLogStore, migrateLogState } from '../logStore';

async function flushPersist(): Promise<void> {
  for (let i = 0; i < 20 && !mockMem.has('femmie-logs'); i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

beforeEach(() => {
  mockMem.clear();
  useLogStore.setState({ phaseContentMuted: false });
});

describe('phaseContentMuted preference', () => {
  it('phaseContentMuted defaults to false', () => {
    expect(useLogStore.getState().phaseContentMuted).toBe(false);
  });

  it('setPhaseContentMuted toggles the flag', () => {
    useLogStore.getState().setPhaseContentMuted(true);
    expect(useLogStore.getState().phaseContentMuted).toBe(true);
    useLogStore.getState().setPhaseContentMuted(false);
    expect(useLogStore.getState().phaseContentMuted).toBe(false);
  });

  it('the preference is persisted only as an encrypted envelope', async () => {
    useLogStore.getState().setPhaseContentMuted(true);
    await flushPersist();
    const onDisk = mockMem.get('femmie-logs')!;
    expect(onDisk).toBeDefined();
    expect(onDisk).not.toContain('phaseContentMuted');
    expect(typeof JSON.parse(onDisk).ciphertext).toBe('string');
  });

  it('does not touch other persisted fields', () => {
    useLogStore.getState().setReminder(true);
    useLogStore.getState().setPhaseContentMuted(true);
    expect(useLogStore.getState().reminderEnabled).toBe(true);
  });
});

describe('clearAll (privacy wipe)', () => {
  it('resets logs and preferences to factory state', () => {
    useLogStore.getState().saveLog({ date: '2026-01-01', cycleDay: 1, entries: [] });
    useLogStore.getState().setReminder(true);
    useLogStore.getState().setPhaseContentMuted(true);
    useLogStore.getState().clearAll();
    const s = useLogStore.getState();
    expect(s.logs).toEqual({});
    expect(s.reminderEnabled).toBe(false);
    expect(s.phaseContentMuted).toBe(false);
    expect(s.cycleLengthPref).toBe(28);
  });
});

describe('upgrade from a pre-ritual build (persist v0 → v1)', () => {
  const legacyState = {
    logs: {
      '2026-10-01': {
        date: '2026-10-01',
        cycleDay: 3,
        savedAt: '2026-10-01T20:00:00.000Z',
        entries: [
          { categoryId: 'menstrual_flow', value: 'medium' },
          { categoryId: 'cervical_mucus', value: 'creamy' },
        ],
      },
    },
    shortcuts: [{ id: 'shortcut_0', label: 'x', entries: [], usageCount: 3 }],
    reminderEnabled: true,
    reminderTime: { hour: 21, minute: 30 },
    cycleLengthPref: 31,
    quickSymptomIds: ['cramps'],
    correlationFeedback: { cramps: 'helpful' },
    phaseContentMuted: true,
  };

  it('keeps logs and prefs, drops removed fields, purges deleted stores', async () => {
    mockMem.set('femmie-logs', JSON.stringify({ state: legacyState, version: 0 }));
    mockMem.set('femmie-mood', '{"ciphertext":"a","nonce":"b"}');
    mockMem.set('femmie-pain', '{"ciphertext":"a","nonce":"b"}');
    mockMem.set('femmie-tags', '{"ciphertext":"a","nonce":"b"}');

    await useLogStore.persist.rehydrate();

    const s = useLogStore.getState() as unknown as Record<string, unknown>;
    expect(Object.keys(s.logs as object)).toEqual(['2026-10-01']);
    expect(s.reminderEnabled).toBe(true);
    expect(s.cycleLengthPref).toBe(31);
    expect(s.phaseContentMuted).toBe(true);
    for (const gone of ['shortcuts', 'reminderTime', 'quickSymptomIds', 'correlationFeedback']) {
      expect(s).not.toHaveProperty(gone);
    }
    expect(mockMem.has('femmie-mood')).toBe(false);
    expect(mockMem.has('femmie-pain')).toBe(false);
    expect(mockMem.has('femmie-tags')).toBe(false);
  });

  it('migrateLogState fills defaults for a missing or empty blob', () => {
    expect(migrateLogState(undefined)).toEqual({
      logs: {},
      reminderEnabled: false,
      cycleLengthPref: 28,
      phaseContentMuted: false,
    });
  });
});
