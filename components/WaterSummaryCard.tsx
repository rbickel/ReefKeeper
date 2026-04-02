import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { WATER_PARAMETERS, WaterParameterId, getParameterStatus } from '../models/WaterParameter';
import { convertTemperatureForDisplay, TemperatureUnit } from '../models/UnitPreference';
import type { AppTheme } from '../constants/Colors';

interface Props {
    latestReadings: Map<WaterParameterId, { value: number; testedAt: string }>;
    temperatureUnit: TemperatureUnit;
}

const STATUS_COLORS: Record<string, string> = {
    ok: '#00b894',
    warning: '#f39c12',
    critical: '#e74c3c',
};

const STATUS_EMOJI: Record<string, string> = {
    ok: '✅',
    warning: '🟡',
    critical: '🔴',
};

export function WaterSummaryCard({ latestReadings, temperatureUnit }: Props) {
    const theme = useTheme<AppTheme>();

    if (latestReadings.size === 0) {
        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Water Parameters" titleVariant="titleMedium" />
                <Card.Content>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        No water tests recorded yet. Log your first test!
                    </Text>
                </Card.Content>
            </Card>
        );
    }

    // Find the most recent testedAt across all readings
    let latestDate: Date | null = null;
    latestReadings.forEach((reading) => {
        const d = new Date(reading.testedAt);
        if (!latestDate || d > latestDate) latestDate = d;
    });

    const timeAgo = latestDate ? getTimeAgo(latestDate) : '';

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
            <Card.Title
                title="Water Parameters"
                titleVariant="titleMedium"
                subtitle={`Last tested: ${timeAgo}`}
            />
            <Card.Content>
                <View style={styles.grid}>
                    {WATER_PARAMETERS.map((param) => {
                        const reading = latestReadings.get(param.id);
                        if (!reading) return null;

                        const status = getParameterStatus(param.id, reading.value);
                        const statusColor = STATUS_COLORS[status];

                        let displayValue = reading.value;
                        let displayUnit = param.unit;
                        if (param.id === 'temperature') {
                            displayValue = convertTemperatureForDisplay(reading.value, temperatureUnit);
                            displayUnit = temperatureUnit;
                        }

                        return (
                            <View
                                key={param.id}
                                style={[styles.cell, { backgroundColor: theme.colors.surfaceVariant, borderLeftColor: statusColor }]}
                            >
                                <Text style={styles.emoji}>{param.emoji}</Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                                    {param.label}
                                </Text>
                                <View style={styles.valueRow}>
                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                                        {displayValue.toFixed(param.decimalPlaces)}
                                    </Text>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
                                        {displayUnit}
                                    </Text>
                                </View>
                                <Text style={styles.statusEmoji}>{STATUS_EMOJI[status]}</Text>
                            </View>
                        );
                    })}
                </View>
            </Card.Content>
        </Card>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
}

const styles = StyleSheet.create({
    card: { marginBottom: 16, borderRadius: 16 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cell: {
        borderRadius: 10,
        padding: 8,
        minWidth: 90,
        flex: 1,
        flexBasis: '30%',
        alignItems: 'center',
        borderLeftWidth: 3,
    },
    emoji: { fontSize: 16, marginBottom: 2 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
    statusEmoji: { fontSize: 12, marginTop: 2 },
});
