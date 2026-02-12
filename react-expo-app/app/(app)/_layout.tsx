import { Tabs, router } from 'expo-router';
import { Button } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons'; 

export default function AppLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerRight: () => (
          <Button title="Logout" onPress={signOut} />
        ),
        headerLeft: () => {
          // If the current route name is NOT 'index' (which is your Home screen),
          // return the Home button component.
          if (route.name !== 'index') {
            return <Button title="Home" onPress={() => router.replace('/')} />;
          }
          // If the current route name IS 'index', return undefined to hide it.
          return undefined; 
        },
        
        // Style for the active tab icon/label
        tabBarActiveTintColor: '#007AFF',
        
        // --- IMPORTANT: HIDE THE BACK BUTTON ---
        // Since this is the root navigator, setting this to undefined 
        // ensures no back button is rendered (as there's nowhere to go back to).
      })}
    >
      {/* 1. HOME Screen (Tab 1) */}
      <Tabs.Screen
        name="index" // Matches app/(app)/index.tsx
        options={{
          href: null, // hide this tab
          title: 'Home',
          tabBarLabel: 'Home', // Text under the icon
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

            {/* 2. NEW PURCHASE MODAL SCREEN: Hidden from tabs <--- ADD THIS BLOCK */}
      <Tabs.Screen
        name="budget/new" // Target the route located at app/(app)/budget/new.tsx
        options={{
          title: 'New Purchase', // The header title will still be set by the modal component itself
          href: null,             // Hides the tab icon
          headerShown: false,     // Hide the Tab's header on this screen (modal usually handles its own header)
        }}
      />
      
      {/* 2. INVEST Screen (Tab 2) */}
      <Tabs.Screen
        name="invest" // Matches app/(app)/invest.tsx
        options={{
          title: 'Investments', // Header title
          tabBarLabel: 'Invest', // Text under the icon
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      
      {/* 3. BUDGET Screen (Tab 3) */}
      <Tabs.Screen
        name="budget" // Matches app/(app)/budget.tsx
        options={{
          title: 'Budget',
          tabBarLabel: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
      
      {/* 4. REPORT Screen (Tab 4) */}
      <Tabs.Screen
        name="report" // Matches app/(app)/report.tsx
        options={{
          title: 'Reports',
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
