import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    calculateBMI,
    calculateDailyCalories,
    calculateWaterIntake,
    getBMICategory,
    getGoalAdjustedCalories
} from '../../utils/healthCalculations';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import { useTheme } from '../ui/ThemeProvider';

const ProfileEditForm = ({ profile, onSave, onCancel, visible }) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        age: profile?.age?.toString() || '',
        gender: profile?.gender || 'other',
        height: profile?.height?.toString() || '',
        weight: profile?.weight?.toString() || '',
        activityLevel: profile?.activityLevel || 'moderate',
        goal: profile?.goal || 'maintain',
        dailyCaloriesTarget: profile?.dailyCaloriesTarget?.toString() || '',
        dailyWaterTarget: profile?.dailyWaterTarget?.toString() || '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        const age = parseInt(formData.age);
        if (!formData.age || isNaN(age) || age < 13 || age > 120) {
            newErrors.age = 'Please enter a valid age (13-120)';
        }

        const height = parseInt(formData.height);
        if (!formData.height || isNaN(height) || height < 100 || height > 250) {
            newErrors.height = 'Please enter a valid height (100-250 cm)';
        }

        const weight = parseFloat(formData.weight);
        if (!formData.weight || isNaN(weight) || weight < 30 || weight > 300) {
            newErrors.weight = 'Please enter a valid weight (30-300 kg)';
        }

        const calories = parseInt(formData.dailyCaloriesTarget);
        if (!formData.dailyCaloriesTarget || isNaN(calories) || calories < 800 || calories > 5000) {
            newErrors.dailyCaloriesTarget = 'Please enter a valid calorie target (800-5000)';
        }

        const water = parseInt(formData.dailyWaterTarget);
        if (!formData.dailyWaterTarget || isNaN(water) || water < 1 || water > 20) {
            newErrors.dailyWaterTarget = 'Please enter a valid water target (1-20 glasses)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const updatedProfile = {
                ...profile,
                name: formData.name.trim(),
                age: parseInt(formData.age),
                gender: formData.gender,
                height: parseInt(formData.height),
                weight: parseFloat(formData.weight),
                activityLevel: formData.activityLevel,
                goal: formData.goal,
                dailyCaloriesTarget: parseInt(formData.dailyCaloriesTarget),
                dailyWaterTarget: parseInt(formData.dailyWaterTarget),
            };

            await onSave(updatedProfile);
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    }, [errors]);

    // Memoize suggestions calculation to prevent unnecessary re-renders
    const suggestions = useMemo(() => {
        const { weight, height, age, gender, activityLevel, goal } = formData;
        const weightNum = parseFloat(weight);
        const heightNum = parseInt(height);
        const ageNum = parseInt(age);

        if (!weightNum || !heightNum || !ageNum || !gender || !activityLevel) return null;

        const bmi = calculateBMI(weightNum, heightNum);
        const bmiCategory = getBMICategory(bmi);
        const baseCalories = calculateDailyCalories(weightNum, heightNum, ageNum, gender, activityLevel);
        const adjustedCalories = getGoalAdjustedCalories(baseCalories, goal);
        const waterSuggestion = calculateWaterIntake(weightNum, activityLevel);

        return {
            bmi,
            bmiCategory,
            calories: adjustedCalories,
            water: waterSuggestion
        };
    }, [formData.weight, formData.height, formData.age, formData.gender, formData.activityLevel, formData.goal]);

    const applySuggestions = useCallback(() => {
        if (suggestions) {
            setFormData(prev => ({
                ...prev,
                dailyCaloriesTarget: suggestions.calories.toString(),
                dailyWaterTarget: suggestions.water.toString()
            }));
        }
    }, [suggestions]);

    const FormSection = useCallback(({ title, children }) => (
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            {children}
        </View>
    ), [theme]);

    const InputField = useCallback(({ label, value, onChangeText, placeholder, keyboardType = 'default', error, icon }) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBackground || theme.card, borderColor: error ? '#ef4444' : theme.border }
            ]}>
                {icon && (
                    <Ionicons name={icon} size={20} color={theme.subText} style={styles.inputIcon} />
                )}
                <TextInput
                    style={[
                        styles.textInput,
                        { color: theme.text, flex: 1 }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subText}
                    keyboardType={keyboardType}
                    autoCorrect={false}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    ), [theme]);

    const PickerField = useCallback(({ label, value, onValueChange, options, error }) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
            <View style={[
                styles.pickerWrapper,
                { backgroundColor: theme.inputBackground || theme.card, borderColor: error ? '#ef4444' : theme.border }
            ]}>
                <Picker
                    selectedValue={value}
                    onValueChange={onValueChange}
                    style={[styles.picker, { color: theme.text }]}
                    dropdownIconColor={theme.text}
                >
                    {options.map(option => (
                        <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                            color={theme.text}
                        />
                    ))}
                </Picker>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    ), [theme]);

    if (!visible) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <FormSection title="Personal Information">
                    <InputField
                        label="Name"
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        placeholder="Enter your name"
                        error={errors.name}
                        icon="person-outline"
                    />

                    <InputField
                        label="Age"
                        value={formData.age}
                        onChangeText={(value) => updateField('age', value)}
                        placeholder="Enter your age"
                        keyboardType="numeric"
                        error={errors.age}
                        icon="calendar-outline"
                    />

                    <PickerField
                        label="Gender"
                        value={formData.gender}
                        onValueChange={(value) => updateField('gender', value)}
                        options={[
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                            { label: 'Other', value: 'other' },
                        ]}
                        error={errors.gender}
                    />
                </FormSection>

                <FormSection title="Physical Information">
                    <InputField
                        label="Height (cm)"
                        value={formData.height}
                        onChangeText={(value) => updateField('height', value)}
                        placeholder="Enter your height"
                        keyboardType="numeric"
                        error={errors.height}
                        icon="resize-outline"
                    />

                    <InputField
                        label="Weight (kg)"
                        value={formData.weight}
                        onChangeText={(value) => updateField('weight', value)}
                        placeholder="Enter your weight"
                        keyboardType="numeric"
                        error={errors.weight}
                        icon="scale-outline"
                    />

                    <PickerField
                        label="Activity Level"
                        value={formData.activityLevel}
                        onValueChange={(value) => updateField('activityLevel', value)}
                        options={[
                            { label: 'Sedentary (little/no exercise)', value: 'sedentary' },
                            { label: 'Light (light exercise 1-3 days/week)', value: 'light' },
                            { label: 'Moderate (moderate exercise 3-5 days/week)', value: 'moderate' },
                            { label: 'Active (hard exercise 6-7 days/week)', value: 'active' },
                            { label: 'Very Active (very hard exercise, physical job)', value: 'very_active' },
                        ]}
                        error={errors.activityLevel}
                    />
                </FormSection>

                <FormSection title="Goals & Targets">
                    <PickerField
                        label="Goal"
                        value={formData.goal}
                        onValueChange={(value) => updateField('goal', value)}
                        options={[
                            { label: 'Lose Weight', value: 'lose' },
                            { label: 'Maintain Weight', value: 'maintain' },
                            { label: 'Gain Weight', value: 'gain' },
                        ]}
                        error={errors.goal}
                    />

                    <InputField
                        label="Daily Calorie Target"
                        value={formData.dailyCaloriesTarget}
                        onChangeText={(value) => updateField('dailyCaloriesTarget', value)}
                        placeholder="Enter daily calorie target"
                        keyboardType="numeric"
                        error={errors.dailyCaloriesTarget}
                        icon="flame-outline"
                    />

                    <InputField
                        label="Daily Water Target (glasses)"
                        value={formData.dailyWaterTarget}
                        onChangeText={(value) => updateField('dailyWaterTarget', value)}
                        placeholder="Enter daily water target"
                        keyboardType="numeric"
                        error={errors.dailyWaterTarget}
                        icon="water-outline"
                    />
                </FormSection>

                {/* Health Insights & Suggestions */}
                {suggestions && (
                    <FormSection title="Health Insights & Suggestions">
                        <View style={styles.insightContainer}>
                            <View style={styles.bmiContainer}>
                                <View style={styles.bmiLeft}>
                                    <Text style={[styles.bmiValue, { color: suggestions.bmiCategory.color }]}>
                                        {suggestions.bmi}
                                    </Text>
                                    <Text style={[styles.bmiLabel, { color: theme.text }]}>BMI</Text>
                                </View>
                                <View style={styles.bmiRight}>
                                    <Text style={[styles.bmiCategory, { color: suggestions.bmiCategory.color }]}>
                                        {suggestions.bmiCategory.category}
                                    </Text>
                                    <Text style={[styles.bmiDescription, { color: theme.subText }]}>
                                        {suggestions.bmiCategory.description}
                                    </Text>
                                    <Text style={[styles.bmiRange, { color: theme.subText }]}>
                                        Normal range: {suggestions.bmiCategory.range}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.suggestionCard, { backgroundColor: theme.primaryLight || theme.primary + '20' }]}>
                                <View style={styles.suggestionHeader}>
                                    <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                                    <Text style={[styles.suggestionTitle, { color: theme.primary }]}>
                                        Recommendations
                                    </Text>
                                </View>

                                <Text style={[styles.suggestionText, { color: theme.text }]}>
                                    Based on your profile, we suggest:
                                </Text>

                                <View style={styles.suggestionItem}>
                                    <Ionicons name="flame-outline" size={16} color={theme.subText} />
                                    <Text style={[styles.suggestionItemText, { color: theme.subText }]}>
                                        Daily calories: {suggestions.calories} kcal
                                    </Text>
                                </View>

                                <View style={styles.suggestionItem}>
                                    <Ionicons name="water-outline" size={16} color={theme.subText} />
                                    <Text style={[styles.suggestionItemText, { color: theme.subText }]}>
                                        Daily water: {suggestions.water} glasses
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.applySuggestionsButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                                    onPress={applySuggestions}
                                >
                                    <Text style={[styles.applySuggestionsText, { color: theme.primary }]}>
                                        Apply Suggestions
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FormSection>
                )}                <View style={styles.buttonContainer}>
                    <SecondaryButton
                        title="Cancel"
                        onPress={onCancel}
                        style={styles.button}
                    />
                    <PrimaryButton
                        title={loading ? "Saving..." : "Save Changes"}
                        onPress={handleSave}
                        style={styles.button}
                        disabled={loading}
                    />
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
        borderRadius: 8,
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        minHeight: 48,
    },
    inputIcon: {
        marginRight: 8,
    },
    textInput: {
        fontSize: 16,
        paddingVertical: 12,
    },
    pickerWrapper: {
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    picker: {
        height: 48,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    button: {
        flex: 1,
    },
    bottomSpacing: {
        height: 20,
    },
    insightContainer: {
        gap: 16,
    },
    bmiContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    bmiLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    bmiValue: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    bmiLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    bmiRight: {
        flex: 1,
    },
    bmiCategory: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    bmiDescription: {
        fontSize: 14,
        marginBottom: 2,
    },
    bmiRange: {
        fontSize: 12,
    },
    suggestionCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    suggestionText: {
        fontSize: 14,
        marginBottom: 12,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    suggestionItemText: {
        fontSize: 14,
        marginLeft: 8,
    },
    applySuggestionsButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    applySuggestionsText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ProfileEditForm;