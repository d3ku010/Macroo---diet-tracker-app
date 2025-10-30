/**
 * Performance Optimization Utilities
 * React optimization patterns and performance monitoring
 */

import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * Higher-order component for memoization with custom comparison
 */
export const withMemo = (Component, compareProps) => {
    const MemoizedComponent = memo(Component, compareProps);
    MemoizedComponent.displayName = `withMemo(${Component.displayName || Component.name})`;
    return MemoizedComponent;
};

/**
 * Hook for debounced values
 */
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for throttled callbacks
 */
export const useThrottle = (callback, delay) => {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]);
};

/**
 * Hook for lazy loading with intersection observer
 */
export const useLazyLoad = (options = {}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasLoaded, setHasLoaded] = React.useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    observer.disconnect();
                }
            },
            {
                threshold: options.threshold || 0.1,
                rootMargin: options.rootMargin || '50px'
            }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [hasLoaded, options.threshold, options.rootMargin]);

    return { ref: elementRef, isVisible, hasLoaded };
};

/**
 * Hook for optimized animations
 */
export const useOptimizedAnimation = (animationCallback, dependencies = []) => {
    const animationRef = useRef(null);

    const startAnimation = useCallback(() => {
        // Wait for interactions to complete
        InteractionManager.runAfterInteractions(() => {
            animationRef.current = requestAnimationFrame(animationCallback);
        });
    }, [animationCallback]);

    const cancelAnimation = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }, []);

    useEffect(() => {
        return cancelAnimation;
    }, [...dependencies, cancelAnimation]);

    return { startAnimation, cancelAnimation };
};

/**
 * Hook for image preloading
 */
export const useImagePreload = (imageUris) => {
    const [loadedImages, setLoadedImages] = React.useState(new Set());
    const [failedImages, setFailedImages] = React.useState(new Set());

    useEffect(() => {
        if (!imageUris.length) return;

        const preloadPromises = imageUris.map(uri =>
            new Promise((resolve) => {
                const image = new Image();
                image.onload = () => {
                    setLoadedImages(prev => new Set([...prev, uri]));
                    resolve(uri);
                };
                image.onerror = () => {
                    setFailedImages(prev => new Set([...prev, uri]));
                    resolve(uri);
                };
                image.src = uri;
            })
        );

        Promise.all(preloadPromises);
    }, [imageUris]);

    const isImageLoaded = useCallback((uri) => loadedImages.has(uri), [loadedImages]);
    const isImageFailed = useCallback((uri) => failedImages.has(uri), [failedImages]);

    return {
        loadedImages: Array.from(loadedImages),
        failedImages: Array.from(failedImages),
        isImageLoaded,
        isImageFailed,
        totalLoaded: loadedImages.size,
        totalFailed: failedImages.size
    };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
    const mountTime = useRef(Date.now());
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    // Track renders
    renderCount.current += 1;
    const currentRenderTime = Date.now();
    const timeSinceLastRender = currentRenderTime - lastRenderTime.current;
    lastRenderTime.current = currentRenderTime;

    useEffect(() => {
        const mountDuration = Date.now() - mountTime.current;

        if (__DEV__) {
            console.log(`🔍 Performance Monitor [${componentName}]:`, {
                mountDuration: `${mountDuration}ms`,
                renderCount: renderCount.current,
                timeSinceLastRender: `${timeSinceLastRender}ms`
            });
        }

        return () => {
            const lifetimeDuration = Date.now() - mountTime.current;
            if (__DEV__) {
                console.log(`🔍 Component Unmount [${componentName}]:`, {
                    lifetimeDuration: `${lifetimeDuration}ms`,
                    totalRenders: renderCount.current,
                    avgRenderInterval: `${Math.round(lifetimeDuration / renderCount.current)}ms`
                });
            }
        };
    }, [componentName]);

    return {
        renderCount: renderCount.current,
        timeSinceLastRender,
        mountTime: mountTime.current
    };
};

/**
 * Hook for memory usage monitoring
 */
export const useMemoryMonitor = (intervalMs = 5000) => {
    const [memoryInfo, setMemoryInfo] = React.useState({
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
    });

    useEffect(() => {
        const updateMemoryInfo = () => {
            if (performance.memory) {
                setMemoryInfo({
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                });
            }
        };

        updateMemoryInfo();
        const interval = setInterval(updateMemoryInfo, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs]);

    const memoryUsagePercent = useMemo(() => {
        if (memoryInfo.jsHeapSizeLimit === 0) return 0;
        return Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100);
    }, [memoryInfo]);

    return {
        ...memoryInfo,
        memoryUsagePercent,
        isHighMemoryUsage: memoryUsagePercent > 80
    };
};

/**
 * Virtual list hook for large datasets
 */
export const useVirtualList = (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleRange = useMemo(() => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
            startIndex + Math.ceil(containerHeight / itemHeight) + 1,
            items.length
        );

        return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, items.length]);

    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
            ...item,
            index: visibleRange.startIndex + index,
            top: (visibleRange.startIndex + index) * itemHeight
        }));
    }, [items, visibleRange, itemHeight]);

    const totalHeight = items.length * itemHeight;

    return {
        visibleItems,
        totalHeight,
        setScrollTop,
        visibleRange
    };
};

/**
 * Optimized selector hook
 */
export const useOptimizedSelector = (selector, equalityFn) => {
    const selectorRef = useRef(selector);
    const equalityFnRef = useRef(equalityFn);
    const selectedValueRef = useRef();

    // Update refs if functions change
    selectorRef.current = selector;
    equalityFnRef.current = equalityFn;

    return useMemo(() => {
        const newValue = selectorRef.current();

        if (selectedValueRef.current === undefined) {
            selectedValueRef.current = newValue;
            return newValue;
        }

        const areEqual = equalityFnRef.current
            ? equalityFnRef.current(selectedValueRef.current, newValue)
            : selectedValueRef.current === newValue;

        if (!areEqual) {
            selectedValueRef.current = newValue;
        }

        return selectedValueRef.current;
    }, [selector, equalityFn]);
};

/**
 * Batch updates hook
 */
export const useBatchUpdates = () => {
    const batchRef = useRef([]);
    const timeoutRef = useRef(null);

    const addToBatch = useCallback((updateFn) => {
        batchRef.current.push(updateFn);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            const updates = batchRef.current;
            batchRef.current = [];

            // Execute all updates in a single batch
            React.unstable_batchedUpdates(() => {
                updates.forEach(update => update());
            });
        }, 0);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return addToBatch;
};

/**
 * Platform-specific optimization utilities
 */
export const PlatformOptimizations = {
    /**
     * Check if device has sufficient memory for heavy operations
     */
    hasHighMemory: () => {
        if (Platform.OS === 'ios') {
            return true; // iOS generally has better memory management
        }
        return navigator.deviceMemory ? navigator.deviceMemory >= 4 : true;
    },

    /**
     * Get optimal chunk size for batch operations
     */
    getOptimalChunkSize: (itemCount) => {
        const hasHighMemory = PlatformOptimizations.hasHighMemory();
        const baseChunkSize = hasHighMemory ? 100 : 50;

        if (itemCount < 100) return itemCount;
        if (itemCount < 1000) return Math.min(baseChunkSize, itemCount);
        return baseChunkSize;
    },

    /**
     * Check if device supports advanced features
     */
    supportsAdvancedFeatures: () => {
        return {
            intersectionObserver: 'IntersectionObserver' in window,
            requestIdleCallback: 'requestIdleCallback' in window,
            performanceObserver: 'PerformanceObserver' in window,
            webWorkers: 'Worker' in window
        };
    }
};

export default {
    withMemo,
    useDebounce,
    useThrottle,
    useLazyLoad,
    useOptimizedAnimation,
    useImagePreload,
    usePerformanceMonitor,
    useMemoryMonitor,
    useVirtualList,
    useOptimizedSelector,
    useBatchUpdates,
    PlatformOptimizations
};