import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Surface, Icon, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreatures } from '../../hooks/useCreatures';
import { useTasks } from '../../hooks/useTasks';
import { getTaskUrgency } from '../../models/Task';
import { CREATURE_TYPE_LABELS } from '../../models/Creature';
import type { AppTheme } from '../../constants/Colors';

export default function DashboardScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { creatures } = useCreatures();
    const { tasks } = useTasks();

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

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text variant="headlineMedium" style={[styles.headerTitle, { color: theme.colors.primary }]}>
                    🐠 ReefKeeper
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
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    ✅ All caught up! No urgent tasks.
                                </Text>
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    header: { marginBottom: 20, paddingTop: 8 },
    headerTitle: { fontWeight: '800', marginBottom: 4 },
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
        minWidth: 64,
    },
    taskSummary: { gap: 6 },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 4,
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
});
