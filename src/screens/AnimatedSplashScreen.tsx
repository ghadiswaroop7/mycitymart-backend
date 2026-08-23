import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

const { width } = Dimensions.get('window');

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onAnimationComplete }) => {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Opacity fades in smoothly
    opacity.value = withTiming(1, { duration: 800 });

    // Scale springs up to 1.1 (slight over-shoot), then rests beautifully at 1.0
    scale.value = withSequence(
      withSpring(1.1, {
        damping: 8,
        stiffness: 100,
        mass: 1,
      }),
      withSpring(1.0, {
        damping: 12,
        stiffness: 100,
      })
    );

    // Automatically trigger the callback to route the user after 2.5 seconds
    const timeoutId = setTimeout(() => {
      onAnimationComplete();
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [onAnimationComplete, opacity, scale]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/bazarpeth_icon_card_light_bg.png')} 
        style={[styles.logo, animatedLogoStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // BazarPeth white brand background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 24,
    alignSelf: 'center',
  },
});

export default AnimatedSplashScreen;
