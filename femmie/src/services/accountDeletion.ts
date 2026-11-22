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
import { useLogStore, LEGACY_STORE_KEYS } from '../store/logStore';
import { useHealthStore } from '../store/healthStore';
import { useEncryptionStore } from '../store/encryptionStore';

export class AccountDeletionError extends Error {
  constructor() {
    super('Account deletion failed on the server; nothing was deleted');
    this.name = 'AccountDeletionError';
  }
}

/**
 * @param signedIn whether there is a server account to delete. Without one,
 *   only the device is wiped.
 * @throws AccountDeletionError when the server delete fails. Local data is intact.
 */
export async function deleteAccountAndData(signedIn: boolean): Promise<void> {
  if (signedIn) {
    // Deletes auth.users for auth.uid(); logs + key_material cascade.
    // See supabase/migrations/20261122120000_delete_my_account.sql.
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw new AccountDeletionError();
  }

  await cancelBedtimeReminder();

  // Clear the log envelope BEFORE destroying the key: clearing triggers an
  // encrypted re-write that calls initLocalDEK(), which would mint a NEW
  // keychain key if it ran after wipeLocal().
  useLogStore.getState().clearAll();
  await useLogStore.persist.clearStorage();

  useHealthStore.setState(useHealthStore.getInitialState());
  await useHealthStore.persist.clearStorage();
  useEncryptionStore.setState(useEncryptionStore.getInitialState());
  await useEncryptionStore.persist.clearStorage();
  await Promise.all(LEGACY_STORE_KEYS.map((k) => AsyncStorage.removeItem(k).catch(() => {})));

  await wipeLocal();
  await wipeDatabase();

  if (signedIn) {
    // The server session died with the account; this drops the local tokens.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}
