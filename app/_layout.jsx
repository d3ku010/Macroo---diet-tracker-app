import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import AppInitializer from '../components/AppInitializer';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import ThemeProvider from '../components/ui/ThemeProvider';
import ToastHost from '../components/ui/Toast';
import { setupGlobalErrorHandlers } from '../utils/globalErrorHandler';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        // Add custom fonts here if needed
    });

    // Initialize global error handlers
    useEffect(() => {
        setupGlobalErrorHandlers();
        console.log('App initialized with global error handling');
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <ErrorBoundary showDetails={__DEV__}>
                <AppInitializer>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="summary" options={{ headerShown: false }} />
                    </Stack>
                    <ToastHost />
                </AppInitializer>
            </ErrorBoundary>
        </ThemeProvider>
    );
}