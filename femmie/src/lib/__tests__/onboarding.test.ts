import { ONBOARDING_STEPS, shouldShowOnboarding } from '../onboarding';

describe('onboarding', () => {
  it('has three local steps and no account step', () => {
    expect(ONBOARDING_STEPS).toEqual(['privacy', 'cycleDate', 'cycleLength']);
  });

  it('is skipped once done, with no account involved', () => {
    expect(shouldShowOnboarding({ onboardingDone: true, hydrated: true })).toBe(false);
  });

  it('shows for a fresh install once storage has hydrated', () => {
    expect(shouldShowOnboarding({ onboardingDone: false, hydrated: true })).toBe(true);
  });

  it('waits for hydration so a returning user never sees it flash', () => {
    expect(shouldShowOnboarding({ onboardingDone: false, hydrated: false })).toBe(false);
  });
});
