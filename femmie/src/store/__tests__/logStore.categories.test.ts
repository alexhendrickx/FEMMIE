/**
 * Tests for the category-level write-backs used by custom-tag merge/delete (F2-13).
 * Same encrypted-storage mocks as tagStore.test.ts.
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
import type { DailyLog } from '../../types/logging';

const tick = () => new Promise((r) => setTimeout(r, 0));

const day = (date: string, entries: DailyLog['entries']): DailyLog => ({
  date,
  cycleDay: 1,
  entries,
  savedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(async () => {
  useLogStore.setState({ logs: {}, shortcuts: [], correlationFeedback: {} });
  await tick(); // let any persist write from the reset land before clearing the mock
  mockMem.clear();
});

describe('logStore category write-backs', () => {
  it('remapCategory re-points entries, drops feedback for the source id, recomputes shortcuts', () => {
    useLogStore.setState({
      logs: {
        '2026-01-01': day('2026-01-01', [
          { categoryId: 'a', value: 1 },
          { categoryId: 'y', value: 2 },
        ]),
        '2026-01-02': day('2026-01-02', [
          { categoryId: 'b', value: 1 },
          { categoryId: 'y', value: 2 },
        ]),
      },
      shortcuts: [],
      correlationFeedback: { a: { helpful: false }, z: { helpful: true } },
    });

    useLogStore.getState().remapCategory('a', 'b');

    const state = useLogStore.getState();
    expect(state.logs['2026-01-01'].entries).toEqual([
      { categoryId: 'b', value: 1 },
      { categoryId: 'y', value: 2 },
    ]);
    expect(state.correlationFeedback).toEqual({ z: { helpful: true } });
    expect(state.shortcuts).toHaveLength(1);
    expect(state.shortcuts[0].usageCount).toBe(2);
  });

  it('removeCategory strips entries and feedback', () => {
    useLogStore.setState({
      logs: {
        '2026-01-01': day('2026-01-01', [
          { categoryId: 'a', value: 1 },
          { categoryId: 'y', value: 2 },
        ]),
      },
      shortcuts: [],
      correlationFeedback: { a: { helpful: false }, z: { helpful: true } },
    });

    useLogStore.getState().removeCategory('a');

    const state = useLogStore.getState();
    expect(state.logs['2026-01-01'].entries).toEqual([{ categoryId: 'y', value: 2 }]);
    expect(state.correlationFeedback).toEqual({ z: { helpful: true } });
  });
});
