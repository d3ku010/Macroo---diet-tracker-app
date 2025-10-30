/**
 * Supabase Service Layer
 * Production-ready database service with authentication, caching, and error handling
 */

import { createClient } from '@supabase/supabase-js';
import { CONFIG, TABLES } from '../config/environment';
import { createAuthError, createNetworkError, createServerError, withErrorHandling } from '../utils/errorHandler';

class SupabaseService {
    constructor() {
        this.client = null;
        this.currentUser = null;
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize Supabase client
     */
    async initialize() {
        try {
            if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
                throw new Error('Supabase credentials not configured');
            }

            this.client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                },
                global: {
                    headers: {
                        'X-Client-Info': 'macroo-diet-tracker'
                    }
                }
            });

            // Set up auth state listener
            this.client.auth.onAuthStateChange((event, session) => {
                this.currentUser = session?.user || null;
                if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    this.clearCache();
                }
            });

            // Get initial session
            const { data: { session } } = await this.client.auth.getSession();
            this.currentUser = session?.user || null;

            this.isInitialized = true;
        } catch (error) {
            throw createNetworkError('Failed to initialize Supabase client', error);
        }
    }

    /**
     * Ensure client is initialized
     */
    ensureInitialized() {
        if (!this.isInitialized || !this.client) {
            throw new Error('Supabase client not initialized. Call initialize() first.');
        }
    }

    /**
     * Cache management
     */
    isCacheValid(key) {
        const timestamp = this.cacheTimestamps.get(key);
        if (!timestamp) return false;
        return Date.now() - timestamp < CONFIG.CACHE_DURATION;
    }

    setCache(key, data) {
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, Date.now());
    }

    getCache(key) {
        if (this.isCacheValid(key)) {
            return this.cache.get(key);
        }
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
        this.cacheTimestamps.clear();
    }

    /**
     * Authentication methods
     */
    async signUp(email, password, userData = {}) {
        this.ensureInitialized();

        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });

        if (error) {
            throw createAuthError(`Sign up failed: ${error.message}`, error);
        }

        return data;
    }

    async signIn(email, password) {
        this.ensureInitialized();

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw createAuthError(`Sign in failed: ${error.message}`, error);
        }

        this.currentUser = data.user;
        this.clearCache(); // Clear cache on new login
        return data;
    }

    async signOut() {
        this.ensureInitialized();

        const { error } = await this.client.auth.signOut();

        if (error) {
            throw createAuthError(`Sign out failed: ${error.message}`, error);
        }

        this.currentUser = null;
        this.clearCache();
    }

    async getCurrentUser() {
        this.ensureInitialized();

        const { data: { user }, error } = await this.client.auth.getUser();

        if (error) {
            throw createAuthError(`Failed to get user: ${error.message}`, error);
        }

        this.currentUser = user;
        return user;
    }

    /**
     * Generic database operations with error handling and caching
     */
    async select(table, options = {}) {
        this.ensureInitialized();

        const { columns = '*', filters = {}, orderBy, limit, useCache = true } = options;

        // Create cache key
        const cacheKey = `${table}_${JSON.stringify({ columns, filters, orderBy, limit })}`;

        // Check cache first
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) return cached;
        }

        let query = this.client.from(table).select(columns);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                query = query.in(key, value);
            } else if (typeof value === 'object' && value.operator) {
                query = query[value.operator](key, value.value);
            } else {
                query = query.eq(key, value);
            }
        });

        // Apply ordering
        if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
        }

        // Apply limit
        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
            throw createServerError(`Database query failed: ${error.message}`, error);
        }

        // Cache successful results
        if (useCache && data) {
            this.setCache(cacheKey, data);
        }

        return data;
    }

    async insert(table, data, options = {}) {
        this.ensureInitialized();

        const { returning = true } = options;

        let query = this.client.from(table).insert(data);

        if (returning) {
            query = query.select();
        }

        const { data: result, error } = await query;

        if (error) {
            throw createServerError(`Database insert failed: ${error.message}`, error);
        }

        // Clear related cache
        this.clearTableCache(table);

        return result;
    }

    async update(table, id, data, options = {}) {
        this.ensureInitialized();

        const { returning = true } = options;

        let query = this.client.from(table).update(data).eq('id', id);

        if (returning) {
            query = query.select();
        }

        const { data: result, error } = await query;

        if (error) {
            throw createServerError(`Database update failed: ${error.message}`, error);
        }

        // Clear related cache
        this.clearTableCache(table);

        return result;
    }

    async delete(table, id) {
        this.ensureInitialized();

        const { data, error } = await this.client
            .from(table)
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            throw createServerError(`Database delete failed: ${error.message}`, error);
        }

        // Clear related cache
        this.clearTableCache(table);

        return data;
    }

    /**
     * Clear cache for specific table
     */
    clearTableCache(table) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${table}_`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.cacheTimestamps.delete(key);
        });
    }

    /**
     * Batch operations for better performance
     */
    async batchInsert(table, dataArray, batchSize = 100) {
        this.ensureInitialized();

        const results = [];

        for (let i = 0; i < dataArray.length; i += batchSize) {
            const batch = dataArray.slice(i, i + batchSize);
            const batchResult = await this.insert(table, batch);
            results.push(...batchResult);
        }

        return results;
    }

    /**
     * Transaction support
     */
    async transaction(operations) {
        this.ensureInitialized();

        // Supabase doesn't have explicit transactions in the JS client,
        // but we can implement basic rollback logic
        const completedOperations = [];

        try {
            for (const operation of operations) {
                const result = await operation();
                completedOperations.push({
                    operation,
                    result,
                    rollback: operation.rollback
                });
            }
            return completedOperations.map(op => op.result);
        } catch (error) {
            // Attempt to rollback completed operations
            for (const op of completedOperations.reverse()) {
                if (op.rollback) {
                    try {
                        await op.rollback();
                    } catch (rollbackError) {
                        // Log rollback error but don't throw
                        console.error('Rollback failed:', rollbackError);
                    }
                }
            }
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        this.ensureInitialized();

        try {
            const { data, error } = await this.client
                .from(TABLES.USERS)
                .select('id')
                .limit(1);

            if (error) {
                throw error;
            }

            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            throw createServerError('Database health check failed', error);
        }
    }
}

// Create singleton instance
const supabaseService = new SupabaseService();

// Wrap all methods with error handling
const methodsToWrap = [
    'initialize', 'signUp', 'signIn', 'signOut', 'getCurrentUser',
    'select', 'insert', 'update', 'delete', 'batchInsert', 'transaction', 'healthCheck'
];

methodsToWrap.forEach(method => {
    const originalMethod = supabaseService[method];
    supabaseService[method] = withErrorHandling(
        originalMethod.bind(supabaseService),
        `SupabaseService.${method}`,
        false // Don't show user errors for low-level operations
    );
});

export default supabaseService;