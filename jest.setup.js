import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('react-native/Libraries/StyleSheet/StyleSheet', () => {
  const realStyleSheet = jest.requireActual(
    'react-native/Libraries/StyleSheet/StyleSheet',
  );
  return {
    ...realStyleSheet,
    flatten: jest.fn(style => style),
  };
});

jest.mock('react-native-nfc-manager', () => ({
  isSupported: jest.fn().mockReturnValue(Promise.resolve(true)),
  isEnabled: jest.fn().mockReturnValue(Promise.resolve(true)),
  start: jest.fn(),
  requestTechnology: jest.fn().mockReturnValue(Promise.resolve()),
  getTag: jest.fn().mockReturnValue(Promise.resolve({ ndefMessage: [] })),
  cancelTechnologyRequest: jest.fn().mockReturnValue(Promise.resolve()),
  ndefHandler: {
    writeNdefMessage: jest.fn().mockReturnValue(Promise.resolve()),
  },
  NfcTech: {
    Ndef: 'Ndef',
  },
  Ndef: {
    TNF_MIME_MEDIA: 'application/json',
    record: jest.fn(),
    encodeMessage: jest.fn(),
  },
}));

jest.mock('react-native-mqtt', () => {
    const client = {
        on: jest.fn((event, callback) => {
            if (event === 'connect') {
                callback();
            }
        }),
        connect: jest.fn(),
        disconnect: jest.fn(),
        publish: jest.fn(),
    };
    return {
        createClient: jest.fn().mockResolvedValue(client),
    };
});
