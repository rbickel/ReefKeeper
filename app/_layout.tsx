import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme, StatusBar, Platform } from 'react-native';
import { LightTheme, DarkTheme } from '../constants/Colors';
import { useNotifications } from '../hooks/useNotifications';
import { Auth0Provider } from 'react-native-auth0';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
    useNotifications();

    // Get Auth0 config from app.config.js
    const auth0Domain = Constants.expoConfig?.extra?.auth0Domain;
    const auth0ClientId = Platform.OS === 'android' 
        ? (Constants.expoConfig?.extra?.auth0ClientIdApk || Constants.expoConfig?.extra?.auth0ClientId)
        : Constants.expoConfig?.extra?.auth0ClientId;

    // Validate Auth0 configuration - placeholder values will cause auth to fail gracefully
    // The app will show the login screen and the error will be displayed to the user
    if (!auth0Domain || !auth0ClientId) {
        console.error('❌ Auth0 configuration missing!');
        console.error('   Set AUTH0_DOMAIN and AUTH0_CLIENT_ID in your .env file.');
        console.error('   For Android: AUTH0_CLIENT_ID_APK can be used instead of AUTH0_CLIENT_ID.');
        console.error('❌ Authentication will not work. The app will display an error when attempting to log in.');
    }

    return (
        <Auth0Provider
            domain={auth0Domain || 'unconfigured.auth0.com'}
            clientId={auth0ClientId || 'unconfigured-client-id'}
        >
            <PaperProvider theme={theme}>
                <StatusBar
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                    backgroundColor={theme.colors.background}
                />
                <Stack
                    screenOptions={{
                        headerStyle: { backgroundColor: theme.colors.surface },
                        headerTintColor: theme.colors.onSurface,
                        headerTitleStyle: { fontWeight: '700' },
                        contentStyle: { backgroundColor: theme.colors.background },
                    }}
                >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="creature/add"
                        options={{ title: 'Add Creature', presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="creature/[id]"
                        options={{ title: 'Creature Details' }}
                    />
                    <Stack.Screen
                        name="task/add"
                        options={{ title: 'Add Task', presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="task/[id]"
                        options={{ title: 'Task Details' }}
                    />
                    <Stack.Screen
                        name="settings"
                        options={{ title: 'Settings' }}
                    />
                </Stack>
            </PaperProvider>
        </Auth0Provider>
    );
}
