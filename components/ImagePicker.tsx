import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Text, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import Constants from 'expo-constants';
import type { AppTheme } from '../constants/Colors';

interface ImagePickerProps {
    value?: string;
    onChange: (uri: string | undefined) => void;
    species?: string;
}

interface UnsplashImage {
    id: string;
    urls: {
        small: string;
        regular: string;
    };
    alt_description?: string;
    user: {
        name: string;
    };
}

export default function ImagePicker({ value, onChange, species }: ImagePickerProps) {
    const theme = useTheme<AppTheme>();
    const [suggestions, setSuggestions] = useState<UnsplashImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Get Unsplash access key from app config
    const unsplashAccessKey = Constants.expoConfig?.extra?.unsplashAccessKey;

    const pickImage = async () => {
        // Request permissions
        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
            return;
        }

        // Launch image picker
        const result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            onChange(result.assets[0].uri);
        }
    };

    const fetchSuggestions = async () => {
        if (!species || species.trim().length === 0) {
            Alert.alert('No Species', 'Please enter a species name first to search for images.');
            return;
        }

        if (!unsplashAccessKey) {
            Alert.alert('Feature Unavailable', 'Image search is not configured. Please contact support or upload your own image.');
            return;
        }

        setLoading(true);
        setShowSuggestions(true);
        try {
            // Use a more permissive query that combines species with marine life keywords
            const query = encodeURIComponent(`${species} marine fish aquarium`);
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${query}&per_page=12&client_id=${unsplashAccessKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }

            const data = await response.json();
            setSuggestions(data.results || []);
        } catch (error) {
            console.error('Error fetching image suggestions:', error);
            Alert.alert('Error', 'Could not fetch image suggestions. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestion = (image: UnsplashImage) => {
        onChange(image.urls.regular);
        setShowSuggestions(false);
    };

    const removeImage = () => {
        onChange(undefined);
    };

    return (
        <View style={styles.container}>
            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurface }]}>
                Photo
            </Text>

            {value ? (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: value }}
                        style={[styles.preview, { borderColor: theme.colors.outline }]}
                        resizeMode="cover"
                    />
                    <Button
                        mode="outlined"
                        onPress={removeImage}
                        icon="close"
                        style={styles.removeButton}
                    >
                        Remove Photo
                    </Button>
                </View>
            ) : (
                <View style={styles.buttons}>
                    <Button
                        mode="outlined"
                        onPress={pickImage}
                        icon="upload"
                        style={styles.actionButton}
                    >
                        Upload Photo
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={fetchSuggestions}
                        icon="magnify"
                        style={styles.actionButton}
                        disabled={!species || species.trim().length === 0}
                    >
                        Find Images
                    </Button>
                </View>
            )}

            {showSuggestions && (
                <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={styles.suggestionsHeader}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                            Image Suggestions
                        </Text>
                        <Chip onClose={() => setShowSuggestions(false)}>
                            Close
                        </Chip>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
                                Searching for images...
                            </Text>
                        </View>
                    ) : suggestions.length > 0 ? (
                        <>
                            <Text variant="bodySmall" style={[styles.attribution, { color: theme.colors.onSurfaceVariant }]}>
                                Images from Unsplash. Tap to select.
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                                {suggestions.map((image) => (
                                    <TouchableOpacity
                                        key={image.id}
                                        onPress={() => selectSuggestion(image)}
                                        style={styles.suggestionItem}
                                    >
                                        <Image
                                            source={{ uri: image.urls.small }}
                                            style={[styles.suggestionImage, { borderColor: theme.colors.outline }]}
                                            resizeMode="cover"
                                        />
                                        <Text
                                            variant="bodySmall"
                                            numberOfLines={2}
                                            style={[styles.suggestionCaption, { color: theme.colors.onSurfaceVariant }]}
                                        >
                                            by {image.user.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    ) : (
                        <View style={styles.noResultsContainer}>
                            <Text style={{ color: theme.colors.onSurfaceVariant }}>
                                No images found for &quot;{species}&quot;. Try a different species name.
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    label: {
        marginBottom: 8,
    },
    previewContainer: {
        alignItems: 'center',
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
    },
    removeButton: {
        borderRadius: 8,
    },
    suggestionsContainer: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    attribution: {
        marginBottom: 8,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 24,
    },
    suggestionsScroll: {
        marginTop: 8,
    },
    suggestionItem: {
        marginRight: 12,
        width: 120,
    },
    suggestionImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        borderWidth: 1,
    },
    suggestionCaption: {
        marginTop: 4,
        textAlign: 'center',
    },
    noResultsContainer: {
        alignItems: 'center',
        padding: 24,
    },
});
