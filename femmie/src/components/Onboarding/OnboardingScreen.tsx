import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Step1Privacy } from './Step1Privacy';
import { Step2Passkey } from './Step2Passkey';
import { Step3CycleDate } from './Step3CycleDate';
import { Step4CycleLength } from './Step4CycleLength';

interface Props {
  onComplete: (firstCycleDate: string | null, cycleLength: number) => void;
}

type Step = 1 | 2 | 3 | 4;

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [firstDate, setFirstDate] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <View
            key={s}
            style={[styles.dot, step >= s && styles.dotActive]}
          />
        ))}
      </View>

      {step === 1 && <Step1Privacy onNext={() => setStep(2)} />}
      {step === 2 && <Step2Passkey onNext={() => setStep(3)} />}
      {step === 3 && (
        <Step3CycleDate
          onNext={(date) => {
            setFirstDate(date);
            setStep(4);
          }}
        />
      )}
      {step === 4 && (
        <Step4CycleLength onDone={(cycleLength) => onComplete(firstDate, cycleLength)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 60,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.periodConfirmed,
    width: 20,
  },
});
