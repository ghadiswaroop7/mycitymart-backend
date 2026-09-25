import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import useServerDrivenScreen from '../../hooks/useServerDrivenScreen';
import WidgetRenderer from './WidgetRenderer';
import { LayoutBlock } from '../../contracts/sduiContracts';

interface Props {
  /** Screen or page identifier: 'home', 'home_all', 'category_women', etc. */
  pageId: string;
  /** Optional city override for targeting */
  city?: string;
  /** Optional user segment override for targeting */
  userSegment?: string;
  /** Optional fallback content to render only if zero blocks exist */
  fallback?: React.ReactNode;
  /** Optional footer content to render below SDUI blocks */
  footer?: React.ReactNode;
  /** Optional header content to render above SDUI blocks */
  header?: React.ReactNode;
}

/**
 * DynamicPageBuilder (Server-Driven UI Engine)
 * 
 * Architecture:
 * - Single source of truth: Layout tree fetched from backend (published_pages/{pageId})
 * - Versioned layout contracts: carries schemaVersion and skips unknown widget types
 * - Targeting: filters by city, userSegment, appVersion
 * - Cache + fallback: instant 0ms cached render, offline fallback to avoid blank screen
 */
export default function DynamicPageBuilder({
  pageId,
  city,
  userSegment,
  fallback,
  footer,
  header,
}: Props) {
  // Normalize pageId: 'home_all' maps to 'home'
  const screenId = pageId === 'home_all' ? 'home' : pageId;

  const { layout, loading, refreshing, refresh } = useServerDrivenScreen({
    screenId,
    city,
    userSegment,
  });

  const blocks: LayoutBlock[] = layout?.blocks || [];

  // ── Loading state (only when no cache exists) ──
  if (loading && blocks.length === 0) {
    return <SDUISkeletonLoader />;
  }

  // ── Empty state fallback ──
  if (blocks.length === 0 && fallback) {
    return <>{fallback}</>;
  }

  // ── Render Server-Driven Blocks ──
  return (
    <View style={styles.container}>
      {header}
      {blocks.map((block) => (
        <WidgetRenderer key={block.id} block={block} />
      ))}
      {footer}
    </View>
  );
}

/**
 * Skeleton loader matching the app's shimmer style.
 */
function SDUISkeletonLoader() {
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.9,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={skeletonStyles.container}>
      {/* Banner skeleton */}
      <Animated.View style={[skeletonStyles.banner, { opacity: shimmer }]} />

      {/* Categories skeleton */}
      <View style={skeletonStyles.catRow}>
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={[skeletonStyles.catCircle, { opacity: shimmer }]} />
        ))}
      </View>

      {/* ETA Bar skeleton */}
      <Animated.View style={[skeletonStyles.etaBar, { opacity: shimmer }]} />

      {/* Boutique Arch skeleton */}
      <Animated.View style={[skeletonStyles.archCard, { opacity: shimmer }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 12,
  },
  banner: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    marginBottom: 14,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  catCircle: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  etaBar: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FED7AA',
    marginBottom: 14,
  },
  archCard: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
});
