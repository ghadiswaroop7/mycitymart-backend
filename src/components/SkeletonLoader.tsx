import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { BAZAR_COLORS, BAZAR_RADIUS } from '../styles/designSystem';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BAZAR_RADIUS.sm,
  style,
}) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 750 }),
        withTiming(0.35, { duration: 750 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={170} borderRadius={BAZAR_RADIUS.md} />
      <View style={{ padding: 10, gap: 6 }}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="90%" height={14} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="30%" height={24} borderRadius={BAZAR_RADIUS.full} />
        </View>
      </View>
    </View>
  );
};

export const CategoryGridSkeleton: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={{ alignItems: 'center', gap: 6 }}>
          <Skeleton width={68} height={68} borderRadius={BAZAR_RADIUS.lg} />
          <Skeleton width={50} height={10} />
        </View>
      ))}
    </View>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <View style={{ paddingHorizontal: 16, marginVertical: 12 }}>
      <Skeleton height={180} borderRadius={BAZAR_RADIUS.xl} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: BAZAR_COLORS.shimmerBase,
  },
  cardSkeleton: {
    width: '48%',
    backgroundColor: BAZAR_COLORS.surface,
    borderRadius: BAZAR_RADIUS.md,
    borderWidth: 1,
    borderColor: BAZAR_COLORS.cardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
});
