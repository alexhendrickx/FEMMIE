import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLogStore } from '../../store/logStore';
import { useTagStore, type TagResult } from '../../store/tagStore';
import {
  buildTagRows,
  mergeTargets,
  suggestionToName,
  suggestionsFor,
  type TagRow,
} from '../../lib/tagsManager';
import { TagForm, type TagFormValues } from './TagForm';
import { colors } from '../../theme/colors';
import type { CustomTag } from '../../types/customTags';

type Mode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'rename'; id: string }
  | { kind: 'merge'; id: string };

const LIST: Mode = { kind: 'list' };

/** You → Tags: create, rename, merge and delete the personal symptom dictionary (F2-13). */
export function TagManagerScreen() {
  const tags = useTagStore((s) => s.tags);
  const createTag = useTagStore((s) => s.createTag);
  const renameTag = useTagStore((s) => s.renameTag);
  const mergeTag = useTagStore((s) => s.mergeTag);
  const deleteTag = useTagStore((s) => s.deleteTag);
  const logs = useLogStore((s) => s.logs);

  const [mode, setMode] = useState<Mode>(LIST);
  const [error, setError] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const logList = useMemo(() => Object.values(logs), [logs]);
  const rows = useMemo(() => buildTagRows(tags, logList), [tags, logList]);
  const suggestions = useMemo(() => suggestionsFor(logList, tags), [logList, tags]);

  // A rename/merge target that was deleted meanwhile falls back to the list.
  const target = 'id' in mode ? tags.find((t) => t.id === mode.id) : undefined;
  const current: Mode = 'id' in mode && !target ? LIST : mode;

  const openMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const finish = (result: TagResult) => {
    if (result.ok) openMode(LIST);
    else setError(result.error);
  };

  const handleAddSuggestion = (phrase: string) => {
    const result = createTag({ name: suggestionToName(phrase), scaleType: 'binary' });
    setSuggestError(result.ok ? null : result.error);
  };

  const handleDelete = (row: TagRow) => {
    Alert.alert(`Delete “${row.name}”?`, 'This also removes it from the days you logged it. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTag(row.id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {current.kind === 'list' && (
        <>
          <View style={styles.block}>
            <Text style={styles.heading}>Your tags</Text>
            {rows.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏷️</Text>
                <Text style={styles.emptyText}>No custom tags yet</Text>
                <Text style={styles.emptyHint}>
                  Add words for what you notice that the built-in symptoms don't cover. They stay
                  encrypted on this device.
                </Text>
              </View>
            ) : (
              rows.map((row) => (
                <TagRowCard
                  key={row.id}
                  row={row}
                  canMerge={tags.length >= 2}
                  onRename={() => openMode({ kind: 'rename', id: row.id })}
                  onMerge={() => openMode({ kind: 'merge', id: row.id })}
                  onDelete={() => handleDelete(row)}
                />
              ))
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => openMode({ kind: 'create' })}
              accessibilityRole="button"
              accessibilityLabel="Add a tag"
            >
              <Text style={styles.primaryBtnText}>Add a tag</Text>
            </TouchableOpacity>
          </View>

          <SuggestionBlock
            suggestions={suggestions}
            error={suggestError}
            onAdd={handleAddSuggestion}
          />
        </>
      )}

      {current.kind === 'create' && (
        <View style={styles.block}>
          <Text style={styles.heading}>New tag</Text>
          <TagForm
            mode="create"
            submitLabel="Add tag"
            error={error}
            onSubmit={(v) =>
              finish(createTag({ name: v.name, scaleType: v.scaleType, icon: v.icon, color: v.color }))
            }
            onCancel={() => openMode(LIST)}
          />
        </View>
      )}

      {current.kind === 'rename' && target && (
        <View style={styles.block}>
          <Text style={styles.heading}>Rename tag</Text>
          <TagForm
            key={`rename-${target.id}`}
            mode="rename"
            initialName={target.name}
            submitLabel="Save name"
            error={error}
            onSubmit={(v: TagFormValues) => finish(renameTag(target.id, v.name))}
            onCancel={() => openMode(LIST)}
          />
        </View>
      )}

      {current.kind === 'merge' && target && (
        <MergePicker
          source={target}
          targets={mergeTargets(tags, target.id)}
          onPick={(keepId) => {
            mergeTag(keepId, target.id);
            openMode(LIST);
          }}
          onCancel={() => openMode(LIST)}
        />
      )}
    </ScrollView>
  );
}

function TagRowCard({
  row,
  canMerge,
  onRename,
  onMerge,
  onDelete,
}: {
  row: TagRow;
  canMerge: boolean;
  onRename: () => void;
  onMerge: () => void;
  onDelete: () => void;
}) {
  const days = row.usageCount === 1 ? 'day' : 'days';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{row.icon}</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardName}>{row.name}</Text>
          <Text style={styles.cardSub}>
            {`${row.scaleLabel} · logged on ${row.usageCount} ${days}`}
          </Text>
        </View>
      </View>
      <View style={styles.pillRow}>
        <Pill label="Rename" a11yLabel={`Rename ${row.name}`} onPress={onRename} />
        {canMerge && <Pill label="Merge" a11yLabel={`Merge ${row.name}`} onPress={onMerge} />}
        <Pill label="Delete" a11yLabel={`Delete ${row.name}`} onPress={onDelete} />
      </View>
    </View>
  );
}

function SuggestionBlock({
  suggestions,
  error,
  onAdd,
}: {
  suggestions: { phrase: string; count: number }[];
  error: string | null;
  onAdd: (phrase: string) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.heading}>Suggested from your notes</Text>
      {suggestions.length === 0 ? (
        <Text style={styles.hint}>
          When a word keeps showing up in your notes, it will be offered here.
        </Text>
      ) : (
        suggestions.map((s) => (
          <View key={s.phrase} style={styles.card}>
            <Text style={styles.cardName}>{`“${s.phrase}” · written ${s.count} times`}</Text>
            <View style={styles.pillRow}>
              <Pill
                label="Add as tag"
                a11yLabel={`Add ${s.phrase} as tag`}
                onPress={() => onAdd(s.phrase)}
              />
            </View>
          </View>
        ))
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function MergePicker({
  source,
  targets,
  onPick,
  onCancel,
}: {
  source: CustomTag;
  targets: CustomTag[];
  onPick: (keepId: string) => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.heading}>{`Merge “${source.name}” into…`}</Text>
      <Text style={styles.hint}>
        {`Everything logged as “${source.name}” moves to the tag you pick. “${source.name}” is then removed.`}
      </Text>
      {targets.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={styles.card}
          onPress={() => onPick(t.id)}
          accessibilityRole="button"
          accessibilityLabel={`Merge into ${t.name}`}
        >
          <Text style={styles.cardName}>{`${t.icon}  ${t.name}`}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancel merge"
      >
        <Text style={styles.secondaryBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

function Pill({ label, a11yLabel, onPress }: { label: string; a11yLabel: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.pill}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Text style={styles.pillText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 24 },

  block: { gap: 12 },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  error: { fontSize: 14, color: colors.periodConfirmed, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 22 },
  cardText: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  primaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.periodConfirmed,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.textLight },
  secondaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },

  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
