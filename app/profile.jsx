import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import { useTheme } from '../components/ui/ThemeProvider';
import notifications from '../utils/notifications';
import { getProfile, saveProfile, suggestCalories } from '../utils/storage';
import { toast } from '../utils/toast';

export default function ProfileScreen() {
    const { theme, toggle, setTheme } = useTheme();
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
        if (b === null) return { label: 'N/A', color: theme.subText };
        if (b < 18.5) return { label: 'Underweight', color: theme.primary };
        if (b < 25) return { label: 'Healthy', color: theme.success };
        if (b < 30) return { label: 'Overweight', color: theme.fat };
        return { label: 'Obese', color: theme.danger };
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.heading, { color: theme.text }]}>Profile</Text>

            {!isEditing && (!profile || !profile.name) ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                    <Text style={{ color: theme.subText }}>No profile added yet.</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton title="Add Profile" onPress={() => setIsEditing(true)} />
                </View>
            ) : null}

            {!isEditing && profile && profile.name ? (
                <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
                    <View style={styles.avatarWrap}>
                        <View style={[styles.avatarCircle, { backgroundColor: theme.muted }]}>
                            <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(profile.name)}</Text>
                        </View>
                    </View>

                    <Text style={[styles.nameText, { color: theme.text }]}>{profile.name}</Text>
                    <Text style={[styles.subText, { color: theme.subText }]}>{profile.age ? `${profile.age} yrs • ${profile.gender}` : profile.gender}</Text>

                    <View style={styles.rowSmall}>
                        <View style={styles.infoBox}>
                            <Text style={[styles.infoLabel, { color: theme.subText }]}>Activity</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.activityLevel}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={[styles.infoLabel, { color: theme.subText }]}>Goal</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.goal}</Text>
                        </View>
                    </View>

                    <View style={[styles.bmiCard, { backgroundColor: theme.card }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.bmiLabel, { color: theme.subText }]}>BMI</Text>
                            <Text style={[styles.bmiValue, { color: bmiStatus(bmi).color }]}>{bmi ?? 'N/A'}</Text>
                            <Text style={[styles.bmiStatus, { color: theme.subText }]}>{bmiStatus(bmi).label}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={[styles.bmiLabel, { color: theme.subText }]}>Ideal BMI</Text>
                            <Text style={[styles.bmiValue, { color: theme.text }]}>{idealBmi}</Text>
                            <Text style={[styles.bmiSmall, { color: theme.subText }]}>Target range: 18.5 - 24.9</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 12, width: '100%' }}>
                        <PrimaryButton title="Edit Profile" onPress={handleEdit} />
                    </View>
                    {/* Theme toggle moved to Overview page */}
                </View>
            ) : null}

            {isEditing ? (
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={profile.name} onChangeText={(t) => setProfile((s) => ({ ...s, name: t }))} />

                    <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={`${profile.age || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, age: t }))} keyboardType="numeric" />

                    <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={profile.gender} onChangeText={(t) => setProfile((s) => ({ ...s, gender: t }))} />

                    <Text style={[styles.label, { color: theme.text }]}>Height (cm)</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={`${profile.heightCm || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, heightCm: t }))} keyboardType="numeric" />

                    <Text style={[styles.label, { color: theme.text }]}>Weight (kg)</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={`${profile.weightKg || ''}`} onChangeText={(t) => setProfile((s) => ({ ...s, weightKg: t }))} keyboardType="numeric" />

                    <Text style={[styles.label, { color: theme.text }]}>Activity level</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={profile.activityLevel} onValueChange={(val) => setProfile((s) => ({ ...s, activityLevel: val }))}>
                            <Picker.Item label="Sedentary" value="sedentary" />
                            <Picker.Item label="Light" value="light" />
                            <Picker.Item label="Moderate" value="moderate" />
                            <Picker.Item label="Active" value="active" />
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: theme.text }]}>Goal</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={profile.goal} onValueChange={(val) => setProfile((s) => ({ ...s, goal: val }))}>
                            <Picker.Item label="Lose" value="lose" />
                            <Picker.Item label="Maintain" value="maintain" />
                            <Picker.Item label="Gain" value="gain" />
                        </Picker>
                    </View>

                    <Text style={[styles.label, { color: theme.text }]}>Daily water goal (ml)</Text>
                    <TextInput style={[styles.input, { borderColor: theme.muted, color: theme.text }]} value={`${profile.dailyWaterGoalMl || 2000}`} onChangeText={(t) => setProfile((s) => ({ ...s, dailyWaterGoalMl: t }))} keyboardType="numeric" />

                    <View style={styles.actionRow}>
                        <SecondaryButton title="Cancel" onPress={handleCancel} style={{ flex: 1, marginRight: 8 }} />
                        <PrimaryButton title="Save" onPress={handleSave} style={{ flex: 1 }} />
                    </View>

                    {suggested ? <Text style={{ marginTop: 12, color: theme.text }}>Suggested calorie target: {suggested} kcal/day</Text> : null}
                    <View style={{ marginTop: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Hydration Reminders</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <SecondaryButton title="Enable Reminder" onPress={async () => {
                                const res = await notifications.requestPermissions();
                                if (!res.granted) { toast('Notifications permission denied', 'error'); return; }
                                try { await notifications.scheduleDailyReminder(20, 0); toast('Reminder scheduled', 'success'); } catch (e) { toast('Install expo-notifications to enable reminders', 'error'); }
                            }} />
                        </View>
                    </View>
                </View>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, paddingBottom: 160, flexGrow: 1 },
    heading: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
    card: { padding: 14, borderRadius: 12, elevation: 2 },
    label: { marginTop: 8, fontWeight: '600' },
    input: { borderWidth: 1, padding: 8, borderRadius: 8, marginTop: 6 },
    pickerWrap: { borderWidth: 1, borderRadius: 8, marginTop: 6, overflow: 'hidden' },
    profileCard: { padding: 18, borderRadius: 14, elevation: 3, alignItems: 'center' },
    avatarWrap: { marginTop: -40, marginBottom: 8 },
    avatarCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    avatarText: { fontSize: 32, fontWeight: '800' },
    nameText: { fontSize: 20, fontWeight: '800', marginTop: 6 },
    subText: { marginTop: 4 },
    rowSmall: { flexDirection: 'row', width: '100%', marginTop: 12, justifyContent: 'space-between' },
    infoBox: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: 12 },
    infoValue: { fontWeight: '700', marginTop: 4 },
    bmiCard: { width: '100%', flexDirection: 'row', padding: 12, marginTop: 12, borderRadius: 10 },
    bmiLabel: {},
    bmiValue: { fontSize: 20, fontWeight: '800', marginTop: 6 },
    bmiStatus: { marginTop: 6, fontWeight: '600' },
    bmiSmall: { marginTop: 6 },
    actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
    saveBtn: { padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 8 },
    saveText: { fontWeight: '700' },
    cancelBtn: { borderWidth: 1, padding: 10, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 8 },
    cancelText: { fontWeight: '700' },
    emptyCard: { padding: 16, borderRadius: 12, alignItems: 'center' },
});
