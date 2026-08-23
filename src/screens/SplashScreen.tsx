import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  useEffect(() => {
    // Navigate out after 2.5 seconds
    const timeoutId = setTimeout(() => {
      onAnimationFinish();
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [onAnimationFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/bazarpeth_icon_card_light_bg.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // BazarPeth white splash
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 24,
    alignSelf: 'center',
  },
});

export default SplashScreen;
