import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
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

// Keep the native splash screen visible while bootstrapping
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function App() {
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
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync().catch(() => {});
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
