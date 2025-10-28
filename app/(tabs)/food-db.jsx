import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ResponsiveCard from '../../components/layout/ResponsiveCard';
import ResponsiveLayout from '../../components/layout/ResponsiveLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../components/ui/ThemeProvider';
import { deleteFoodFromDatabase, getFoodDatabase, saveFoodToDatabase, updateFoodInDatabase } from '../../utils/supabaseStorage';
import { toast } from '../../utils/toast';

export default function FoodDbScreen() {
    const { theme } = useTheme();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [foods, setFoods] = useState([]);
    const [newFood, setNewFood] = useState('');
    const [newCalories, setNewCalories] = useState('');
    const [newProtein, setNewProtein] = useState('');
    const [newCarbs, setNewCarbs] = useState('');
    const [newFat, setNewFat] = useState('');

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingFood, setEditingFood] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCalories, setEditCalories] = useState('');
    const [editProtein, setEditProtein] = useState('');
    const [editCarbs, setEditCarbs] = useState('');
    const [editFat, setEditFat] = useState('');

    const load = async () => {
        const data = await getFoodDatabase();
        setFoods(data || []);
    };

    useEffect(() => {
        load();
    }, []);

    // Refresh data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('Food DB screen focused, refreshing data...');
            load();
            setRefreshTrigger(prev => prev + 1);
        }, [])
    );

    const handleAddFood = async () => {
        if (!newFood || !newCalories || !newProtein || !newCarbs || !newFat) {
            toast('Please fill all food details', 'error');
            return;
        }

        const newFoodItem = {
            name: newFood,
            calories: parseFloat(newCalories),
            protein: parseFloat(newProtein),
            carbs: parseFloat(newCarbs),
            fat: parseFloat(newFat),
        };

        await saveFoodToDatabase(newFoodItem);
        await load();
        toast('Food added to database!', 'success');
        setNewFood('');
        setNewCalories('');
        setNewProtein('');
        setNewCarbs('');
        setNewFat('');
    };

    const openEdit = (f) => {
        setEditingFood(f);
        setEditName(f.name);
        setEditCalories(String(f.calories || ''));
        setEditProtein(String(f.protein || ''));
        setEditCarbs(String(f.carbs || ''));
        setEditFat(String(f.fat || ''));
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingFood) return;
        const updated = {
            name: editName || editingFood.name,
            calories: parseFloat(editCalories) || editingFood.calories,
            protein: parseFloat(editProtein) || editingFood.protein,
            carbs: parseFloat(editCarbs) || editingFood.carbs,
            fat: parseFloat(editFat) || editingFood.fat,
        };
        await updateFoodInDatabase(editingFood.id, updated);
        setEditModalVisible(false);
        setEditingFood(null);
        await load();
        toast('Food updated', 'success');
    };

    return (
        <ResponsiveLayout>
            <Text style={[styles.heading, { color: theme.text }]}>Food Database</Text>

            <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
                <Text style={[styles.subheading, { color: theme.text }]}>Add New Food</Text>
                <TextInput value={newFood} onChangeText={setNewFood} placeholder="Name" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                <TextInput value={newCalories} onChangeText={setNewCalories} placeholder="Calories (per 100g)" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                <TextInput value={newProtein} onChangeText={setNewProtein} placeholder="Protein (per 100g)" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                <TextInput value={newCarbs} onChangeText={setNewCarbs} placeholder="Carbs (per 100g)" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                <TextInput value={newFat} onChangeText={setNewFat} placeholder="Fat (per 100g)" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <PrimaryButton title="Add Food" onPress={handleAddFood} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ width: 110 }}>
                        <PrimaryButton title="Refresh" onPress={load} />
                    </View>
                </View>
            </ResponsiveCard>

            {foods.length === 0 ? (
                <ResponsiveCard size="medium">
                    <Text style={{ color: theme.subText, textAlign: 'center' }}>No foods in the database.</Text>
                </ResponsiveCard>
            ) : (
                foods.map((f, i) => (
                    <ResponsiveCard key={i} size="medium" style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>{f.name}</Text>
                                <Text style={[styles.meta, { color: theme.subText }]} numberOfLines={1}>
                                    {f.calories} kcal/100g • P {f.protein} • C {f.carbs} • F {f.fat}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                                <TouchableOpacity onPress={() => openEdit(f)} style={{ padding: 6 }} accessibilityLabel="Edit food">
                                    <Ionicons name="pencil" size={18} color={theme.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={async () => {
                                    const removed = f; // Store the food data for undo
                                    await deleteFoodFromDatabase(f.id);
                                    await load();
                                    toast({ message: 'Food deleted', type: 'error', action: { label: 'Undo', onPress: async () => { if (removed) { await saveFoodToDatabase(removed); await load(); toast('Restored', 'success'); } } } });
                                }} style={{ padding: 6 }} accessibilityLabel="Delete food">
                                    <Ionicons name="trash" size={18} color={theme.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ResponsiveCard>
                ))
            )}

            {/* Edit Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: theme.text }}>Edit Food</Text>
                        <TextInput value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                        <TextInput value={editCalories} onChangeText={setEditCalories} placeholder="Calories" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                        <TextInput value={editProtein} onChangeText={setEditProtein} placeholder="Protein" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                        <TextInput value={editCarbs} onChangeText={setEditCarbs} placeholder="Carbs" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                        <TextInput value={editFat} onChangeText={setEditFat} placeholder="Fat" keyboardType="numeric" placeholderTextColor={theme.subText} style={[styles.input, { borderColor: theme.muted, backgroundColor: theme.background, color: theme.text }]} />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                            <PrimaryButton title="Cancel" onPress={() => setEditModalVisible(false)} style={{ marginRight: 8 }} />
                            <PrimaryButton title="Save" onPress={handleSaveEdit} />
                        </View>
                    </View>
                </View>
            </Modal>
        </ResponsiveLayout>
    );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: { flex: 1 },
    heading: {
        fontSize: screenWidth < 380 ? 20 : 22,
        fontWeight: '700',
        marginBottom: 16,
        marginTop: 8
    },
    subheading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    input: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    card: {
        padding: 14,
        borderRadius: 12,
        marginVertical: 12,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    foodItem: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    name: { fontSize: screenWidth < 380 ? 14 : 16, fontWeight: '700' },
    meta: { fontSize: screenWidth < 380 ? 11 : 12, marginTop: 4 },
});
