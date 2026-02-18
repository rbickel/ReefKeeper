import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Surface, Text, IconButton, Menu, Avatar, useTheme } from 'react-native-paper';
import { useAuth0 } from 'react-native-auth0';
import type { AppTheme } from '../constants/Colors';

export const Header = () => {
    const { user, clearSession, error } = useAuth0();
    const theme = useTheme<AppTheme>();
    const [visible, setVisible] = React.useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const handleLogout = async () => {
        closeMenu();
        try {
            await clearSession(
                {},
                Platform.OS === 'android' ? { customScheme: 'reef-keeper' } : undefined
            );
        } catch (e) {
            console.error('Logout failed', e);
        }
    };

    if (!user) return null;

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.left}>
                <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>
                    🐠 ReefKeeper
                </Text>
            </View>
            <View style={styles.right}>
                <Menu
                    visible={visible}
                    onDismiss={closeMenu}
                    anchor={
                        <IconButton
                            icon={() => (
                                <Avatar.Image
                                    size={36}
                                    source={{ uri: user.picture || `https://www.gravatar.com/avatar/${user.email}?d=identicon` }}
                                />
                            )}
                            onPress={openMenu}
                        />
                    }
                >
                    <Menu.Item title={user.nickname || user.name || 'User'} disabled />
                    <Menu.Item onPress={handleLogout} title="Logout" leadingIcon="logout" />
                </Menu>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontWeight: '800',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
