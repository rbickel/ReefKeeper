import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { LightTheme, DarkTheme } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth0 } from 'react-native-auth0';

function useTestMode() {
    const [isTestMode, setIsTestMode] = React.useState(false);
    React.useEffect(() => {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            setIsTestMode(localStorage.getItem('@reef_keeper:test_mode') === 'true');
        }
    }, []);
    return isTestMode;
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
    const { user: auth0User } = useAuth0();
    const isTestMode = useTestMode();
    const user = isTestMode ? (auth0User ?? { nickname: 'Test User' }) : auth0User;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.surfaceVariant,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                    display: user ? 'flex' : 'none',
                },
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.onSurface,
                headerTitleStyle: { fontWeight: '700' },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="creatures"
                options={{
                    title: 'Creatures',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="fish" size={size} color={color} />
                    ),
                    href: user ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="wrench-clock" size={size} color={color} />
                    ),
                    href: user ? undefined : null,
                }}
            />
        </Tabs>
    );
}
