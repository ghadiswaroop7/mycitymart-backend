import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import usePageLayout from '../../hooks/usePageLayout';
import WidgetRenderer from './WidgetRenderer';
import SDUIRenderer from './SDUIRenderer';

interface Props {
  pageId: string;
  /** Optional fallback content to render when no SDUI blocks exist */
  fallback?: React.ReactNode;
  /** Optional footer content to render below SDUI blocks (e.g. All Products grid) */
  footer?: React.ReactNode;
}

/**
 * DynamicPageBuilder
 * 
 * Top-level SDUI component: given a pageId (e.g. "home_all"),
 * it fetches the layout blocks from Firestore and renders them
 * in order via WidgetRenderer.
 * 
 * Shows skeleton during loading. Falls back to `fallback` prop
 * when no SDUI data exists (allows legacy UI to render).
 * If `footer` is provided, it always renders below SDUI blocks.
 */
export default function DynamicPageBuilder({ pageId, fallback, footer }: Props) {
  const { blocks, loading, error } = usePageLayout(pageId);

  // ── Loading state ──
  if (loading) {
    return <SDUISkeletonLoader />;
  }

  // ── No SDUI data → render legacy fallback ──
  if (blocks.length === 0) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  // ── Render SDUI blocks + footer ──
  return (
    <View>
      <SDUIRenderer blocks={blocks} />
      {footer}
    </View>
  );
}

/**
 * Skeleton loader matching the app's existing shimmer style.
 */
function SDUISkeletonLoader() {
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={skeletonStyles.container}>
      {/* Trust badges skeleton */}
      <View style={skeletonStyles.trustRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={skeletonStyles.trustItem}>
            <Animated.View style={[skeletonStyles.trustCircle, { opacity: shimmer }]} />
            <Animated.View style={[skeletonStyles.trustLine, { opacity: shimmer }]} />
          </View>
        ))}
      </View>

      {/* Banner skeleton */}
      <Animated.View style={[skeletonStyles.banner, { opacity: shimmer }]} />

      {/* Section title skeleton */}
      <Animated.View style={[skeletonStyles.titleBar, { opacity: shimmer }]} />

      {/* Cards row skeleton */}
      <View style={skeletonStyles.cardsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={skeletonStyles.cardWrap}>
            <Animated.View style={[skeletonStyles.cardImage, { opacity: shimmer }]} />
            <Animated.View style={[skeletonStyles.cardLine1, { opacity: shimmer }]} />
            <Animated.View style={[skeletonStyles.cardLine2, { opacity: shimmer }]} />
          </View>
        ))}
      </View>

      {/* Grid skeleton */}
      <View style={skeletonStyles.gridRow}>
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={[skeletonStyles.gridItem, { opacity: shimmer }]} />
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  // Trust badges
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    gap: 6,
  },
  trustCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  trustLine: {
    width: 50,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  // Banner
  banner: {
    height: 155,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  // Title bar
  titleBar: {
    width: 160,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  // Cards row
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardWrap: {
    width: 155,
    gap: 6,
  },
  cardImage: {
    width: 155,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  cardLine1: {
    width: 120,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  cardLine2: {
    width: 80,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  // Grid
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '47%',
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
});
