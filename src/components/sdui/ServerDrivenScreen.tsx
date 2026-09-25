import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import useServerDrivenScreen from '../../hooks/useServerDrivenScreen';
import WidgetRenderer from './WidgetRenderer';
import { LayoutBlock } from '../../contracts/sduiContracts';

interface Props {
  /** Screen identifier: 'home', 'category', 'search', 'pdp', etc. */
  screenId: string;
  /** Custom city override for targeting */
  city?: string;
  /** Custom userSegment override for targeting */
  userSegment?: string;
  /** Optional custom header to render above SDUI blocks */
  header?: React.ReactNode;
  /** Optional custom footer to render below SDUI blocks */
  footer?: React.ReactNode;
  /** Optional contentContainerStyle */
  contentContainerStyle?: any;
}

/**
 * ServerDrivenScreen
 * 
 * Implements Amazon/Flipkart/Zepto's server-driven UI engine:
 * 1. Single source of truth: Screen layout described completely by JSON tree from backend.
 * 2. Versioned layout contract with graceful degradation (skips unknown widget types).
 * 3. Targeting by city, userSegment, and appVersion.
 * 4. Offline-first caching with local fallback (never blank).
 * 5. Pull-to-refresh triggers live fetch.
 */
export default function ServerDrivenScreen({
  screenId,
  city,
  userSegment,
  header,
  footer,
  contentContainerStyle,
}: Props) {
  const { layout, loading, refreshing, refresh } = useServerDrivenScreen({
    screenId,
    city,
    userSegment,
  });

  const blocks: LayoutBlock[] = layout?.blocks || [];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={['#EA580C']}
          tintColor="#EA580C"
        />
      }
      contentContainerStyle={[styles.container, contentContainerStyle]}
    >
      {/* Optional Top Header */}
      {header}

      {/* Shimmer loading if first time with no cached blocks */}
      {loading && blocks.length === 0 ? (
        <SDUIScreenSkeleton />
      ) : (
        /* Dynamic Server-Driven Widget List */
        <View style={styles.blockWrapper}>
          {blocks.map((block) => (
            <WidgetRenderer key={block.id} block={block} />
          ))}
        </View>
      )}

      {/* Optional Bottom Footer */}
      {footer}
    </ScrollView>
  );
}

/**
 * Shimmer skeleton placeholder for instant perceived performance.
 */
function SDUIScreenSkeleton() {
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
      {/* Banner Shimmer */}
      <Animated.View style={[skeletonStyles.banner, { opacity: shimmer }]} />

      {/* Quick Category Shimmer */}
      <View style={skeletonStyles.catRow}>
        {[1, 2, 3, 4].map((i) => (
          <Animated.View key={i} style={[skeletonStyles.catCircle, { opacity: shimmer }]} />
        ))}
      </View>

      {/* ETA Bar Shimmer */}
      <Animated.View style={[skeletonStyles.etaBar, { opacity: shimmer }]} />

      {/* Boutique Arch Shimmer */}
      <Animated.View style={[skeletonStyles.boutiqueCard, { opacity: shimmer }]} />

      {/* Product Grid Shimmer */}
      <View style={skeletonStyles.productRow}>
        <Animated.View style={[skeletonStyles.productCard, { opacity: shimmer }]} />
        <Animated.View style={[skeletonStyles.productCard, { opacity: shimmer }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  blockWrapper: {
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
  boutiqueCard: {
    width: '100%',
    height: 170,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
});
