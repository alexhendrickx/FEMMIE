import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../services/secureStorage';
import { isValidPainEvent } from '../lib/pain';
import type { PainEventInput } from '../lib/painForm';
import type { PainEvent } from '../types/pain';

function makePainEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface PainState {
  /** Every logged pain episode, insertion order. Health data — encrypted at rest. */
  events: PainEvent[];

  /**
   * Validate + persist one episode. Returns the stored event (with its new id) or null
   * when the input fails `isValidPainEvent` — nothing is written in that case.
   */
  addEvent: (input: PainEventInput) => PainEvent | null;
  removeEvent: (id: string) => void;
  /** Used by the privacy wipe. */
  clearAll: () => void;
}

export const usePainStore = create<PainState>()(
  persist(
    (set) => ({
      events: [],

      addEvent(input) {
        const event: PainEvent = { ...input, id: makePainEventId() };
        if (!isValidPainEvent(event)) return null;
        set((state) => ({ events: [...state.events, event] }));
        return event;
      },

      removeEvent(id) {
        set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
      },

      clearAll() {
        set({ events: [] });
      },
    }),
    {
      name: 'femmie-pain',
      // Pain location / intensity / medication = health data — encrypted at rest, never plaintext.
      storage: createJSONStorage(() => encryptedStorage),
    },
  ),
);
