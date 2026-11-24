import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Stepper } from '../common/Stepper';
import { ONBOARDING_STEPS, type OnboardingStep } from '../../lib/onboarding';
import { Step1Privacy } from './Step1Privacy';
import { Step3CycleDate } from './Step3CycleDate';
import { Step4CycleLength } from './Step4CycleLength';

interface Props {
  onComplete: (firstCycleDate: string | null, cycleLength: number) => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [firstDate, setFirstDate] = useState<string | null>(null);
  const step: OnboardingStep = ONBOARDING_STEPS[index];
  const next = () => setIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));

  return (
    <View style={styles.container}>
      <Stepper
        total={ONBOARDING_STEPS.length}
        current={index + 1}
        onBack={index > 0 ? () => setIndex((i) => i - 1) : undefined}
      />

      {step === 'privacy' && <Step1Privacy onNext={next} />}
      {step === 'cycleDate' && (
        <Step3CycleDate
          onNext={(date) => {
            setFirstDate(date);
            next();
          }}
        />
      )}
      {step === 'cycleLength' && (
        <Step4CycleLength initial={28} onDone={(len) => onComplete(firstDate, len)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
