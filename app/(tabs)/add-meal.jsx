import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput
} from 'react-native';
import { getFoodDatabase, saveMealEntry } from '../../utils/storage';

export default function AddMealScreen() {
  const [mealType, setMealType] = useState('Breakfast');
  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState('');


  useEffect(() => {
    loadFoodList();
  }, []);

  const loadFoodList = async () => {
    const saved = await getFoodDatabase();
    setFoodList(saved);
    if (saved.length > 0) {
      setSelectedFood(saved[0].name);
    }
  };

  const handleAddMeal = async () => {
    if (!quantity) {
      Alert.alert('Please enter quantity');
      return;
    }

    const food = foodList.find((f) => f.name === selectedFood);
    if (!food) {
      Alert.alert('Selected food not found');
      return;
    }

    const qty = parseFloat(quantity);
    const nutrients = {
      calories: (food.calories * qty) / 100,
      protein: (food.protein * qty) / 100,
      carbs: (food.carbs * qty) / 100,
      fat: (food.fat * qty) / 100,
    };

    const newMeal = {
      type: mealType,
      food: selectedFood,
      quantity: qty,
      nutrients,
      date: new Date().toISOString().split("T")[0], // <-- add today's date
    };


    await saveMealEntry(newMeal);
    Alert.alert('Meal added!');
    setQuantity('');
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Add a Meal</Text>

        <Text style={styles.label}>Meal Type</Text>
        <Picker selectedValue={mealType} onValueChange={setMealType}>
          <Picker.Item label="Breakfast" value="Breakfast" />
          <Picker.Item label="Lunch" value="Lunch" />
          <Picker.Item label="Dinner" value="Dinner" />
          <Picker.Item label="Other" value="Other" />
        </Picker>

        <Text style={styles.label}>Food</Text>
        <Picker selectedValue={selectedFood} onValueChange={setSelectedFood}>
          {foodList.map((food) => (
            <Picker.Item key={food.name} label={food.name} value={food.name} />
          ))}
        </Picker>

        <Text style={styles.label}>Quantity (grams)</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
        />

        <Button title="Add Meal" onPress={handleAddMeal} />

        {/* Add-food form moved to Food DB tab */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { marginTop: 12, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 24,
  },
});
