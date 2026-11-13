// Manual mock for expo-apple-authentication: its real entry point calls into a
// native module that does not exist under Node, which would throw on import.
// Jest auto-uses this mock for the node_modules package in all tests.
module.exports = {
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(async () => ({ identityToken: null })),
};
