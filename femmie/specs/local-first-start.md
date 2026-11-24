# Spec: Start without an account, local-only and honest
_Status: spec - 2026-11-23_

## Goal
A new user goes privacy intro → last period → cycle length → Today, with no account. Nothing in the app claims a server feature that does not exist.

## Interface
- **Onboarding:** 3 steps (`Step1Privacy`, `Step3CycleDate`, `Step4CycleLength`), so the `Stepper` shows 3 dots. `Step2Auth` is deleted, along with its `signedIn` resume logic in `OnboardingScreen`.
- **AppGate (`App.tsx`):** shows the main app when `onboardingDone` is true, whether or not anyone is signed in. Hydration wait stays.
- **You → Settings, Account section:**
  - Signed in (an existing TestFlight session): shows "Signed in" and "Log out".
  - Signed out: shows "Backup is coming soon. Your data stays on this phone." and no buttons.
- **Privacy screen:**
  - Remove the "Cloud sync (optional)" row and the "Cloud backup" switch.
  - Fix the copy:
    - Logs: "stored on this phone, encrypted" (not "SQLite").
    - Key: "kept in the iOS Keychain on this phone" (not "secure enclave").
    - Drop the "annual transparency report" promise.
    - Legal text: "There is nothing on our servers to hand over."
- **Step1Privacy promises** stay. "Delete everything, everywhere, in one tap" stays true: signed-out deletion wipes the device, and signed-in deletion still removes the account.
- **States:** no new loading or error states. Account deletion keeps its existing alerts.

## Data and API
- **No schema change.** No new endpoints.
- **Remove dead code:**
  - `src/services/cloudSync.ts` and `src/services/sqlite.ts`, with their tests and the `pullFromCloud` calls in `AuthContext`.
  - The `expo-sqlite` dependency and its `app.json` plugin.
  - The `wipeDatabase` step in `accountDeletion.ts`. The DB file was never created: nothing ever stored to SQLite.
- **`encryptionStore`:**
  - Drop `cloudSyncEnabled`, `syncStatus` and `lastSyncAt`, since nothing sets them truthfully.
  - Keep `keyReady` for the Privacy pill.
  - Bump the persist version to strip the old fields.
- **`healthStore`:** persist through `encryptedStorage` (`src/services/secureStorage.ts`) instead of plain AsyncStorage. Its audit log records which health types synced and when.
  - The existing plaintext blob is read once (the adapter already accepts a legacy plaintext blob) and rewritten encrypted on the next write.
- **Kept for slice 2, untouched:** `authService.ts`, `AuthContext` sign-in and register functions, `wrapDekWithPassphrase` and `unwrapDekWithPassphrase`.
  - The wrap functions use MODERATE constants that react-native-libsodium does not expose. Slice 2 rewrites them; note it in a code comment, not here.
- **Offline or retry:** not applicable. No network calls are added, and the only network call left is account deletion for signed-in users.

## Behavior and edge cases
- **Upgrading user who is signed in and has logs:** goes straight to Today (`onboardingDone` migration), Settings shows "Signed in" and "Log out", and deletion removes the account.
- **Upgrading user mid-onboarding (signed in, `onboardingDone` false):** restarts at step 1 of the 3 steps. Nothing is lost, since there are no logs yet.
- **Signed-in user taps Log out:** stays in the app with local data intact (local-first), and Settings switches to the signed-out text.
- **Fresh install:** never contacts Supabase.
- **Health store blob from an older build:** hydrates from plaintext, then is stored as ciphertext after the next change.

## Out of scope
- Backup, sync, account creation, sign-in, recovery code, password reset: all slice 2.
- Sign in with Apple.
- Moving the timer tables. The user said another app uses this project; flagged for slice 2.
- `ReconnectBanner`/`isOffline`: never set true today; leave it for slice 2, which needs real connectivity state.

## Acceptance criteria (these become tests)
- [ ] `ONBOARDING_STEPS` (new pure export, e.g. in `src/lib/onboarding.ts`) lists exactly privacy, cycleDate, cycleLength, in that order. `OnboardingScreen` renders from it.
- [ ] `shouldShowOnboarding({ onboardingDone, hydrated })` (pure) returns false once hydrated and done, whether or not anyone is signed in, and `AppGate` uses it.
- [ ] No source file imports `services/cloudSync`, `services/sqlite`, `Step2Auth`, or `expo-sqlite`, and `package.json` has no `expo-sqlite` (source-text test, following the `supabase.test.ts` precedent).
- [ ] `deleteAccountAndData(false)` wipes logs, health, encryption store and keychain key without calling Supabase. The existing test is updated for the removed `wipeDatabase` step.
- [ ] `deleteAccountAndData(true)` still calls `delete_my_account` first and signs out after (existing tests stay green).
- [ ] After a `healthStore` change, AsyncStorage `femmie-health` holds an `EncryptedPayload` with no plaintext data-type ids.
- [ ] A plaintext `femmie-health` blob from an older build hydrates its `permissionStatus` and `pausedIds`.
- [ ] `encryptionStore` v0 → v1 migration drops `cloudSyncEnabled` and `lastSyncAt`.
- [ ] `PrivacyScreen.tsx` source contains none of: "transparency report", "secure enclave", "SQLite", "Cloud backup".
- [ ] `tsc --noEmit` clean, full jest green, `npx expo export -p ios` bundles.

## Verification
- `cd femmie && npx tsc --noEmit && npx jest`
- `npx expo export -p ios --output-dir .export-check`, then delete the folder.
- `npx expo config --type introspect`: no SQLite plugin.
- Then an EAS production build, and the user tests on TestFlight:
  - a fresh install reaches Today in 3 steps with no account;
  - an upgraded install keeps its logs;
  - Delete everything works signed out.
