import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Screens
import DashboardScreen from '@/screens/DashboardScreen';
import MapScreen from '@/screens/MapScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import JournalScreen from '@/screens/JournalScreen';
import SettingsScreen from '@/screens/SettingsScreen';

// Constants
import { COLORS, SPACING } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const unreadAlertsCount = useAppSelector(state => state.alerts.unreadCount);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Journal':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : SPACING.sm,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.textLight,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
        }}
      />
      
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Carte',
          tabBarLabel: 'Carte',
          headerShown: false, // Mapbox needs full screen
        }}
      />
      
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendrier',
          tabBarLabel: 'Calendrier',
        }}
      />
      
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          title: 'Journal',
          tabBarLabel: 'Journal',
        }}
      />
      
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Paramètres',
          tabBarLabel: 'Paramètres',
        }}
      />
    </Tab.Navigator>
  );
}
