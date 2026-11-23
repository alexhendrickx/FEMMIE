/**
 * Onboarding is local-only: no account step. A new user goes privacy → last period →
 * cycle length → Today. Backup (and with it an account) comes later, from You.
 */
export const ONBOARDING_STEPS = ['privacy', 'cycleDate', 'cycleLength'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Whether the app should show onboarding. Being signed in plays no part. */
export function shouldShowOnboarding({
  onboardingDone,
  hydrated,
}: {
  onboardingDone: boolean;
  hydrated: boolean;
}): boolean {
  return hydrated && !onboardingDone;
}
