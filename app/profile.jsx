import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getProfile, saveProfile, suggestCalories } from '../utils/storage';
import { toast } from '../utils/toast';

export default function ProfileScreen() {
    const [profile, setProfile] = useState({
        name: '',
        age: '',
        gender: 'male',
        heightCm: '',
        weightKg: '',
        activityLevel: 'sedentary',
        goal: 'maintain',
        dailyWaterGoalMl: 2000,
    });
    const [suggested, setSuggested] = useState(null);
    const [isEditing, setIsEditing] = useState(true);

    useEffect(() => {
        (async () => {
            const p = await getProfile();
            if (p) {
                setProfile({ ...profile, ...p });
                setIsEditing(false);
                const cal = suggestCalories(p);
                setSuggested(cal);
            } else {
                setIsEditing(true);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        // normalize numeric values
        const normalized = {
            ...profile,
            age: Number(profile.age) || undefined,
            heightCm: Number(profile.heightCm) || undefined,
            weightKg: Number(profile.weightKg) || undefined,
            dailyWaterGoalMl: Number(profile.dailyWaterGoalMl) || 2000,
        };

        await saveProfile(normalized);
        const cal = suggestCalories(normalized);
        setSuggested(cal);
        setProfile(normalized);
        setIsEditing(false);
        toast('Profile saved', 'success');
    };

    const handleEdit = () => setIsEditing(true);

    const handleCancel = async () => {
        const p = await getProfile();
        if (p) setProfile(p);
        setIsEditing(false);
    };

    const initials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0]?.toUpperCase())
            .slice(0, 2)
            .join('');
    };

    const computeBMI = (w, h) => {
        if (!w || !h) return null;
        const heightM = h / 100;
        if (heightM <= 0) return null;
        const bmi = w / (heightM * heightM);
        return Number(bmi.toFixed(1));
    };

    const bmi = computeBMI(profile.weightKg, profile.heightCm);
    const idealBmi = 22; // using 22 as population ideal

    const bmiStatus = (b) => {
        if (b === null) return { label: 'N/A', color: '#999' };
        if (b < 18.5) return { label: 'Underweight', color: '#3b82f6' };
        if (b < 25) return { label: 'Healthy', color: '#10b981' };
        if (b < 30) return { label: 'Overweight', color: '#f59e0b' };
        return { label: 'Obese', color: '#ef4444' };
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Profile</Text>

            {!isEditing && (!profile || !profile.name) ? (
                <View style={styles.emptyCard}>
                    <Text style={{ color: '#666' }}>No profile added yet.</Text>
                    <View style={{ height: 10 }} />
                    <Button title="Add Profile" onPress={() => setIsEditing(true)} />
                </View>
            ) : null}

            {!isEditing && profile && profile.name ? (
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
                        </View>
                    </View>

                    <Text style={styles.nameText}>{profile.name}</Text>
                    <Text style={styles.subText}>{profile.age ? `${profile.age} yrs • ${profile.gender}` : profile.gender}</Text>

                    <View style={styles.rowSmall}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Activity</Text>
                            <Text style={styles.infoValue}>{profile.activityLevel}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Goal</Text>
                            <Text style={styles.infoValue}>{profile.goal}</Text>
                        </View>
                    </View>

                    <View style={styles.bmiCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bmiLabel}>BMI</Text>
                            <Text style={[styles.bmiValue, { color: bmiStatus(bmi).color }]}>{bmi ?? 'N/A'}</Text>
                            <Text style={styles.bmiStatus}>{bmiStatus(bmi).label}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={styles.bmiLabel}>Ideal BMI</Text>
                            <Text style={styles.bmiValue}>{idealBmi}</Text>
                            <Text style={styles.bmiSmall}>Target range: 18.5 - 24.9</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 12, width: '100%' }}>
                        <Button title="Edit Profile" onPress={handleEdit} />
                    </View>
                </View>
            ) : null}

            {isEditing ? (
                <View style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput style={styles.input} value={profile.name} onChangeText={(t) => setProfile((s) => ({ ...s, name: t }))} />

                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} value={`${profile.age || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, age: t }))} keyboardType="numeric" />

                    <Text style={styles.label}>Gender</Text>
                    <TextInput style={styles.input} value={profile.gender} onChangeText={(t) => setProfile((s) => ({ ...s, gender: t }))} />

                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput style={styles.input} value={`${profile.heightCm || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, heightCm: t }))} keyboardType="numeric" />

                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput style={styles.input} value={`${profile.weightKg || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, weightKg: t }))} keyboardType="numeric" />

                    <Text style={styles.label}>Activity level</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={profile.activityLevel} onValueChange={(val) => setProfile((s) => ({ ...s, activityLevel: val }))}>
                            <Picker.Item label="Sedentary" value="sedentary" />
                            <Picker.Item label="Light" value="light" />
                            <Picker.Item label="Moderate" value="moderate" />
                            <Picker.Item label="Active" value="active" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Goal</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={profile.goal} onValueChange={(val) => setProfile((s) => ({ ...s, goal: val }))}>
                            <Picker.Item label="Lose" value="lose" />
                            <Picker.Item label="Maintain" value="maintain" />
                            <Picker.Item label="Gain" value="gain" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Daily water goal (ml)</Text>
                    <TextInput style={styles.input} value={`${profile.dailyWaterGoalMl || 2000}`} onChangeText={(t) => setProfile((s) => ({ ...s, dailyWaterGoalMl: t }))} keyboardType="numeric" />

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    {suggested ? <Text style={{ marginTop: 12 }}>Suggested calorie target: {suggested} kcal/day</Text> : null}
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 160, backgroundColor: '#f6fbff', flexGrow: 1 },
    heading: { fontSize: 22, fontWeight: '800', marginBottom: 14, color: '#223' },
    card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, elevation: 2 },
    label: { marginTop: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8, marginTop: 6 },
    pickerWrap: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginTop: 6, overflow: 'hidden' },
    profileCard: { backgroundColor: '#fff', padding: 18, borderRadius: 14, elevation: 3, alignItems: 'center' },
    avatarWrap: { marginTop: -40, marginBottom: 8 },
    avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e6f0ff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#0b63d9' },
    nameText: { fontSize: 20, fontWeight: '800', marginTop: 6 },
    subText: { color: '#666', marginTop: 4 },
    rowSmall: { flexDirection: 'row', width: '100%', marginTop: 12, justifyContent: 'space-between' },
    infoBox: { flex: 1, alignItems: 'center' },
    infoLabel: { color: '#666', fontSize: 12 },
    infoValue: { fontWeight: '700', marginTop: 4 },
    bmiCard: { width: '100%', flexDirection: 'row', padding: 12, marginTop: 12, borderRadius: 10, backgroundColor: '#f8fbff' },
    bmiLabel: { color: '#666' },
    bmiValue: { fontSize: 20, fontWeight: '800', marginTop: 6 },
    bmiStatus: { marginTop: 6, fontWeight: '600' },
    bmiSmall: { color: '#666', marginTop: 6 },
    actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
    saveBtn: { backgroundColor: '#0b63d9', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 8 },
    saveText: { color: '#fff', fontWeight: '700' },
    cancelBtn: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 8 },
    cancelText: { color: '#333', fontWeight: '700' },
    emptyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
});
