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

import { useLogStore } from '../logStore';

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
