/**
 * Performance Monitor
 * Real-time performance tracking and optimization recommendations
 */


/**
 * Performance metrics collector
 */
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            // App lifecycle
            appStartTime: Date.now(),
            sessionStartTime: Date.now(),

            // Navigation
            navigationTimes: [],
            screenTransitions: new Map(),

            // Rendering
            renderTimes: new Map(),
            frameDrops: 0,

            // Memory
            memoryUsage: [],
            memoryPeaks: [],

            // Network
            apiCalls: [],
            networkLatency: [],

            // User interactions
            interactions: [],
            gestureLatency: [],

            // Errors
            errors: [],
            crashes: 0
        };

        this.observers = new Set();
        this.isMonitoring = false;
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.setupPerformanceObservers();
        this.startMemoryMonitoring();
        this.startFrameRateMonitoring();

        console.log('📊 Performance monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.observers.forEach(observer => observer.disconnect?.());
        this.observers.clear();

        console.log('📊 Performance monitoring stopped');
    }

    /**
     * Set up performance observers
     */
    setupPerformanceObservers() {
        try {
            // Navigation timing
            if ('PerformanceObserver' in window) {
                const navObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.recordNavigationTiming(entry);
                    });
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.add(navObserver);

                // Resource timing
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.recordResourceTiming(entry);
                    });
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.add(resourceObserver);

                // Long tasks
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        this.recordLongTask(entry);
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.add(longTaskObserver);
            }
        } catch (error) {
            console.warn('Failed to setup performance observers:', error);
        }
    }

    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        const monitorMemory = () => {
            if (!this.isMonitoring) return;

            try {
                if (performance.memory) {
                    const usage = {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit,
                        timestamp: Date.now()
                    };

                    this.metrics.memoryUsage.push(usage);

                    // Keep only last 100 measurements
                    if (this.metrics.memoryUsage.length > 100) {
                        this.metrics.memoryUsage.shift();
                    }

                    // Track memory peaks
                    const lastPeak = this.metrics.memoryPeaks[this.metrics.memoryPeaks.length - 1];
                    if (!lastPeak || usage.used > lastPeak.used) {
                        this.metrics.memoryPeaks.push(usage);

                        // Keep only last 10 peaks
                        if (this.metrics.memoryPeaks.length > 10) {
                            this.metrics.memoryPeaks.shift();
                        }
                    }
                }
            } catch (error) {
                console.warn('Memory monitoring error:', error);
            }

            setTimeout(monitorMemory, 5000); // Check every 5 seconds
        };

        monitorMemory();
    }

    /**
     * Start frame rate monitoring
     */
    startFrameRateMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;

        const measureFrameRate = (currentTime) => {
            if (!this.isMonitoring) return;

            frameCount++;
            const elapsed = currentTime - lastTime;

            if (elapsed >= 1000) { // Every second
                const fps = Math.round((frameCount * 1000) / elapsed);

                if (fps < 55) { // Consider frames below 55 FPS as drops
                    this.metrics.frameDrops++;
                }

                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFrameRate);
        };

        requestAnimationFrame(measureFrameRate);
    }

    /**
     * Record navigation timing
     */
    recordNavigationTiming(entry) {
        this.metrics.navigationTimes.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
        });
    }

    /**
     * Record resource timing
     */
    recordResourceTiming(entry) {
        if (entry.name.includes('api') || entry.name.includes('supabase')) {
            this.metrics.apiCalls.push({
                url: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Record long task
     */
    recordLongTask(entry) {
        console.warn(`⚠️ Long task detected: ${entry.duration}ms`);

        this.metrics.errors.push({
            type: 'long_task',
            duration: entry.duration,
            timestamp: Date.now()
        });
    }

    /**
     * Record screen transition
     */
    recordScreenTransition(fromScreen, toScreen, duration) {
        const key = `${fromScreen}->${toScreen}`;
        const existing = this.metrics.screenTransitions.get(key) || [];

        existing.push({
            duration,
            timestamp: Date.now()
        });

        // Keep only last 10 measurements per transition
        if (existing.length > 10) {
            existing.shift();
        }

        this.metrics.screenTransitions.set(key, existing);
    }

    /**
     * Record render time for component
     */
    recordRenderTime(componentName, duration) {
        const existing = this.metrics.renderTimes.get(componentName) || [];

        existing.push({
            duration,
            timestamp: Date.now()
        });

        // Keep only last 20 measurements per component
        if (existing.length > 20) {
            existing.shift();
        }

        this.metrics.renderTimes.set(componentName, existing);
    }

    /**
     * Record user interaction
     */
    recordInteraction(type, duration, metadata = {}) {
        this.metrics.interactions.push({
            type,
            duration,
            metadata,
            timestamp: Date.now()
        });

        // Keep only last 100 interactions
        if (this.metrics.interactions.length > 100) {
            this.metrics.interactions.shift();
        }
    }

    /**
     * Record API call performance
     */
    recordApiCall(endpoint, method, duration, success) {
        this.metrics.apiCalls.push({
            endpoint,
            method,
            duration,
            success,
            timestamp: Date.now()
        });

        // Calculate network latency
        this.metrics.networkLatency.push(duration);
        if (this.metrics.networkLatency.length > 50) {
            this.metrics.networkLatency.shift();
        }
    }

    /**
     * Record error
     */
    recordError(error, context = {}) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        });

        if (context.fatal) {
            this.metrics.crashes++;
        }
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const now = Date.now();
        const sessionDuration = now - this.metrics.sessionStartTime;

        // Calculate averages
        const avgMemoryUsage = this.metrics.memoryUsage.length > 0
            ? this.metrics.memoryUsage.reduce((sum, usage) => sum + usage.used, 0) / this.metrics.memoryUsage.length
            : 0;

        const avgApiLatency = this.metrics.networkLatency.length > 0
            ? this.metrics.networkLatency.reduce((sum, latency) => sum + latency, 0) / this.metrics.networkLatency.length
            : 0;

        const avgRenderTimes = {};
        for (const [component, times] of this.metrics.renderTimes) {
            avgRenderTimes[component] = times.reduce((sum, time) => sum + time.duration, 0) / times.length;
        }

        return {
            sessionDuration,
            memoryUsage: {
                average: Math.round(avgMemoryUsage / 1024 / 1024), // MB
                peak: this.metrics.memoryPeaks.length > 0
                    ? Math.round(Math.max(...this.metrics.memoryPeaks.map(p => p.used)) / 1024 / 1024)
                    : 0
            },
            performance: {
                frameDrops: this.metrics.frameDrops,
                longTasks: this.metrics.errors.filter(e => e.type === 'long_task').length,
                avgApiLatency: Math.round(avgApiLatency),
                slowestApiCall: Math.max(...this.metrics.networkLatency, 0)
            },
            interactions: {
                total: this.metrics.interactions.length,
                avgGestureLatency: this.metrics.gestureLatency.length > 0
                    ? Math.round(this.metrics.gestureLatency.reduce((sum, lat) => sum + lat, 0) / this.metrics.gestureLatency.length)
                    : 0
            },
            errors: {
                total: this.metrics.errors.length,
                crashes: this.metrics.crashes
            },
            components: avgRenderTimes
        };
    }

    /**
     * Get performance recommendations
     */
    getRecommendations() {
        const summary = this.getPerformanceSummary();
        const recommendations = [];

        // Memory recommendations
        if (summary.memoryUsage.peak > 100) { // > 100MB
            recommendations.push({
                type: 'memory',
                severity: 'high',
                message: 'High memory usage detected. Consider implementing lazy loading and memory cleanup.',
                value: `${summary.memoryUsage.peak}MB peak usage`
            });
        }

        // Performance recommendations
        if (summary.performance.frameDrops > 10) {
            recommendations.push({
                type: 'performance',
                severity: 'medium',
                message: 'Frame drops detected. Optimize animations and reduce computational work on main thread.',
                value: `${summary.performance.frameDrops} frame drops`
            });
        }

        if (summary.performance.avgApiLatency > 2000) {
            recommendations.push({
                type: 'network',
                severity: 'medium',
                message: 'Slow API responses. Consider implementing caching and request optimization.',
                value: `${summary.performance.avgApiLatency}ms average latency`
            });
        }

        // Component recommendations
        for (const [component, avgTime] of Object.entries(summary.components)) {
            if (avgTime > 16) { // > 16ms (60fps threshold)
                recommendations.push({
                    type: 'rendering',
                    severity: avgTime > 33 ? 'high' : 'medium',
                    message: `Slow rendering in ${component}. Consider memoization and optimization.`,
                    value: `${Math.round(avgTime)}ms average render time`
                });
            }
        }

        // Error recommendations
        if (summary.errors.crashes > 0) {
            recommendations.push({
                type: 'stability',
                severity: 'critical',
                message: 'App crashes detected. Implement better error handling and crash prevention.',
                value: `${summary.errors.crashes} crashes`
            });
        }

        return recommendations;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const summary = this.getPerformanceSummary();
        const recommendations = this.getRecommendations();

        const report = {
            timestamp: new Date().toISOString(),
            summary,
            recommendations,
            score: this.calculatePerformanceScore(summary),
            rawMetrics: {
                memoryUsage: this.metrics.memoryUsage.slice(-10), // Last 10 measurements
                apiCalls: this.metrics.apiCalls.slice(-20), // Last 20 calls
                interactions: this.metrics.interactions.slice(-50) // Last 50 interactions
            }
        };

        return report;
    }

    /**
     * Calculate performance score (0-100)
     */
    calculatePerformanceScore(summary) {
        let score = 100;

        // Memory penalties
        if (summary.memoryUsage.peak > 150) score -= 20;
        else if (summary.memoryUsage.peak > 100) score -= 10;

        // Performance penalties
        if (summary.performance.frameDrops > 20) score -= 15;
        else if (summary.performance.frameDrops > 10) score -= 8;

        if (summary.performance.avgApiLatency > 3000) score -= 20;
        else if (summary.performance.avgApiLatency > 2000) score -= 10;

        // Error penalties
        score -= summary.errors.crashes * 25;
        score -= Math.min(summary.errors.total * 2, 20);

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMetrics();

// Auto-start monitoring in development
if (__DEV__) {
    performanceMonitor.startMonitoring();
}

/**
 * Performance decorator for components
 */
export const withPerformanceTracking = (Component, componentName) => {
    const WrappedComponent = (props) => {
        const startTime = performance.now();

        React.useEffect(() => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            performanceMonitor.recordRenderTime(componentName, renderTime);
        });

        return <Component {...props} />;
    };

    WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
    return WrappedComponent;
};

/**
 * Performance hook
 */
export const usePerformanceTracking = (componentName) => {
    const startTimeRef = React.useRef(performance.now());
    const renderCountRef = React.useRef(0);

    renderCountRef.current++;

    React.useEffect(() => {
        const renderTime = performance.now() - startTimeRef.current;
        performanceMonitor.recordRenderTime(componentName, renderTime);
        startTimeRef.current = performance.now();
    });

    const recordInteraction = React.useCallback((type, duration, metadata) => {
        performanceMonitor.recordInteraction(type, duration, { component: componentName, ...metadata });
    }, [componentName]);

    return {
        renderCount: renderCountRef.current,
        recordInteraction
    };
};

export default performanceMonitor;