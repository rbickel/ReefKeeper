import React from 'react';
import { Card, Text, useTheme, IconButton, Checkbox } from 'react-native-paper';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaintenanceTask, getTaskUrgency } from '../models/Task';
import type { AppTheme } from '../constants/Colors';

interface Props {
    task: MaintenanceTask;
    isCompleting?: boolean;
    renderAsCompleted?: boolean;
    onPress: () => void;
    onComplete: () => void;
}

const URGENCY_COLORS: Record<string, string> = {
    overdue: '#e74c3c',
    today: '#f39c12',
    upcoming: '#3498db',
    later: '#95a5a6',
};

export function TaskCard({ task, isCompleting, renderAsCompleted, onPress, onComplete }: Props) {
    const theme = useTheme<AppTheme>();
    const urgency = getTaskUrgency(task);
    const urgencyColor = URGENCY_COLORS[urgency];
    const dueDate = new Date(task.nextDueDate);
    const completed = isCompleting || task.isCompleted || renderAsCompleted;

    // For completed tasks, show completion date if available, or just "Completed"
    const completionDate = task.completionHistory.length > 0
        ? new Date(task.completionHistory[task.completionHistory.length - 1].completedAt)
        : null;

    const formatDue = () => {
        if (task.isCompleted || renderAsCompleted) {
            return completionDate ? `Completed ${completionDate.toLocaleDateString()}` : 'Completed';
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffTime = dueDay.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dueText = '';
        if (diffDays < 0) dueText = `${Math.abs(diffDays)}d overdue`;
        else if (diffDays === 0) dueText = 'Due today';
        else if (diffDays === 1) dueText = 'Due tomorrow';
        else dueText = `Due in ${diffDays}d`;

        return dueText;
    };

    const getLastDoneText = () => {
        if (!completionDate || task.isCompleted) return '';
        const now = new Date();
        const diffMs = now.getTime() - completionDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 24) return ' (Done today)';
        if (diffHours < 48) return ' (Done yesterday)';
        return ` (Last: ${completionDate.toLocaleDateString()})`;
    };

    return (
        <Pressable onPress={onPress}>
            <Card
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.colors.surface,
                        borderLeftColor: task.isCompleted ? theme.colors.outline : urgencyColor,
                        borderLeftWidth: 3,
                        opacity: completed ? 0.6 : 1,
                    },
                ]}
                mode="elevated"
            >
                <View style={styles.row}>
                    <Checkbox
                        testID={`task-checkbox-${task.id}`}
                        status={completed ? 'checked' : 'unchecked'}
                        onPress={onComplete}
                        color={theme.colors.primary}
                        disabled={completed}
                    />
                    <View style={styles.info}>
                        <Text
                            variant="titleSmall"
                            style={{
                                color: theme.colors.onSurface,
                                fontWeight: '700',
                                textDecorationLine: completed ? 'line-through' : 'none',
                            }}
                        >
                            {task.title}
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={{ color: task.isCompleted ? theme.colors.onSurfaceVariant : (urgency === 'overdue' ? urgencyColor : theme.colors.onSurfaceVariant) }}
                        >
                            {formatDue()}
                            {!task.isCompleted && task.recurrenceInterval !== undefined && task.recurrenceInterval > 0 && ` · Every ${task.recurrenceInterval} ${task.recurrenceUnit}${getLastDoneText()}`}
                        </Text>
                    </View>
                    <IconButton icon="chevron-right" size={18} iconColor={theme.colors.onSurfaceVariant} />
                </View>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 12, marginBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 4 },
    info: { flex: 1, marginLeft: 4 },
});
