import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert } from 'react-native';
import { HugeIcon } from '../../HugeIcon';
import { FlashIcon, Tick01Icon } from '@hugeicons/core-free-icons';
import type { SpinWheelRewardData, BlockStyle } from '../../../types/sdui';

interface Props {
  data: SpinWheelRewardData;
  style?: BlockStyle;
}

const REWARDS = [
  { label: '₹100 OFF', code: 'BAZAR100', color: '#008B45' },
  { label: 'FREE DELIVERY', code: 'FREESHIP', color: '#EA580C' },
  { label: '15% DISCOUNT', code: 'SAVE15', color: '#7C3AED' },
  { label: '₹50 CASHBACK', code: 'CASH50', color: '#0284C7' },
  { label: '20% OFF FASHION', code: 'STYLE20', color: '#DB2777' },
  { label: '₹200 OFF GROCERY', code: 'GROC200', color: '#16A34A' },
];

export default function SpinWheelRewardWidget({ data, style }: Props) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<any | null>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonReward(null);

    const randomCycles = Math.floor(Math.random() * 4 + 5); // 5-8 full spins
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const targetDeg = randomCycles * 360 + randomIndex * (360 / REWARDS.length);

    Animated.timing(spinAnim, {
      toValue: targetDeg,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      const chosen = REWARDS[randomIndex];
      setWonReward(chosen);
      Alert.alert('Congratulations! 🎉', `You won coupon code "${chosen.code}" for ${chosen.label}! Copy and apply at checkout.`);
    });
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const title = data?.title || '🎡 Daily Lucky Spin & Win';
  const subtitle = data?.subtitle || 'Spin the wheel daily to unlock exclusive discount coupons!';

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DAILY REWARDS 🎁</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Wheel Container */}
      <View style={styles.wheelArea}>
        {/* Pointer Triangle */}
        <View style={styles.pointerTriangle} />

        <Animated.View style={[styles.wheelCircle, { transform: [{ rotate: spinInterpolate }] }]}>
          {REWARDS.map((r, i) => {
            const angle = (i * 360) / REWARDS.length;
            return (
              <View
                key={i}
                style={[
                  styles.slice,
                  {
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: r.color,
                  },
                ]}
              >
                <Text style={styles.sliceText}>{r.label}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Center Spin Button */}
        <TouchableOpacity
          style={[styles.centerSpinBtn, isSpinning && styles.centerSpinBtnDisabled]}
          onPress={handleSpin}
          disabled={isSpinning}
          activeOpacity={0.8}
        >
          <Text style={styles.spinText}>{isSpinning ? '...' : 'SPIN'}</Text>
        </TouchableOpacity>
      </View>

      {/* Won Reward Banner */}
      {wonReward && (
        <View style={styles.wonBanner}>
          <Text style={styles.wonTitle}>🎉 Code Unlocked: <Text style={{ color: '#008B45', fontWeight: '800' }}>{wonReward.code}</Text></Text>
          <Text style={styles.wonSub}>Apply at checkout for {wonReward.label}!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: '#FAF5FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    alignItems: 'center',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#581C87',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    color: '#7E22CE',
    textAlign: 'center',
    marginTop: 2,
  },
  wheelArea: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pointerTriangle: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
    zIndex: 30,
    transform: [{ rotate: '180deg' }],
  },
  wheelCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  slice: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 14,
  },
  sliceText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Poppins_800ExtraBold',
    textAlign: 'center',
  },
  centerSpinBtn: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#9333EA',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerSpinBtnDisabled: {
    opacity: 0.7,
  },
  spinText: {
    color: '#9333EA',
    fontSize: 11,
    fontFamily: 'Poppins_800ExtraBold',
  },
  wonBanner: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D8B4FE',
    alignItems: 'center',
  },
  wonTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  wonSub: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
});
