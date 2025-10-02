import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import ThemeProvider, { useTheme } from '../../components/ui/ThemeProvider';
import ToastHost from '../../components/ui/Toast';

function ThemedTabs() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.card, elevation: 2, height: 80 },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: theme.text },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subText,
        tabBarStyle: { backgroundColor: theme.card },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={({ navigation }) => ({
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.primary} />
              <Text style={{ marginLeft: 8, fontWeight: '700', fontSize: 16, color: theme.text }}>Dashboard</Text>
            </View>
          ),
        })}
      />
      <Tabs.Screen
        name="monthly"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
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
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <ToastHost />
        <ThemedTabs />
      </View>
    </ThemeProvider>
  );
}
