/**
 * Caching Strategies
 * Advanced caching implementation for performance optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorHandler } from './errorHandler';

/**
 * Memory cache with LRU eviction
 */
class MemoryCache {
    constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.accessTimes = new Map();
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.delete(key);
            return null;
        }

        // Update access time for LRU
        this.accessTimes.set(key, Date.now());
        return entry.data;
    }

    set(key, data) {
        const entry = {
            data,
            timestamp: Date.now()
        };

        // Remove existing entry
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest if at capacity
        else if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, entry);
        this.accessTimes.set(key, Date.now());
    }

    delete(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
    }

    clear() {
        this.cache.clear();
        this.accessTimes.clear();
    }

    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.delete(key);
            return false;
        }

        return true;
    }

    size() {
        return this.cache.size;
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    getStats() {
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                expiredCount++;
            }
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            expired: expiredCount,
            utilization: (this.cache.size / this.maxSize) * 100
        };
    }
}

/**
 * Persistent cache with compression
 */
class PersistentCache {
    constructor(namespace = 'app_cache', maxSize = 50 * 1024 * 1024) { // 50MB
        this.namespace = namespace;
        this.maxSize = maxSize;
        this.metadata = null;
    }

    async initialize() {
        try {
            const metadataKey = `${this.namespace}_metadata`;
            const metadata = await AsyncStorage.getItem(metadataKey);
            this.metadata = metadata ? JSON.parse(metadata) : {
                entries: {},
                totalSize: 0,
                lastCleanup: Date.now()
            };
        } catch (error) {
            console.warn('Failed to initialize persistent cache:', error);
            this.metadata = {
                entries: {},
                totalSize: 0,
                lastCleanup: Date.now()
            };
        }
    }

    async get(key) {
        try {
            if (!this.metadata) await this.initialize();

            const entry = this.metadata.entries[key];
            if (!entry) return null;

            // Check if expired
            if (entry.ttl && Date.now() > entry.expires) {
                await this.delete(key);
                return null;
            }

            const data = await AsyncStorage.getItem(`${this.namespace}_${key}`);
            if (!data) {
                // Metadata exists but data doesn't - cleanup
                await this.delete(key);
                return null;
            }

            // Update access time
            entry.lastAccess = Date.now();
            await this.saveMetadata();

            return JSON.parse(data);
        } catch (error) {
            console.warn('Failed to get from persistent cache:', error);
            return null;
        }
    }

    async set(key, data, ttl = 86400000) { // 24 hours default
        try {
            if (!this.metadata) await this.initialize();

            const serialized = JSON.stringify(data);
            const size = new Blob([serialized]).size;

            // Check if we need to free space
            if (this.metadata.totalSize + size > this.maxSize) {
                await this.evictOldest(size);
            }

            // Store data
            const storageKey = `${this.namespace}_${key}`;
            await AsyncStorage.setItem(storageKey, serialized);

            // Update metadata
            const oldEntry = this.metadata.entries[key];
            this.metadata.entries[key] = {
                key,
                size,
                created: Date.now(),
                lastAccess: Date.now(),
                expires: ttl ? Date.now() + ttl : null,
                ttl
            };

            // Adjust total size
            if (oldEntry) {
                this.metadata.totalSize -= oldEntry.size;
            }
            this.metadata.totalSize += size;

            await this.saveMetadata();
        } catch (error) {
            console.error('Failed to set persistent cache:', error);
            throw errorHandler.handleError(error);
        }
    }

    async delete(key) {
        try {
            if (!this.metadata) await this.initialize();

            const entry = this.metadata.entries[key];
            if (entry) {
                await AsyncStorage.removeItem(`${this.namespace}_${key}`);
                this.metadata.totalSize -= entry.size;
                delete this.metadata.entries[key];
                await this.saveMetadata();
            }
        } catch (error) {
            console.warn('Failed to delete from persistent cache:', error);
        }
    }

    async clear() {
        try {
            if (!this.metadata) await this.initialize();

            const keys = Object.keys(this.metadata.entries).map(key => `${this.namespace}_${key}`);
            if (keys.length > 0) {
                await AsyncStorage.multiRemove(keys);
            }

            this.metadata = {
                entries: {},
                totalSize: 0,
                lastCleanup: Date.now()
            };

            await this.saveMetadata();
        } catch (error) {
            console.error('Failed to clear persistent cache:', error);
        }
    }

    async has(key) {
        try {
            if (!this.metadata) await this.initialize();

            const entry = this.metadata.entries[key];
            if (!entry) return false;

            // Check if expired
            if (entry.ttl && Date.now() > entry.expires) {
                await this.delete(key);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async evictOldest(requiredSpace) {
        const entries = Object.values(this.metadata.entries);
        entries.sort((a, b) => a.lastAccess - b.lastAccess);

        let freedSpace = 0;
        for (const entry of entries) {
            await this.delete(entry.key);
            freedSpace += entry.size;

            if (freedSpace >= requiredSpace) {
                break;
            }
        }
    }

    async cleanup() {
        try {
            if (!this.metadata) await this.initialize();

            const now = Date.now();
            const expiredKeys = [];

            for (const [key, entry] of Object.entries(this.metadata.entries)) {
                if (entry.ttl && now > entry.expires) {
                    expiredKeys.push(key);
                }
            }

            for (const key of expiredKeys) {
                await this.delete(key);
            }

            this.metadata.lastCleanup = now;
            await this.saveMetadata();

            return expiredKeys.length;
        } catch (error) {
            console.error('Failed to cleanup persistent cache:', error);
            return 0;
        }
    }

    async saveMetadata() {
        try {
            const metadataKey = `${this.namespace}_metadata`;
            await AsyncStorage.setItem(metadataKey, JSON.stringify(this.metadata));
        } catch (error) {
            console.error('Failed to save cache metadata:', error);
        }
    }

    getStats() {
        if (!this.metadata) return null;

        return {
            entries: Object.keys(this.metadata.entries).length,
            totalSize: this.metadata.totalSize,
            maxSize: this.maxSize,
            utilization: (this.metadata.totalSize / this.maxSize) * 100,
            lastCleanup: this.metadata.lastCleanup
        };
    }
}

/**
 * Multi-level cache with fallback strategy
 */
class MultiLevelCache {
    constructor(options = {}) {
        this.memoryCache = new MemoryCache(
            options.memorySize || 100,
            options.memoryTTL || 300000
        );
        this.diskCache = new PersistentCache(
            options.namespace || 'multi_cache',
            options.diskSize || 50 * 1024 * 1024
        );
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        await this.diskCache.initialize();
        this.initialized = true;
    }

    async get(key, options = {}) {
        if (!this.initialized) await this.initialize();

        // Try memory cache first
        let data = this.memoryCache.get(key);
        if (data !== null) {
            return data;
        }

        // Try disk cache
        data = await this.diskCache.get(key);
        if (data !== null) {
            // Promote to memory cache
            this.memoryCache.set(key, data);
            return data;
        }

        // Cache miss
        if (options.fallback) {
            try {
                data = await options.fallback();
                if (data !== null) {
                    await this.set(key, data, options.ttl);
                    return data;
                }
            } catch (error) {
                console.warn('Cache fallback failed:', error);
            }
        }

        return null;
    }

    async set(key, data, ttl) {
        if (!this.initialized) await this.initialize();

        // Set in both caches
        this.memoryCache.set(key, data);
        await this.diskCache.set(key, data, ttl);
    }

    async delete(key) {
        if (!this.initialized) await this.initialize();

        this.memoryCache.delete(key);
        await this.diskCache.delete(key);
    }

    async clear() {
        if (!this.initialized) await this.initialize();

        this.memoryCache.clear();
        await this.diskCache.clear();
    }

    async has(key) {
        if (!this.initialized) await this.initialize();

        return this.memoryCache.has(key) || await this.diskCache.has(key);
    }

    async cleanup() {
        if (!this.initialized) await this.initialize();

        return await this.diskCache.cleanup();
    }

    getStats() {
        return {
            memory: this.memoryCache.getStats(),
            disk: this.diskCache.getStats()
        };
    }
}

/**
 * Cache manager with automatic cleanup
 */
class CacheManager {
    constructor() {
        this.caches = new Map();
        this.cleanupInterval = null;
    }

    createCache(name, options = {}) {
        const cache = new MultiLevelCache({
            namespace: `cache_${name}`,
            ...options
        });

        this.caches.set(name, cache);
        return cache;
    }

    getCache(name) {
        return this.caches.get(name);
    }

    async clearAllCaches() {
        const clearPromises = Array.from(this.caches.values()).map(cache => cache.clear());
        await Promise.all(clearPromises);
    }

    startAutoCleanup(intervalMs = 600000) { // 10 minutes
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(async () => {
            try {
                let totalCleaned = 0;
                for (const cache of this.caches.values()) {
                    const cleaned = await cache.cleanup();
                    totalCleaned += cleaned;
                }

                if (totalCleaned > 0) {
                    console.log(`🧹 Cache cleanup: removed ${totalCleaned} expired entries`);
                }
            } catch (error) {
                console.error('Cache cleanup failed:', error);
            }
        }, intervalMs);
    }

    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    getAllStats() {
        const stats = {};
        for (const [name, cache] of this.caches) {
            stats[name] = cache.getStats();
        }
        return stats;
    }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Common cache instances
export const apiCache = cacheManager.createCache('api', {
    memorySize: 50,
    memoryTTL: 300000, // 5 minutes
    diskSize: 10 * 1024 * 1024 // 10MB
});

export const imageCache = cacheManager.createCache('images', {
    memorySize: 20,
    memoryTTL: 600000, // 10 minutes
    diskSize: 30 * 1024 * 1024 // 30MB
});

export const foodCache = cacheManager.createCache('foods', {
    memorySize: 100,
    memoryTTL: 1800000, // 30 minutes
    diskSize: 5 * 1024 * 1024 // 5MB
});

// Start automatic cleanup
cacheManager.startAutoCleanup();

export {
    CacheManager, MemoryCache, MultiLevelCache, PersistentCache
};

export default cacheManager;