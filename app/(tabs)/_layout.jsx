import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import ToastHost from '../../components/ui/Toast';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <ToastHost />
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fff', elevation: 2, height: 56 },
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          tabBarActiveTintColor: '#007aff',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarLabelStyle: { fontSize: 12, paddingBottom: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Overview',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="bar-chart-outline" size={20} color="#007aff" />
                <Text style={{ marginLeft: 8, fontWeight: '700', fontSize: 16 }}>Dashboard</Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="add-meal"
          options={{
            title: 'Log',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" color={color} size={size} />
            ),
            headerTitle: 'Add Meal',
          }}
        />
        <Tabs.Screen
          name="food-db"
          options={{
            title: 'Foods',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fast-food-outline" color={color} size={size} />
            ),
            headerTitle: 'Food DB',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
            headerTitle: 'Profile',
          }}
        />
      </Tabs>
    </View>
  );
}
