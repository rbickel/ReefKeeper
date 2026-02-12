import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import type { AppTheme } from '../constants/Colors';

interface Props {
    icon: string;
    title: string;
    subtitle: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
    const theme = useTheme<AppTheme>();

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {subtitle}
            </Text>
            {actionLabel && onAction && (
                <Button mode="contained" onPress={onAction} style={styles.button}>
                    {actionLabel}
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    subtitle: { textAlign: 'center', marginBottom: 16 },
    button: { borderRadius: 12 },
});
