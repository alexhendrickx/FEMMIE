import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { CATEGORY_MAP } from '../../data/categories';
import { useLogStore } from '../../store/logStore';
import type { DailyLog, MoodValue, FlowValue } from '../../types/logging';
import {
  buildFlowSteps,
  assembleEntries,
  insightOfTheDay,
  emptyAnswers,
  DEFAULT_QUICK_SYMPTOM_IDS,
  type FlowAnswers,
} from '../../lib/dailyFlow';

const MOODS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😟', label: 'Low' },
  { value: 'bad', emoji: '😢', label: 'Rough' },
];

const FLOWS: { value: FlowValue | 'none'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'none', label: 'No flow' },
];

interface DailyFlowProps {
  visible: boolean;
  date: string;
  cycleDay: number | null;
  isLikelyPeriod: boolean;
  quickSymptomIds?: string[];
  onClose: () => void;
  onSaved?: () => void;
}

export function DailyFlow({
  visible,
  date,
  cycleDay,
  isLikelyPeriod,
  quickSymptomIds = DEFAULT_QUICK_SYMPTOM_IDS,
  onClose,
  onSaved,
}: DailyFlowProps) {
  const saveLog = useLogStore((s) => s.saveLog);
  const logs = useLogStore((s) => s.logs);

  const steps = useMemo(() => buildFlowSteps({ isLikelyPeriod }), [isLikelyPeriod]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<FlowAnswers>(emptyAnswers);

  // Insight is computed from history BEFORE today's entry is saved.
  const insight = useMemo(
    () => insightOfTheDay(Object.values(logs), date),
    [logs, date],
  );

  function reset() {
    setStepIndex(0);
    setAnswers(emptyAnswers());
  }

  function close() {
    reset();
    onClose();
  }

  function next() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    if (stepIndex === 0) close();
    else setStepIndex((i) => i - 1);
  }

  function finish() {
    const entries = assembleEntries(answers);
    saveLog({ date, cycleDay: cycleDay ?? 1, entries });
    onSaved?.();
    reset();
  }

  const step = steps[stepIndex];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        {/* Header: close + progress */}
        <View style={styles.header}>
          <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.progressTrack}>
            {steps.map((s, i) => (
              <View
                key={s}
                style={[styles.progressSeg, i <= stepIndex && styles.progressSegActive]}
              />
            ))}
          </View>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {step === 'mood' && (
            <StepMood
              value={answers.mood}
              onPick={(mood) => {
                setAnswers((a) => ({ ...a, mood }));
                next();
              }}
            />
          )}

          {step === 'flow' && (
            <StepFlow
              value={answers.flow}
              onPick={(flow) => {
                setAnswers((a) => ({ ...a, flow }));
                next();
              }}
            />
          )}

          {step === 'symptoms' && (
            <StepSymptoms
              ids={quickSymptomIds}
              selected={answers.symptoms}
              onToggle={(id) =>
                setAnswers((a) => ({
                  ...a,
                  symptoms: { ...a.symptoms, [id]: !a.symptoms[id] },
                }))
              }
              onNext={next}
            />
          )}

          {step === 'insight' && <StepInsight insight={insight} onDone={finish} />}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function StepMood({ value, onPick }: { value?: MoodValue; onPick: (m: MoodValue) => void }) {
  return (
    <View>
      <Text style={styles.question}>How's today?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const active = value === m.value;
          return (
            <Pressable
              key={m.value}
              onPress={() => onPick(m.value)}
              style={[styles.moodItem, active && styles.moodItemActive]}
              accessibilityRole="button"
              accessibilityLabel={m.label}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepFlow({
  value,
  onPick,
}: {
  value?: FlowValue | 'none';
  onPick: (f: FlowValue | 'none') => void;
}) {
  return (
    <View>
      <Text style={styles.question}>Period flow today?</Text>
      <View style={styles.pillColumn}>
        {FLOWS.map((f) => {
          const active = value === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => onPick(f.value)}
              style={[styles.bigPill, active && styles.bigPillActive]}
              accessibilityRole="button"
              accessibilityLabel={f.label}
            >
              <Text style={[styles.bigPillText, active && styles.bigPillTextActive]}>
                {active ? '✓  ' : ''}
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepSymptoms({
  ids,
  selected,
  onToggle,
  onNext,
}: {
  ids: string[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  const anySelected = Object.values(selected).some(Boolean);
  return (
    <View>
      <Text style={styles.question}>Anything else?</Text>
      <View style={styles.symptomGrid}>
        {ids.map((id) => {
          const cat = CATEGORY_MAP.get(id);
          if (!cat) return null;
          const active = !!selected[id];
          return (
            <Pressable
              key={id}
              onPress={() => onToggle(id)}
              style={[styles.symptomChip, active && styles.symptomChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.label}
            >
              <Text style={styles.symptomIcon}>{active ? '✓' : cat.icon}</Text>
              <Text style={[styles.symptomLabel, active && styles.symptomLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.primaryBtn} onPress={onNext} accessibilityRole="button">
        <Text style={styles.primaryBtnText}>{anySelected ? 'Next' : 'All good'}</Text>
      </Pressable>
    </View>
  );
}

function StepInsight({ insight, onDone }: { insight: string | null; onDone: () => void }) {
  return (
    <View style={styles.insightWrap}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.insightTitle}>Logged for today</Text>
      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>Insight of the day</Text>
        <Text style={styles.insightText}>
          {insight ?? 'Keep logging and your personal patterns will start to appear here.'}
        </Text>
      </View>
      <Text style={styles.seeYou}>See you tomorrow 🌙</Text>
      <Pressable style={styles.primaryBtn} onPress={onDone} accessibilityRole="button">
        <Text style={styles.primaryBtnText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  back: { fontSize: 30, color: colors.textSecondary, width: 24, lineHeight: 32 },
  close: { fontSize: 18, color: colors.textMuted, width: 24, textAlign: 'right' },
  progressTrack: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSeg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  progressSegActive: { backgroundColor: colors.periodConfirmed },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, flexGrow: 1 },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Mood
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 3,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodItemActive: { borderColor: colors.periodConfirmed, backgroundColor: colors.fertileAccent },
  moodEmoji: { fontSize: 30 },
  moodLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },

  // Flow
  pillColumn: { gap: 12 },
  bigPill: {
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  bigPillActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  bigPillText: { fontSize: 17, fontWeight: '600', color: colors.text },
  bigPillTextActive: { color: colors.textLight },

  // Symptoms
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  symptomChipActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  symptomIcon: { fontSize: 16 },
  symptomLabel: { fontSize: 15, color: colors.text },
  symptomLabelActive: { color: colors.textLight, fontWeight: '600' },

  // Insight
  insightWrap: { alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  check: {
    fontSize: 40,
    color: colors.textLight,
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.periodConfirmed,
    marginBottom: 20,
  },
  insightTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 },
  insightCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.fertile,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  insightText: { fontSize: 16, color: colors.text, lineHeight: 23 },
  seeYou: { fontSize: 15, color: colors.textSecondary, marginBottom: 28 },

  // Shared
  primaryBtn: {
    marginTop: 28,
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
});
