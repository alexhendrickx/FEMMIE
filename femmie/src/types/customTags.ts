/** How a custom symptom tag is logged. */
export type CustomTagScale = 'binary' | '1-5' | 'free_text';

/**
 * A user-authored symptom tag (Feature F2-13).
 *
 * NOTE: the roadmap schema lists `userId`, but Femmie is on-device single-user
 * (the device IS the user), so a userId would be dead data here — omitted. The
 * tag's `name` is user content and must be encrypted before it is persisted or
 * synced, exactly like any other log data.
 */
export interface CustomTag {
  id: string;
  name: string;
  /** Theme token / palette id chosen in the UI (never a raw hex in logic). */
  color: string;
  /** Single emoji. */
  icon: string;
  scaleType: CustomTagScale;
  createdAt: string; // ISO timestamp
}

/** A phrase mined from free-text notes that the user might want to promote to a tag. */
export interface TagSuggestion {
  phrase: string;
  count: number;
}
