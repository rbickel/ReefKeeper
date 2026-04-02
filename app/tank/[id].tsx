import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert, Platform } from 'react-native';
import { Text, useTheme, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Tank, TANK_TYPE_LABELS } from '../../models/Tank';
import { formatVolume } from '../../models/UnitPreference';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import * as tankService from '../../services/tankService';
import * as creatureService from '../../services/creatureService';
import * as taskService from '../../services/taskService';
import type { AppTheme } from '../../constants/Colors';

export default function TankDetailScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { preferences } = useUnitPreferences();

    const [tank, setTank] = useState<Tank | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatureCount, setCreatureCount] = useState(0);
    const [taskCount, setTaskCount] = useState(0);
    const [totalTanks, setTotalTanks] = useState(0);

    const loadTank = useCallback(async () => {
        setLoading(true);
        try {
            const tanks = await tankService.getTanks();
            setTotalTanks(tanks.length);
            const found = tanks.find((t) => t.id === id);
            setTank(found || null);

            if (found) {
                const creatures = await creatureService.getCreaturesByTank(found.id);
                setCreatureCount(creatures.length);
                const tasks = await taskService.getTasksByTank(found.id);
                setTaskCount(tasks.length);
            }
        } catch (error) {
            console.error('Failed to load tank:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadTank();
    }, [loadTank]);

    const handleDelete = () => {
        if (totalTanks <= 1) {
            const msg = 'This is your only tank — it cannot be deleted.';
            if (Platform.OS === 'web') {
                alert(msg);
            } else {
                Alert.alert('Cannot Delete', msg);
            }
            return;
        }

        const doDelete = async () => {
            try {
                await tankService.deleteTank(id!);
                router.back();
            } catch (error) {
                console.error('Failed to delete tank:', error);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('Are you sure you want to delete this tank? This cannot be undone.')) {
                doDelete();
            }
        } else {
            Alert.alert(
                'Delete Tank',
                'Are you sure you want to delete this tank? This cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!tank) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Tank not found.
                </Text>
                <Button onPress={() => router.back()} style={{ marginTop: 12 }}>
                    Go back
                </Button>
            </View>
        );
    }

    const emoji = TANK_TYPE_LABELS[tank.type]?.split(' ')[0] || '🌊';

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            {/* Photo / Placeholder */}
            <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={{ fontSize: 64 }}>{emoji}</Text>
            </View>

            {/* Info */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Content>
                    <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.onSurface }}>
                        {tank.name}
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {TANK_TYPE_LABELS[tank.type]}
                    </Text>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Volume</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {formatVolume(tank.volumeLiters, preferences.volume)}
                        </Text>
                    </View>

                    {tank.totalSystemLiters != null && (
                        <View style={styles.detailRow}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>System Volume</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                {formatVolume(tank.totalSystemLiters, preferences.volume)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Salinity Unit</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {tank.salinityUnit === 'ppt' ? 'PPT' : 'Specific Gravity'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Created</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {new Date(tank.createdAt).toLocaleDateString()}
                        </Text>
                    </View>

                    {tank.notes ? (
                        <View style={{ marginTop: 12 }}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Notes</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                                {tank.notes}
                            </Text>
                        </View>
                    ) : null}
                </Card.Content>
            </Card>

            {/* Stats */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Tank Stats" titleVariant="titleMedium" />
                <Card.Content>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Creatures</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {creatureCount}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Tasks</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {taskCount}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
                <Button
                    mode="contained"
                    icon="pencil"
                    onPress={() => router.push(`/tank/edit/${id}`)}
                    style={styles.actionBtn}
                >
                    Edit Tank
                </Button>
                <Button
                    mode="outlined"
                    icon="delete"
                    onPress={handleDelete}
                    disabled={totalTanks <= 1}
                    textColor={totalTanks > 1 ? theme.custom.overdue : theme.colors.onSurfaceVariant}
                    style={[styles.actionBtn, totalTanks > 1 ? { borderColor: theme.custom.overdue } : undefined]}
                >
                    {totalTanks <= 1 ? 'Only Tank' : 'Delete Tank'}
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    photoPlaceholder: {
        height: 180,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: { marginBottom: 16, borderRadius: 16 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    actions: {
        gap: 12,
        marginTop: 8,
    },
    actionBtn: {
        borderRadius: 12,
    },
});
