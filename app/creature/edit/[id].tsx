import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TextInput, Button, SegmentedButtons, useTheme, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CreatureType, CREATURE_TYPE_LABELS } from '../../../models/Creature';
import * as creatureService from '../../../services/creatureService';
import type { AppTheme } from '../../../constants/Colors';
import ImagePicker from '../../../components/ImagePicker';

export default function EditCreatureScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('');
    const [type, setType] = useState<CreatureType>('fish');
    const [quantity, setQuantity] = useState('1');
    const [notes, setNotes] = useState('');
    const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCreature = async () => {
            setLoading(true);
            setNotFound(false);
            const creatures = await creatureService.getCreatures();
            const creature = creatures.find((c) => c.id === id);
            if (creature) {
                setName(creature.name);
                setSpecies(creature.species);
                setType(creature.type);
                setQuantity(creature.quantity.toString());
                setNotes(creature.notes || '');
                setPhotoUri(creature.photoUri);
            } else {
                setNotFound(true);
            }
            setLoading(false);
        };
        
        loadCreature();
    }, [id]);

    const canSave = name.trim().length > 0 && species.trim().length > 0;

    const handleSave = async () => {
        if (!canSave || !id) return;
        setSaving(true);
        setError('');
        try {
            const parsedQuantity = parseInt(quantity, 10);
            const validQuantity = isNaN(parsedQuantity) ? 1 : Math.max(1, parsedQuantity);
            
            await creatureService.updateCreature(id, {
                name: name.trim(),
                species: species.trim(),
                type,
                quantity: validQuantity,
                notes: notes.trim(),
                photoUri,
            });
            router.back();
        } catch (err) {
            console.error('Failed to update creature:', err);
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
                    Creature not found.
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
                ✏️ Edit Creature
            </Text>

            {error ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.custom.overdue + '22' }]}>
                    <Text variant="bodyMedium" style={{ color: theme.custom.overdue }}>
                        {error}
                    </Text>
                </View>
            ) : null}

            <TextInput
                label="Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. Nemo"
            />

            <TextInput
                label="Species *"
                value={species}
                onChangeText={setSpecies}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. Amphiprion ocellaris"
            />

            <ImagePicker
                value={photoUri}
                onChange={setPhotoUri}
                species={species}
            />

            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                Type
            </Text>
            <SegmentedButtons
                value={type}
                onValueChange={(v) => setType(v as CreatureType)}
                buttons={[
                    { value: 'fish', label: '🐠 Fish' },
                    { value: 'coral', label: '🪸 Coral' },
                    { value: 'invertebrate', label: '🦀 Invert' },
                    { value: 'other', label: '🌊 Other' },
                ]}
                style={styles.segments}
            />

            <TextInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
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
    content: { padding: 16, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { fontWeight: '800', marginBottom: 16 },
    errorContainer: { padding: 12, borderRadius: 8, marginBottom: 12 },
    input: { marginBottom: 12 },
    label: { marginBottom: 6, marginTop: 4 },
    segments: { marginBottom: 12 },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
    button: { flex: 1, borderRadius: 12 },
});
