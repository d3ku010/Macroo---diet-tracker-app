import { useRef } from 'react';
import {
    Animated,
    Platform,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';

export default function SmoothButton({
    children,
    onPress,
    style,
    disabled = false,
    animationType = 'scale', // 'scale', 'opacity', 'both'
    scaleValue = 0.95,
    opacityValue = 0.7,
    duration = 100,
    ...props
}) {
    const animatedValue = useRef(new Animated.Value(1)).current;
    const opacityAnimatedValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;

        const animations = [];

        if (animationType === 'scale' || animationType === 'both') {
            animations.push(
                Animated.timing(animatedValue, {
                    toValue: scaleValue,
                    duration: duration,
                    useNativeDriver: true,
                })
            );
        }

        if (animationType === 'opacity' || animationType === 'both') {
            animations.push(
                Animated.timing(opacityAnimatedValue, {
                    toValue: opacityValue,
                    duration: duration,
                    useNativeDriver: true,
                })
            );
        }

        if (animations.length > 0) {
            Animated.parallel(animations).start();
        }
    };

    const handlePressOut = () => {
        if (disabled) return;

        const animations = [];

        if (animationType === 'scale' || animationType === 'both') {
            animations.push(
                Animated.spring(animatedValue, {
                    toValue: 1,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                })
            );
        }

        if (animationType === 'opacity' || animationType === 'both') {
            animations.push(
                Animated.timing(opacityAnimatedValue, {
                    toValue: 1,
                    duration: duration + 50,
                    useNativeDriver: true,
                })
            );
        }

        if (animations.length > 0) {
            Animated.parallel(animations).start();
        }
    };

    const animatedStyle = {
        transform: [{ scale: animatedValue }],
        opacity: opacityAnimatedValue,
    };

    // Use TouchableOpacity for better accessibility on all platforms
    const ButtonComponent = Platform.OS === 'web' ? TouchableWithoutFeedback : TouchableOpacity;

    return (
        <ButtonComponent
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={1} // Disable TouchableOpacity's default opacity since we handle it ourselves
            {...props}
        >
            <Animated.View style={[style, animatedStyle, disabled && { opacity: 0.5 }]}>
                {children}
            </Animated.View>
        </ButtonComponent>
    );
}

// Preset button variants for common use cases
export function ScaleButton(props) {
    return <SmoothButton animationType="scale" {...props} />;
}

export function FadeButton(props) {
    return <SmoothButton animationType="opacity" {...props} />;
}

export function BounceButton(props) {
    return <SmoothButton animationType="both" scaleValue={0.92} duration={80} {...props} />;
}

// Enhanced button with ripple effect for Android-like feel
export function RippleButton({
    children,
    onPress,
    style,
    rippleColor = 'rgba(255, 255, 255, 0.3)',
    disabled = false,
    ...props
}) {
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        if (disabled || !onPress) return;

        // Create ripple effect
        Animated.parallel([
            Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.96,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 300,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // Reset ripple after animation
            rippleAnim.setValue(0);
        });

        onPress();
    };

    const rippleScale = rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const rippleOpacity = rippleAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 0],
    });

    return (
        <TouchableWithoutFeedback onPress={handlePress} disabled={disabled} {...props}>
            <Animated.View
                style={[
                    style,
                    { transform: [{ scale: scaleAnim }] },
                    disabled && { opacity: 0.5 },
                ]}
            >
                {children}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: rippleColor,
                        borderRadius: style?.borderRadius || 0,
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
                    }}
                    pointerEvents="none"
                />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}