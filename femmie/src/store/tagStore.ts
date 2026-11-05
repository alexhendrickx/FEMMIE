import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../services/secureStorage';
import { useLogStore } from './logStore';
import {
  checkTagName,
  newTagId,
  applyMerge,
  DEFAULT_TAG_ICON,
  DEFAULT_TAG_COLOR,
} from '../lib/tagsManager';
import type { CustomTag, CustomTagScale } from '../types/customTags';

export type TagResult =
  | { ok: true; tag: CustomTag }
  | { ok: false; error: string; duplicateOf?: CustomTag };

interface TagState {
  tags: CustomTag[];
  createTag: (input: { name: string; scaleType: CustomTagScale; color?: string; icon?: string }) => TagResult;
  /** Name only — id is unchanged, so logged entries stay attached. */
  renameTag: (id: string, name: string) => TagResult;
  /** Re-points `discardId`'s logs onto `keepId`, then drops `discardId`. No-op on bad ids. */
  mergeTag: (keepId: string, discardId: string) => void;
  /** Removes the tag and every log entry logged under it. */
  deleteTag: (id: string) => void;
  /** Wipes the persisted envelope first, then empties memory. */
  clearAll: () => Promise<void>;
}

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],

      createTag(input) {
        const check = checkTagName(get().tags, input.name);
        if (!check.ok) return check;
        const tag: CustomTag = {
          id: newTagId(Date.now(), Math.random()),
          name: check.name,
          color: input.color ?? DEFAULT_TAG_COLOR,
          icon: input.icon ?? DEFAULT_TAG_ICON,
          scaleType: input.scaleType,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tags: [...state.tags, tag] }));
        return { ok: true, tag };
      },

      renameTag(id, name) {
        const check = checkTagName(get().tags, name, id);
        if (!check.ok) return check;
        const existing = get().tags.find((t) => t.id === id);
        if (!existing) return { ok: false, error: 'That tag no longer exists.' };
        const tag: CustomTag = { ...existing, name: check.name };
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? tag : t)),
        }));
        return { ok: true, tag };
      },

      mergeTag(keepId, discardId) {
        const { tags } = get();
        if (keepId === discardId) return;
        if (!tags.some((t) => t.id === keepId) || !tags.some((t) => t.id === discardId)) return;
        useLogStore.getState().remapCategory(discardId, keepId);
        set({ tags: applyMerge(tags, keepId, discardId) });
      },

      deleteTag(id) {
        useLogStore.getState().removeCategory(id);
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
      },

      async clearAll() {
        // Storage first: the follow-up write below is then only an empty envelope.
        await useTagStore.persist.clearStorage();
        set({ tags: [] });
      },
    }),
    {
      name: 'femmie-tags',
      // Tag names are user-authored health vocabulary — encrypted at rest, never plaintext.
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (s) => ({ tags: s.tags }),
    },
  ),
);
