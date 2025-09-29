import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getFoodDatabase, saveMealEntry, saveWaterEntry } from '../../utils/storage';
import { toast } from '../../utils/toast';

export default function AddMealScreen() {
  const [mealType, setMealType] = useState('Breakfast');
  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState('');
  const [waterMl, setWaterMl] = useState('250');
  const scale = useRef(new Animated.Value(1)).current;


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
      toast('Please enter quantity', 'error');
      return;
    }

    const food = foodList.find((f) => f.name === selectedFood);
    if (!food) {
      toast('Selected food not found', 'error');
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
    toast('Meal added!', 'success');
    setQuantity('');
  };

  const handleAddWater = async () => {
    const ml = parseInt(waterMl, 10);
    if (!ml || ml <= 0) {
      toast('Please enter a valid amount in ml', 'error');
      return;
    }

    await saveWaterEntry(ml);

    // simple scale animation to indicate success
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();

    toast(`${ml} ml added`, 'success');
    setWaterMl('250');
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: '#f6fbff' }]}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Log a Meal</Text>

        <View style={styles.card}>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Quick Water</Text>
          <View style={styles.waterRow}>
            <View style={styles.glassIconWrap}>
              <Ionicons name="water-outline" size={28} color="#3b82f6" />
            </View>
            <TextInput
              value={waterMl}
              onChangeText={setWaterMl}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={handleAddWater} activeOpacity={0.8}>
              <Animated.View style={[styles.addButton, { transform: [{ scale }] }]}>
                <Text style={styles.addButtonText}>Add</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 14, color: '#223' },
  label: { marginTop: 12, fontWeight: '600', color: '#444' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
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
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glassIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
});
