/**
 * Encrypted persistence for DRSP mood records. libsodium is absent under Jest, so the
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

import { useMoodStore } from '../moodStore';
import { DRSP_ITEM_COUNT, type DrspEntry } from '../../types/mood';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const valid: DrspEntry = { date: '2026-03-04', scores: Array(DRSP_ITEM_COUNT).fill(4) };
const initial = { drspEnabled: false, entries: {}, safeguardDismissed: false };

beforeEach(async () => {
  // setState persists asynchronously — let that write land before clearing the fake disk.
  useMoodStore.setState(initial);
  for (let i = 0; i < 10; i++) await flush();
  mockMem.clear();
});

describe('useMoodStore', () => {
  it('saveEntry stores a valid record keyed by date and returns true', () => {
    expect(useMoodStore.getState().saveEntry(valid)).toBe(true);
    const stored = useMoodStore.getState().entries['2026-03-04'];
    expect(stored).toEqual(valid);
    expect(stored.scores).not.toBe(valid.scores);
  });

  it('saveEntry upserts — a second save for the same date replaces the first', () => {
    useMoodStore.getState().saveEntry(valid);
    useMoodStore.getState().saveEntry({ ...valid, scores: Array(DRSP_ITEM_COUNT).fill(2) });
    const { entries } = useMoodStore.getState();
    expect(Object.keys(entries)).toHaveLength(1);
    expect(entries['2026-03-04'].scores.every((s) => s === 2)).toBe(true);
  });

  it('saveEntry rejects invalid scores or a non-ISO date and writes nothing', () => {
    expect(useMoodStore.getState().saveEntry({ ...valid, scores: Array(9).fill(4) })).toBe(false);
    expect(useMoodStore.getState().entries).toEqual({});
    expect(useMoodStore.getState().saveEntry({ ...valid, scores: Array(DRSP_ITEM_COUNT).fill(7) })).toBe(false);
    expect(useMoodStore.getState().entries).toEqual({});
    expect(useMoodStore.getState().saveEntry({ ...valid, date: '04/03/2026' })).toBe(false);
    expect(useMoodStore.getState().entries).toEqual({});
  });

  it('removeEntry drops only the matching date', () => {
    const other: DrspEntry = { date: '2026-03-05', scores: valid.scores };
    useMoodStore.getState().saveEntry(valid);
    useMoodStore.getState().saveEntry(other);
    useMoodStore.getState().removeEntry('2026-03-04');
    const { entries } = useMoodStore.getState();
    expect(Object.keys(entries)).toEqual(['2026-03-05']);
  });

  it('setDrspEnabled toggles the opt-in flag', () => {
    useMoodStore.getState().setDrspEnabled(true);
    expect(useMoodStore.getState().drspEnabled).toBe(true);
    useMoodStore.getState().setDrspEnabled(false);
    expect(useMoodStore.getState().drspEnabled).toBe(false);
  });

  it('dismissSafeguard sets the permanent flag and clearAll resets everything', () => {
    useMoodStore.getState().dismissSafeguard();
    expect(useMoodStore.getState().safeguardDismissed).toBe(true);

    useMoodStore.getState().setDrspEnabled(true);
    useMoodStore.getState().saveEntry(valid);
    useMoodStore.getState().clearAll();
    expect(useMoodStore.getState()).toMatchObject(initial);
  });

  it('persists under femmie-mood as an encrypted envelope with no plaintext health data', async () => {
    useMoodStore.getState().saveEntry(valid);
    useMoodStore.getState().setDrspEnabled(true);
    for (let i = 0; i < 10 && !mockMem.has('femmie-mood'); i++) await flush();

    const onDisk = mockMem.get('femmie-mood') ?? '';
    const envelope = JSON.parse(onDisk);
    expect(typeof envelope.ciphertext).toBe('string');
    expect(typeof envelope.nonce).toBe('string');
    expect(onDisk).not.toContain('"scores"');
    expect(onDisk).not.toContain('2026-03-04');
    expect(onDisk).not.toContain('safeguardDismissed');
    expect(onDisk).not.toContain('drspEnabled');
    expect([...mockMem.keys()]).toEqual(['femmie-mood']);
  });

  it('rehydrates entries and the dismiss flag from the encrypted blob', async () => {
    useMoodStore.getState().saveEntry(valid);
    useMoodStore.getState().dismissSafeguard();
    for (let i = 0; i < 10 && !mockMem.has('femmie-mood'); i++) await flush();
    const blob = mockMem.get('femmie-mood') as string;

    useMoodStore.setState(initial);
    for (let i = 0; i < 10 && mockMem.get('femmie-mood') === blob; i++) await flush();
    mockMem.set('femmie-mood', blob);

    await useMoodStore.persist.rehydrate();
    const state = useMoodStore.getState();
    expect(state.entries['2026-03-04'].scores).toEqual(valid.scores);
    expect(state.safeguardDismissed).toBe(true);
  });
});
