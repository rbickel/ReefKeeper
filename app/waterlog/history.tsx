import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme, Card, Button, ActivityIndicator, Menu, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTanks } from '../../hooks/useTanks';
import { useWaterLogs } from '../../hooks/useWaterLogs';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import { WATER_PARAMETERS, WaterParameterId, getParameterStatus } from '../../models/WaterParameter';
import { convertTemperatureForDisplay } from '../../models/UnitPreference';
import type { AppTheme } from '../../constants/Colors';

const STATUS_COLORS: Record<string, string> = {
    ok: '#00b894',
    warning: '#f39c12',
    critical: '#e74c3c',
};

export default function ParameterHistoryScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { activeTank, loading: tanksLoading } = useTanks();
    const tankId = activeTank?.id ?? '';
    const { getHistory, loading: logsLoading } = useWaterLogs(tankId);
    const { preferences } = useUnitPreferences();

    const [selectedParam, setSelectedParam] = useState<WaterParameterId>('temperature');
    const [menuVisible, setMenuVisible] = useState(false);
    const [historyData, setHistoryData] = useState<{ date: string; value: number }[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    const paramDef = WATER_PARAMETERS.find((p) => p.id === selectedParam)!;
    const loading = tanksLoading || logsLoading;

    const loadHistory = useCallback(async (paramId: WaterParameterId) => {
        if (!tankId) return;
        setDataLoading(true);
        try {
            const data = await getHistory(paramId);
            setHistoryData(data);
        } catch {
            setHistoryData([]);
        } finally {
            setDataLoading(false);
        }
    }, [tankId, getHistory]);

    useEffect(() => {
        if (tankId) {
            loadHistory(selectedParam);
        }
    }, [selectedParam, tankId, loadHistory]);

    // Statistics
    const stats = React.useMemo(() => {
        if (historyData.length === 0) return null;
        const vals = historyData.map((d) => d.value);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const latest = vals[vals.length - 1] ?? vals[0];
        return { min, max, avg, latest, count: vals.length };
    }, [historyData]);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const isTemp = selectedParam === 'temperature';
    const displayUnit = isTemp ? preferences.temperature : paramDef.unit;

    const formatValue = (val: number): string => {
        const dv = isTemp ? convertTemperatureForDisplay(val, preferences.temperature) : val;
        return dv.toFixed(paramDef.decimalPlaces);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Parameter selector */}
            <View style={styles.selectorRow}>
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                    Parameter History
                </Text>
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button mode="outlined" compact onPress={() => setMenuVisible(true)} style={styles.paramPicker}>
                            {paramDef.emoji} {paramDef.label}
                        </Button>
                    }
                >
                    {WATER_PARAMETERS.map((p) => (
                        <Menu.Item
                            key={p.id}
                            title={`${p.emoji} ${p.label}`}
                            onPress={() => {
                                setSelectedParam(p.id);
                                setMenuVisible(false);
                            }}
                        />
                    ))}
                </Menu>
            </View>

            {/* Statistics */}
            {stats && (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Title title="Statistics" titleVariant="titleMedium" />
                    <Card.Content>
                        <View style={styles.statsGrid}>
                            <Surface style={[styles.statCell, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                                    {formatValue(stats.latest)}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Latest
                                </Text>
                            </Surface>
                            <Surface style={[styles.statCell, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Text variant="titleLarge" style={{ color: theme.colors.secondary, fontWeight: '700' }}>
                                    {formatValue(stats.avg)}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Average
                                </Text>
                            </Surface>
                            <Surface style={[styles.statCell, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                                    {formatValue(stats.min)}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Min
                                </Text>
                            </Surface>
                            <Surface style={[styles.statCell, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                                    {formatValue(stats.max)}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Max
                                </Text>
                            </Surface>
                            <Surface style={[styles.statCell, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                                    {stats.count}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Readings
                                </Text>
                            </Surface>
                        </View>
                    </Card.Content>
                </Card>
            )}

            {/* Reef range legend */}
            <View style={styles.legendRow}>
                <View style={[styles.legendSwatch, { backgroundColor: 'rgba(0, 184, 148, 0.2)' }]} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Reef range: {paramDef.ranges.reefLow}–{paramDef.ranges.reefHigh} {paramDef.unit}
                </Text>
            </View>

            {/* History readings with visual bars */}
            {dataLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} size="large" color={theme.colors.primary} />
            ) : historyData.length === 0 ? (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Content style={styles.emptyContent}>
                        <Text style={{ fontSize: 48, marginBottom: 12 }}>📈</Text>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}>
                            No {paramDef.label} readings yet
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                            Log a water test to start tracking history.
                        </Text>
                    </Card.Content>
                </Card>
            ) : (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                    <Card.Content>
                        {historyData.map((point, idx) => {
                            const status = getParameterStatus(selectedParam, point.value);
                            const barColor = STATUS_COLORS[status];

                            const { criticalLow, criticalHigh } = paramDef.ranges;
                            const rangeMin = criticalLow ?? Math.min(paramDef.ranges.reefLow * 0.8, point.value * 0.9);
                            const rangeMax = criticalHigh ?? paramDef.ranges.reefHigh * 1.2;
                            const span = rangeMax - rangeMin || 1;
                            const pct = Math.max(0, Math.min(100, ((point.value - rangeMin) / span) * 100));

                            const reefLowPct = Math.max(0, ((paramDef.ranges.reefLow - rangeMin) / span) * 100);
                            const reefWidthPct = Math.min(100 - reefLowPct, ((paramDef.ranges.reefHigh - paramDef.ranges.reefLow) / span) * 100);

                            const displayVal = formatValue(point.value);
                            const dateStr = new Date(point.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                            });

                            const statusEmoji = status === 'ok' ? '✅' : status === 'warning' ? '🟡' : '🔴';

                            return (
                                <View key={idx} style={styles.historyRow}>
                                    <Text variant="labelSmall" style={[styles.histDate, { color: theme.colors.onSurfaceVariant }]}>
                                        {dateStr}
                                    </Text>
                                    <View style={[styles.histTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                                        <View
                                            style={[
                                                styles.reefRange,
                                                {
                                                    left: `${reefLowPct}%`,
                                                    width: `${reefWidthPct}%`,
                                                },
                                            ]}
                                        />
                                        <View style={[styles.histBar, { width: `${pct}%`, backgroundColor: barColor }]} />
                                    </View>
                                    <Text variant="labelSmall" style={[styles.histValue, { color: theme.colors.onSurface }]}>
                                        {displayVal} {displayUnit}
                                    </Text>
                                    <Text style={styles.histBadge}>{statusEmoji}</Text>
                                </View>
                            );
                        })}
                    </Card.Content>
                </Card>
            )}

            {/* Log new test button */}
            <Button
                mode="contained"
                icon="plus"
                onPress={() => router.push('/waterlog/add')}
                style={[styles.logButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontWeight: '700' }}
            >
                Log New Test
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    selectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
    },
    paramPicker: { borderRadius: 8 },
    card: { marginBottom: 16, borderRadius: 16 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statCell: {
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        minWidth: 80,
        flex: 1,
        flexBasis: '28%',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    legendSwatch: {
        width: 16,
        height: 12,
        borderRadius: 3,
    },
    emptyContent: { alignItems: 'center', paddingVertical: 24 },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    histDate: { width: 52, fontSize: 10 },
    histTrack: {
        flex: 1,
        height: 18,
        borderRadius: 9,
        overflow: 'hidden',
        position: 'relative',
    },
    reefRange: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 184, 148, 0.15)',
        borderRadius: 9,
    },
    histBar: {
        height: '100%',
        borderRadius: 9,
        minWidth: 4,
    },
    histValue: {
        width: 72,
        textAlign: 'right',
        fontSize: 10,
        marginLeft: 4,
    },
    histBadge: {
        fontSize: 12,
        marginLeft: 4,
        width: 20,
    },
    logButton: { borderRadius: 12, marginTop: 8 },
});
