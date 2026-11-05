/**
 * Encrypted persistence for pain episodes. libsodium is absent under Jest, so the
 * encryption layer runs its dev plaintext-fallback envelope — the on-disk string must
 * still be an envelope with no raw health data in it.
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

import { usePainStore } from '../painStore';
import type { PainEventInput } from '../../lib/painForm';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const valid: PainEventInput = {
  date: '2026-03-04',
  locations: ['lower_abdomen', 'lower_back'],
  intensity: 7,
  durationMin: 120,
  medications: [{ name: 'ibuprofen', effectiveness: 4 }],
};
beforeEach(async () => {
  // setState persists asynchronously — let that write land before clearing the fake disk.
  usePainStore.setState({ events: [] });
  for (let i = 0; i < 10; i++) await flush();
  mockMem.clear();
});

describe('usePainStore', () => {
  it('addEvent assigns an id, stores the event and returns it', () => {
    const saved = usePainStore.getState().addEvent(valid);
    expect(saved).not.toBeNull();
    expect(typeof saved!.id).toBe('string');
    expect(saved!.id.length).toBeGreaterThan(0);
    expect(usePainStore.getState().events).toEqual([saved]);
  });

  it('addEvent rejects an invalid event and writes nothing', () => {
    expect(usePainStore.getState().addEvent({ ...valid, intensity: 11 })).toBeNull();
    expect(usePainStore.getState().events).toEqual([]);
    expect(
      usePainStore.getState().addEvent({ ...valid, locations: ['elbow' as never] }),
    ).toBeNull();
    expect(usePainStore.getState().events).toEqual([]);
  });

  it('two adds get distinct ids', () => {
    usePainStore.getState().addEvent(valid);
    usePainStore.getState().addEvent(valid);
    const { events } = usePainStore.getState();
    expect(events.length).toBe(2);
    expect(events[0].id).not.toBe(events[1].id);
  });

  it('removeEvent drops only the matching id', () => {
    const first = usePainStore.getState().addEvent(valid)!;
    const second = usePainStore.getState().addEvent(valid)!;
    usePainStore.getState().removeEvent(first.id);
    const { events } = usePainStore.getState();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe(second.id);
  });

  it('clearAll empties the store', () => {
    usePainStore.getState().addEvent(valid);
    usePainStore.getState().clearAll();
    expect(usePainStore.getState().events).toEqual([]);
  });

  it('persists under femmie-pain as an encrypted envelope with no plaintext health data', async () => {
    usePainStore.getState().addEvent(valid);
    for (let i = 0; i < 10 && !mockMem.has('femmie-pain'); i++) await flush();

    const onDisk = mockMem.get('femmie-pain')!;
    expect(onDisk).toBeDefined();
    const envelope = JSON.parse(onDisk);
    expect(typeof envelope.ciphertext).toBe('string');
    expect(typeof envelope.nonce).toBe('string');
    expect(onDisk).not.toContain('lower_abdomen');
    expect(onDisk).not.toContain('ibuprofen');
    expect(onDisk).not.toContain('"intensity"');
    expect([...mockMem.keys()]).toEqual(['femmie-pain']);
  });

  it('rehydrates events from the encrypted blob', async () => {
    usePainStore.getState().addEvent(valid);
    for (let i = 0; i < 10 && !mockMem.has('femmie-pain'); i++) await flush();

    // Snapshot the encrypted blob; clearing state re-persists an empty blob asynchronously,
    // so wait for that write to land, then put the real envelope back before rehydrating.
    const blob = mockMem.get('femmie-pain')!;
    usePainStore.setState({ events: [] });
    for (let i = 0; i < 10 && mockMem.get('femmie-pain') === blob; i++) await flush();
    mockMem.set('femmie-pain', blob);
    await usePainStore.persist.rehydrate();
    const { events } = usePainStore.getState();
    expect(events.length).toBe(1);
    expect(events[0].locations).toEqual(valid.locations);
  });
});
