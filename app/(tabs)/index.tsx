import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Surface, Icon, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreatures } from '../../hooks/useCreatures';
import { useTasks } from '../../hooks/useTasks';
import { getTaskUrgency } from '../../models/Task';
import { CREATURE_TYPE_LABELS } from '../../models/Creature';
import type { AppTheme } from '../../constants/Colors';
import { useAuth0 } from 'react-native-auth0';
import { Header } from '../../components/Header';
import { Platform } from 'react-native';

/**
 * Check if the app is running in E2E test mode.
 * In test mode, Auth0 authentication is bypassed.
 */
function useTestMode() {
    const [isTestMode, setIsTestMode] = React.useState(false);
    React.useEffect(() => {
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            setIsTestMode(localStorage.getItem('@reef_keeper:test_mode') === 'true');
        }
    }, []);
    return isTestMode;
}

export default function DashboardScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { creatures } = useCreatures();
    const { tasks } = useTasks();
    const { user: auth0User, authorize, isLoading: auth0Loading, error } = useAuth0();
    const isTestMode = useTestMode();

    // In test mode, treat user as authenticated with a mock user
    const user = isTestMode ? (auth0User ?? { nickname: 'Test User', name: 'Test User' }) : auth0User;
    const isLoading = isTestMode ? false : auth0Loading;

    const overdueTasks = tasks.filter((t) => getTaskUrgency(t) === 'overdue');
    const todayTasks = tasks.filter((t) => getTaskUrgency(t) === 'today');
    const upcomingTasks = tasks.filter((t) => getTaskUrgency(t) === 'upcoming');

    const creatureCounts = creatures.reduce(
        (acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + c.quantity;
            return acc;
        },
        {} as Record<string, number>
    );

    const handleLogin = async () => {
        try {
            const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
                ? window.location.origin
                : undefined;
            await authorize(
                {
                    scope: 'openid profile email',
                    ...(redirectUrl ? { redirectUrl } : {}),
                },
                Platform.OS === 'android' ? { customScheme: 'reef-keeper' } : undefined
            );
        } catch (e) {
            console.error('Login failed', e);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
                <View style={styles.landingContent}>
                    <Text variant="displaySmall" style={[styles.landingTitle, { color: theme.colors.primary }]}>
                        🐠 ReefKeeper
                    </Text>
                    <Text variant="headlineSmall" style={[styles.landingSubTitle, { color: theme.colors.onSurfaceVariant }]}>
                        Master your underwater world
                    </Text>
                    <Card style={styles.loginCard} mode="elevated">
                        <Card.Content>
                            <Text variant="bodyLarge" style={styles.loginText}>
                                Sign in to track your creatures, manage maintenance tasks, and receive important notifications.
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                style={styles.loginButton}
                                contentStyle={{ height: 50 }}
                                labelStyle={{ fontSize: 18, fontWeight: '700' }}
                            >
                                Login / Register
                            </Button>
                        </Card.Content>
                    </Card>
                    {error && (
                        <Text style={{ color: theme.colors.error, marginTop: 16 }}>
                            {error.message}
                        </Text>
                    )}
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.dashboardHeader}>
                    <Text variant="headlineSmall" style={[styles.dashboardHeaderTitle, { color: theme.colors.onSurface }]}>
                        Welcome back, {user.nickname || user.name}!
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Your reef aquarium at a glance
                    </Text>
                </View>

                {/* Creature Summary */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Title
                        title="Creatures"
                        titleVariant="titleMedium"
                        right={() => (
                            <Button mode="text" onPress={() => router.push('/creatures')} compact>
                                View all
                            </Button>
                        )}
                    />
                    <Card.Content>
                        {creatures.length === 0 ? (
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                No creatures registered yet. Add your first one!
                            </Text>
                        ) : (
                            <View style={styles.statsRow}>
                                <Surface style={[styles.statBubble, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                    <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
                                        {creatures.reduce((sum, c) => sum + c.quantity, 0)}
                                    </Text>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Total
                                    </Text>
                                </Surface>
                                {Object.entries(creatureCounts).map(([type, count]) => (
                                    <Surface
                                        key={type}
                                        style={[styles.statBubble, { backgroundColor: theme.colors.surfaceVariant }]}
                                        elevation={0}
                                    >
                                        <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                                            {count}
                                        </Text>
                                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {CREATURE_TYPE_LABELS[type as keyof typeof CREATURE_TYPE_LABELS]?.split(' ')[0] || type}
                                        </Text>
                                    </Surface>
                                ))}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Task Overview */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Title
                        title="Maintenance"
                        titleVariant="titleMedium"
                        right={() => (
                            <Button mode="text" onPress={() => router.push('/tasks')} compact>
                                View all
                            </Button>
                        )}
                    />
                    <Card.Content>
                        {tasks.length === 0 ? (
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                No tasks configured yet.
                            </Text>
                        ) : (
                            <View style={styles.taskSummary}>
                                {overdueTasks.length > 0 && (
                                    <View style={[styles.taskRow, { borderLeftColor: theme.custom.overdue }]}>
                                        <Text variant="titleMedium" style={{ color: theme.custom.overdue }}>
                                            {overdueTasks.length}
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                                            overdue
                                        </Text>
                                    </View>
                                )}
                                {todayTasks.length > 0 && (
                                    <View style={[styles.taskRow, { borderLeftColor: theme.custom.today }]}>
                                        <Text variant="titleMedium" style={{ color: theme.custom.today }}>
                                            {todayTasks.length}
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                                            due today
                                        </Text>
                                    </View>
                                )}
                                {upcomingTasks.length > 0 && (
                                    <View style={[styles.taskRow, { borderLeftColor: theme.custom.upcoming }]}>
                                        <Text variant="titleMedium" style={{ color: theme.custom.upcoming }}>
                                            {upcomingTasks.length}
                                        </Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                                            upcoming
                                        </Text>
                                    </View>
                                )}
                                {overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0 && (
                                    <View style={styles.taskRow}>
                                        <Icon source="check-circle" size={20} color={theme.colors.primary} />
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                                            All caught up! No urgent tasks.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <Button
                        mode="contained"
                        icon="plus"
                        onPress={() => router.push('/creature/add')}
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        labelStyle={{ fontWeight: '700' }}
                    >
                        Add Creature
                    </Button>
                    <Button
                        mode="contained-tonal"
                        icon="plus"
                        onPress={() => router.push('/task/add')}
                        style={styles.actionButton}
                        labelStyle={{ fontWeight: '700' }}
                    >
                        Add Task
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    dashboardHeader: { marginBottom: 20 },
    dashboardHeaderTitle: { fontWeight: '700', marginBottom: 4 },
    card: { marginBottom: 16, borderRadius: 16 },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    statBubble: {
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        minWidth: 80,
    },
    taskSummary: { gap: 8 },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 6,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
    },
    landingContent: {
        padding: 24,
        alignItems: 'center',
    },
    landingTitle: {
        fontWeight: '900',
        marginBottom: 8,
    },
    landingSubTitle: {
        textAlign: 'center',
        marginBottom: 48,
        opacity: 0.8,
    },
    loginCard: {
        width: '100%',
        borderRadius: 24,
        padding: 8,
    },
    loginText: {
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        opacity: 0.7,
    },
    loginButton: {
        borderRadius: 12,
    },
});

