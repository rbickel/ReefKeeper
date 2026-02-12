import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Example Authentication Guard Component
 * 
 * This is a reference implementation showing how to create an auth guard
 * that respects the test mode flag set by Playwright tests.
 * 
 * Usage:
 * 1. Wrap your app with this component in _layout.tsx
 * 2. When authentication is added, implement the actual auth logic
 * 3. Tests will automatically bypass authentication via the test mode flag
 * 
 * Example in _layout.tsx:
 * 
 * export default function RootLayout() {
 *     return (
 *         <AuthGuard>
 *             <PaperProvider theme={theme}>
 *                 <Stack>...</Stack>
 *             </PaperProvider>
 *         </AuthGuard>
 *     );
 * }
 */

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check if we're in test mode
            const isTestMode = await AsyncStorage.getItem('@reef_keeper:test_mode');
            
            if (isTestMode === 'true') {
                // Bypass authentication in test mode
                console.log('[AuthGuard] Test mode detected, bypassing authentication');
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
            }

            // TODO: Add your actual authentication check here
            // For example:
            // const authToken = await AsyncStorage.getItem('@reef_keeper:auth_token');
            // const isValid = await validateToken(authToken);
            // setIsAuthenticated(isValid);
            
            // For now, allow access (no auth implemented yet)
            setIsAuthenticated(true);
        } catch (error) {
            console.error('[AuthGuard] Error checking authentication:', error);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!isAuthenticated) {
        // TODO: Return your login screen component here
        // For example:
        // return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
        
        // For now, just render children since auth isn't implemented
        return <>{children}</>;
    }

    return <>{children}</>;
}
