import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Stepper } from '../common/Stepper';
import { Step1Privacy } from './Step1Privacy';
import { Step2Auth } from './Step2Auth';
import { Step3CycleDate } from './Step3CycleDate';
import { Step4CycleLength } from './Step4CycleLength';

interface Props {
  onComplete: (firstCycleDate: string | null, cycleLength: number) => void;
  /** Already signed in (app was closed mid-onboarding): resume after the account step. */
  signedIn: boolean;
}

type Step = 1 | 2 | 3 | 4;

export function OnboardingScreen({ onComplete, signedIn }: Props) {
  const [step, setStep] = useState<Step>(signedIn ? 3 : 1);
  const [firstDate, setFirstDate] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Stepper
        total={4}
        current={step}
        onBack={step > (signedIn ? 3 : 1) ? () => setStep((s) => (s - 1) as Step) : undefined}
      />

      {step === 1 && <Step1Privacy onNext={() => setStep(2)} />}
      {step === 2 && <Step2Auth onNext={() => setStep(3)} />}
      {step === 3 && (
        <Step3CycleDate
          onNext={(date) => {
            setFirstDate(date);
            setStep(4);
          }}
        />
      )}
      {step === 4 && (
        <Step4CycleLength
          initial={28}
          onDone={(len) => onComplete(firstDate, len)}
        />
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
