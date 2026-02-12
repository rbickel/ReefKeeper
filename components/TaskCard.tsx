import React from 'react';
import { Card, Text, useTheme, IconButton, Checkbox } from 'react-native-paper';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaintenanceTask, getTaskUrgency } from '../models/Task';
import type { AppTheme } from '../constants/Colors';

interface Props {
    task: MaintenanceTask;
    isCompleting?: boolean;
    onPress: () => void;
    onComplete: () => void;
}

const URGENCY_COLORS: Record<string, string> = {
    overdue: '#e74c3c',
    today: '#f39c12',
    upcoming: '#3498db',
    later: '#95a5a6',
};

export function TaskCard({ task, isCompleting, onPress, onComplete }: Props) {
    const theme = useTheme<AppTheme>();
    const urgency = getTaskUrgency(task);
    const urgencyColor = URGENCY_COLORS[urgency];
    const dueDate = new Date(task.nextDueDate);
    const isOverdue = urgency === 'overdue';

    const formatDue = () => {
        const now = new Date();
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays}d`;
    };

    return (
        <Pressable onPress={onPress}>
            <Card
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.colors.surface,
                        borderLeftColor: urgencyColor,
                        borderLeftWidth: 3,
                        opacity: isCompleting ? 0.6 : 1,
                    },
                ]}
                mode="elevated"
            >
                <View style={styles.row}>
                    <Checkbox
                        status={isCompleting ? 'checked' : 'unchecked'}
                        onPress={onComplete}
                        color={theme.colors.primary}
                        disabled={isCompleting}
                    />
                    <View style={styles.info}>
                        <Text
                            variant="titleSmall"
                            style={{
                                color: theme.colors.onSurface,
                                fontWeight: '700',
                                textDecorationLine: isCompleting ? 'line-through' : 'none',
                            }}
                        >
                            {task.title}
                        </Text>
                        <Text
                            variant="bodySmall"
                            style={{ color: isOverdue ? urgencyColor : theme.colors.onSurfaceVariant }}
                        >
                            {formatDue()} · Every {task.recurrenceInterval}{' '}
                            {task.recurrenceUnit}
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
