import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Image } from 'react-native';
import { Text, useTheme, Button, Card, Divider, IconButton, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Creature, CREATURE_TYPE_LABELS } from '../../models/Creature';
import * as creatureService from '../../services/creatureService';
import type { AppTheme } from '../../constants/Colors';

export default function CreatureDetailScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [creature, setCreature] = useState<Creature | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCreature();
    }, [id]);

    const loadCreature = async () => {
        setLoading(true);
        const creatures = await creatureService.getCreatures();
        const found = creatures.find((c) => c.id === id);
        setCreature(found || null);
        setLoading(false);
    };

    const handleArchive = async () => {
        if (!id) return;
        await creatureService.archiveCreature(id);
        router.back();
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!creature) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Creature not found.
                </Text>
                <Button onPress={() => router.back()} style={{ marginTop: 12 }}>
                    Go back
                </Button>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
            {/* Photo */}
            {creature.photoUri ? (
                <Image source={{ uri: creature.photoUri }} style={styles.photo} />
            ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={{ fontSize: 64 }}>
                        {creature.type === 'fish' ? '🐠' : creature.type === 'coral' ? '🪸' : creature.type === 'invertebrate' ? '🦀' : '🌊'}
                    </Text>
                </View>
            )}

            {/* Info */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Content>
                    <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.onSurface }}>
                        {creature.name}
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {creature.species}
                    </Text>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Type</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {CREATURE_TYPE_LABELS[creature.type]}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Quantity</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {creature.quantity}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Acquired</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                            {new Date(creature.dateAcquired).toLocaleDateString()}
                        </Text>
                    </View>
                    {creature.notes ? (
                        <View style={{ marginTop: 12 }}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>Notes</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                                {creature.notes}
                            </Text>
                        </View>
                    ) : null}
                </Card.Content>
            </Card>

            {/* Health Log */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <Card.Title title="Health Log" titleVariant="titleMedium" />
                <Card.Content>
                    {creature.healthLog.length === 0 ? (
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            No health entries yet. Tap the button below to add one.
                        </Text>
                    ) : (
                        creature.healthLog.map((entry) => (
                            <View key={entry.id} style={styles.logEntry}>
                                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                                    {new Date(entry.date).toLocaleDateString()}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                                    {entry.note}
                                </Text>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
                <Button
                    mode="outlined"
                    icon="archive"
                    onPress={handleArchive}
                    textColor={theme.custom.overdue}
                    style={[styles.actionBtn, { borderColor: theme.custom.overdue }]}
                >
                    Archive Creature
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    photo: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
    photoPlaceholder: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    card: { borderRadius: 16, marginBottom: 16 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    logEntry: { marginBottom: 8, borderLeftWidth: 2, borderLeftColor: '#0a84ff', paddingLeft: 8 },
    actions: { marginTop: 8, gap: 8 },
    actionBtn: { borderRadius: 12 },
});
