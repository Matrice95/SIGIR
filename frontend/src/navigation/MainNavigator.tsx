import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

// Screens
import DashboardScreen from '@/screens/DashboardScreenNew';
import MapScreen from '@/screens/MapScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import JournalScreen from '@/screens/JournalScreen';
import SettingsScreen from '@/screens/SettingsScreen';

// Constants
import { COLORS, SPACING, SHADOWS } from '@/constants/theme';
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

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 65,
          ...SHADOWS.medium,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarIconStyle: {
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
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
          headerShown: false,
        }}
      />
      
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Carte',
          tabBarLabel: 'Carte',
          headerShown: false,
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
