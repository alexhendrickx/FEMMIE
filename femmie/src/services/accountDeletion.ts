/**
 * "Delete everything": removes the account and every trace of the user's data.
 *
 * Order matters. The server goes first, and nothing local is touched unless the
 * server confirms, so a failed request never leaves ciphertext behind while the
 * app claims it is gone. The user can simply try again.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { wipeLocal } from './encryption';
import { wipeDatabase } from './sqlite';
import { cancelBedtimeReminder } from '../utils/notifications';
import { encryptedWritesSettled } from './secureStorage';
import { useLogStore, LEGACY_STORE_KEYS } from '../store/logStore';
import { useHealthStore } from '../store/healthStore';
import { useEncryptionStore } from '../store/encryptionStore';

/** The server refused or was unreachable. Nothing was deleted anywhere. */
export class AccountDeletionError extends Error {
  constructor() {
    super('Account deletion failed on the server; nothing was deleted');
    this.name = 'AccountDeletionError';
  }
}

/** The account is gone, but part of the on-device cleanup failed. */
export class LocalWipeError extends Error {
  constructor() {
    super('Account deleted, but some on-device data could not be removed');
    this.name = 'LocalWipeError';
  }
}

/**
 * @param signedIn whether there is a server account to delete. Without one,
 *   only the device is wiped.
 * @throws AccountDeletionError when the server delete fails. Local data is intact.
 * @throws LocalWipeError when the account is gone but a device step failed.
 *   Every remaining step still runs, and the session is always dropped.
 */
export async function deleteAccountAndData(signedIn: boolean): Promise<void> {
  if (signedIn) {
    // Deletes auth.users for auth.uid(); logs + key_material cascade.
    // See supabase/migrations/20261122120000_delete_my_account.sql.
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw new AccountDeletionError();
  }

  // Past this point the account no longer exists, so every step runs even if
  // an earlier one fails.
  let failed = false;
  const step = async (run: () => Promise<unknown>): Promise<void> => {
    try {
      await run();
    } catch {
      failed = true;
    }
  };

  await step(cancelBedtimeReminder);

  // Reset the log store and let its encrypted re-write land BEFORE the key is
  // destroyed: a write still in flight would call initLocalDEK() afterwards
  // and mint a fresh key in the keychain.
  await step(async () => {
    useLogStore.getState().clearAll();
    await encryptedWritesSettled();
    await useLogStore.persist.clearStorage();
  });
  await step(async () => {
    useHealthStore.setState(useHealthStore.getInitialState());
    await useHealthStore.persist.clearStorage();
  });
  await step(async () => {
    useEncryptionStore.setState(useEncryptionStore.getInitialState());
    await useEncryptionStore.persist.clearStorage();
  });
  await step(() => Promise.all(LEGACY_STORE_KEYS.map((k) => AsyncStorage.removeItem(k))));

  await step(wipeLocal);
  await step(wipeDatabase);

  if (signedIn) {
    // The server session died with the account; this drops the local tokens.
    await step(async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    });
  }

  if (failed) throw new LocalWipeError();
}
