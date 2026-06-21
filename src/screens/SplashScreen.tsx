import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  useEffect(() => {
    // Navigate out after 3.5 seconds (Navigation logic tasach theva)
    const timeoutId = setTimeout(() => {
      onAnimationFinish();
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E8A3C', // JHAT-PAT green
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '70%',
    height: undefined,
    aspectRatio: 2.5,
  },
});

export default SplashScreen;
