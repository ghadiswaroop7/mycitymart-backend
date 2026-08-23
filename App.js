import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, Text, View, StyleSheet as RNStyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold
} from '@expo-google-fonts/poppins';
import './global.css';

// Fix NativeWind Web dark-mode error: must be called before any render
// This tells react-native-css-interop to use class-based dark mode on Web
if (Platform.OS === 'web') {
  const { StyleSheet: CSSInteropStyleSheet } = require('react-native-css-interop');
  if (CSSInteropStyleSheet?.setFlag) {
    CSSInteropStyleSheet.setFlag('darkMode', 'class');
  }
}


// ---------------------------------------------------------------------------
// Global Error Boundary — prevents a blank crash screen on Android
// ---------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>😔</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <Text style={errorStyles.detail}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = RNStyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  detail: { fontSize: 12, color: '#999', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

// ---------------------------------------------------------------------------
// Keep the native splash screen visible while bootstrapping fonts & state
// ---------------------------------------------------------------------------
try {
  if (Platform.OS !== 'web') {
    SplashScreen.preventAutoHideAsync();
  }
} catch (e) {
  // Silently ignore
}

function AppContent() {
  const [fontLoadTimeout, setFontLoadTimeout] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold
  });

  useEffect(() => {
    // Fallback safety timeout (4 seconds) so the splash screen doesn't hang indefinitely if fonts fail
    const timer = setTimeout(() => {
      setFontLoadTimeout(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const appIsReady = Platform.OS === 'web' || Boolean(fontsLoaded) || fontLoadTimeout;

  const onNavigationReady = useCallback(async () => {
    if (appIsReady) {
      try {
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        // Silently ignore
      }
    }
  }, [appIsReady]);

  useEffect(() => {
    // If navigation doesn't trigger onReady immediately, ensure splash is dismissed when ready
    if (appIsReady) {
      const hideTimer = setTimeout(async () => {
        try {
          if (Platform.OS !== 'web') {
            await SplashScreen.hideAsync();
          }
        } catch (e) {}
      }, 150);
      return () => clearTimeout(hideTimer);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#008B45' }}>🛍️ BazarPeth</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
      <Provider store={store}>
        <AuthProvider>
          <NavigationContainer onReady={onNavigationReady}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </Provider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

