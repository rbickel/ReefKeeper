import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth0 } from 'react-native-auth0';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
    const { user } = useAuth0();

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
