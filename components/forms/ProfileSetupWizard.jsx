import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import { useTheme } from '../ui/ThemeProvider';

const { width } = Dimensions.get('window');

const ProfileSetupWizard = ({ onComplete, onSkip }) => {
    const { theme } = useTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const [slideAnim] = useState(new Animated.Value(0));

    const steps = [
        {
            title: "Welcome to Diet Tracker!",
            subtitle: "Let's set up your profile to get personalized recommendations",
            icon: "heart-outline",
            color: "#10b981"
        },
        {
            title: "Track Your Progress",
            subtitle: "Monitor your daily nutrition, calories, and hydration goals",
            icon: "analytics-outline",
            color: "#3b82f6"
        },
        {
            title: "Get Smart Insights",
            subtitle: "Receive personalized health recommendations based on your profile",
            icon: "bulb-outline",
            color: "#f59e0b"
        },
        {
            title: "Ready to Start?",
            subtitle: "Complete your profile to unlock all features",
            icon: "checkmark-circle-outline",
            color: "#10b981"
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            Animated.timing(slideAnim, {
                toValue: -(currentStep + 1) * width,
                duration: 300,
                useNativeDriver: true,
            }).start();
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            Animated.timing(slideAnim, {
                toValue: -(currentStep - 1) * width,
                duration: 300,
                useNativeDriver: true,
            }).start();
            setCurrentStep(currentStep - 1);
        }
    };

    const StepIndicator = () => (
        <View style={styles.stepIndicator}>
            {steps.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.stepDot,
                        {
                            backgroundColor: index <= currentStep ? theme.primary : theme.border,
                            transform: [{ scale: index === currentStep ? 1.2 : 1 }]
                        }
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <StepIndicator />
                {currentStep < steps.length - 1 && (
                    <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                        <Text style={[styles.skipText, { color: theme.subText }]}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Animated.View
                style={[
                    styles.stepsContainer,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                {steps.map((step, index) => (
                    <View key={index} style={[styles.step, { width }]}>
                        <View style={styles.stepContent}>
                            <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
                                <Ionicons name={step.icon} size={48} color={step.color} />
                            </View>

                            <Text style={[styles.stepTitle, { color: theme.text }]}>
                                {step.title}
                            </Text>

                            <Text style={[styles.stepSubtitle, { color: theme.subText }]}>
                                {step.subtitle}
                            </Text>

                            {index === steps.length - 1 && (
                                <View style={styles.featureList}>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                                        <Text style={[styles.featureText, { color: theme.subText }]}>
                                            Personalized calorie recommendations
                                        </Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                                        <Text style={[styles.featureText, { color: theme.subText }]}>
                                            BMI calculation and health insights
                                        </Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Ionicons name="checkmark" size={16} color={theme.primary} />
                                        <Text style={[styles.featureText, { color: theme.subText }]}>
                                            Smart water intake suggestions
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ))}
            </Animated.View>

            <View style={styles.footer}>
                <View style={styles.buttonContainer}>
                    {currentStep > 0 && (
                        <SecondaryButton
                            title="Back"
                            onPress={prevStep}
                            style={styles.backButton}
                        />
                    )}

                    <PrimaryButton
                        title={currentStep === steps.length - 1 ? "Complete Profile" : "Next"}
                        onPress={nextStep}
                        style={[styles.nextButton, currentStep === 0 && styles.singleButton]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    stepsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    step: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    stepContent: {
        alignItems: 'center',
        maxWidth: 320,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    stepSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    featureList: {
        alignSelf: 'stretch',
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        flex: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    backButton: {
        flex: 1,
    },
    nextButton: {
        flex: 2,
    },
    singleButton: {
        flex: 1,
    },
});

export default ProfileSetupWizard;