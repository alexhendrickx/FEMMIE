export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface AuthState {
  tokens: AuthTokens | null;
  accountId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
}

export interface RegisterBeginResponse {
  challenge: string;
  rpId: string;
  userId: string;
}

export interface LoginBeginResponse {
  challenge: string;
}

export interface PasskeyCredential {
  credentialId: string;
  publicKey: string;
  deviceType: 'singleDevice' | 'multiDevice';
}
