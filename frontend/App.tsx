import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
// import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';

// Store
import { store } from './src/store';
import { initializeAuth } from './src/store/slices/authSlice';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Services
import { initializeServices } from './src/services/initialization';

// Styles
import { COLORS } from './src/constants/theme';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: 'red', marginBottom: 10 }}>Une erreur s'est produite</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    // Initialize auth state
    store.dispatch(initializeAuth());
    
    // Initialize app services (notifications, location, etc.)
    initializeServices().then(() => {
      SplashScreen.hideAsync();
    }).catch((error) => {
      console.error('Init error:', error);
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <RootNavigator />
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
