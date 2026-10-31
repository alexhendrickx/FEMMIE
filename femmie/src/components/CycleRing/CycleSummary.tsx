import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CycleRing } from './CycleRing';
import { PredictionLine, type CycleSummaryState } from './PredictionLine';
import { useLogStore } from '../../store/logStore';
import { todayISO } from '../CycleCalendar/utils';
import {
  cycleLengths,
  cyclePhase,
  currentCycleDay,
  extractPeriodStarts,
  predictNextPeriod,
} from '../../lib/cycle';

const DEFAULT_AVG_LENGTH = 28;

interface CycleSummaryProps {
  onPressRing: () => void;
}

export function CycleSummary({ onPressRing }: CycleSummaryProps) {
  const logs = useLogStore((s) => s.logs);

  const derived = useMemo(() => {
    const logList = Object.values(logs);
    const starts = extractPeriodStarts(logList);
    const today = todayISO();

    const cycleDay = currentCycleDay(starts, today);
    const lengths = cycleLengths(starts);
    const avgLength =
      lengths.length > 0
        ? lengths.reduce((a, b) => a + b, 0) / lengths.length
        : DEFAULT_AVG_LENGTH;
    const phase = cycleDay !== null ? cyclePhase(cycleDay, avgLength) : null;
    const progress = cycleDay !== null ? cycleDay / avgLength : 0;
    const prediction = predictNextPeriod(starts, today);

    let state: CycleSummaryState;
    if (cycleDay === null) {
      state = 'empty';
    } else if (prediction.confidence === 'low') {
      state = 'low';
    } else if (prediction.windowEnd !== undefined && today > prediction.windowEnd) {
      state = 'overdue';
    } else {
      state = 'normal';
    }

    return { cycleDay, phase, progress, state, prediction };
  }, [logs]);

  return (
    <View style={styles.container}>
      <CycleRing
        cycleDay={derived.cycleDay}
        phase={derived.phase}
        progress={derived.progress}
        onPress={onPressRing}
      />
      <PredictionLine state={derived.state} prediction={derived.prediction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
});
