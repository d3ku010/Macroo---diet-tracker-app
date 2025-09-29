import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-meal"
          options={{
            title: 'Add Meal',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="food-db"
          options={{
            title: 'Food DB',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fast-food" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
