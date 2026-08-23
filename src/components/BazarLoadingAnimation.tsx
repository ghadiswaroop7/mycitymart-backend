import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';

const isNative = Platform.OS !== 'web';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BazarLoadingAnimationProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ROTATING_MESSAGES = [
  'Connecting to Sangamner Local Bazar... 🏪',
  'Finding best local deals & discounts... ⚡',
  'Connecting with verified neighbourhood Dukaans... 🛍️',
  'Loading authentic products at wholesale prices... 💸',
];

export default function BazarLoadingAnimation({
  message,
  submessage,
  fullScreen = true,
  size = 'large',
}: BazarLoadingAnimationProps) {
  // 3D Floating & Bobbing Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;
  const pulseGlow = useRef(new Animated.Value(0.4)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [activeMsgIdx, setActiveMsgIdx] = useState(0);

  useEffect(() => {
    // 1. 3D Floating & Bobbing Loop
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: -14,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.7,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.timing(shadowScale, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: isNative,
          }),
        ]),
      ])
    );

    // 2. Pulsing Glow Loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 0.9,
          duration: 900,
          useNativeDriver: isNative,
        }),
        Animated.timing(pulseGlow, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: isNative,
        }),
      ])
    );

    // 3. Orbiting Sparkles Loop
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: isNative,
      })
    );

    // 4. Infinite Shimmer Progress Bar
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    floatingLoop.start();
    glowLoop.start();
    orbitLoop.start();
    progressLoop.start();

    // 5. Message Switcher Timer
    const msgInterval = setInterval(() => {
      setActiveMsgIdx((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 2200);

    return () => {
      floatingLoop.stop();
      glowLoop.stop();
      orbitLoop.stop();
      progressLoop.stop();
      clearInterval(msgInterval);
    };
  }, []);

  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const orbitRotation1 = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const orbitRotation2 = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '540deg'],
  });

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const cardSize = size === 'small' ? 70 : size === 'medium' ? 95 : 120;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
      {/* 3D Floating Showcase Stage */}
      <View style={[styles.stage, { width: cardSize * 1.6, height: cardSize * 1.6 }]}>
        {/* Glow Aura behind */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              width: cardSize * 1.3,
              height: cardSize * 1.3,
              borderRadius: (cardSize * 1.3) / 2,
              opacity: pulseGlow,
            },
          ]}
        />

        {/* Orbiting 3D Particle 1 */}
        <Animated.View
          style={[
            styles.orbitTrack,
            {
              width: cardSize * 1.4,
              height: cardSize * 1.4,
              transform: [{ rotate: orbitRotation1 }],
            },
          ]}
        >
          <View style={styles.orbitBadge}>
            <Text style={{ fontSize: 13 }}>⚡</Text>
          </View>
        </Animated.View>

        {/* Orbiting 3D Particle 2 */}
        <Animated.View
          style={[
            styles.orbitTrack,
            {
              width: cardSize * 1.4,
              height: cardSize * 1.4,
              transform: [{ rotate: orbitRotation2 }],
            },
          ]}
        >
          <View style={[styles.orbitBadge, { backgroundColor: '#FFF7E6', borderColor: '#FFD700' }]}>
            <Text style={{ fontSize: 13 }}>🛍️</Text>
          </View>
        </Animated.View>

        {/* 3D Floating Shopping Bag / Store Card */}
        <Animated.View
          style={[
            styles.card3D,
            {
              width: cardSize,
              height: cardSize,
              borderRadius: cardSize * 0.28,
              transform: [
                { translateY: floatAnim },
                { rotateZ: spinInterpolation },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/bazarpeth_icon_card_light_bg.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 3D Ground Shadow Oval */}
        <Animated.View
          style={[
            styles.groundShadow,
            {
              width: cardSize * 0.75,
              height: 14,
              transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
            },
          ]}
        />
      </View>

      {/* Message and Status */}
      <View style={styles.textContainer}>
        <Text style={styles.mainTitle}>
          {message || ROTATING_MESSAGES[activeMsgIdx]}
        </Text>
        <Text style={styles.subTitle}>
          {submessage || 'Fast Delivery • Direct from Sangamner Dukaans'}
        </Text>

        {/* Shimmering Brand Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressBarWidth,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  stage: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 139, 69, 0.18)',
    shadowColor: '#008B45',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  orbitTrack: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  orbitBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#008B45',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  card3D: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008B45',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 139, 69, 0.15)',
    overflow: 'hidden',
    zIndex: 10,
  },
  logoImage: {
    width: '82%',
    height: '82%',
  },
  groundShadow: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    borderRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    maxWidth: 300,
  },
  mainTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    textAlign: 'center',
    minHeight: 22,
  },
  subTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#008B45',
    borderRadius: 2,
  },
});
