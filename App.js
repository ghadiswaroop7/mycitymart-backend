import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { Platform, Text, View, StyleSheet as RNStyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import SplashScreenComponent from './src/screens/SplashScreen';
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
// Keep the native splash screen visible while bootstrapping
// ---------------------------------------------------------------------------
try {
  if (Platform.OS !== 'web') {
    SplashScreen.preventAutoHideAsync();
  }
} catch (e) {
  // Silently ignore — splash screen may not be available in all environments
}

function AppContent() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
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
    // Set a fallback timeout of 5 seconds to prevent getting stuck if fonts fail to load
    const timer = setTimeout(() => {
      setFontLoadTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || fontLoadTimeout;

  useEffect(() => {
    // Dismiss the native splash screen once fonts are ready or timeout occurs
    if (fontsReady) {
      try {
        if (Platform.OS !== 'web') {
          SplashScreen.hideAsync();
        }
      } catch (e) {
        // Silently ignore
      }
    }
  }, [fontsReady]);

  // Render the custom splash screen if the animation is not finished OR fonts are not ready yet
  const showSplash = !isSplashFinished || !fontsReady;

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AuthProvider>
          {showSplash ? (
            <SplashScreenComponent onAnimationFinish={() => setIsSplashFinished(true)} />
          ) : (
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          )}
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

