/**
 * Optimized Image Component
 * High-performance image loading with caching and lazy loading
 */

import React, { memo, useCallback, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { useLazyLoad } from '../utils/performanceOptimizations';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Image cache for loaded images
 */
class ImageCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(uri) {
        if (this.cache.has(uri)) {
            // Move to end (most recently used)
            const value = this.cache.get(uri);
            this.cache.delete(uri);
            this.cache.set(uri, value);
            return value;
        }
        return null;
    }

    set(uri, data) {
        if (this.cache.has(uri)) {
            this.cache.delete(uri);
        } else if (this.cache.size >= this.maxSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(uri, data);
    }

    has(uri) {
        return this.cache.has(uri);
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

const imageCache = new ImageCache();

/**
 * Optimized Image Component
 */
const OptimizedImage = memo(({
    source,
    style,
    placeholder,
    fallback,
    lazy = false,
    fadeInDuration = 300,
    resizeMode = 'cover',
    onLoad,
    onError,
    cachePolicy = 'memory-only', // 'memory-only', 'disk-cache', 'network-only'
    ...props
}) => {
    const [loadState, setLoadState] = useState('loading');
    const [opacity] = useState(new Animated.Value(0));
    const { ref: lazyRef, isVisible } = useLazyLoad({ threshold: 0.1 });

    const imageUri = typeof source === 'string' ? source : source?.uri;
    const shouldLoad = lazy ? isVisible : true;

    /**
     * Handle image load success
     */
    const handleLoad = useCallback((event) => {
        setLoadState('loaded');

        // Cache successful load
        if (cachePolicy !== 'network-only' && imageUri) {
            imageCache.set(imageUri, {
                loaded: true,
                timestamp: Date.now(),
                dimensions: event.nativeEvent
            });
        }

        // Fade in animation
        Animated.timing(opacity, {
            toValue: 1,
            duration: fadeInDuration,
            useNativeDriver: true
        }).start();

        onLoad?.(event);
    }, [opacity, fadeInDuration, onLoad, cachePolicy, imageUri]);

    /**
     * Handle image load error
     */
    const handleError = useCallback((error) => {
        setLoadState('error');

        // Cache error state
        if (imageUri) {
            imageCache.set(imageUri, {
                loaded: false,
                error: true,
                timestamp: Date.now()
            });
        }

        onError?.(error);
    }, [onError, imageUri]);

    /**
     * Check cache before loading
     */
    const checkCache = useCallback(() => {
        if (cachePolicy === 'network-only' || !imageUri) return false;

        const cached = imageCache.get(imageUri);
        if (cached) {
            const isExpired = Date.now() - cached.timestamp > 300000; // 5 minutes
            if (!isExpired) {
                if (cached.loaded) {
                    setLoadState('loaded');
                    opacity.setValue(1);
                    return true;
                } else if (cached.error) {
                    setLoadState('error');
                    return true;
                }
            }
        }
        return false;
    }, [cachePolicy, imageUri, opacity]);

    // Check cache on mount
    React.useEffect(() => {
        checkCache();
    }, [checkCache]);

    /**
     * Render placeholder
     */
    const renderPlaceholder = () => {
        if (!placeholder) {
            return (
                <View style={[styles.placeholder, style]}>
                    <View style={styles.placeholderContent} />
                </View>
            );
        }

        if (React.isValidElement(placeholder)) {
            return placeholder;
        }

        return (
            <Image
                source={placeholder}
                style={[style, { position: 'absolute' }]}
                resizeMode={resizeMode}
            />
        );
    };

    /**
     * Render fallback for errors
     */
    const renderFallback = () => {
        if (!fallback) {
            return (
                <View style={[styles.fallback, style]}>
                    <View style={styles.fallbackIcon} />
                </View>
            );
        }

        if (React.isValidElement(fallback)) {
            return fallback;
        }

        return (
            <Image
                source={fallback}
                style={style}
                resizeMode={resizeMode}
            />
        );
    };

    return (
        <View ref={lazyRef} style={[style, { position: 'relative' }]}>
            {/* Placeholder */}
            {loadState === 'loading' && renderPlaceholder()}

            {/* Fallback for errors */}
            {loadState === 'error' && renderFallback()}

            {/* Main image */}
            {shouldLoad && imageUri && (
                <Animated.View style={{ opacity }}>
                    <Image
                        source={source}
                        style={style}
                        resizeMode={resizeMode}
                        onLoad={handleLoad}
                        onError={handleError}
                        {...props}
                    />
                </Animated.View>
            )}
        </View>
    );
});

/**
 * Progressive Image Component for better UX
 */
export const ProgressiveImage = memo(({
    source,
    thumbnailSource,
    style,
    ...props
}) => {
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [thumbnailOpacity] = useState(new Animated.Value(0));
    const [imageOpacity] = useState(new Animated.Value(0));

    const handleThumbnailLoad = useCallback(() => {
        setThumbnailLoaded(true);
        Animated.timing(thumbnailOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
        }).start();
    }, [thumbnailOpacity]);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            // Fade out thumbnail
            Animated.timing(thumbnailOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        });
    }, [imageOpacity, thumbnailOpacity]);

    return (
        <View style={style}>
            {/* Thumbnail */}
            {thumbnailSource && (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: thumbnailOpacity }]}>
                    <Image
                        source={thumbnailSource}
                        style={StyleSheet.absoluteFill}
                        onLoad={handleThumbnailLoad}
                        blurRadius={1}
                        {...props}
                    />
                </Animated.View>
            )}

            {/* Full resolution image */}
            <Animated.View style={{ opacity: imageOpacity }}>
                <Image
                    source={source}
                    style={StyleSheet.absoluteFill}
                    onLoad={handleImageLoad}
                    {...props}
                />
            </Animated.View>
        </View>
    );
});

/**
 * Image Grid Component with virtualization
 */
export const VirtualizedImageGrid = memo(({
    images,
    numColumns = 2,
    itemSize,
    containerHeight,
    onImagePress,
    renderImage
}) => {
    const itemHeight = itemSize || (screenWidth / numColumns);
    const [scrollY, setScrollY] = useState(0);

    // Calculate visible range
    const startIndex = Math.floor(scrollY / itemHeight) * numColumns;
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) * numColumns + numColumns,
        images.length
    );

    const visibleImages = images.slice(startIndex, endIndex);
    const totalHeight = Math.ceil(images.length / numColumns) * itemHeight;

    const handleScroll = useCallback((event) => {
        setScrollY(event.nativeEvent.contentOffset.y);
    }, []);

    const renderImageItem = useCallback((image, index) => {
        const actualIndex = startIndex + index;
        const row = Math.floor(actualIndex / numColumns);
        const col = actualIndex % numColumns;
        const top = row * itemHeight;
        const left = col * (screenWidth / numColumns);

        return (
            <View
                key={image.id || actualIndex}
                style={[
                    styles.gridItem,
                    {
                        position: 'absolute',
                        top,
                        left,
                        width: screenWidth / numColumns,
                        height: itemHeight
                    }
                ]}
            >
                {renderImage ? renderImage(image, actualIndex) : (
                    <OptimizedImage
                        source={{ uri: image.uri }}
                        style={styles.gridImage}
                        lazy={true}
                        onPress={() => onImagePress?.(image, actualIndex)}
                    />
                )}
            </View>
        );
    }, [startIndex, numColumns, itemHeight, onImagePress, renderImage]);

    return (
        <ScrollView
            style={{ height: containerHeight }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
        >
            <View style={{ height: totalHeight, position: 'relative' }}>
                {visibleImages.map(renderImageItem)}
            </View>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholderContent: {
        width: '60%',
        height: '60%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4
    },
    fallback: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    fallbackIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#CCCCCC',
        borderRadius: 20
    },
    gridItem: {
        padding: 2
    },
    gridImage: {
        flex: 1,
        borderRadius: 8
    }
});

// Export cache utilities
export const ImageCacheUtils = {
    clear: () => imageCache.clear(),
    size: () => imageCache.size(),
    has: (uri) => imageCache.has(uri),
    get: (uri) => imageCache.get(uri)
};

OptimizedImage.displayName = 'OptimizedImage';
ProgressiveImage.displayName = 'ProgressiveImage';
VirtualizedImageGrid.displayName = 'VirtualizedImageGrid';

export default OptimizedImage;