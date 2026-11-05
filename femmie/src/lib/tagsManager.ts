import type { DailyLog } from '../types/logging';
import type { CustomTag, CustomTagScale, TagSuggestion } from '../types/customTags';
import { colors } from '../theme/colors';
import {
  DEFAULT_SUGGESTION_THRESHOLD,
  MAX_TAG_NAME_LENGTH,
  findDuplicate,
  isValidTagName,
  mergeTags,
  normalizeTagName,
  remapTagInLogs,
  suggestTagsFromNotes,
} from './customTags';

/**
 * View-model + pure helpers for the Tag manager (F2-13). Framework-free: no
 * react-native / expo / storage imports. Persistence lives in `store/tagStore.ts`.
 */

export const TAG_ID_PREFIX = 'tag_'; // never collides with CATEGORY_MAP ids
export const DEFAULT_TAG_ICON = '🏷️';
export const TAG_ICONS = ['🏷️', '🤕', '🌀', '💧', '🍫', '😴'] as const;
export const TAG_COLOR_IDS = ['periodConfirmed', 'fertile', 'fertileAccent', 'textSecondary'] as const;
export type TagColorId = (typeof TAG_COLOR_IDS)[number];
export const DEFAULT_TAG_COLOR: TagColorId = 'textSecondary';
export const SCALE_OPTIONS: { id: CustomTagScale; label: string; hint: string }[] = [
  { id: 'binary', label: 'Yes / no', hint: 'Did it happen today?' },
  { id: '1-5', label: '1–5 scale', hint: 'How strong was it?' },
  { id: 'free_text', label: 'Short note', hint: 'Describe it in your own words' },
];

/** Trim + collapse whitespace; keeps the user's casing. */
export function cleanTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export type TagNameCheck =
  | { ok: true; name: string }
  | { ok: false; error: string; duplicateOf?: CustomTag };

/** Validate a candidate name against existing tags (`ignoreId` = the tag being renamed). */
export function checkTagName(tags: CustomTag[], raw: string, ignoreId?: string): TagNameCheck {
  const cleaned = cleanTagName(raw);
  if (!isValidTagName(cleaned)) {
    return {
      ok: false,
      error: cleaned.length === 0
        ? 'Give your tag a name.'
        : `Keep it under ${MAX_TAG_NAME_LENGTH} characters.`,
    };
  }

  const dup = findDuplicate(tags.filter((t) => t.id !== ignoreId), cleaned);
  if (dup) {
    const exact = normalizeTagName(dup.name) === normalizeTagName(cleaned);
    return {
      ok: false,
      error: exact
        ? `You already have a tag called “${dup.name}”.`
        : `This looks a lot like “${dup.name}”. Use that one, or merge them.`,
      duplicateOf: dup,
    };
  }
  return { ok: true, name: cleaned };
}

export function newTagId(now: number, rand: number): string {
  return `${TAG_ID_PREFIX}${now.toString(36)}${Math.floor(rand * 1e6).toString(36)}`;
}

/** Palette id → theme token. Unknown ids fall back to the secondary text colour. */
export function resolveTagColor(colorId: string): string {
  return colors[colorId as keyof typeof colors] ?? colors.textSecondary;
}

/**
 * Re-point `fromId` → `toId` in every log. When a day already has both, the kept
 * tag's own entry wins and the `fromId` entry is dropped (no duplicate categoryId
 * on one day). Pure.
 */
export function remapTagInLogsDeduped(logs: DailyLog[], fromId: string, toId: string): DailyLog[] {
  if (fromId === toId) return logs;
  return logs.map((log) => {
    const hasFrom = log.entries.some((e) => e.categoryId === fromId);
    const hasTo = log.entries.some((e) => e.categoryId === toId);
    if (hasFrom && hasTo) {
      return { ...log, entries: log.entries.filter((e) => e.categoryId !== fromId) };
    }
    return remapTagInLogs([log], fromId, toId)[0];
  });
}

/** Strip every entry for `tagId`. Logs without it keep their identity. */
export function removeTagFromLogs(logs: DailyLog[], tagId: string): DailyLog[] {
  return logs.map((log) => {
    if (!log.entries.some((e) => e.categoryId === tagId)) return log;
    return { ...log, entries: log.entries.filter((e) => e.categoryId !== tagId) };
  });
}

/** Written notes: string values logged against free-text custom tags. */
export function collectNotes(logs: DailyLog[], tags: CustomTag[]): string[] {
  const freeTextIds = new Set(
    tags.filter((t) => t.scaleType === 'free_text').map((t) => t.id),
  );
  const notes: string[] = [];
  for (const log of logs) {
    for (const e of log.entries) {
      if (freeTextIds.has(e.categoryId) && typeof e.value === 'string') notes.push(e.value);
    }
  }
  return notes;
}

export function suggestionsFor(
  logs: DailyLog[],
  tags: CustomTag[],
  threshold?: number,
  limit = 5,
): TagSuggestion[] {
  return suggestTagsFromNotes(
    collectNotes(logs, tags),
    tags,
    threshold ?? DEFAULT_SUGGESTION_THRESHOLD,
  ).slice(0, limit);
}

export function suggestionToName(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export interface TagRow {
  id: string;
  name: string;
  icon: string;
  /** Resolved theme colour (hex from tokens only). */
  color: string;
  scaleLabel: string;
  /** Number of days with at least one entry for this tag. */
  usageCount: number;
}

export function buildTagRows(tags: CustomTag[], logs: DailyLog[]): TagRow[] {
  return [...tags]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      icon: tag.icon,
      color: resolveTagColor(tag.color),
      scaleLabel: SCALE_OPTIONS.find((o) => o.id === tag.scaleType)?.label ?? tag.scaleType,
      usageCount: logs.filter((l) => l.entries.some((e) => e.categoryId === tag.id)).length,
    }));
}

/** Every tag except `tagId` — the valid merge destinations. */
export function mergeTargets(tags: CustomTag[], tagId: string): CustomTag[] {
  return tags.filter((t) => t.id !== tagId);
}

/** Re-export seam over `mergeTags`: drop `discardId`, keep `keepId`. */
export function applyMerge(tags: CustomTag[], keepId: string, discardId: string): CustomTag[] {
  return mergeTags(tags, keepId, discardId);
}
