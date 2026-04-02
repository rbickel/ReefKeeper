import React from 'react';
import { ScrollView, View, StyleSheet, useColorScheme as useRNColorScheme } from 'react-native';
import { Text, useTheme, Card, Button, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useUnitPreferences } from '../hooks/useUnitPreferences';
import { useTanks } from '../hooks/useTanks';
import { TANK_TYPE_LABELS } from '../models/Tank';
import type { AppTheme } from '../constants/Colors';

export default function SettingsScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const colorScheme = useRNColorScheme();
    const { preferences, setSystem } = useUnitPreferences();
    const { tanks } = useTanks();

    const handleExportData = async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const allData = await AsyncStorage.multiGet(allKeys);
            const exportObj: Record<string, unknown> = {};
            for (const [key, value] of allData) {
                if (key.startsWith('@reef_keeper')) {
                    exportObj[key] = value ? JSON.parse(value) : null;
                }
            }
            // In a full implementation, this would use Sharing API or Clipboard
            console.log('Export data:', JSON.stringify(exportObj, null, 2));
            alert('Data exported to console (sharing coming soon!)');
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleClearData = async () => {
        const keys = await AsyncStorage.getAllKeys();
        const reefKeys = keys.filter((k) => k.startsWith('@reef_keeper'));
        await AsyncStorage.multiRemove(reefKeys);
        alert('All data cleared. Restart the app to re-initialise default tasks.');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            <Text variant="headlineMedium" style={[styles.header, { color: theme.colors.primary }]}>
                ⚙️ Settings
            </Text>

            {/* Appearance */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Appearance" titleVariant="titleMedium" />
                <Card.Content>
                    <View style={styles.settingRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            Theme
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {colorScheme === 'dark' ? '🌙 Dark' : '☀️ Light'} (system)
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Units */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Units" titleVariant="titleMedium" />
                <Card.Content>
                    <Text variant="labelLarge" style={[styles.unitLabel, { color: theme.colors.onSurface }]}>
                        Unit System
                    </Text>
                    <SegmentedButtons
                        value={preferences.system}
                        onValueChange={(v) => setSystem(v as 'metric' | 'imperial')}
                        buttons={[
                            { value: 'metric', label: '📏 Metric' },
                            { value: 'imperial', label: '📐 Imperial' },
                        ]}
                        style={{ marginBottom: 12 }}
                    />
                    <View style={styles.settingRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            Temperature
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {preferences.temperature}
                        </Text>
                    </View>
                    <View style={styles.settingRow}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            Volume
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            {preferences.volume === 'L' ? 'Liters' : 'Gallons'}
                        </Text>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, fontStyle: 'italic' }}>
                        Data is always stored in metric — switching units only changes display.
                    </Text>
                </Card.Content>
            </Card>

            {/* Tank Management */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Tank Management" titleVariant="titleMedium" />
                <Card.Content>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                        {tanks.length} {tanks.length === 1 ? 'tank' : 'tanks'} configured
                    </Text>
                    {tanks.map((tank) => {
                        const emoji = TANK_TYPE_LABELS[tank.type]?.split(' ')[0] || '🌊';
                        return (
                            <View key={tank.id} style={styles.tankRow}>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                                    {emoji} {tank.name}
                                </Text>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => router.push(`/tank/${tank.id}`)}
                                >
                                    View
                                </Button>
                            </View>
                        );
                    })}
                    <Button
                        mode="outlined"
                        icon="plus"
                        onPress={() => router.push('/tank/add')}
                        style={[styles.dataButton, { marginTop: 8 }]}
                    >
                        Add New Tank
                    </Button>
                </Card.Content>
            </Card>

            {/* Data */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Data Management" titleVariant="titleMedium" />
                <Card.Content>
                    <Button
                        mode="outlined"
                        icon="export"
                        onPress={handleExportData}
                        style={styles.dataButton}
                    >
                        Export Data (JSON)
                    </Button>
                    <Button
                        mode="outlined"
                        icon="delete-sweep"
                        onPress={handleClearData}
                        textColor={theme.custom.overdue}
                        style={[styles.dataButton, { borderColor: theme.custom.overdue }]}
                    >
                        Clear All Data
                    </Button>
                </Card.Content>
            </Card>

            {/* About */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="About" titleVariant="titleMedium" />
                <Card.Content>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        ReefKeeper v1.0.0
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        Track your reef aquarium creatures and stay on top of maintenance tasks.
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    header: { fontWeight: '800', marginBottom: 16 },
    card: { borderRadius: 16, marginBottom: 16 },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    dataButton: { marginBottom: 8, borderRadius: 12 },
    unitLabel: { marginBottom: 8 },
    tankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
});
