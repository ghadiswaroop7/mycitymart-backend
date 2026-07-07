import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import LottieView from 'lottie-react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { getStorefrontLayouts, getProducts, getLocalShops, getBanners, getActiveFlashDeals, getCategories, createSampleBanners } from '../services/firestoreService';
import { collection, getDocs, query, where, documentId, orderBy, doc, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

// Setup firestore instance reference
const firestore = db;
import { HugeIcon } from '../components/HugeIcon';
import {   FlashIcon, Home02Icon, ChevronDownIcon, Search02Icon, Camera02Icon, QrCodeIcon , Location01Icon , TruckIcon } from '@hugeicons/core-free-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import { CATEGORIES } from '../config/categories';

import HomeTabBar from '../components/HomeTabBar';
import ProductCard from '../components/ProductCard';
import MiniProductCard from '../components/MiniProductCard';
import SafeImage from '../components/SafeImage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH - 24;

// Animated Category Icon with Spinning Gradient Border
const AnimatedCategoryIcon = ({ cat, idx, onPress }: { cat: any, idx: number, onPress: () => void }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { Easing } = require('react-native');
    // Stagger start slightly
    setTimeout(() => {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, idx * 100);
  }, [idx, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ alignItems: 'center', marginRight: 16, width: 84 }}
    >
      <View style={{
        width: 76, height: 76, marginBottom: 8, borderRadius: 24,
        shadowColor: '#EC4899', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
      }}>
        <View style={{ width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: '#F3F4F6' }}>
        {/* Rotating Outer Mask / Gradient */}
        <Animated.View style={[{
          position: 'absolute',
          top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
          transform: [{ rotate: spin }]
        }]}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#7C3AED', '#EC4899', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
        
        {/* Inner Container (Masks out the center) */}
        <View style={{
          position: 'absolute',
          top: 4, bottom: 4, left: 4, right: 4, 
          borderRadius: 20, 
          backgroundColor: '#FFFFFF',
          justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden'
        }}>
          {cat.image ? (
            <Image source={cat.image} style={{ width: '100%', height: '100%', borderRadius: 20 }} resizeMode="cover" />
          ) : (
             <View style={{ width: '100%', height: '100%', backgroundColor: cat.color || '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                <Text style={{ fontSize: 32 }}>{cat.icon}</Text>
             </View>
          )}
        </View>
        </View>
      </View>
      <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#1A1A1A', textAlign: 'center', lineHeight: 16 }} numberOfLines={2}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  );
};

// Animated Breathing Gradient Background
const AnimatedGradientBackground = ({ colors }: { colors: [string, string, ...string[]] }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.8 + (progress.value * 0.2), // Breaths between 0.8 and 1.0 opacity
      transform: [
        { scale: 1 + (progress.value * 0.05) } // Slight zoom in/out
      ]
    };
  });

  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Reanimated.View>
  );
};

// Video Background Component to safely use hooks
const HeroVideoBackground = ({ source: videoUrl }: { source: string }) => {
  // Log the video URL right before player initialization
  const player = useVideoPlayer(videoUrl || '', player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const lastLoadedUrlRef = useRef<string | null>(videoUrl || null);

  useEffect(() => {
    if (!player || !videoUrl) return;
    if (lastLoadedUrlRef.current !== videoUrl) {
      player.replace(videoUrl);
      lastLoadedUrlRef.current = videoUrl;
      player.play();
    }
  }, [player, videoUrl]);

  return <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="cover" />;
};

// Premium Skeleton Loader for fetching states
const SkeletonLoader = () => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
      {/* Banner Skeleton */}
      <Animated.View style={{
        height: 180,
        backgroundColor: '#E5E7EB',
        borderRadius: 16,
        marginBottom: 24,
        opacity: animatedValue
      }} />

      {/* Categories Row Skeleton */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Animated.View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#E5E7EB',
              opacity: animatedValue
            }} />
            <Animated.View style={{
              width: 40,
              height: 10,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              marginTop: 8,
              opacity: animatedValue
            }} />
          </View>
        ))}
      </View>

      {/* Grid Header Skeleton */}
      <Animated.View style={{
        width: 150,
        height: 20,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 16,
        opacity: animatedValue
      }} />

      {/* Product Grid Skeleton */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: '48%', marginBottom: 16 }}>
            <Animated.View style={{
              height: 160,
              backgroundColor: '#E5E7EB',
              borderRadius: 12,
              opacity: animatedValue
            }} />
            <Animated.View style={{
              height: 15,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              marginTop: 10,
              width: '80%',
              opacity: animatedValue
            }} />
            <Animated.View style={{
              height: 15,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              marginTop: 6,
              width: '50%',
              opacity: animatedValue
            }} />
          </View>
        ))}
      </View>
    </View>
  );
};

// Section color themes matching website:
const SECTION_THEMES: Record<string, any> = {
  'summer_mega_sale': {
    gradient: ['#6B21A8', '#EC4899'],  // purple to pink
    title: 'Summer Mega Sale',
    badge: 'SALE'
  },
  'carousel': {
    gradient: ['#10b981', '#3b82f6'],  // green to blue (default carousel)
    title: 'Featured',
    badge: 'SALE'
  },
  'flash_deal': {
    gradient: ['#0F766E', '#3B82F6'],  // teal to blue
    title: '⚡ Flash Deals',
    badge: 'LIMITED'
  },
  'trending': {
    gradient: ['#DC2626', '#F97316'],  // red to orange
    title: '🔥 Trending Now',
    badge: 'HOT'
  },
  'default': {
    gradient: ['#1E40AF', '#7C3AED'],  // blue to purple
    title: 'Featured Products',
    badge: 'NEW'
  }
};

// Determine gradient colors for a carousel section based on title keywords
const getCarouselGradient = (layout: any): string[] => {
  // 1. If bgColor is already an array of colors, use it
  if (Array.isArray(layout.config?.bgColor) && layout.config.bgColor.length >= 2) {
    return layout.config.bgColor;
  }
  // 2. If bgColor is a comma-separated string, parse it
  if (typeof layout.config?.bgColor === 'string' && layout.config.bgColor.includes(',')) {
    return layout.config.bgColor.split(',').map((c: string) => c.trim());
  }
  // 3. Check backgroundEffect
  if (layout.config?.backgroundEffect) {
    const effect = layout.config.backgroundEffect.toLowerCase();
    if (effect.includes('green') || effect.includes('emerald')) return ['#10b981', '#3b82f6'];
    if (effect.includes('purple') || effect.includes('violet')) return ['#8b5cf6', '#3b82f6'];
    if (effect.includes('red') || effect.includes('rose')) return ['#DC2626', '#F97316'];
    if (effect.includes('teal') || effect.includes('cyan')) return ['#0F766E', '#3b82f6'];
    if (effect.includes('pink')) return ['#EC4899', '#8b5cf6'];
  }
  // 4. Match by section title keywords
  const title = (layout.title || '').toLowerCase();
  if (title.includes('rain') || title.includes('monsoon') || title.includes('mega sale')) {
    return ['#10b981', '#3b82f6'];  // Green to Blue
  }
  if (title.includes('summer') || title.includes('hot')) {
    return ['#8b5cf6', '#3b82f6'];  // Purple to Blue
  }
  if (title.includes('winter') || title.includes('cold')) {
    return ['#1E40AF', '#7C3AED'];  // Blue to Purple
  }
  if (title.includes('trending') || title.includes('fire')) {
    return ['#DC2626', '#F97316'];  // Red to Orange
  }
  if (title.includes('flash') || title.includes('deal')) {
    return ['#0F766E', '#3B82F6'];  // Teal to Blue
  }
  if (title.includes('new') || title.includes('arrival')) {
    return ['#6B21A8', '#EC4899'];  // Purple to Pink
  }
  // 5. Fallback: cycle between two default gradients based on layout ID hash
  const hash = (layout.id || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const defaults = [
    ['#10b981', '#3b82f6'],  // green to blue
    ['#8b5cf6', '#3b82f6'],  // purple to blue
    ['#6B21A8', '#EC4899'],  // purple to pink
    ['#0F766E', '#3B82F6'],  // teal to blue
  ];
  return defaults[hash % defaults.length];
};

const styles_card = StyleSheet.create({
  sectionCard: {
    marginHorizontal: 0,
    marginBottom: 20,
    borderRadius: 24,
    padding: 18,
    marginLeft: 16,
    marginRight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start',
    marginBottom: 4
  },
  sectionBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Poppins_700Bold' },
  sectionTitle: { 
    color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold' 
  },
  viewAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20
  },
  viewAllText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  
  productCardV2: {
    width: 175,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgesRow: {
    position: 'absolute',
    top: 8, left: 8, right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2
  },
  premiumBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4
  },
  premiumText: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  newBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4
  },
  newText: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  lowStockBadge: {
    position: 'absolute',
    top: 30, right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, zIndex: 2
  },
  lowStockText: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  trendingBadge: {
    position: 'absolute',
    top: 30, left: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, zIndex: 2
  },
  trendingText: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_700Bold' },
  productImageV2: {
    width: 175, height: 175,
  },
  productInfoV2: { padding: 14 },
  productNameV2: { 
    fontSize: 13, fontFamily: 'Poppins_500Medium', 
    color: '#1A1A1A', marginBottom: 6 
  },
  priceRowV2: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceV2: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1A1A1A' },
  originalPriceV2: { 
    fontSize: 12, color: '#9CA3AF',
    fontFamily: 'Poppins_300Light',
    textDecorationLine: 'line-through' 
  },
  discountBarContainer: {
    height: 3, backgroundColor: '#E5E7EB',
    borderRadius: 2, marginTop: 6, marginBottom: 8
  },
  discountBarFill: {
    height: 3, backgroundColor: '#EF4444', borderRadius: 2
  },
  addBtnV2: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4
  },
  addBtnTextV2: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 13 },
});

// Carousel-specific card styles — white top (image), dark bottom (info)
const styles_carousel = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  ribbon: {
    position: 'absolute',
    top: 12,
    left: 0,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 3,
  },
  ribbonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgesCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
    zIndex: 3,
    alignItems: 'flex-end',
  },
  trendBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  trendBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#F97316' },
  newBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  urgencyBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  urgencyBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#fff' },
  imageWrap: {
    width: 160,
    height: 140,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: 160,
    height: 140,
  },
  infoWrap: {
    backgroundColor: '#1E293B',
    padding: 10,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  originalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 6,
    marginBottom: 6,
  },
  discountBarFill: {
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  addBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
});

// Enhanced Product Card V2 — matches website exactly:
const ProductCardV2 = ({ product, theme, badges, isGrid, config }: any) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const discount = product.originalPrice 
    ? Math.round((1 - product.price/product.originalPrice) * 100)
    : 0;
  
  const isLowStock = product.stock && product.stock <= 2;
  const isDynamic = !!config;
  const bottomBg = isDynamic ? '#1E293B' : '#ffffff';
  const textColor = isDynamic ? '#ffffff' : '#1A1A1A';
  const subTextColor = isDynamic ? '#94A3B8' : '#9CA3AF';
  const addBtnBg = isDynamic ? '#38BDF8' : '#1A1A1A';
  
  return (
    <TouchableOpacity
      style={[styles_card.productCardV2, { width: '100%' }, { backgroundColor: isDynamic ? '#ffffff' : '#fff' }]}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      activeOpacity={0.9}
    >
      {/* Dynamic Section Badges */}
      {isDynamic && (
        <>
          {config?.ribbonText && (
            <View style={{
              position: 'absolute', top: 12, left: 0,
              backgroundColor: config.ribbonColor || '#7C3AED',
              paddingHorizontal: 12, paddingVertical: 4,
              borderTopRightRadius: 12, borderBottomRightRadius: 12,
              zIndex: 3
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                {config.ribbonText}
              </Text>
            </View>
          )}
          
          <View style={{ position: 'absolute', top: 8, right: 8, gap: 4, zIndex: 3, alignItems: 'flex-end' }}>
            {badges?.trending && (
              <View style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#F97316' }}>🔥 Trending</Text>
              </View>
            )}
            {badges?.newArrival && (
              <View style={{ backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>✨ NEW</Text>
              </View>
            )}
            {badges?.stockUrgency && (
              <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>Only 2 left!</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Old Badges (Non-Dynamic) */}
      {!isDynamic && (
        <>
          <View style={styles_card.badgesRow}>
            {(badges ? badges.premium : true) && (
              <View style={styles_card.premiumBadge}>
                <Text style={styles_card.premiumText}>
                  {product.tags?.includes('ai-curated') ? '🤖 AI CURATED' : '⭐ PREMIUM'}
                </Text>
              </View>
            )}
            {(badges ? badges.newArrival : true) && (
              <View style={styles_card.newBadge}>
                <Text style={styles_card.newText}>✨ NEW</Text>
              </View>
            )}
          </View>
          {isLowStock && (
            <View style={styles_card.lowStockBadge}>
              <Text style={styles_card.lowStockText}>Only {product.stock} left!</Text>
            </View>
          )}
          {product.tags?.includes('trending') && (
            <View style={styles_card.trendingBadge}>
              <Text style={styles_card.trendingText}>🔥 Trending</Text>
            </View>
          )}
        </>
      )}
      
      {/* Product Image */}
      <SafeImage
        uri={product.images?.[0] || product.image || product.imageUrl}
        style={[styles_card.productImageV2, { width: '100%', height: 170 }]}
        resizeMode="cover"
      />
      
      {/* Product Info */}
      <View style={[styles_card.productInfoV2, { backgroundColor: bottomBg }]}>
        <Text style={[styles_card.productNameV2, { color: textColor }]} numberOfLines={2}>
          {product.name}
        </Text>
        
        <View style={styles_card.priceRowV2}>
          <Text style={[styles_card.priceV2, { color: textColor }]}>₹{product.price}</Text>
          {product.originalPrice && (
            <Text style={[styles_card.originalPriceV2, { color: subTextColor }]}>
              ₹{product.originalPrice}
            </Text>
          )}
        </View>
        
        {/* Discount progress bar (like website) */}
        {discount > 0 && (
          <View style={styles_card.discountBarContainer}>
            <View style={[
              styles_card.discountBarFill,
              { width: `${Math.min(discount, 100)}%` }
            ]} />
          </View>
        )}
        
        <TouchableOpacity
          style={[styles_card.addBtnV2, { backgroundColor: addBtnBg }]}
          onPress={(e) => {
            e.stopPropagation();
            dispatch(addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice || product.price,
              imageUrl: product.images?.[0] || product.image || product.imageUrl,
              quantity: 1,
              vendor: product.vendor
            }));
          }}
        >
          <Text style={[styles_card.addBtnTextV2, { color: isDynamic ? '#000' : '#fff' }]}>ADD</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Banner Carousel:
const BannerCarousel = ({ banners }: { banners: any[] }) => {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      const next = (current + 1) % banners.length;
      setCurrent(next);
      scrollRef.current?.scrollTo({ 
        x: next * SCREEN_WIDTH, animated: true 
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [current, banners]);
  
  if (banners.length === 0) return null;
  
  return (
    <View style={styles_banner.bannerContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrent(index);
        }}
      >
        {banners.map((banner: any, i: number) => (
          <TouchableOpacity key={banner.id} activeOpacity={0.9}>
            <SafeImage
              uri={banner.imageUrl || banner.image}
              style={styles_banner.bannerImage}
              resizeMode="cover"
            />
            {banner.title && (
              <View style={styles_banner.bannerOverlay}>
                {banner.badge && (
                  <View style={styles_banner.bannerBadge}>
                    <Text style={styles_banner.bannerBadgeText}>
                      {banner.badge}
                    </Text>
                  </View>
                )}
                <Text style={styles_banner.bannerTitle}>{banner.title}</Text>
                {banner.subtitle && (
                  <Text style={styles_banner.bannerSubtitle}>
                    {banner.subtitle}
                  </Text>
                )}
                {banner.ctaText && (
                  <TouchableOpacity style={styles_banner.bannerCTA}>
                    <Text style={styles_banner.bannerCTAText}>
                      {banner.ctaText} →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Dot indicators — inside banner, bottom-right */}
      {banners.length > 1 && (
        <View style={styles_banner.dotsRow}>
          {banners.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles_banner.dot,
                i === current ? styles_banner.dotActive : styles_banner.dotInactive
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles_banner = StyleSheet.create({
  bannerContainer: { marginBottom: 16, overflow: 'hidden', position: 'relative' },
  bannerImage: { 
    width: SCREEN_WIDTH - 32, 
    height: 220, 
    borderRadius: 16,
    marginHorizontal: 16
  },
  bannerOverlay: {
    position: 'absolute', bottom: 0, left: 16,
    right: 16, padding: 16, paddingBottom: 28,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden'
  },
  bannerBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, alignSelf: 'flex-start',
    marginBottom: 6
  },
  bannerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bannerTitle: { 
    color: '#fff', fontSize: 20, fontWeight: '700' 
  },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  bannerCTA: {
    marginTop: 8, backgroundColor: '#FF6B35',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, alignSelf: 'flex-start'
  },
  bannerCTAText: { color: '#fff', fontWeight: '600' },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: '#FFFFFF', width: 16 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.5)', width: 6 },
});

const TrustBadges = () => (
  <View className="flex-row justify-between bg-zinc-50 px-5 py-4 border-t border-b border-zinc-100 mb-6 mt-2">
    {[
      { icon: <HugeIcon icon={TruckIcon} size={24} color="#008B45" />, title: 'Free Delivery', sub: 'First 3 orders' },
      { icon: <Text style={{ fontSize: 24 }}>⚡</Text>, title: 'Flash Deals', sub: 'Up to 60% off' },
      { icon: <Text style={{ fontSize: 24 }}>🛡️</Text>, title: 'Authentic', sub: 'Verified shops' },
    ].map(badge => (
      <View key={badge.title} className="items-center flex-1">
        <View style={{ height: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
          {badge.icon}
        </View>
        <Text className="text-[11px] font-bold text-[#1C1C1C] text-center">{badge.title}</Text>
        <Text className="text-[9px] text-zinc-500 text-center">{badge.sub}</Text>
      </View>
    ))}
  </View>
);

// Colorful Section Card Component:
const SectionCard = ({ layout }: { layout: any }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!layout.productIds || !Array.isArray(layout.productIds) || layout.productIds.length === 0) {
        setProducts([]);
        return;
      }
      try {
        const chunks = [];
        for (let i = 0; i < layout.productIds.length; i += 10) {
          chunks.push(layout.productIds.slice(i, i + 10));
        }
        let fetchedProducts: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach(doc => fetchedProducts.push({ id: doc.id, ...doc.data() }));
        }
        
        // Maintain the order of products as they are in productIds array
        fetchedProducts.sort((a, b) => layout.productIds.indexOf(a.id) - layout.productIds.indexOf(b.id));
        setProducts(fetchedProducts);
      } catch (e) {
        console.error("Error fetching section products:", e);
      }
    };
    if (layout.componentType !== 'banner') {
      fetchProducts();
    }
  }, [layout]);

  // ── BANNER TYPE ──
  if (layout.componentType === 'banner') {
    return (
      <View className="w-full mb-6">
        {layout.title && <Text className="text-lg font-black text-[#1C1C1C] px-5 mb-3">{layout.title}</Text>}
        <SafeImage uri={layout.imageUrl} className="w-full h-40 bg-zinc-100 rounded-xl mx-5" style={{ width: 'auto' }} resizeMode="cover" />
      </View>
    );
  }
  const theme = SECTION_THEMES[layout.componentType] || SECTION_THEMES.default;

  // ══════════════════════════════════════════════════════════════════
  // ── CAROUSEL TYPE — STRICT HORIZONTAL SCROLL + GRADIENT BG ──
  // ══════════════════════════════════════════════════════════════════
  if (layout.componentType === 'carousel') {
    const gradientColors = getCarouselGradient(layout) as [string, string, ...string[]];

    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles_card.sectionCard}
      >
        {/* Section Header */}
        <View style={styles_card.sectionHeader}>
          <View>
            {theme.badge && (
              <View style={styles_card.sectionBadge}>
                <Text style={styles_card.sectionBadgeText}>{theme.badge}</Text>
              </View>
            )}
            <Text style={styles_card.sectionTitle}>
              {layout.title || theme.title}
            </Text>
          </View>
          <TouchableOpacity style={styles_card.viewAllBtn}>
            <Text style={styles_card.viewAllText}>View all →</Text>
          </TouchableOpacity>
        </View>

        {/* STRICT HORIZONTAL SCROLL — no flex-wrap, no numColumns */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8, paddingBottom: 8 }}
        >
          {products.map((product) => (
            <View key={product.id} style={{ width: 160, marginRight: 14 }}>
              <TouchableOpacity
                style={styles_carousel.card}
                activeOpacity={0.9}
                onPress={() => {
                  // @ts-ignore
                  navigation?.navigate?.('ProductDetail', { productId: product.id });
                }}
              >
                {/* Top badge ribbon */}
                {layout.config?.ribbonText && (
                  <View style={styles_carousel.ribbon}>
                    <Text style={styles_carousel.ribbonText}>
                      {layout.config.ribbonText}
                    </Text>
                  </View>
                )}

                {/* Corner badges */}
                <View style={styles_carousel.badgesCorner}>
                  {layout.config?.badges?.trending && (
                    <View style={styles_carousel.trendBadge}>
                      <Text style={styles_carousel.trendBadgeText}>🔥 Trending</Text>
                    </View>
                  )}
                  {layout.config?.badges?.newArrival && (
                    <View style={styles_carousel.newBadge}>
                      <Text style={styles_carousel.newBadgeText}>✨ NEW</Text>
                    </View>
                  )}
                  {layout.config?.badges?.stockUrgency && (
                    <View style={styles_carousel.urgencyBadge}>
                      <Text style={styles_carousel.urgencyBadgeText}>Only 2 left!</Text>
                    </View>
                  )}
                </View>

                {/* White top half — product image */}
                <View style={styles_carousel.imageWrap}>
                  <SafeImage
                    uri={product.images?.[0] || product.image || product.imageUrl}
                    style={styles_carousel.image}
                    resizeMode="cover"
                  />
                </View>

                {/* Dark bottom half — title + price */}
                <View style={styles_carousel.infoWrap}>
                  <Text style={styles_carousel.name} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles_carousel.priceRow}>
                    <Text style={styles_carousel.price}>₹{product.price}</Text>
                    {product.originalPrice > 0 && product.originalPrice !== product.price && (
                      <Text style={styles_carousel.originalPrice}>₹{product.originalPrice}</Text>
                    )}
                  </View>
                  {product.originalPrice > 0 && product.originalPrice !== product.price && (
                    <View style={styles_carousel.discountBarBg}>
                      <View style={[
                        styles_carousel.discountBarFill,
                        { width: `${Math.min(Math.round((1 - product.price / product.originalPrice) * 100), 100)}%` }
                      ]} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles_carousel.addBtn}
                    onPress={() => {
                      dispatch(addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        originalPrice: product.originalPrice || product.price,
                        imageUrl: product.images?.[0] || product.image || product.imageUrl,
                        quantity: 1,
                        vendor: product.vendor,
                      }));
                    }}
                  >
                    <Text style={styles_carousel.addBtnText}>ADD</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ── GRID TYPE + OTHER TYPES — existing behaviour preserved ──
  // ══════════════════════════════════════════════════════════════════
  const isGrid = layout.componentType === 'grid';
  const hasGradient = Array.isArray(layout.config?.bgColor) || layout.config?.backgroundEffect || (typeof layout.config?.bgColor === 'string' && layout.config.bgColor.includes(','));

  // Extract gradient colors for grid / other types
  let gradientColors = theme.gradient;
  if (Array.isArray(layout.config?.bgColor)) {
    gradientColors = layout.config.bgColor;
  } else if (typeof layout.config?.bgColor === 'string' && layout.config.bgColor.includes(',')) {
    gradientColors = layout.config.bgColor.split(',').map((c: string) => c.trim());
  } else if (layout.config?.bgColor) {
    gradientColors = [layout.config.bgColor, layout.config.bgColor];
  }

  const InnerContent = (
    <>
      {/* Section Header */}
      <View style={styles_card.sectionHeader}>
        <View>
          {theme.badge && (
            <View style={styles_card.sectionBadge}>
              <Text style={styles_card.sectionBadgeText}>{theme.badge}</Text>
            </View>
          )}
          <Text style={styles_card.sectionTitle}>
            {layout.title || theme.title}
          </Text>
        </View>
        <TouchableOpacity style={styles_card.viewAllBtn}>
          <Text style={styles_card.viewAllText}>View all →</Text>
        </TouchableOpacity>
      </View>
      
      {/* Grid Layout */}
      {isGrid ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {products.map(product => (
            <View key={product.id} style={{ width: '48%', marginBottom: 16 }}>
              <ProductCardV2 
                product={product}
                theme={theme}
                badges={layout.config?.badges}
                isGrid={true}
                config={layout.config}
              />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {products.map((product, index) => (
            <View key={product.id} style={{ width: 160, marginRight: index === products.length - 1 ? 0 : 16 }}>
              <ProductCardV2 
                product={product}
                theme={theme}
                badges={layout.config?.badges}
                isGrid={false}
                config={layout.config}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </>
  );

  if (hasGradient) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles_card.sectionCard}
      >
        {InnerContent}
      </LinearGradient>
    );
  }

  const fallbackBgColor = layout.config?.bgColor || theme.gradient[0];
  return (
    <View style={[styles_card.sectionCard, { backgroundColor: fallbackBgColor }]}>
      {InnerContent}
    </View>
  );
};

const CATEGORY_ICONS: Record<string, any> = {
  'fashion': { icon: '👗', color: '#FFE4E4', label: 'Fashion' },
  'electronics': { icon: '📱', color: '#E3F2FD', label: 'Electronics' },
  'grocery': { icon: '🛒', color: '#E8F5E9', label: 'Grocery' },
  'home & kitchen': { icon: '🏠', color: '#FFF3E0', label: 'Home' },
  'pharmacy': { icon: '💊', color: '#F3E5F5', label: 'Pharmacy' },
  'bakery': { icon: '🍞', color: '#FFF8E1', label: 'Bakery' },
  'fresh meats': { icon: '🥩', color: '#FFE9D9', label: 'Fresh Meat' },
  'sweets': { icon: '🍬', color: '#FCE4EC', label: 'Sweets' },
  'wellness': { icon: '💆', color: '#E8F5E9', label: 'Wellness' },
  'gifts & toys': { icon: '🎁', color: '#F3E5F5', label: 'Gifts' },
  'hardware': { icon: '🔧', color: '#E3F2FD', label: 'Hardware' },
};

const buildCategoryIcons = (products: any[]) => {
  const cats = [...new Set(
    products.map(p => p.category?.toLowerCase()).filter(Boolean)
  )] as string[];
  
  return [
    { id: 'all', label: 'For You', icon: '✨', color: '#FFE4E4' },
    ...cats.map(cat => ({
      id: cat,
      label: CATEGORY_ICONS[cat]?.label || (cat.charAt(0).toUpperCase() + cat.slice(1)),
      icon: CATEGORY_ICONS[cat]?.icon || '🛍️',
      color: CATEGORY_ICONS[cat]?.color || '#F5F5F5'
    }))
  ];
};

const getTabProducts = (tab: string, products: any[]) => {
  if (tab === 'ALL') return products;
  if (tab === 'LOCAL SHOPS') return [];
  
  return products.filter(product => {
    const cat = (product.category || '').toLowerCase();
    const subcat = (product.subcategory || '').toLowerCase();
    const tags = Array.isArray(product.tags) ? product.tags : 
                 (typeof product.tags === 'string' ? [product.tags] : []);
                 
    switch(tab) {
      case 'MEN':
        return cat.includes('men') || cat.includes('male') ||
               subcat.includes('men') ||
               tags.some((t: string) => t.toLowerCase().includes('men')) ||
               (cat === 'fashion' && subcat.includes('men'));
               
      case 'WOMEN':
        return cat.includes('women') || cat.includes('female') ||
               cat.includes('ladies') || cat.includes('girl') ||
               subcat.includes('women') ||
               tags.some((t: string) => t.toLowerCase().includes('women'));
               
      case 'KIDS':
        return cat.includes('kids') || cat.includes('child') ||
               cat.includes('baby') || cat.includes('boy') ||
               subcat.includes('kids') ||
               tags.some((t: string) => t.toLowerCase().includes('kids'));
               
      case 'BEAUTY':
        return cat.includes('beauty') || cat.includes('cosmetic') || cat.includes('makeup') ||
               cat.includes('skincare') || cat.includes('fragrance') || cat.includes('perfume') ||
               subcat.includes('beauty') || subcat.includes('cosmetic') ||
               tags.some((t: string) => ['beauty', 'cosmetic', 'makeup', 'skincare', 'perfume'].some(keyword => t.toLowerCase().includes(keyword)));
               
      default:
        return false;
    }
  });
};

// Flash Deal Section Component
const FlashDealSection = ({ deals, products }: { deals: any[], products: any[] }) => {
  return (
    <View className="mb-6">
      {deals.map((deal: any) => {
        const dealProduct = products.find(p => p.id === deal.productId);
        if (!dealProduct) return null;
        
        return (
          <View key={deal.id} className="bg-[#008B45] rounded-xl mx-4 mb-4 overflow-hidden">
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-white/10">
              <View className="flex-row items-center">
                <HugeIcon icon={FlashIcon} color="white" size={20} fill="white" className="mr-2" />
                <Text className="text-white font-black text-lg italic">FLASH DEAL</Text>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-md">
                <Text className="text-white font-extrabold text-xs">ENDING SOON</Text>
              </View>
            </View>
            <View className="p-4 bg-white m-[2px] rounded-b-xl">
              <ProductCardV2 product={dealProduct} theme={SECTION_THEMES.flash_deal} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profileLoading = useSelector((state: RootState) => state.profile.isLoading);
  const profile = useSelector((state: RootState) => state.profile.profile);
  const userCity = profile?.city;
  
  const flatListRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Live Firebase syncing states
  const [promoOffers, setPromoOffers] = useState<any[]>([]);
  const [loadingPromoOffers, setLoadingPromoOffers] = useState(true);
  
  const [layoutSettings, setLayoutSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [layouts, setLayouts] = useState<any[]>([]);
  const [loadingLayouts, setLoadingLayouts] = useState(true);

  // Animated Hero Header State
  const [heroAd, setHeroAd] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'hero_header_ads'), where('isActive', '==', true), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setHeroAd({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setHeroAd(null);
      }
    }, (error) => {
      console.error('🔴 Error listening to hero_header_ads:', error);
      setHeroAd(null);
    });
    return () => unsubscribe();
  }, []);

  const [products, setProducts] = useState<any[]>([]);
  const [localShops, setLocalShops] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [flashDeals, setFlashDeals] = useState<any[]>([]);

  // Compute overall storefront loading status, ensuring the user's profile is ready
  const isStorefrontLoading =
    loadingLayouts ||
    loadingSettings ||
    loadingPromoOffers ||
    loadingCategories ||
    (isAuthenticated && (profileLoading || !profile));

  const headerHeight = promoOffers.length > 0
    ? scrollY.interpolate({
        inputRange: [0, 170],
        outputRange: [330, 160],
        extrapolate: 'clamp'
      })
    : 160;

  const headerBackgroundColor = promoOffers.length >= 2
    ? scrollX.interpolate({
        inputRange: promoOffers.map((_, index) => index * ITEM_WIDTH),
        outputRange: promoOffers.map(offer => offer.bgColor || '#008B45'),
        extrapolate: 'clamp',
      })
    : (promoOffers[0]?.bgColor || '#008B45');

  // Automatic scrolling timer for promo banners
  useEffect(() => {
    if (promoOffers.length <= 1) return;
    const timer = setInterval(() => {
      let nextIndex = activeIndexRef.current + 1;
      if (nextIndex >= promoOffers.length) {
        nextIndex = 0;
      }
      activeIndexRef.current = nextIndex;
      try {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
      } catch (e) {
        // Safe catch if unmounted/not ready
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [promoOffers]);

  const handleScrollEnd = (e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / ITEM_WIDTH);
    activeIndexRef.current = index;
  };

  // 1. Live Sync for Promo Offers (banners collection)
  useEffect(() => {
    if (isAuthenticated && profileLoading) {
      return;
    }
    const q = query(
      collection(db, 'banners'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedBanners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter in memory to allow both user-city matching and global/national banners
      if (userCity) {
        fetchedBanners = fetchedBanners.filter((b: any) => !b.city || b.city === userCity || b.city === 'global' || b.city === 'national');
      }
      fetchedBanners = fetchedBanners.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setPromoOffers(fetchedBanners);
      setLoadingPromoOffers(false);
    }, (error) => {
      console.error('🔴 Error listening to banners collection:', error);
      setLoadingPromoOffers(false);
    });
    return () => unsubscribe();
  }, [userCity, isAuthenticated, profileLoading]);

  // Log banners variable and states right after the banners useEffect
  // 2. Live Sync for Categories
  useEffect(() => {
    if (isAuthenticated && profileLoading) return;
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategoriesData(cats);
      setLoadingCategories(false);
    }, (error) => {
      console.error('🔴 Error listening to categories. Permission Denied?:', error);
      setLoadingCategories(false);
    });
    return () => unsubscribe();
  }, [isAuthenticated, profileLoading]);

  // 3. Live Sync for settings/app document
  useEffect(() => {
    if (isAuthenticated && profileLoading) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLayoutSettings(data);
      } else {
      }
      setLoadingSettings(false);
    }, (error) => {
      console.error('🔴 Error listening to app settings. Permission Denied?:', error);
      setLoadingSettings(false);
    });
    return () => unsubscribe();
  }, [isAuthenticated, profileLoading]);

  // 4. One-time fetch of other static storefront collections
  useEffect(() => {
    if (isAuthenticated && profileLoading) {
      return;
    }

    const loadAllData = async () => {
      setLoadingLayouts(true);
      try {
        const [
          productsData,
          bannersData, 
          dealsData,
          layoutsData,
          shopsData
        ] = await Promise.allSettled([
          getProducts(userCity),
          getBanners(userCity),
          getActiveFlashDeals(),
          getStorefrontLayouts(userCity),
          getLocalShops(userCity)
        ]);
        
        if (productsData.status === 'fulfilled') {
          setProducts(productsData.value);
        }
        if (bannersData.status === 'fulfilled') {
          setBanners(bannersData.value);
        }
        if (dealsData.status === 'fulfilled') {
          setFlashDeals(dealsData.value);
        }
        if (layoutsData.status === 'fulfilled') {
          setLayouts(layoutsData.value);
        }
        if (shopsData.status === 'fulfilled') {
          setLocalShops(shopsData.value);
        }
      } catch(e) {
        console.error('Load error:', e);
      } finally {
        setLoadingLayouts(false);
      }
    };
    loadAllData();
  }, [isAuthenticated, profileLoading, userCity]);

  const dynamicCategories = [
    { id: 'all', label: 'For You', icon: '✨', color: '#FFE4E4' },
    ...categoriesData.map(cat => {
      const nameLower = (cat.name || '').toLowerCase();
      const matched = CATEGORY_ICONS[nameLower];
      
      let icon = '🛍️';
      if (cat.icon && cat.icon.length <= 2) {
        icon = cat.icon;
      } else if (matched?.icon) {
        icon = matched.icon;
      } else {
        const lucideToEmoji: Record<string, string> = {
          'Zap': '⚡',
          'Shirt': '👕',
          'ShoppingCart': '🛒',
          'UtensilsCrossed': '🍳',
          'Activity': '⚽',
          'Home': '🏠',
        };
        icon = lucideToEmoji[cat.icon] || '🛍️';
      }

      return {
        id: nameLower,
        label: cat.name || '',
        icon: icon,
        color: matched?.color || '#F5F5F5'
      };
    })
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => {
        const cat = typeof p.category === 'string' ? p.category.toLowerCase() : '';
        const sel = selectedCategory.toLowerCase();
        return cat === sel;
      });

  const currentTabProducts = getTabProducts(activeTab, filteredProducts);

  const getHomepageSections = () => {
    const defaultSections = [
      { id: 'banners', key: 'banners', name: 'Hero Banner', enabled: true },
      { id: 'trust_badges', key: 'trust_badges', name: 'Trust Strip', enabled: true },
      { id: 'flash_deals', key: 'flash_deals', name: 'Flash Deals', enabled: true },
      { id: 'storefront_layouts', key: 'storefront_layouts', name: 'Featured Products', enabled: true },
      { id: 'all_products', key: 'all_products', name: 'All Products', enabled: true }
    ];

    if (!layoutSettings?.homepageSections) {
      return defaultSections;
    }

    return layoutSettings.homepageSections
      .filter((sec: any) => sec.enabled)
      .map((sec: any) => {
        const name = (sec.name || '').toLowerCase();
        let sectionKey = '';
        if (name.includes('banner') || name.includes('hero')) sectionKey = 'banners';
        else if (name.includes('trust') || name.includes('badge') || name.includes('strip')) sectionKey = 'trust_badges';
        else if (name.includes('flash') || name.includes('deal')) sectionKey = 'flash_deals';
        else if (name.includes('layout') || name.includes('storefront') || name.includes('featured')) sectionKey = 'storefront_layouts';
        else if (name.includes('product') || name.includes('all') || name.includes('new arrival')) sectionKey = 'all_products';
        else if (name.includes('shop') || name.includes('local')) sectionKey = 'local_shops';
        
        return {
          ...sec,
          key: sectionKey
        };
      })
      .filter((sec: any) => sec.key !== '');
  };

  const renderActiveTabContent = () => {
    if (isStorefrontLoading) {
      return <SkeletonLoader />;
    }

    if (activeTab === 'LOCAL SHOPS') {
      return (
        <View className="px-5 pt-4 pb-20">
          {localShops.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-lg font-bold text-zinc-800">No local shops found</Text>
            </View>
          ) : (
            localShops.map(shop => (
              <TouchableOpacity key={shop.id} className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4 flex-row">
                <Image source={{ uri: shop.image || shop.imageUrl || 'https://via.placeholder.com/150' }} className="w-20 h-20 rounded-lg mr-4 bg-zinc-100" />
                <View className="flex-1 justify-center">
                  <Text className="font-bold text-lg text-[#1C1C1C]">{shop.name}</Text>
                  <Text className="text-zinc-500 text-xs mb-1">{shop.category}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-yellow-600">⭐ {shop.rating || '4.0'}</Text>
                    <Text className="mx-2 text-zinc-300">•</Text>
                    <Text className="text-xs text-zinc-500"><HugeIcon icon={Location01Icon} size={16} /> {shop.distance || '0.5 km'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      );
    }

    if (activeTab === 'ALL' && selectedCategory === 'all') {
      const activeSections = getHomepageSections();
      

      return (
        <View className="pt-4 pb-20">
          {activeSections.map((sec: any, idx: number) => {
            const uniqueKey = `sec_${sec.key}_${idx}`;
            switch (sec.key) {
              case 'banners':
                return banners.length > 0 ? (
                  <BannerCarousel key={uniqueKey} banners={banners} />
                ) : (
                  <View key={uniqueKey} style={{
                    marginHorizontal: 16,
                    marginVertical: 12,
                    height: 220,
                    backgroundColor: '#008B45',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
                      🛍️ Jhat-Pat Sale
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                      Best deals in your neighborhood
                    </Text>
                    <TouchableOpacity 
                      onPress={createSampleBanners}
                      style={{ marginTop: 16, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#008B45', fontWeight: 'bold' }}>Create Sample Banners</Text>
                    </TouchableOpacity>
                  </View>
                );
              case 'trust_badges':
                return <TrustBadges key={uniqueKey} />;
              case 'flash_deals':
                return flashDeals.length > 0 ? (
                  <FlashDealSection key={uniqueKey} deals={flashDeals} products={products} />
                ) : null;
              case 'storefront_layouts':
                return layouts.map(layout => (
                  <SectionCard
                    key={`${uniqueKey}_layout_${layout.id}`}
                    layout={layout}
                  />
                ));
              case 'local_shops':
                return localShops.length > 0 ? (
                  <View key={uniqueKey} className="mb-6">
                    <Text className="text-xl font-black text-[#1C1C1C] px-5 mb-3">Shops Near You <HugeIcon icon={Location01Icon} size={16} /></Text>
                    {localShops.slice(0, 3).map(shop => (
                      <TouchableOpacity key={shop.id} className="bg-white p-4 rounded-xl border border-zinc-150 mb-3 flex-row mx-5">
                        <Image source={{ uri: shop.image || shop.imageUrl || 'https://via.placeholder.com/150' }} className="w-16 h-16 rounded-lg mr-4 bg-zinc-100" />
                        <View className="flex-1 justify-center">
                          <Text className="font-bold text-base text-[#1C1C1C]">{shop.name}</Text>
                          <Text className="text-zinc-500 text-xs mb-1">{shop.category}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-xs font-bold text-yellow-600">⭐ {shop.rating || '4.0'}</Text>
                            <Text className="mx-2 text-zinc-300">•</Text>
                            <Text className="text-xs text-zinc-500"><HugeIcon icon={Location01Icon} size={16} /> {shop.distance || '0.5 km'}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null;
              case 'all_products':
                return (
                  <View key={uniqueKey}>
                    <View className="px-5 mt-6 mb-2 flex-row justify-between items-center">
                      <Text className="text-xl font-black text-[#1C1C1C]">All Products</Text>
                    </View>
                    <View className="px-5 flex-row justify-between">
                      {products.length === 0 ? (
                         <Text className="text-zinc-500 w-full text-center py-10">No products found</Text>
                      ) : (
                         <>
                           <View style={{ width: '48%' }}>
                             {products.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
                           </View>
                           <View style={{ width: '48%' }}>
                             {products.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
                           </View>
                         </>
                      )}
                    </View>
                  </View>
                );
              default:
                return null;
            }
          })}
        </View>
      );
    }

    // Default Grid for filtered/tabbed products
    return (
      <View className="px-5 pt-4 pb-20 flex-row justify-between">
        {currentTabProducts.length === 0 ? (
          <View className="w-full items-center justify-center py-10">
            <Text className="text-2xl mb-2">😕</Text>
            <Text className="text-lg font-black text-zinc-800 mb-1">No products found</Text>
            <Text className="text-zinc-500">Check Firebase connection or add products</Text>
          </View>
        ) : (
          <>
            <View style={{ width: '48%' }}>
              {currentTabProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
            </View>
            <View style={{ width: '48%' }}>
              {currentTabProducts.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
            </View>
          </>
        )}
      </View>
    );
  };

  if (isStorefrontLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SkeletonLoader />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: headerHeight,
        backgroundColor: heroAd?.bgType ? 'transparent' : headerBackgroundColor,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {/* Dynamic Background Render */}
        {heroAd?.bgType === 'video' && heroAd?.bgUrl && (
          <HeroVideoBackground source={heroAd.bgUrl} />
        )}
        {heroAd?.bgType === 'lottie' && heroAd?.bgUrl && (
          <LottieView
            source={{ uri: heroAd.bgUrl }}
            autoPlay
            loop
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        )}
        {heroAd?.bgType === 'animated_gradient' && heroAd?.bgColors && (
          <AnimatedGradientBackground colors={heroAd.bgColors} />
        )}
        
        {/* Fallback solid background if no ad */}
        {!heroAd?.bgType && (
           <View style={[StyleSheet.absoluteFill, { backgroundColor: headerBackgroundColor }]} />
        )}

        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 12, flex: 1 }}>
            {/* ── STATIC HEADER CONTENT (Location & Search Bar) ── */}
            {/* Location & Rewards Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 20, marginRight: 8 }}>
                  <HugeIcon icon={Home02Icon} size={16} color="#FFFFFF" />
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text 
                    style={{ color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginRight: 4, flexShrink: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {profile?.location ? `Home - ${profile.location}` : (profile?.city || 'Swaroop Nagar, Thane')}
                  </Text>
                  <HugeIcon icon={ChevronDownIcon} size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: '#FFD700', marginRight: 4, fontSize: 12 }}>⚡</Text>
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>0</Text>
              </View>
            </View>

            {/* Unified Search & Smart Bar Scanner */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Search')}
                style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
              >
                <HugeIcon icon={Search02Icon} size={18} color="#A1A1AA" />
                <View pointerEvents="none" style={{ flex: 1, marginLeft: 10, height: '100%', justifyContent: 'center' }}>
                  <TextInput
                    style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#1C1C1C' }}
                    placeholder={heroAd?.searchPlaceholder || 'Search "milk"'}
                    placeholderTextColor="#A1A1AA"
                    editable={false}
                  />
                </View>
                <TouchableOpacity style={{ borderLeftWidth: 1, borderLeftColor: '#E4E4E7', paddingLeft: 12 }}>
                   <HugeIcon icon={Camera02Icon} size={18} color="#1C1C1C" />
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={{ backgroundColor: 'rgba(0,102,51,0.4)', borderRadius: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#006633' }}>
                <HugeIcon icon={QrCodeIcon} size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* ── PROMOTIONAL BANNER CAROUSEL (fades out and slides up) ── */}
            <Animated.View style={{
              opacity: scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0], extrapolate: 'clamp' }),
              transform: [{
                translateY: scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -20], extrapolate: 'clamp' })
              }],
            }}>
              <Animated.FlatList
                ref={flatListRef}
                data={promoOffers}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScrollEnd}
                getItemLayout={(data, index) => (
                  { length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index }
                )}
                renderItem={({ item }) => (
                  <View style={{
                    width: ITEM_WIDTH,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                  }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      {item.badge && (
                        <View style={{
                          backgroundColor: '#FFD700',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          alignSelf: 'flex-start',
                          marginBottom: 6,
                        }}>
                          <Text style={{ color: '#008B45', fontSize: 10, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 1 }}>{item.badge}</Text>
                        </View>
                      )}
                      <Text style={{ color: '#FFFFFF', fontSize: 22, fontFamily: 'Poppins_800ExtraBold', marginBottom: 3 }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Poppins_300Light', marginBottom: 12 }} numberOfLines={1}>
                        {item.desc || item.subtitle || 'Shop our latest deals!'}
                      </Text>
                      <TouchableOpacity style={{
                        backgroundColor: '#FFD700',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: '#008B45', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>{item.ctaText || 'Shop Now'}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      width: 80, height: 80,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }}>
                      {item.imageUrl ? (
                        <SafeImage
                          uri={item.imageUrl}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 60 }}>{item.icon || '🎉'}</Text>
                      )}
                    </View>
                  </View>
                )}
              />
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <View style={{ flex: 1, backgroundColor: '#FFFFFF', marginTop: 160, overflow: 'hidden' }}>
        <Animated.ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false} 
          stickyHeaderIndices={[2]}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Spacer to align content below expanded header */}
          <View style={{ height: promoOffers.length > 0 ? 170 : 0 }} />
          {/* ── CATEGORY ICONS ── */}
          <View className="bg-white">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginTop: 16, paddingBottom: 8 }}>
              {CATEGORIES.map((cat, idx) => (
                <AnimatedCategoryIcon 
                  key={cat.id} 
                  cat={cat} 
                  idx={idx} 
                  onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat.id, categoryName: cat.label })} 
                />
              ))}
            </ScrollView>
          </View>
          <View className="bg-white">
            <HomeTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </View>
          {renderActiveTabContent()}
        </Animated.ScrollView>
      </View>
    </View>
  );
}
