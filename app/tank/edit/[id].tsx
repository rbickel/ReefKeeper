import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, useTheme, Text, ActivityIndicator, Menu } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TankType, SalinityUnit, TANK_TYPE_LABELS } from '../../../models/Tank';
import { convertVolumeForDisplay, convertVolumeForStorage } from '../../../models/UnitPreference';
import { useUnitPreferences } from '../../../hooks/useUnitPreferences';
import * as tankService from '../../../services/tankService';
import type { AppTheme } from '../../../constants/Colors';

const TANK_TYPES = Object.keys(TANK_TYPE_LABELS) as TankType[];

export default function EditTankScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { preferences } = useUnitPreferences();

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<TankType>('mixed-reef');
    const [volume, setVolume] = useState('');
    const [totalSystemVolume, setTotalSystemVolume] = useState('');
    const [salinityUnit, setSalinityUnit] = useState<SalinityUnit>('ppt');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [typeMenuVisible, setTypeMenuVisible] = useState(false);

    const volumeLabel = preferences.volume === 'gal' ? 'gal' : 'L';

    useEffect(() => {
        const loadTank = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const tanks = await tankService.getTanks();
                const tank = tanks.find((t) => t.id === id);
                if (tank) {
                    setName(tank.name);
                    setType(tank.type);
                    setVolume(convertVolumeForDisplay(tank.volumeLiters, preferences.volume).toFixed(0));
                    setTotalSystemVolume(
                        tank.totalSystemLiters != null
                            ? convertVolumeForDisplay(tank.totalSystemLiters, preferences.volume).toFixed(0)
                            : ''
                    );
                    setSalinityUnit(tank.salinityUnit);
                    setNotes(tank.notes || '');
                } else {
                    setNotFound(true);
                }
            } catch (err) {
                console.error('Failed to load tank:', err);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        loadTank();
    }, [id, preferences.volume]);

    const canSave = name.trim().length > 0 && volume.trim().length > 0 && parseFloat(volume) > 0;

    const handleSave = async () => {
        if (!canSave || !id) return;
        setSaving(true);
        setError('');
        try {
            const volumeNum = parseFloat(volume);
            const storedVolume = convertVolumeForStorage(volumeNum, preferences.volume);
            const totalNum = totalSystemVolume.trim() ? parseFloat(totalSystemVolume) : undefined;
            const storedTotal = totalNum != null ? convertVolumeForStorage(totalNum, preferences.volume) : undefined;

            await tankService.updateTank(id, {
                name: name.trim(),
                type,
                volumeLiters: storedVolume,
                totalSystemLiters: storedTotal,
                salinityUnit,
                notes: notes.trim(),
            });
            router.back();
        } catch (err) {
            console.error('Failed to update tank:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (notFound) {
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

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <Text variant="titleLarge" style={[styles.header, { color: theme.colors.primary }]}>
                ✏️ Edit Tank
            </Text>

            {error ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.custom.overdue + '22' }]}>
                    <Text variant="bodyMedium" style={{ color: theme.custom.overdue }}>
                        {error}
                    </Text>
                </View>
            ) : null}

            <TextInput
                label="Tank Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. My Reef Tank"
            />

            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                Tank Type
            </Text>
            <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                    <Button
                        mode="outlined"
                        onPress={() => setTypeMenuVisible(true)}
                        style={[styles.typeButton, { borderColor: theme.colors.outline }]}
                        contentStyle={styles.typeButtonContent}
                        icon="chevron-down"
                    >
                        {TANK_TYPE_LABELS[type]}
                    </Button>
                }
                style={styles.typeMenu}
            >
                <ScrollView style={{ maxHeight: 300 }}>
                    {TANK_TYPES.map((t) => (
                        <Menu.Item
                            key={t}
                            title={TANK_TYPE_LABELS[t]}
                            onPress={() => {
                                setType(t);
                                setTypeMenuVisible(false);
                            }}
                            leadingIcon={type === t ? 'check' : undefined}
                        />
                    ))}
                </ScrollView>
            </Menu>

            <TextInput
                label={`Volume (${volumeLabel}) *`}
                value={volume}
                onChangeText={setVolume}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
            />

            <TextInput
                label={`Total System Volume (${volumeLabel})`}
                value={totalSystemVolume}
                onChangeText={setTotalSystemVolume}
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="Including sump, refugium, etc."
            />

            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                Salinity Unit
            </Text>
            <SegmentedButtons
                value={salinityUnit}
                onValueChange={(v) => setSalinityUnit(v as SalinityUnit)}
                buttons={[
                    { value: 'ppt', label: 'PPT (parts per thousand)' },
                    { value: 'sg', label: 'SG (specific gravity)' },
                ]}
                style={styles.segments}
            />

            <TextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="Any additional notes..."
            />

            <View style={styles.buttons}>
                <Button
                    mode="outlined"
                    onPress={() => router.back()}
                    style={styles.button}
                >
                    Cancel
                </Button>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={saving}
                    disabled={!canSave || saving}
                    style={[styles.button, { backgroundColor: canSave ? theme.colors.primary : undefined }]}
                >
                    Save Changes
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    header: { fontWeight: '800', marginBottom: 16 },
    input: { marginBottom: 12 },
    label: { marginBottom: 6, marginTop: 4 },
    segments: { marginBottom: 12 },
    typeButton: { marginBottom: 12, borderRadius: 12, alignSelf: 'stretch' },
    typeButtonContent: { justifyContent: 'flex-start' },
    typeMenu: { width: 280 },
    errorContainer: { padding: 12, borderRadius: 8, marginBottom: 12 },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    button: { flex: 1, borderRadius: 12 },
});
