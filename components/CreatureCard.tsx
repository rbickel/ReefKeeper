import React from 'react';
import { Card, Text, useTheme, IconButton } from 'react-native-paper';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Creature, CREATURE_TYPE_LABELS, CARE_LEVEL_LABELS } from '../models/Creature';
import type { AppTheme } from '../constants/Colors';

interface Props {
    creature: Creature;
    onPress: () => void;
    tankVolumeLiters?: number;
}

export function CreatureCard({ creature, onPress, tankVolumeLiters }: Props) {
    const theme = useTheme<AppTheme>();

    return (
        <Pressable onPress={onPress}>
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
                <View style={styles.row}>
                    {creature.photoUri ? (
                        <Image source={{ uri: creature.photoUri }} style={styles.photo} />
                    ) : (
                        <View style={[styles.photoPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Text style={{ fontSize: 28 }}>
                                {creature.type === 'fish' ? '🐠' : creature.type === 'coral' ? '🪸' : creature.type === 'invertebrate' ? '🦀' : '🌊'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                            {creature.name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {creature.species}
                        </Text>
                        <View style={styles.badges}>
                            <Text variant="labelSmall" style={{ color: theme.colors.secondary }}>
                                {CREATURE_TYPE_LABELS[creature.type]}
                            </Text>
                            {creature.quantity > 1 && (
                                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                                    ×{creature.quantity}
                                </Text>
                            )}
                            {creature.careLevel && (
                                <Text variant="labelSmall">
                                    {CARE_LEVEL_LABELS[creature.careLevel]}
                                </Text>
                            )}
                            {creature.compatibilityNotes ? (
                                <Text variant="labelSmall">⚠️</Text>
                            ) : null}
                            {creature.minTankSizeLiters != null && tankVolumeLiters != null && creature.minTankSizeLiters > tankVolumeLiters ? (
                                <Text variant="labelSmall" style={{ color: theme.custom?.overdue }}>📏 Tank too small</Text>
                            ) : null}
                        </View>
                    </View>
                    <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceVariant} />
                </View>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 12, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    photo: { width: 56, height: 56, borderRadius: 12 },
    photoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: { flex: 1, marginLeft: 12 },
    badges: { flexDirection: 'row', gap: 8, marginTop: 2 },
});
