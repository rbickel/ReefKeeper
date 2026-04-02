import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Modal, Portal, List, Button, Text, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Tank, TANK_TYPE_LABELS } from '../models/Tank';
import type { AppTheme } from '../constants/Colors';

interface TankSelectorProps {
    tanks: Tank[];
    activeTank: Tank | null;
    onSelect: (id: string) => void;
}

export function TankSelector({ tanks, activeTank, onSelect }: TankSelectorProps) {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const [visible, setVisible] = useState(false);

    const open = () => setVisible(true);
    const close = () => setVisible(false);

    const handleSelect = (id: string) => {
        onSelect(id);
        close();
    };

    const handleAddTank = () => {
        close();
        router.push('/tank/add');
    };

    const label = activeTank
        ? `${TANK_TYPE_LABELS[activeTank.type]?.split(' ')[0] || '🌊'} ${activeTank.name}`
        : '🌊 No Tank';

    return (
        <>
            <View style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceVariant }]}>
                <Chip
                    icon="chevron-down"
                    onPress={open}
                    mode="outlined"
                    style={[styles.chip, { borderColor: theme.colors.primary + '44' }]}
                    textStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                >
                    {label}
                </Chip>
            </View>

            <Portal>
                <Modal
                    visible={visible}
                    onDismiss={close}
                    contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
                >
                    <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                        Select Tank
                    </Text>
                    <Divider />
                    <ScrollView style={styles.list}>
                        {tanks.map((tank) => {
                            const emoji = TANK_TYPE_LABELS[tank.type]?.split(' ')[0] || '🌊';
                            const isActive = activeTank?.id === tank.id;
                            return (
                                <List.Item
                                    key={tank.id}
                                    title={tank.name}
                                    description={TANK_TYPE_LABELS[tank.type]}
                                    left={() => (
                                        <Text style={styles.emoji}>{emoji}</Text>
                                    )}
                                    right={() =>
                                        isActive ? (
                                            <List.Icon icon="check" color={theme.colors.primary} />
                                        ) : null
                                    }
                                    onPress={() => handleSelect(tank.id)}
                                    style={isActive ? { backgroundColor: theme.colors.primary + '11' } : undefined}
                                />
                            );
                        })}
                    </ScrollView>
                    <Divider />
                    <Button
                        mode="text"
                        icon="plus"
                        onPress={handleAddTank}
                        style={styles.addButton}
                    >
                        Add New Tank
                    </Button>
                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    chip: {
        alignSelf: 'flex-start',
        borderRadius: 20,
    },
    modal: {
        marginHorizontal: 24,
        borderRadius: 16,
        maxHeight: '70%',
        overflow: 'hidden',
    },
    modalTitle: {
        fontWeight: '700',
        padding: 16,
    },
    list: {
        maxHeight: 300,
    },
    emoji: {
        fontSize: 24,
        alignSelf: 'center',
        marginLeft: 16,
    },
    addButton: {
        margin: 8,
    },
});
