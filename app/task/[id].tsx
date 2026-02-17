import React, { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, useTheme, Card, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaintenanceTask, getTaskUrgency } from '../../models/Task';
import * as taskService from '../../services/taskService';
import type { AppTheme } from '../../constants/Colors';

const URGENCY_COLORS: Record<string, string> = {
    overdue: '#e74c3c',
    today: '#f39c12',
    upcoming: '#3498db',
    later: '#95a5a6',
};

export default function TaskDetailScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [task, setTask] = useState<MaintenanceTask | null>(null);
    const [loading, setLoading] = useState(true);

    const loadTask = useCallback(async () => {
        setLoading(true);
        const tasks = await taskService.getTasks();
        const found = tasks.find((t) => t.id === id);
        setTask(found || null);
        setLoading(false);
    }, [id]);

    // Refresh data when screen gains focus (handles both initial mount and subsequent focus)
    useFocusEffect(
        useCallback(() => {
            loadTask();
        }, [loadTask])
    );

    const handleComplete = async () => {
        if (!id) return;
        await taskService.completeTask(id);
        await loadTask();
    };

    const handleDelete = async () => {
        if (!id) return;
        await taskService.deleteTask(id);
        router.back();
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!task) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Task not found.
                </Text>
                <Button onPress={() => router.back()} style={{ marginTop: 12 }}>Go back</Button>
            </View>
        );
    }

    const urgency = getTaskUrgency(task);
    const urgencyColor = URGENCY_COLORS[urgency];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            {/* Title & Status */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Content>
                    <View style={styles.titleRow}>
                        <View style={[styles.urgencyDot, { backgroundColor: urgencyColor }]} />
                        <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.onSurface, flex: 1 }}>
                            {task.title}
                        </Text>
                    </View>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                        {task.description}
                    </Text>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Next Due</Text>
                        <Text variant="bodyMedium" style={{ color: urgencyColor, fontWeight: '600' }}>
                            {new Date(task.nextDueDate).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Recurrence</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            Every {task.recurrenceInterval} {task.recurrenceUnit}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Reminder</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {task.reminderOffsetHours}h before due
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Times completed</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                            {task.completionHistory.length}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Completion History */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Completion History" titleVariant="titleMedium" />
                <Card.Content>
                    {task.completionHistory.length === 0 ? (
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            Not completed yet.
                        </Text>
                    ) : (
                        task.completionHistory
                            .slice(-10)
                            .reverse()
                            .map((entry) => (
                                <View key={entry.id} style={styles.historyEntry}>
                                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                                        ✅ {new Date(entry.completedAt).toLocaleString()}
                                    </Text>
                                    {entry.notes && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {entry.notes}
                                        </Text>
                                    )}
                                </View>
                            ))
                    )}
                </Card.Content>
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
                <Button
                    mode="contained"
                    icon="check"
                    onPress={handleComplete}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                >
                    Mark as Done
                </Button>
                {!task.isPredefined && (
                    <Button
                        mode="outlined"
                        icon="delete"
                        onPress={handleDelete}
                        textColor={theme.custom.overdue}
                        style={[styles.actionBtn, { borderColor: theme.custom.overdue }]}
                    >
                        Delete Task
                    </Button>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: { borderRadius: 16, marginBottom: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    urgencyDot: { width: 12, height: 12, borderRadius: 6 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    historyEntry: { marginBottom: 6 },
    actions: { gap: 8, marginTop: 8 },
    actionBtn: { borderRadius: 12 },
});
