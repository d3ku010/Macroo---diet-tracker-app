// Essential AsyncStorage - Only for critical app state and validation
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    // App state
    APP_INITIALIZED: 'app_initialized',
    LAST_SYNC: 'last_sync',
    USER_PREFERENCES: 'user_preferences',

    // Offline/validation data
    OFFLINE_MODE: 'offline_mode',
    PENDING_SYNC: 'pending_sync',
    CACHE_TIMESTAMP: 'cache_timestamp',

    // Theme and UI preferences
    THEME_PREFERENCE: 'theme_preference',
    ONBOARDING_COMPLETED: 'onboarding_completed',
};

class EssentialStorage {
    // ==================== APP STATE ====================

    async setAppInitialized(value = true) {
        await AsyncStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, value.toString());
    }

    async isAppInitialized() {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);
        return value === 'true';
    }

    async setLastSync(timestamp = new Date().toISOString()) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
    }

    async getLastSync() {
        return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    }

    // ==================== USER PREFERENCES ====================

    async saveUserPreferences(preferences) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    }

    async getUserPreferences() {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        return data ? JSON.parse(data) : {};
    }

    async updateUserPreference(key, value) {
        const preferences = await this.getUserPreferences();
        preferences[key] = value;
        await this.saveUserPreferences(preferences);
    }

    // ==================== OFFLINE/SYNC STATE ====================

    async setOfflineMode(isOffline) {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, isOffline.toString());
    }

    async isOfflineMode() {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
        return value === 'true';
    }

    async addPendingSync(action) {
        try {
            const pending = await this.getPendingSync();
            pending.push({
                ...action,
                timestamp: new Date().toISOString(),
                id: Date.now().toString(),
            });
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pending));
        } catch (error) {
            console.error('Error adding pending sync:', error);
        }
    }

    async getPendingSync() {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting pending sync:', error);
            return [];
        }
    }

    async clearPendingSync() {
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
    }

    // ==================== THEME PREFERENCES ====================

    async setThemePreference(theme) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
    }

    async getThemePreference() {
        return await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
    }

    // ==================== ONBOARDING ====================

    async setOnboardingCompleted(completed = true) {
        await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed.toString());
    }

    async isOnboardingCompleted() {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
        return value === 'true';
    }

    // ==================== CACHE MANAGEMENT ====================

    async setCacheTimestamp(key, timestamp = new Date().toISOString()) {
        const timestamps = await this.getCacheTimestamps();
        timestamps[key] = timestamp;
        await AsyncStorage.setItem(STORAGE_KEYS.CACHE_TIMESTAMP, JSON.stringify(timestamps));
    }

    async getCacheTimestamp(key) {
        const timestamps = await this.getCacheTimestamps();
        return timestamps[key];
    }

    async getCacheTimestamps() {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_TIMESTAMP);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            return {};
        }
    }

    async isCacheExpired(key, maxAgeMinutes = 30) {
        const timestamp = await this.getCacheTimestamp(key);
        if (!timestamp) return true;

        const age = Date.now() - new Date(timestamp).getTime();
        const maxAge = maxAgeMinutes * 60 * 1000;
        return age > maxAge;
    }

    // ==================== UTILITY METHODS ====================

    async clearAll() {
        try {
            await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
            console.log('✅ All essential storage cleared');
        } catch (error) {
            console.error('Error clearing essential storage:', error);
        }
    }

    async getStorageInfo() {
        const info = {};
        for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
            try {
                const value = await AsyncStorage.getItem(storageKey);
                info[key] = value ? JSON.parse(value) : null;
            } catch {
                info[key] = await AsyncStorage.getItem(storageKey);
            }
        }
        return info;
    }
}

export default new EssentialStorage();