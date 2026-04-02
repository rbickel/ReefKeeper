import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, useTheme, TextInput, Button, ActivityIndicator, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTanks } from '../../hooks/useTanks';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import { WATER_PARAMETERS, WaterParameterId, getParameterStatus } from '../../models/WaterParameter';
import { WaterReading } from '../../models/WaterLog';
import {
    convertTemperatureForStorage,
} from '../../models/UnitPreference';
import { evaluateThresholds } from '../../services/taskService';
import type { AppTheme } from '../../constants/Colors';

const STATUS_EMOJI: Record<string, string> = {
    ok: '✅',
    warning: '🟡',
    critical: '🔴',
};

export default function AddWaterLogScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { activeTank, loading: tanksLoading } = useTanks();
    const tankId = activeTank?.id ?? '';
    const { add } = useWaterLogs(tankId);
    const { preferences } = useUnitPreferences();

    const [values, setValues] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleValueChange = (paramId: WaterParameterId, text: string) => {
        // Allow numbers, decimal point, and empty
        if (text === '' || /^-?\d*\.?\d*$/.test(text)) {
            setValues((prev) => ({ ...prev, [paramId]: text }));
        }
    };

    const handleSave = async () => {
        if (!tankId) return;
        setSaving(true);
        try {
            const readings: WaterReading[] = [];
            for (const param of WATER_PARAMETERS) {
                const raw = values[param.id];
                if (raw !== undefined && raw !== '') {
                    let numericValue = parseFloat(raw);
                    if (isNaN(numericValue)) continue;

                    // Convert temperature from display unit to storage unit (always °C)
                    if (param.id === 'temperature') {
                        numericValue = convertTemperatureForStorage(numericValue, preferences.temperature);
                    }

                    readings.push({ parameterId: param.id, value: numericValue });
                }
            }

            if (readings.length === 0) {
                setSaving(false);
                return;
            }

            await add({
                tankId,
                testedAt: new Date().toISOString(),
                readings,
                notes: notes.trim(),
            });

            // Evaluate threshold triggers
            try {
                const alerts = await evaluateThresholds(tankId, readings);
                if (alerts.length > 0) {
                    Alert.alert('⚡ Threshold Alerts', alerts.map((a) => a.message).join('\n'));
                }
            } catch (e) {
                console.error('Threshold evaluation failed:', e);
            }

            router.back();
        } catch (error) {
            console.error('Failed to save water log:', error);
        } finally {
            setSaving(false);
        }
    };

    if (tanksLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const filledCount = Object.values(values).filter((v) => v !== '' && v !== undefined).length;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Tank name */}
                <Surface style={[styles.tankBanner, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                        🪸 {activeTank?.name ?? 'Unknown Tank'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                </Surface>

                {/* Parameter inputs */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Test Results
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                    Enter only the parameters you tested — empty fields won't be saved.
                </Text>

                {WATER_PARAMETERS.map((param) => {
                    const rawValue = values[param.id] ?? '';
                    const numericValue = parseFloat(rawValue);
                    const hasValue = rawValue !== '' && !isNaN(numericValue);

                    let status: string | null = null;
                    if (hasValue) {
                        // For temperature, convert display value to storage value to check status
                        const storageValue = param.id === 'temperature'
                            ? convertTemperatureForStorage(numericValue, preferences.temperature)
                            : numericValue;
                        status = getParameterStatus(param.id, storageValue);
                    }

                    const isTemp = param.id === 'temperature';
                    const displayUnit = isTemp ? preferences.temperature : param.unit;

                    return (
                        <View key={param.id} style={[styles.paramRow, { borderBottomColor: theme.colors.surfaceVariant }]}>
                            <View style={styles.paramLabel}>
                                <Text style={styles.paramEmoji}>{param.emoji}</Text>
                                <View style={styles.paramLabelText}>
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                        {param.label}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.paramInput}>
                                <TextInput
                                    mode="outlined"
                                    value={rawValue}
                                    onChangeText={(text) => handleValueChange(param.id, text)}
                                    keyboardType="decimal-pad"
                                    placeholder="—"
                                    dense
                                    style={styles.input}
                                    outlineStyle={styles.inputOutline}
                                />
                                <Text variant="labelSmall" style={[styles.unitLabel, { color: theme.colors.onSurfaceVariant }]}>
                                    {displayUnit}
                                </Text>
                                <View style={styles.statusBadge}>
                                    {hasValue && status ? (
                                        <Text style={styles.statusEmoji}>{STATUS_EMOJI[status]}</Text>
                                    ) : (
                                        <Text style={styles.statusEmoji}> </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Notes */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface, marginTop: 16 }]}>
                    Notes
                </Text>
                <TextInput
                    mode="outlined"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g., Weekly full panel test"
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                />

                {/* Save button */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving || filledCount === 0}
                    style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                    contentStyle={{ height: 48 }}
                    labelStyle={{ fontWeight: '700', fontSize: 16 }}
                >
                    {filledCount === 0 ? 'Enter at least one reading' : `Save Water Test (${filledCount} parameters)`}
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    tankBanner: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'column',
        gap: 4,
    },
    sectionTitle: { fontWeight: '700', marginBottom: 8 },
    paramRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    paramLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paramEmoji: { fontSize: 18, marginRight: 8 },
    paramLabelText: { flex: 1 },
    paramInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    input: {
        width: 80,
        height: 36,
        fontSize: 14,
        textAlign: 'right',
    },
    inputOutline: { borderRadius: 8 },
    unitLabel: { width: 28, textAlign: 'left' },
    statusBadge: { width: 24, alignItems: 'center' },
    statusEmoji: { fontSize: 16 },
    notesInput: { borderRadius: 8, marginBottom: 16 },
    saveButton: { borderRadius: 12, marginTop: 8 },
});
