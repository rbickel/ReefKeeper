import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { WaterParameterId, getParameterStatus } from '../models/WaterParameter';

interface Props {
    parameterId: WaterParameterId;
    value: number;
    size?: 'small' | 'medium';
}

const STATUS_EMOJI: Record<string, string> = {
    ok: '✅',
    warning: '🟡',
    critical: '🔴',
};

export function ParameterStatusBadge({ parameterId, value, size = 'small' }: Props) {
    const status = getParameterStatus(parameterId, value);
    const emoji = STATUS_EMOJI[status];

    return (
        <View style={[styles.badge, size === 'medium' && styles.badgeMedium]}>
            <Text style={size === 'medium' ? styles.emojiMedium : styles.emojiSmall}>{emoji}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeMedium: {
        marginLeft: 4,
    },
    emojiSmall: {
        fontSize: 14,
    },
    emojiMedium: {
        fontSize: 18,
    },
});
