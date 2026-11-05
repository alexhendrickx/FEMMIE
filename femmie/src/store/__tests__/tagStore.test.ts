/**
 * Tests for the custom-tag store. Persistence runs through the encrypted adapter; in
 * Node the libsodium path falls back to the dev plaintext envelope, so we assert the
 * envelope shape and that no tag name ever appears on disk in the clear.
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

import { useTagStore } from '../tagStore';
import { useLogStore } from '../logStore';
import { encryptedStorage } from '../../services/secureStorage';
import { DEFAULT_TAG_COLOR, DEFAULT_TAG_ICON } from '../../lib/tagsManager';
import type { CustomTag } from '../../types/customTags';
import type { DailyLog } from '../../types/logging';

const tick = () => new Promise((r) => setTimeout(r, 0));

const flush = async () => {
  for (let i = 0; i < 20 && !mockMem.has('femmie-tags'); i++) await tick();
};

const day = (date: string, entries: DailyLog['entries']): DailyLog => ({
  date,
  cycleDay: 1,
  entries,
  savedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(async () => {
  useTagStore.setState({ tags: [] });
  useLogStore.setState({ logs: {}, shortcuts: [], correlationFeedback: {} });
  await tick(); // let any persist write from the reset land before clearing the mock
  mockMem.clear();
});

describe('tagStore', () => {
  it('createTag adds a tag with defaults and returns ok', () => {
    const result = useTagStore.getState().createTag({ name: '  Brain fog ', scaleType: 'binary' });
    expect(result.ok).toBe(true);
    const tags = useTagStore.getState().tags;
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({
      name: 'Brain fog',
      scaleType: 'binary',
      color: DEFAULT_TAG_COLOR,
      icon: DEFAULT_TAG_ICON,
    });
    expect(tags[0].id.startsWith('tag_')).toBe(true);
  });

  it('createTag rejects a duplicate and leaves state unchanged', () => {
    const store = useTagStore.getState();
    store.createTag({ name: 'Brain fog', scaleType: 'binary' });
    const before = useTagStore.getState().tags;
    const result = useTagStore.getState().createTag({ name: 'brain fog', scaleType: '1-5' });
    expect(result.ok).toBe(false);
    expect(useTagStore.getState().tags).toBe(before);
  });

  it('createTag rejects an invalid name', () => {
    const result = useTagStore.getState().createTag({ name: '   ', scaleType: 'binary' });
    expect(result).toEqual({ ok: false, error: 'Give your tag a name.' });
    expect(useTagStore.getState().tags).toHaveLength(0);
  });

  it('renameTag changes name only, keeps id, and rejects a clash with another tag', () => {
    const store = useTagStore.getState();
    const cramps = store.createTag({ name: 'Cramps', scaleType: 'binary' });
    const bloating = store.createTag({ name: 'Bloating', scaleType: 'binary' });
    if (!cramps.ok || !bloating.ok) throw new Error('setup failed');

    const renamed = useTagStore.getState().renameTag(cramps.tag.id, 'Period cramps');
    expect(renamed.ok).toBe(true);
    const updated = useTagStore.getState().tags.find((t) => t.id === cramps.tag.id);
    expect(updated).toMatchObject({ id: cramps.tag.id, name: 'Period cramps' });

    const clash = useTagStore.getState().renameTag(bloating.tag.id, 'period cramps');
    expect(clash.ok).toBe(false);
  });

  it('mergeTag drops the discarded tag and remaps its logged entries into logStore', () => {
    const store = useTagStore.getState();
    const a = store.createTag({ name: 'Cramps', scaleType: 'binary' });
    const b = store.createTag({ name: 'Bloating', scaleType: 'binary' });
    if (!a.ok || !b.ok) throw new Error('setup failed');
    useLogStore.setState({
      logs: { '2026-01-01': day('2026-01-01', [{ categoryId: a.tag.id, value: true }]) },
    });

    useTagStore.getState().mergeTag(b.tag.id, a.tag.id);

    expect(useTagStore.getState().tags.map((t) => t.id)).toEqual([b.tag.id]);
    expect(useLogStore.getState().logs['2026-01-01'].entries).toEqual([
      { categoryId: b.tag.id, value: true },
    ]);
  });

  it('mergeTag is a no-op for the same id or an unknown id', () => {
    const a = useTagStore.getState().createTag({ name: 'Cramps', scaleType: 'binary' });
    if (!a.ok) throw new Error('setup failed');
    const logs = { '2026-01-01': day('2026-01-01', [{ categoryId: a.tag.id, value: true }]) };
    useLogStore.setState({ logs });
    const before = useTagStore.getState().tags;

    useTagStore.getState().mergeTag(a.tag.id, a.tag.id);
    useTagStore.getState().mergeTag(a.tag.id, 'tag_missing');

    expect(useTagStore.getState().tags).toBe(before);
    expect(useLogStore.getState().logs).toBe(logs);
  });

  it('deleteTag removes the tag and its entries from logStore', () => {
    const a = useTagStore.getState().createTag({ name: 'Cramps', scaleType: 'binary' });
    if (!a.ok) throw new Error('setup failed');
    useLogStore.setState({
      logs: {
        '2026-01-01': day('2026-01-01', [
          { categoryId: a.tag.id, value: true },
          { categoryId: 'flow', value: 'light' },
        ]),
      },
    });

    useTagStore.getState().deleteTag(a.tag.id);

    expect(useTagStore.getState().tags).toHaveLength(0);
    expect(useLogStore.getState().logs['2026-01-01'].entries).toEqual([
      { categoryId: 'flow', value: 'light' },
    ]);
  });

  it('persists as an encrypted envelope with no plaintext tag name', async () => {
    useTagStore.getState().createTag({ name: 'Zzyzxqq', scaleType: 'binary' });
    await flush();
    const raw = mockMem.get('femmie-tags')!;
    expect(raw).not.toContain('Zzyzxqq');
    expect(typeof JSON.parse(raw).ciphertext).toBe('string');
  });

  it('rehydrates tags from the encrypted envelope', async () => {
    const tag: CustomTag = {
      id: 'tag_seed',
      name: 'Seeded tag',
      color: DEFAULT_TAG_COLOR,
      icon: DEFAULT_TAG_ICON,
      scaleType: 'binary',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    await encryptedStorage.setItem(
      'femmie-tags',
      JSON.stringify({ state: { tags: [tag] }, version: 0 }),
    );
    await useTagStore.persist.rehydrate();
    expect(useTagStore.getState().tags).toEqual([tag]);
  });

  it('clearAll empties tags and leaves no tag name on disk', async () => {
    useTagStore.getState().createTag({ name: 'Zzyzxqq', scaleType: 'binary' });
    await flush();
    await useTagStore.getState().clearAll();
    await tick();
    expect(useTagStore.getState().tags).toEqual([]);
    expect(mockMem.get('femmie-tags') ?? '').not.toContain('Zzyzxqq');
  });
});
