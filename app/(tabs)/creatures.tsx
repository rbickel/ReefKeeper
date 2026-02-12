import { View, FlatList, StyleSheet } from 'react-native';
import { FAB, Text, Searchbar, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useCreatures } from '../../hooks/useCreatures';
import { CreatureType, CREATURE_TYPE_LABELS } from '../../models/Creature';
import { CreatureCard } from '../../components/CreatureCard';
import type { AppTheme } from '../../constants/Colors';

const TYPES: (CreatureType | 'all')[] = ['all', 'fish', 'coral', 'invertebrate', 'other'];

export default function CreaturesScreen() {
    const theme = useTheme<AppTheme>();
    const router = useRouter();
    const { creatures, loading } = useCreatures();
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<CreatureType | 'all'>('all');

    const filtered = useMemo(() => {
        let result = creatures;
        if (selectedType !== 'all') {
            result = result.filter((c) => c.type === selectedType);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.species.toLowerCase().includes(q)
            );
        }
        return result;
    }, [creatures, search, selectedType]);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Search */}
            <View style={styles.searchArea}>
                <Searchbar
                    placeholder="Search creatures..."
                    onChangeText={setSearch}
                    value={search}
                    style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
                    inputStyle={{ fontSize: 14 }}
                />
                <View style={styles.chips}>
                    {TYPES.map((type) => (
                        <Chip
                            key={type}
                            selected={selectedType === type}
                            onPress={() => setSelectedType(type)}
                            mode="outlined"
                            compact
                            style={
                                selectedType === type
                                    ? { backgroundColor: theme.colors.primary + '22' }
                                    : undefined
                            }
                        >
                            {type === 'all' ? '🌊 All' : CREATURE_TYPE_LABELS[type]}
                        </Chip>
                    ))}
                </View>
            </View>

            {/* List */}
            {filtered.length === 0 ? (
                <View style={styles.center}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {creatures.length === 0
                            ? '🐠 No creatures yet!\nTap + to add your first.'
                            : 'No matches found.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <CreatureCard
                            creature={item}
                            onPress={() => router.push(`/creature/${item.id}`)}
                        />
                    )}
                />
            )}

            {/* FAB */}
            <FAB
                icon="plus"
                onPress={() => router.push('/creature/add')}
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="#fff"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    searchArea: { padding: 12, gap: 8 },
    searchBar: { borderRadius: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    list: { padding: 12, paddingBottom: 80, gap: 8 },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        borderRadius: 16,
    },
});
