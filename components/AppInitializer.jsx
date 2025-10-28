import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import SplashScreenComponent from '../components/SplashScreen';
import essentialStorage from '../utils/essentialStorage';
import supabase from '../utils/supabaseClient';

// Keep native splash screen visible
SplashScreen.preventAutoHideAsync();

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function AppInitializer({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [showCustomSplash, setShowCustomSplash] = useState(true);

    const initializeApp = useCallback(async () => {
        try {
            console.log('🚀 Starting app initialization...');

            // Initialize essential app data
            await Promise.all([
                // Test database connection
                testDatabaseConnection(),
                // Load critical user data
                loadEssentialData(),
                // Initialize user if needed
                ensureUserExists(),
            ]);

            console.log('✅ App initialization completed');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            // Continue anyway - app should work offline
        }
    }, []);

    const testDatabaseConnection = async () => {
        try {
            const { error } = await supabase.from('foods').select('count').limit(1);
            if (error) throw error;
            console.log('✅ Database connection verified');
        } catch (error) {
            console.log('⚠️ Database connection failed:', error.message);
            throw error;
        }
    };

    const loadEssentialData = async () => {
        try {
            // Load only essential data for app startup
            // The rest will be loaded on-demand

            // Store app state for validation and sync tracking
            await essentialStorage.setAppInitialized(true);
            await essentialStorage.setLastSync();

            // Load user preferences if they exist
            const preferences = await essentialStorage.getUserPreferences();
            if (!preferences.onboardingCompleted) {
                await essentialStorage.setOnboardingCompleted(false);
            }

            console.log('✅ Essential data loaded');
        } catch (error) {
            console.error('Error loading essential data:', error);
        }
    }; const ensureUserExists = async () => {
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', DEMO_USER_ID)
                .single();

            if (!existingUser) {
                const { error } = await supabase
                    .from('users')
                    .insert([{
                        id: DEMO_USER_ID,
                        name: 'Demo User',
                        email: 'demo@macroo.app'
                    }]);

                if (error && !error.message.includes('duplicate')) {
                    throw error;
                }
            }
            console.log('✅ User account verified');
        } catch (error) {
            console.log('⚠️ User initialization warning:', error.message);
            // Non-critical error, continue
        }
    };

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    const onCustomSplashComplete = useCallback(async () => {
        setShowCustomSplash(false);
        // Hide native splash screen
        await SplashScreen.hideAsync();
        setIsLoading(false);
    }, []);

    if (showCustomSplash) {
        return <SplashScreenComponent onLoadingComplete={onCustomSplashComplete} />;
    }

    return children;
}