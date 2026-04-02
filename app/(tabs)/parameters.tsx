import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, Card, FAB, ActivityIndicator, Menu, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTanks } from '../../hooks/useTanks';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import { WATER_PARAMETERS, WaterParameterId, getParameterStatus } from '../../models/WaterParameter';
import { convertTemperatureForDisplay } from '../../models/UnitPreference';
import { Header } from '../../components/Header';
import { ParameterStatusBadge } from '../../components/ParameterStatusBadge';
import type { AppTheme } from '../../constants/Colors';

const STATUS_COLORS: Record<string, string> = {
    ok: '#00b894',
    warning: '#f39c12',
    critical: '#e74c3c',
};

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

export default function ParametersScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { activeTank, loading: tanksLoading } = useTanks();
    const tankId = activeTank?.id ?? '';
    const { logs, latestReadings, loading: logsLoading } = useWaterLogs(tankId);
    const { preferences } = useUnitPreferences();
    const [chartParam, setChartParam] = useState<WaterParameterId>('temperature');
    const [menuVisible, setMenuVisible] = useState(false);
    const [historyData, setHistoryData] = useState<{ date: string; value: number }[]>([]);
    const { getHistory } = useWaterLogs(tankId);

    const loading = tanksLoading || logsLoading;

    // Load chart data for selected parameter
    const loadChartData = useCallback(async (paramId: WaterParameterId) => {
        if (!tankId) return;
        try {
            const data = await getHistory(paramId, 30);
            setHistoryData(data);
        } catch {
            setHistoryData([]);
        }
    }, [tankId, getHistory]);

    React.useEffect(() => {
        if (tankId) {
            loadChartData(chartParam);
        }
    }, [chartParam, tankId, loadChartData]);

    const selectedParamDef = WATER_PARAMETERS.find((p) => p.id === chartParam) ?? WATER_PARAMETERS[0];

    // Find most recent testedAt
    let latestDate: Date | null = null;
    latestReadings.forEach((reading) => {
        const d = new Date(reading.testedAt);
        if (!latestDate || d > latestDate) latestDate = d;
    });

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.content}
            >
                {/* Current Readings Summary */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                        Water Parameters
                    </Text>
                    {latestDate && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Last tested: {getTimeAgo(latestDate)}
                        </Text>
                    )}
                </View>

                {latestReadings.size === 0 ? (
                    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                        <Card.Content style={styles.emptyContent}>
                            <Text style={styles.emptyIcon}>🧪</Text>
                            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}>
                                No water tests yet
                            </Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                                Log your first water test to see parameter readings here.
                            </Text>
                        </Card.Content>
                    </Card>
                ) : (
                    <>
                        {/* Readings grid */}
                        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
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
                                            displayValue = convertTemperatureForDisplay(reading.value, preferences.temperature);
                                            displayUnit = preferences.temperature;
                                        }

                                        return (
                                            <Pressable
                                                key={param.id}
                                                style={[styles.cell, { backgroundColor: theme.colors.surfaceVariant, borderLeftColor: statusColor }]}
                                                onPress={() => {
                                                    setChartParam(param.id);
                                                }}
                                            >
                                                <Text style={styles.cellEmoji}>{param.emoji}</Text>
                                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                                                    {param.label}
                                                </Text>
                                                <View style={styles.cellValueRow}>
                                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                                                        {displayValue.toFixed(param.decimalPlaces)}
                                                    </Text>
                                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
                                                        {displayUnit}
                                                    </Text>
                                                </View>
                                                <ParameterStatusBadge parameterId={param.id} value={reading.value} />
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </Card.Content>
                        </Card>

                        {/* Parameter Chart */}
                        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                            <Card.Content>
                                <View style={styles.chartHeader}>
                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                                        {selectedParamDef.emoji} {selectedParamDef.label} — 30 Day Trend
                                    </Text>
                                    <Menu
                                        visible={menuVisible}
                                        onDismiss={() => setMenuVisible(false)}
                                        anchor={
                                            <Button mode="outlined" compact onPress={() => setMenuVisible(true)} style={styles.paramPicker}>
                                                {selectedParamDef.emoji} {selectedParamDef.label}
                                            </Button>
                                        }
                                    >
                                        {WATER_PARAMETERS.map((p) => (
                                            <Menu.Item
                                                key={p.id}
                                                title={`${p.emoji} ${p.label}`}
                                                onPress={() => {
                                                    setChartParam(p.id);
                                                    setMenuVisible(false);
                                                }}
                                            />
                                        ))}
                                    </Menu>
                                </View>

                                {historyData.length === 0 ? (
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                                        No readings for {selectedParamDef.label} yet.
                                    </Text>
                                ) : (
                                    <View style={styles.chartArea}>
                                        {/* Range labels */}
                                        <View style={styles.rangeLabelRow}>
                                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                Range: {selectedParamDef.ranges.reefLow}–{selectedParamDef.ranges.reefHigh} {selectedParamDef.unit}
                                            </Text>
                                        </View>
                                        {/* Bar chart representation */}
                                        {historyData.slice(0, 15).map((point) => {
                                            const status = getParameterStatus(chartParam, point.value);
                                            const barColor = STATUS_COLORS[status];
                                            const { criticalLow, criticalHigh } = selectedParamDef.ranges;
                                            const rangeMin = criticalLow ?? Math.min(selectedParamDef.ranges.reefLow * 0.8, point.value * 0.9);
                                            const rangeMax = criticalHigh ?? selectedParamDef.ranges.reefHigh * 1.2;
                                            const span = rangeMax - rangeMin || 1;
                                            const pct = Math.max(0, Math.min(100, ((point.value - rangeMin) / span) * 100));

                                            let displayValue = point.value;
                                            let displayUnit = selectedParamDef.unit;
                                            if (chartParam === 'temperature') {
                                                displayValue = convertTemperatureForDisplay(point.value, preferences.temperature);
                                                displayUnit = preferences.temperature;
                                            }

                                            const dateStr = new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                                            return (
                                                <View key={point.date} style={styles.barRow}>
                                                    <Text variant="labelSmall" style={[styles.barDate, { color: theme.colors.onSurfaceVariant }]}>
                                                        {dateStr}
                                                    </Text>
                                                    <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                                                        {/* Reef range indicator */}
                                                        <View
                                                            style={[
                                                                styles.reefRange,
                                                                {
                                                                    left: `${Math.max(0, ((selectedParamDef.ranges.reefLow - rangeMin) / span) * 100)}%`,
                                                                    width: `${Math.min(100, ((selectedParamDef.ranges.reefHigh - selectedParamDef.ranges.reefLow) / span) * 100)}%`,
                                                                },
                                                            ]}
                                                        />
                                                        <View style={[styles.bar, { width: `${pct}%`, backgroundColor: barColor }]} />
                                                    </View>
                                                    <Text variant="labelSmall" style={[styles.barValue, { color: theme.colors.onSurface }]}>
                                                        {displayValue.toFixed(selectedParamDef.decimalPlaces)} {displayUnit}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                        {historyData.length > 15 && (
                                            <Button
                                                mode="text"
                                                compact
                                                onPress={() => router.push('/waterlog/history')}
                                            >
                                                View full history ({historyData.length} readings)
                                            </Button>
                                        )}
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    </>
                )}

                {/* Recent test logs */}
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Water Tests
                </Text>

                {logs.length === 0 ? (
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                        No water tests recorded yet.
                    </Text>
                ) : (
                    logs.slice(0, 10).map((log) => {
                        const logDate = new Date(log.testedAt);
                        const dateStr = logDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                        });
                        const timeStr = logDate.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                        });

                        // Count critical/warnings
                        let critCount = 0;
                        let warnCount = 0;
                        log.readings.forEach((r) => {
                            const s = getParameterStatus(r.parameterId, r.value);
                            if (s === 'critical') critCount++;
                            if (s === 'warning') warnCount++;
                        });

                        return (
                            <Pressable
                                key={log.id}
                                onPress={() => router.push(`/waterlog/${log.id}`)}
                            >
                                <Card style={[styles.logCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
                                    <Card.Content style={styles.logContent}>
                                        <View style={styles.logLeft}>
                                            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                                                {dateStr} · {timeStr}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {log.readings.length} parameters tested
                                                {log.notes ? ` · ${log.notes}` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.logRight}>
                                            {critCount > 0 && <Text style={styles.logBadge}>🔴 {critCount}</Text>}
                                            {warnCount > 0 && <Text style={styles.logBadge}>🟡 {warnCount}</Text>}
                                            {critCount === 0 && warnCount === 0 && <Text style={styles.logBadge}>✅</Text>}
                                        </View>
                                    </Card.Content>
                                </Card>
                            </Pressable>
                        );
                    })
                )}
            </ScrollView>

            <FAB
                icon="plus"
                label="Log Water Test"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
                onPress={() => router.push('/waterlog/add')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 96 },
    sectionHeader: { marginBottom: 16 },
    card: { marginBottom: 16, borderRadius: 16 },
    emptyContent: { alignItems: 'center', paddingVertical: 24 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cell: {
        borderRadius: 10,
        padding: 8,
        minWidth: 90,
        flex: 1,
        flexBasis: '30%',
        alignItems: 'center',
        borderLeftWidth: 3,
    },
    cellEmoji: { fontSize: 16, marginBottom: 2 },
    cellValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    paramPicker: { borderRadius: 8 },
    chartArea: { marginTop: 12 },
    rangeLabelRow: { marginBottom: 8 },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    barDate: { width: 52, fontSize: 10 },
    barTrack: { flex: 1, height: 16, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    reefRange: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(0, 184, 148, 0.15)', borderRadius: 8 },
    bar: { height: '100%', borderRadius: 8, minWidth: 4 },
    barValue: { width: 72, textAlign: 'right', fontSize: 10, marginLeft: 4 },
    sectionTitle: { fontWeight: '700', marginBottom: 12, marginTop: 8 },
    logCard: { marginBottom: 8, borderRadius: 12 },
    logContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logLeft: { flex: 1 },
    logRight: { flexDirection: 'row', gap: 4 },
    logBadge: { fontSize: 14 },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        borderRadius: 16,
    },
});
