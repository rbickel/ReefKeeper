module.exports = {
    preset: 'jest-expo',
    testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-paper|@react-native-async-storage|@sinclair/typebox)',
    ],
    setupFilesAfterEnv: ['@testing-library/react-native/matchers'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
