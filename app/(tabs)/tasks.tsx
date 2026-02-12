import { View, SectionList, StyleSheet } from 'react-native';
import { FAB, Text, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { getTaskUrgency, MaintenanceTask } from '../../models/Task';
import { TaskCard } from '../../components/TaskCard';
import type { AppTheme } from '../../constants/Colors';

const URGENCY_ORDER = ['today', 'upcoming', 'later', 'completed'] as const;
const URGENCY_LABELS: Record<string, string> = {
    today: '🟡 Due Today',
    upcoming: '🔵 Upcoming',
    later: '⚪ Later',
    completed: '✅ Completed',
};

export default function TasksScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { tasks, loading, complete } = useTasks();
    const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

    const handleComplete = async (id: string, title?: string) => {
        setCompletingIds((prev) => new Set(prev).add(id));
        try {
            await complete(id);
            setSnackbarMessage(title ? `Completed "${title}"` : 'Task completed');
        } finally {
            setCompletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const sections = useMemo(() => {
        const grouped: Record<string, MaintenanceTask[]> = {};

        for (const task of tasks) {
            let category: string;

            if (task.isCompleted) {
                category = 'completed';
            } else {
                const urgency = getTaskUrgency(task);
                // Merge 'overdue' into 'today' per spec
                category = urgency === 'overdue' ? 'today' : urgency;
            }

            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(task);
        }
        return URGENCY_ORDER
            .filter((u) => grouped[u]?.length)
            .map((u) => ({
                title: URGENCY_LABELS[u],
                urgency: u,
                data: grouped[u],
            }));
    }, [tasks]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {sections.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        🔧 No tasks configured yet.{'\n'}Tap + to create one.
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderSectionHeader={({ section }) => (
                        <Text
                            variant="titleSmall"
                            style={[styles.sectionHeader, { color: theme.custom[section.urgency as keyof typeof theme.custom] || theme.colors.onSurface }]}
                        >
                            {section.title}
                        </Text>
                    )}
                    renderItem={({ item, section }) => (
                        <TaskCard
                            task={item}
                            isCompleting={completingIds.has(item.id)}
                            renderAsCompleted={item.isCompleted || section.urgency === 'completed'}
                            onPress={() => router.push(`/task/${item.id}`)}
                            onComplete={() => handleComplete(item.id, item.title)}
                        />
                    )}
                />
            )}

            <FAB
                testID="add-task-fab"
                icon="plus"
                onPress={() => router.push('/task/add')}
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
            />

            <Snackbar
                visible={!!snackbarMessage}
                onDismiss={() => setSnackbarMessage(null)}
                duration={3000}
                style={{ marginBottom: 80 }} // Above FAB/Tab bar
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 12, paddingBottom: 80 },
    sectionHeader: {
        fontWeight: '700',
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        borderRadius: 16,
    },
});
