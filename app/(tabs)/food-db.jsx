import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getFoodList, saveFoodToDatabase } from '../../utils/storage';

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
            Alert.alert('Please fill all food details');
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
        Alert.alert('Food added to database!');
        setNewFood('');
        setNewCalories('');
        setNewProtein('');
        setNewCarbs('');
        setNewFat('');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Food Database</Text>
            <Button title="Refresh" onPress={load} />

            <View style={{ marginTop: 12, marginBottom: 20 }}>
                <Text style={styles.subheading}>Add New Food</Text>
                <TextInput value={newFood} onChangeText={setNewFood} placeholder="Name" style={styles.input} />
                <TextInput value={newCalories} onChangeText={setNewCalories} placeholder="Calories (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newProtein} onChangeText={setNewProtein} placeholder="Protein (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newCarbs} onChangeText={setNewCarbs} placeholder="Carbs (per 100g)" keyboardType="numeric" style={styles.input} />
                <TextInput value={newFat} onChangeText={setNewFat} placeholder="Fat (per 100g)" keyboardType="numeric" style={styles.input} />
                <Button title="Add Food to Database" onPress={handleAddFood} />
            </View>

            {foods.length === 0 ? (
                <Text style={{ color: '#777', marginTop: 12 }}>No foods in the database.</Text>
            ) : (
                foods.map((f, i) => (
                    <View key={i} style={styles.item}>
                        <Text style={styles.name}>{f.name}</Text>
                        <Text style={styles.meta}>{f.calories} kcal / 100g • P {f.protein} • C {f.carbs} • F {f.fat}</Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff' },
    heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
    item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    name: { fontSize: 16, fontWeight: '600' },
    meta: { color: '#666', fontSize: 12, marginTop: 4 },
});
