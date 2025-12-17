import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Navigators
import MainNavigator from './MainNavigator';

// Screens
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import FieldDetailsScreen from '@/screens/FieldDetailsScreen';
import OperationDetailsScreen from '@/screens/OperationDetailsScreen';
import AddOperationScreen from '@/screens/AddOperationScreen';
import AddFieldScreen from '@/screens/AddFieldScreen';
import AlertsScreen from '@/screens/AlertsScreen';
import WeatherScreen from '@/screens/WeatherScreen';
import EvapotranspirationScreen from '@/screens/EvapotranspirationScreen';

// Store
import { useAppSelector } from '@/store/hooks';
import { COLORS } from '@/constants/theme';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);
  
  // Splash screen pendant le chargement
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.textLight,
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        {!isAuthenticated ? (
          // Écran de connexion si non authentifié
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Navigation principale si authentifié
          <>
            <Stack.Screen
              name="Main"
              component={MainNavigator}
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="FieldDetails"
              component={FieldDetailsScreen}
              options={{ title: 'Détails parcelle' }}
            />
            
            <Stack.Screen
              name="OperationDetails"
              component={OperationDetailsScreen}
              options={{ title: 'Détails opération' }}
            />
            
            <Stack.Screen
              name="AddOperation"
              component={AddOperationScreen}
              options={{
                title: 'Nouvelle opération',
              }}
            />
            
            <Stack.Screen
              name="AddField"
              component={AddFieldScreen}
              options={{
                title: 'Nouvelle parcelle',
              }}
            />
            
            <Stack.Screen
              name="Alerts"
              component={AlertsScreen}
              options={{
                title: 'Alertes',
              }}
            />
            
            <Stack.Screen
              name="Weather"
              component={WeatherScreen}
              options={{
                title: 'Météo détaillée',
              }}
            />
            
            <Stack.Screen
              name="Evapotranspiration"
              component={EvapotranspirationScreen}
              options={{
                title: 'Évapotranspiration',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
