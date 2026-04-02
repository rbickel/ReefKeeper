import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { TankType, SalinityUnit, TANK_TYPE_LABELS } from '../../models/Tank';
import { convertVolumeForStorage } from '../../models/UnitPreference';
import { useUnitPreferences } from '../../hooks/useUnitPreferences';
import { useTanks } from '../../hooks/useTanks';
import type { AppTheme } from '../../constants/Colors';

const TANK_TYPES = Object.keys(TANK_TYPE_LABELS) as TankType[];

export default function AddTankScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { add } = useTanks();
    const { preferences } = useUnitPreferences();

    const [name, setName] = useState('');
    const [type, setType] = useState<TankType>('mixed-reef');
    const [volume, setVolume] = useState('');
    const [totalSystemVolume, setTotalSystemVolume] = useState('');
    const [salinityUnit, setSalinityUnit] = useState<SalinityUnit>('ppt');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [typeMenuVisible, setTypeMenuVisible] = useState(false);

    const volumeLabel = preferences.volume === 'gal' ? 'gal' : 'L';
    const canSave = name.trim().length > 0 && volume.trim().length > 0 && parseFloat(volume) > 0;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const volumeNum = parseFloat(volume);
            const storedVolume = convertVolumeForStorage(volumeNum, preferences.volume);
            const totalNum = totalSystemVolume.trim() ? parseFloat(totalSystemVolume) : undefined;
            const storedTotal = totalNum != null ? convertVolumeForStorage(totalNum, preferences.volume) : undefined;

            await add({
                name: name.trim(),
                type,
                volumeLiters: storedVolume,
                totalSystemLiters: storedTotal,
                salinityUnit,
                notes: notes.trim(),
                isDefault: false,
                photoUri: undefined,
            });
            router.back();
        } catch (error) {
            console.error('Failed to save tank:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <Text variant="titleLarge" style={[styles.header, { color: theme.colors.primary }]}>
                🪸 New Tank
            </Text>

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
                placeholder={`e.g. ${preferences.volume === 'gal' ? '75' : '284'}`}
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
                    Save Tank
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    header: { fontWeight: '800', marginBottom: 16 },
    input: { marginBottom: 12 },
    label: { marginBottom: 6, marginTop: 4 },
    segments: { marginBottom: 12 },
    typeButton: { marginBottom: 12, borderRadius: 12, alignSelf: 'stretch' },
    typeButtonContent: { justifyContent: 'flex-start' },
    typeMenu: { width: 280 },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    button: { flex: 1, borderRadius: 12 },
});
