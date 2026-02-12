import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme, StatusBar } from 'react-native';
import { LightTheme, DarkTheme } from '../constants/Colors';
import { useNotifications } from '../hooks/useNotifications';
import { Auth0Provider } from 'react-native-auth0';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
    useNotifications();

    return (
        <Auth0Provider
            domain="reefkeeper.eu.auth0.com"
            clientId="UBtsC4v07Wvl8OqMB7wc9S8KVYncoYhB"
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
