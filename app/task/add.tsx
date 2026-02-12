import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, useTheme, Text, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { RecurrenceUnit } from '../../models/Task';
import * as taskService from '../../services/taskService';
import type { AppTheme } from '../../constants/Colors';

export default function AddTaskScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isRecurring, setIsRecurring] = useState(true);
    const [interval, setInterval] = useState('7');
    const [unit, setUnit] = useState<RecurrenceUnit>('days');
    const [reminderHours, setReminderHours] = useState('24');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [saving, setSaving] = useState(false);

    const canSave = title.trim().length > 0;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const now = new Date();
            let nextDue = new Date(now);
            const intervalNum = Math.max(1, parseInt(interval) || 1);

            if (isRecurring) {
                // Calculate first due date based on recurrence
                switch (unit) {
                    case 'days':
                        nextDue.setDate(nextDue.getDate() + intervalNum);
                        break;
                    case 'weeks':
                        nextDue.setDate(nextDue.getDate() + intervalNum * 7);
                        break;
                    case 'months':
                        nextDue.setMonth(nextDue.getMonth() + intervalNum);
                        break;
                }
            }
            // If non-recurring, due date is 'now' (or we could add a date picker later)

            await taskService.addTask({
                title: title.trim(),
                description: description.trim(),
                recurrenceInterval: isRecurring ? intervalNum : undefined,
                recurrenceUnit: isRecurring ? unit : undefined,
                nextDueDate: nextDue.toISOString(),
                reminderOffsetHours: Math.max(1, parseInt(reminderHours) || 24),
                notificationsEnabled,
                isPredefined: false,
            });
            router.back();
        } catch (error) {
            console.error('Failed to save task:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <Text variant="titleLarge" style={[styles.header, { color: theme.colors.primary }]}>
                🔧 New Task
            </Text>

            <TextInput
                testID="task-name-input"
                label="Task name *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. Replace RODI filters"
            />

            <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What does this task involve?"
            />

            <View style={styles.switchRow}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                    Repeating Task
                </Text>
                <Switch
                    testID="task-recurring-switch"
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                />
            </View>

            {isRecurring && (
                <>
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                        Repeat every
                    </Text>
                    <View style={styles.recurrenceRow}>
                        <TextInput
                            value={interval}
                            onChangeText={setInterval}
                            mode="outlined"
                            keyboardType="number-pad"
                            style={[styles.input, { flex: 1 }]}
                        />
                        <SegmentedButtons
                            value={unit}
                            onValueChange={(v) => setUnit(v as RecurrenceUnit)}
                            buttons={[
                                { value: 'days', label: 'Days' },
                                { value: 'weeks', label: 'Weeks' },
                                { value: 'months', label: 'Months' },
                            ]}
                            style={{ flex: 2 }}
                        />
                    </View>
                </>
            )}

            <TextInput
                label="Remind me (hours before due)"
                value={reminderHours}
                onChangeText={setReminderHours}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
            />

            <View style={styles.switchRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    Enable notifications
                </Text>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>

            <View style={styles.buttons}>
                <Button mode="outlined" onPress={() => router.back()} style={styles.button}>
                    Cancel
                </Button>
                <Button
                    testID="save-task-button"
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={!canSave || saving}
                    style={[styles.button, { backgroundColor: canSave ? theme.colors.primary : undefined }]}
                >
                    Save Task
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    header: { fontWeight: '800', marginBottom: 16 },
    input: { marginBottom: 12 },
    label: { marginBottom: 6, marginTop: 4 },
    recurrenceRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    button: { flex: 1, borderRadius: 12 },
});
