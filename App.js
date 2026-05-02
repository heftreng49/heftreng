import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/theme';
import { setupFCM } from './src/utils/notifications';

// Auth yüklenirken gösterilen splash
function AppLoader() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background,
                   alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.brand} size="large" />
    </View>
  );
}

function AppInner() {
  const { loadingAuth } = useAuth();

  useEffect(() => {
    setupFCM().catch(() => {});
  }, []);

  if (loadingAuth) return <AppLoader />;

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary:      COLORS.brand,
          background:   COLORS.background,
          card:         COLORS.surface,
          text:         COLORS.text,
          border:       COLORS.border,
          notification: COLORS.brand,
        },
      }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
