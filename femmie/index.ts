import { registerRootComponent } from 'expo';
import App from './App';
import { configureEncryption } from './src/services/encryption';

// Production builds fail closed: if libsodium or the DEK is ever unavailable,
// encryption throws instead of silently writing readable plaintext. Dev keeps
// the permissive fallback so Expo Go / tests run without the native module.
configureEncryption({ allowPlaintextFallback: __DEV__ });

registerRootComponent(App);
