import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { deleteFood, getFoodList, saveFoodToDatabase, updateFood } from '../../utils/storage';
import { toast } from '../../utils/toast';

export default function FoodDbScreen() {
    const [foods, setFoods] = useState([]);
    const [newFood, setNewFood] = useState('');
    const [newCalories, setNewCalories] = useState('');
    const [newProtein, setNewProtein] = useState('');
    const [newCarbs, setNewCarbs] = useState('');
    const [newFat, setNewFat] = useState('');

    const load = async () => {
        const data = await getFoodList();
        setFoods(data || []);
    };

    useEffect(() => {
        load();
    }, []);

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

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: '#f6fbff' }]}
            contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.heading}>Food Database</Text>

            <View style={styles.card}>
                <Text style={styles.subheading}>Add New Food</Text>
                <TextInput value={newFood} onChangeText={setNewFood} placeholder="Name" style={styles.input} />
                <TextInput value={newCalories} onChangeText={setNewCalories} placeholder="Calories (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newProtein} onChangeText={setNewProtein} placeholder="Protein (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newCarbs} onChangeText={setNewCarbs} placeholder="Carbs (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newFat} onChangeText={setNewFat} placeholder="Fat (per 100g)" keyboardType="numeric" style={styles.input} />
                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Button title="Add Food" onPress={handleAddFood} />
                    </View>
                    <View style={{ width: 12 }} />
                </View>
                <View style={{ marginTop: 8 }}>
                    <Button title="Refresh" onPress={load} />
                </View>
            </View>

            {foods.length === 0 ? (
                <Text style={{ color: '#777', marginTop: 12 }}>No foods in the database.</Text>
            ) : (
                foods.map((f, i) => (
                    <View key={i} style={styles.foodItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.name}>{f.name}</Text>
                                <Text style={styles.meta}>{f.calories} kcal / 100g  P {f.protein}  C {f.carbs}  F {f.fat}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Text style={{ color: '#0b63d9', fontWeight: '700' }} onPress={() => {
                                    // quick edit: toggle name to 'name (edited)' for demonstration
                                    const newF = { ...f, name: `${f.name} (edited)` };
                                    updateFood(f.name, newF).then(load).then(() => toast('Food updated', 'success'));
                                }}>Edit</Text>
                                <Text style={{ color: '#e11d48', fontWeight: '700' }} onPress={() => { deleteFood(f.name).then(load).then(() => toast('Food deleted', 'error')); }}>Delete</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    heading: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#223' },
    subheading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    foodItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    name: { fontSize: 16, fontWeight: '700', color: '#111' },
    meta: { color: '#666', fontSize: 12, marginTop: 4 },
});
