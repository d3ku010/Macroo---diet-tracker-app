import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MacrooSupabaseTest from '../../components/MacrooSupabaseTest';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getProfile, saveProfile } from '../../utils/supabaseStorage';
import { toast } from '../../utils/toast';

export default function ProfileScreen() {
    const { theme } = useTheme();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editProfile, setEditProfile] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const userData = await getProfile();
            if (userData) {
                setProfile(userData);
            } else {
                const defaultProfile = {
                    name: 'User',
                    age: 25,
                    gender: 'other',
                    height: 170,
                    weight: 70,
                    activityLevel: 'moderate',
                    goal: 'maintain',
                    dailyCaloriesTarget: 2000,
                    dailyWaterTarget: 8,
                };
                setProfile(defaultProfile);
                await saveProfile(defaultProfile);
            }
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateBMI = (weight, height) => {
        if (!weight || !height || weight <= 0 || height <= 0) return null;
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        return Math.round(bmi * 10) / 10; // Round to 1 decimal place
    };

    const getBMICategory = (bmi) => {
        if (!bmi) return { category: 'Unknown', color: theme.subText };
        if (bmi < 18.5) return { category: 'Underweight', color: '#3498db' };
        if (bmi < 25) return { category: 'Normal', color: '#27ae60' };
        if (bmi < 30) return { category: 'Overweight', color: '#f39c12' };
        return { category: 'Obese', color: '#e74c3c' };
    };

    const startEdit = () => {
        setEditProfile({ ...profile });
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditProfile(null);
        setIsEditing(false);
    };

    const saveEdit = async () => {
        try {
            // Validate inputs
            if (!editProfile.name || editProfile.name.trim() === '') {
                toast('Name is required', 'error');
                return;
            }

            if (!editProfile.age || editProfile.age < 1 || editProfile.age > 120) {
                toast('Please enter a valid age (1-120)', 'error');
                return;
            }

            if (!editProfile.height || editProfile.height < 50 || editProfile.height > 300) {
                toast('Please enter a valid height (50-300 cm)', 'error');
                return;
            }

            if (!editProfile.weight || editProfile.weight < 20 || editProfile.weight > 500) {
                toast('Please enter a valid weight (20-500 kg)', 'error');
                return;
            }

            // Convert strings to numbers
            const normalizedProfile = {
                ...editProfile,
                age: parseInt(editProfile.age),
                height: parseFloat(editProfile.height),
                weight: parseFloat(editProfile.weight),
                dailyCaloriesTarget: parseInt(editProfile.dailyCaloriesTarget || 2000),
                dailyWaterTarget: parseInt(editProfile.dailyWaterTarget || 8),
            };

            await saveProfile(normalizedProfile);
            setProfile(normalizedProfile);
            setIsEditing(false);
            setEditProfile(null);
            toast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast('Failed to save profile', 'error');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
                <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
            </View>
        );
    }

    const bmi = profile ? calculateBMI(profile.weight, profile.height) : null;
    const bmiInfo = getBMICategory(bmi);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

                {/* Temporary Supabase Test Component */}
                <View style={[styles.card, { backgroundColor: theme.card, marginBottom: 20 }]}>
                    <MacrooSupabaseTest />
                </View>

                {profile && (
                    <>
                        {/* Profile Summary Card */}
                        <View style={[styles.card, { backgroundColor: theme.card }]}>
                            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={[styles.name, { color: theme.text }]}>
                                {profile.name}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.subText }]}>
                                {profile.age} years • {profile.gender}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.subText }]}>
                                Goal: {(profile.goal || 'maintain').charAt(0).toUpperCase() + (profile.goal || 'maintain').slice(1)} Weight
                            </Text>

                            <TouchableOpacity
                                style={[styles.editButton, { borderColor: theme.primary }]}
                                onPress={startEdit}
                            >
                                <Ionicons name="create-outline" size={20} color={theme.primary} />
                                <Text style={[styles.editText, { color: theme.primary }]}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Health Stats Card */}
                        <View style={[styles.card, { backgroundColor: theme.card, marginTop: 16 }]}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Health Stats</Text>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: theme.subText }]}>Height</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{profile.height} cm</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statLabel, { color: theme.subText }]}>Weight</Text>
                                    <Text style={[styles.statValue, { color: theme.text }]}>{profile.weight} kg</Text>
                                </View>
                            </View>

                            <View style={styles.bmiContainer}>
                                <Text style={[styles.statLabel, { color: theme.subText }]}>BMI</Text>
                                <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>
                                    {bmi || 'N/A'}
                                </Text>
                                <Text style={[styles.bmiCategory, { color: bmiInfo.color }]}>
                                    {bmiInfo.category}
                                </Text>
                            </View>
                        </View>

                        {/* Goals Card */}
                        <View style={[styles.card, { backgroundColor: theme.card, marginTop: 16 }]}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Goals</Text>

                            <View style={styles.goalRow}>
                                <Ionicons name="flame-outline" size={20} color={theme.primary} />
                                <Text style={[styles.goalLabel, { color: theme.text }]}>Calories</Text>
                                <Text style={[styles.goalValue, { color: theme.subText }]}>
                                    {profile.dailyCaloriesTarget || 2000} kcal
                                </Text>
                            </View>

                            <View style={styles.goalRow}>
                                <Ionicons name="water-outline" size={20} color={theme.primary} />
                                <Text style={[styles.goalLabel, { color: theme.text }]}>Water</Text>
                                <Text style={[styles.goalValue, { color: theme.subText }]}>
                                    {profile.dailyWaterTarget || 8} glasses
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditing}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={cancelEdit}>
                                <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={saveEdit}>
                                <Text style={[styles.modalHeaderButton, { color: theme.primary }]}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {editProfile && (
                                <>
                                    {/* Basic Info */}
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Name</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.name}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, name: text })}
                                            placeholder="Your name"
                                            placeholderTextColor={theme.subText}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Age</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.age?.toString()}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, age: text })}
                                            placeholder="25"
                                            placeholderTextColor={theme.subText}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Height (cm)</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.height?.toString()}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, height: text })}
                                            placeholder="170"
                                            placeholderTextColor={theme.subText}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Weight (kg)</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.weight?.toString()}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, weight: text })}
                                            placeholder="70"
                                            placeholderTextColor={theme.subText}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    {/* BMI Preview */}
                                    {editProfile.height && editProfile.weight && (
                                        <View style={[styles.bmiPreview, { backgroundColor: theme.card }]}>
                                            <Text style={[styles.bmiPreviewLabel, { color: theme.text }]}>BMI Preview</Text>
                                            <Text style={[styles.bmiPreviewValue, {
                                                color: getBMICategory(calculateBMI(editProfile.weight, editProfile.height)).color
                                            }]}>
                                                {calculateBMI(editProfile.weight, editProfile.height)} - {getBMICategory(calculateBMI(editProfile.weight, editProfile.height)).category}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Gender Picker */}
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Gender</Text>
                                        <View style={[styles.pickerContainer, {
                                            borderColor: theme.muted,
                                            backgroundColor: theme.card
                                        }]}>
                                            <Picker
                                                selectedValue={editProfile.gender}
                                                onValueChange={(value) => setEditProfile({ ...editProfile, gender: value })}
                                                style={{ color: theme.text }}
                                            >
                                                <Picker.Item label="Male" value="male" />
                                                <Picker.Item label="Female" value="female" />
                                                <Picker.Item label="Other" value="other" />
                                            </Picker>
                                        </View>
                                    </View>

                                    {/* Activity Level */}
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Activity Level</Text>
                                        <View style={[styles.pickerContainer, {
                                            borderColor: theme.muted,
                                            backgroundColor: theme.card
                                        }]}>
                                            <Picker
                                                selectedValue={editProfile.activityLevel}
                                                onValueChange={(value) => setEditProfile({ ...editProfile, activityLevel: value })}
                                                style={{ color: theme.text }}
                                            >
                                                <Picker.Item label="Sedentary" value="sedentary" />
                                                <Picker.Item label="Light" value="light" />
                                                <Picker.Item label="Moderate" value="moderate" />
                                                <Picker.Item label="Active" value="active" />
                                                <Picker.Item label="Very Active" value="very_active" />
                                            </Picker>
                                        </View>
                                    </View>

                                    {/* Goal */}
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Goal</Text>
                                        <View style={[styles.pickerContainer, {
                                            borderColor: theme.muted,
                                            backgroundColor: theme.card
                                        }]}>
                                            <Picker
                                                selectedValue={editProfile.goal}
                                                onValueChange={(value) => setEditProfile({ ...editProfile, goal: value })}
                                                style={{ color: theme.text }}
                                            >
                                                <Picker.Item label="Lose Weight" value="lose" />
                                                <Picker.Item label="Maintain Weight" value="maintain" />
                                                <Picker.Item label="Gain Weight" value="gain" />
                                            </Picker>
                                        </View>
                                    </View>

                                    {/* Daily Goals */}
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Daily Calorie Target</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.dailyCaloriesTarget?.toString()}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, dailyCaloriesTarget: text })}
                                            placeholder="2000"
                                            placeholderTextColor={theme.subText}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Daily Water Target (glasses)</Text>
                                        <TextInput
                                            style={[styles.textInput, {
                                                borderColor: theme.muted,
                                                color: theme.text,
                                                backgroundColor: theme.card
                                            }]}
                                            value={editProfile.dailyWaterTarget?.toString()}
                                            onChangeText={(text) => setEditProfile({ ...editProfile, dailyWaterTarget: text })}
                                            placeholder="8"
                                            placeholderTextColor={theme.subText}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={{ height: 50 }} />
                                </>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16 },

    // Profile Cards
    card: { padding: 20, borderRadius: 16, alignItems: 'center' },
    cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, alignSelf: 'flex-start' },

    // Avatar
    avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },

    // Profile Info
    name: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
    subtitle: { fontSize: 16, marginBottom: 8, textAlign: 'center' },

    // Edit Button
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        marginTop: 16
    },
    editText: { fontSize: 16, fontWeight: '600' },

    // Stats
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
    statItem: { alignItems: 'center' },
    statLabel: { fontSize: 14, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '600' },

    // BMI
    bmiContainer: { alignItems: 'center', width: '100%' },
    bmiValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 4 },
    bmiCategory: { fontSize: 16, fontWeight: '600' },

    // Goals
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
        gap: 12
    },
    goalLabel: { flex: 1, fontSize: 16 },
    goalValue: { fontSize: 16, fontWeight: '600' },

    // Modal
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalHeaderButton: { fontSize: 16, fontWeight: '600' },
    headerButton: {
        cursor: Platform.OS === 'web' ? 'pointer' : 'default',
        padding: 8,
    },
    modalContent: { flex: 1, padding: 20 },

    // Form Inputs
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    textInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 44
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 44,
        justifyContent: 'center'
    },

    // BMI Preview
    bmiPreview: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center'
    },
    bmiPreviewLabel: { fontSize: 14, marginBottom: 4 },
    bmiPreviewValue: { fontSize: 18, fontWeight: 'bold' },
});