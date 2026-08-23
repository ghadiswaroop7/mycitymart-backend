import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import SafeImage from '../../SafeImage';
import type { HeroBannerData } from '../../../types/sdui';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  data: HeroBannerData;
}

export default function HeroBannerWidget({ data }: Props) {
  const banners = data?.banners || [];
  const autoPlayMs = data?.autoPlayMs || 4000;
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-play carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [banners.length, autoPlayMs]);

  const onMomentumScrollEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrent(index);
  }, []);

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {banners.map((banner, i) => (
          <TouchableOpacity key={`hero-${i}`} activeOpacity={0.9} style={styles.slide}>
            <SafeImage
              uri={banner.imageUrl}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {/* Overlay content */}
            {(banner.title || banner.badge) && (
              <View style={styles.overlay}>
                {banner.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{banner.badge}</Text>
                  </View>
                ) : null}
                {banner.title ? (
                  <Text style={styles.title}>{banner.title}</Text>
                ) : null}
                {banner.subtitle ? (
                  <Text style={styles.subtitle}>{banner.subtitle}</Text>
                ) : null}
                {banner.ctaText ? (
                  <TouchableOpacity style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>{banner.ctaText} →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === current ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  slide: {
    width: SCREEN_WIDTH,
  },
  bannerImage: {
    width: SCREEN_WIDTH - 32,
    height: 155,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    padding: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  ctaBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    width: 5,
  },
});
