import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, Card, Button, ActivityIndicator, Divider, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTanks } from '../../hooks/useTanks';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import { WATER_PARAMETERS, getParameterStatus } from '../../models/WaterParameter';
import { WaterLog } from '../../models/WaterLog';
import { convertTemperatureForDisplay } from '../../models/UnitPreference';
import { ParameterStatusBadge } from '../../components/ParameterStatusBadge';
import type { AppTheme } from '../../constants/Colors';

const STATUS_EMOJI: Record<string, string> = {
    ok: '✅',
    warning: '🟡',
    critical: '🔴',
};

const STATUS_LABELS: Record<string, string> = {
    ok: 'In range',
    warning: 'Warning',
    critical: 'Critical',
};

export default function WaterLogDetailScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { activeTank, tanks, loading: tanksLoading } = useTanks();
    const tankId = activeTank?.id ?? '';
    const { logs, loading: logsLoading, remove } = useWaterLogs(tankId);
    const { preferences } = useUnitPreferences();

    const loading = tanksLoading || logsLoading;

    const log = logs.find((l) => l.id === id);

    // Also check all tanks' logs if not found in active tank
    const [allTankLog, setAllTankLog] = useState<WaterLog | null>(null);
    useEffect(() => {
        if (!log && !loading && id) {
            // The log might be in a different tank — for now just use what we have
            setAllTankLog(null);
        }
    }, [log, loading, id]);

    const displayLog = log ?? allTankLog;

    const handleDelete = () => {
        Alert.alert(
            'Delete Water Test',
            'Are you sure you want to delete this water test? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (id) {
                            await remove(id);
                            router.back();
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!displayLog) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    Water test not found
                </Text>
                <Button mode="text" onPress={() => router.back()} style={{ marginTop: 12 }}>
                    Go back
                </Button>
            </View>
        );
    }

    const testedDate = new Date(displayLog.testedAt);
    const dateStr = testedDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const timeStr = testedDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });

    const tank = tanks.find((t) => t.id === displayLog.tankId);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Header info */}
            <Surface style={[styles.headerBanner, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    🧪 Water Test
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {dateStr} at {timeStr}
                </Text>
                {tank && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        🪸 {tank.name}
                    </Text>
                )}
            </Surface>

            {/* Readings */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Readings" titleVariant="titleMedium" />
                <Card.Content>
                    {displayLog.readings.map((reading, idx) => {
                        const paramDef = WATER_PARAMETERS.find((p) => p.id === reading.parameterId);
                        if (!paramDef) return null;

                        const status = getParameterStatus(reading.parameterId, reading.value);
                        let displayValue = reading.value;
                        let displayUnit = paramDef.unit;
                        if (reading.parameterId === 'temperature') {
                            displayValue = convertTemperatureForDisplay(reading.value, preferences.temperature);
                            displayUnit = preferences.temperature;
                        }

                        return (
                            <View key={reading.parameterId}>
                                {idx > 0 && <Divider style={{ marginVertical: 8 }} />}
                                <View style={styles.readingRow}>
                                    <View style={styles.readingLeft}>
                                        <Text style={styles.readingEmoji}>{paramDef.emoji}</Text>
                                        <View>
                                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                                {paramDef.label}
                                            </Text>
                                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {STATUS_LABELS[status]}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.readingRight}>
                                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                                            {displayValue.toFixed(paramDef.decimalPlaces)} {displayUnit}
                                        </Text>
                                        <ParameterStatusBadge parameterId={reading.parameterId} value={reading.value} size="medium" />
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </Card.Content>
            </Card>

            {/* Notes */}
            {displayLog.notes ? (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Title title="Notes" titleVariant="titleMedium" />
                    <Card.Content>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {displayLog.notes}
                        </Text>
                    </Card.Content>
                </Card>
            ) : null}

            {/* Delete button */}
            <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                textColor={theme.colors.error}
                style={styles.deleteButton}
            >
                Delete Water Test
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    headerBanner: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    card: { marginBottom: 16, borderRadius: 16 },
    readingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    readingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    readingEmoji: { fontSize: 22 },
    readingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deleteButton: {
        borderRadius: 12,
        borderColor: '#e74c3c',
        marginTop: 8,
    },
});
