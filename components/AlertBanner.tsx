import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { WATER_PARAMETERS, WaterParameterId, getParameterStatus } from '../models/WaterParameter';
import { convertTemperatureForDisplay, TemperatureUnit } from '../models/UnitPreference';
import type { AppTheme } from '../constants/Colors';

interface Props {
    latestReadings: Map<WaterParameterId, { value: number; testedAt: string }>;
    temperatureUnit: TemperatureUnit;
}

interface Alert {
    level: 'critical' | 'warning' | 'stale';
    message: string;
}

export function AlertBanner({ latestReadings, temperatureUnit }: Props) {
    const theme = useTheme<AppTheme>();

    if (latestReadings.size === 0) {
        return (
            <Surface style={[styles.banner, styles.infoBanner, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    🧪 No water test recorded yet
                </Text>
            </Surface>
        );
    }

    const alerts: Alert[] = [];

    // Check staleness — find most recent testedAt
    let latestDate: number = 0;
    latestReadings.forEach((reading) => {
        const d = new Date(reading.testedAt).getTime();
        if (d > latestDate) latestDate = d;
    });

    if (latestDate > 0) {
        const daysSince = Math.floor((Date.now() - latestDate) / (1000 * 60 * 60 * 24));
        if (daysSince > 7) {
            alerts.push({
                level: 'stale',
                message: `⚠️ Last test was ${daysSince} days ago`,
            });
        }
    }

    // Check each parameter
    WATER_PARAMETERS.forEach((param) => {
        const reading = latestReadings.get(param.id);
        if (!reading) return;

        const status = getParameterStatus(param.id, reading.value);
        if (status === 'ok') return;

        let displayValue = reading.value;
        let displayUnit = param.unit;
        if (param.id === 'temperature') {
            displayValue = convertTemperatureForDisplay(reading.value, temperatureUnit);
            displayUnit = temperatureUnit;
        }

        const formatted = `${displayValue.toFixed(param.decimalPlaces)} ${displayUnit}`.trim();

        if (status === 'critical') {
            const threshold = reading.value > (param.ranges.reefHigh)
                ? `above critical threshold (${param.ranges.criticalHigh} ${param.unit})`
                : `below critical threshold (${param.ranges.criticalLow} ${param.unit})`;
            alerts.push({
                level: 'critical',
                message: `🔴 ${param.label} at ${formatted} — ${threshold}`,
            });
        } else if (status === 'warning') {
            const direction = reading.value > param.ranges.reefHigh
                ? `above recommended range (${param.ranges.reefLow}-${param.ranges.reefHigh} ${param.unit})`
                : `below recommended range (${param.ranges.reefLow}-${param.ranges.reefHigh} ${param.unit})`;
            alerts.push({
                level: 'warning',
                message: `🟡 ${param.label} at ${formatted} — ${direction}`,
            });
        }
    });

    if (alerts.length === 0) {
        return (
            <Surface style={[styles.banner, { backgroundColor: '#e6f9f0' }]} elevation={0}>
                <Text variant="bodyMedium" style={{ color: '#00b894' }}>
                    ✅ All parameters in range
                </Text>
            </Surface>
        );
    }

    // Sort: critical first, then warning, then stale
    const order: Record<string, number> = { critical: 0, warning: 1, stale: 2 };
    alerts.sort((a, b) => order[a.level] - order[b.level]);

    const hasCritical = alerts.some((a) => a.level === 'critical');
    const bannerBg = hasCritical ? '#fde8e8' : '#fef9e7';

    return (
        <Surface style={[styles.banner, { backgroundColor: bannerBg }]} elevation={0}>
            {alerts.map((alert, idx) => (
                <Text key={idx} variant="bodySmall" style={styles.alertText}>
                    {alert.message}
                </Text>
            ))}
        </Surface>
    );
}

const styles = StyleSheet.create({
    banner: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    infoBanner: {},
    alertText: {
        marginBottom: 4,
        lineHeight: 20,
    },
});
