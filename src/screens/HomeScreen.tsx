import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, FlatList, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import LottieView from 'lottie-react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, interpolateColor, Extrapolation, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import Svg, { Path, ClipPath, Defs, G, Image as SvgImage } from 'react-native-svg';
import YoutubeVideoPlayer from './YoutubeVideoPlayer';
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
import { TAB_THEMES } from '../config/tabThemes';
import { useHomepageData } from '../hooks/useHomepageData';
import { normalizeCategoryKey, doesProductBelongToCategory } from '../utils/productClassifier';

import HomeTabBar from '../components/HomeTabBar';
import ProductCard from '../components/ProductCard';
import MiniProductCard from '../components/MiniProductCard';
import SafeImage from '../components/SafeImage';
import { getProductImage } from '../utils/productImages';
import DynamicPageBuilder from '../components/sdui/DynamicPageBuilder';
import SDUIRenderer from '../components/SDUIRenderer';
import UniversalSDUIRenderer from '../components/sdui/UniversalSDUIRenderer';
import HeaderBannerCarousel from '../components/HeaderBannerCarousel';
import CategoryStories from '../components/CategoryStories';
import ExploreCategoriesGrid from '../components/ExploreCategoriesGrid';
import LiveProductsCatalog from '../components/LiveProductsCatalog';
import { handleSDUILink } from '../utils/sduiNavigation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_ASPECT_RATIO = 1.7; // Generous spacious height matching Toing app's hero banner container
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH / BANNER_ASPECT_RATIO);

// Professional Meesho-Style Category Icon (Big Squircle Card with Soft Pastel Tone & High-Def Artwork)
const AnimatedCategoryIcon = ({ cat, idx, onPress }: { cat: any; idx?: number; onPress: () => void }) => {
  const imageSrc = cat.imageUrl || cat.image || cat.iconUrl;
  const bgBadgeColor = cat.color || '#F8FAFC';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles_cat.itemContainer}
    >
      {/* Big Meesho-Style Squircle Card */}
      <View style={[styles_cat.iconBadge, { backgroundColor: bgBadgeColor }]}>
        {imageSrc ? (
          <SafeImage
            uri={imageSrc}
            style={styles_cat.iconImage}
            resizeMode="contain"
            fallbackEmoji={cat.icon || '🛍️'}
            fallbackText=""
          />
        ) : (
          <Text style={{ fontSize: 32 }}>{cat.icon || '🛍️'}</Text>
        )}
      </View>

      {/* Clean Category Label */}
      <Text style={styles_cat.label} numberOfLines={2}>
        {cat.label || cat.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles_cat = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    marginRight: 14,
    width: 76,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20, // Clean professional squircle shape like Meesho
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconImage: {
    width: 58,
    height: 58,
  },
  label: {
    fontSize: 11.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 15,
  },
});

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

// Safe Lottie Component for Web & Mobile
const SafeLottieView = (props: any) => {
  const LottieComp: any = typeof LottieView === 'function' ? LottieView : (LottieView as any)?.default;
  if (!LottieComp || typeof LottieComp !== 'function') return null;
  try {
    return <LottieComp {...props} />;
  } catch (e) {
    return null;
  }
};

// Helper to extract YouTube ID
const getYoutubeIdFromUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Native Video Loop Player via expo-video (Expo 56+)
const NativeExpoVideo = ({ source, style }: { source: string; style?: any }) => {
  const player = useVideoPlayer(source, p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Pause the looping hero video when this component unmounts (e.g. leaving Home)
  useEffect(() => {
    return () => {
      try { player.pause(); } catch (e) {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={style || StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Video Background Component with seamless Web & Native video support
const HeroVideoBackground = ({ source: videoUrl }: { source: string }) => {
  if (!videoUrl) return null;

  const ytId = getYoutubeIdFromUrl(videoUrl);
  if (ytId) {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
          } as any}
          allow="autoplay; encrypted-media"
          title="Hero Video"
        />
      );
    }
    return (
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <YoutubeVideoPlayer videoId={ytId} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        } as any}
      />
    );
  }

  return <NativeExpoVideo source={videoUrl} />;
};

// Universal Banner Media Component (Supports .webm, .mp4, YouTube, Giphy, Shutterstock, Cloudinary, etc.)
// Universal Web Video Player that strictly guarantees autoplay and loop on all desktop/mobile browsers
const Html5Video = ({ src, style }: { src: string; style?: any }) => {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = true;
      el.defaultMuted = true;
      el.playsInline = true;
      el.autoplay = true;
      el.loop = true;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.setAttribute('muted', 'true');
      el.setAttribute('autoplay', 'true');
      el.setAttribute('loop', 'true');
      const promise = el.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
    }
  }, [src]);

  const mp4Src = src.replace(/\.webm(\?.*)?$/i, '.mp4$1');

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minWidth: '100%',
        minHeight: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      } as any}
    >
      <source src={src} type={src.includes('.webm') ? 'video/webm' : 'video/mp4'} />
      <source src={mp4Src} type="video/mp4" />
    </video>
  );
};

// Universal Banner Media Component (Supports .webm, .mp4, YouTube, Giphy, Shutterstock, Cloudinary, etc.)
const BannerUniversalMedia = ({
  source,
  isVideo,
  style,
}: {
  source: string;
  isVideo: boolean;
  style: any;
}) => {
  let normalizedSource = (source || '').trim();
  if (Platform.OS !== 'web' && normalizedSource.includes('.webm')) {
    normalizedSource = normalizedSource.replace(/\.webm(\?.*)?$/i, '.mp4$1');
  }

  const ytId = getYoutubeIdFromUrl(normalizedSource);

  if (ytId) {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
          } as any}
          allow="autoplay; encrypted-media"
          title="Banner Video"
        />
      );
    }
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <YoutubeVideoPlayer videoId={ytId} />
      </View>
    );
  }

  if (isVideo) {
    if (Platform.OS === 'web') {
      return <Html5Video src={normalizedSource} style={style} />;
    }
    return (
      <NativeExpoVideo
        source={normalizedSource}
        style={[style, StyleSheet.absoluteFill]}
      />
    );
  }

  return (
    <SafeImage
      uri={source}
      style={style}
      resizeMode="cover"
    />
  );
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
        uri={getProductImage(product)}
        style={[styles_card.productImageV2, { width: '100%', height: 170 }]}
        resizeMode="cover"
        fallbackEmoji={product.emoji}
        fallbackText={product.name}
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
const BannerCarousel = React.memo(({ banners }: { banners: any[] }) => {
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
});

const styles_banner = StyleSheet.create({
  bannerContainer: { marginBottom: 12, overflow: 'hidden', position: 'relative' },
  bannerImage: { 
    width: SCREEN_WIDTH - 32, 
    height: 145, 
    borderRadius: 14,
    marginHorizontal: 16
  },
  bannerOverlay: {
    position: 'absolute', bottom: 0, left: 16,
    right: 16, padding: 10, paddingBottom: 12,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    overflow: 'hidden'
  },
  bannerBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start',
    marginBottom: 4
  },
  bannerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bannerTitle: { 
    color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20
  },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  bannerCTA: {
    marginTop: 6, backgroundColor: '#FF6B35',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 6, alignSelf: 'flex-start'
  },
  bannerCTAText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  dotsRow: {
    position: 'absolute',
    bottom: 8,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: { height: 5, borderRadius: 2.5 },
  dotActive: { backgroundColor: '#FFFFFF', width: 14 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.5)', width: 5 },
});

const TrustBadges = React.memo(() => (
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
));

// Colorful Section Card Component:
const SectionCard = React.memo(({ layout }: { layout: any }) => {
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
                    uri={getProductImage(product)}
                    style={styles_carousel.image}
                    resizeMode="cover"
                    fallbackEmoji={product.emoji}
                    fallbackText={product.name}
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
});

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
  if (!tab || tab.toUpperCase() === 'ALL') return products;
  if (tab.toUpperCase() === 'LOCAL SHOPS') return [];
  
  const tabUpper = tab.toUpperCase().trim();
  const targetCategory = normalizeCategoryKey(tabUpper);

  return products.filter(product => {
    return doesProductBelongToCategory(product, targetCategory);
  });
};

// Flash Deal Section Component
const FlashDealSection = React.memo(({ deals, products }: { deals: any[], products: any[] }) => {
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
});

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const TOP_INSET = Math.max(insets.top, Platform.OS === 'android' ? 24 : 44);
  const TOP_CONTROLS_HEIGHT = 126;
  const COLLAPSED_HEADER_HEIGHT = TOP_INSET + TOP_CONTROLS_HEIGHT;
  const TOTAL_HEADER_HEIGHT = BANNER_HEIGHT + COLLAPSED_HEADER_HEIGHT;

  const scrollY = useSharedValue(0);
  const scrollHandlerY = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Camera Visual Search State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isProcessingVisualSearch, setIsProcessingVisualSearch] = useState(false);

  const handleLaunchCamera = async () => {
    setIsCameraModalOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to search products by photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setIsProcessingVisualSearch(true);
        setTimeout(() => {
          setIsProcessingVisualSearch(false);
          navigation.navigate('Search', { initialQuery: 'Fashion' });
        }, 1000);
      }
    } catch (e) {
      console.error('Camera Search Error:', e);
    }
  };

  const handleLaunchGallery = async () => {
    setIsCameraModalOpen(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setIsProcessingVisualSearch(true);
        setTimeout(() => {
          setIsProcessingVisualSearch(false);
          navigation.navigate('Search', { initialQuery: 'Trending' });
        }, 1000);
      }
    } catch (e) {
      console.error('Gallery Search Error:', e);
    }
  };

  // Dynamic layout & content fetched from Firestore 'app_homepage_layout' collection
  const { data: tabLayout, loading: isTabLayoutLoading } = useHomepageData(activeTab);

  const tabFadeOpacity = useSharedValue(1);
  const animatedTabStyle = useAnimatedStyle(() => ({
    opacity: tabFadeOpacity.value,
  }));

  const mainScrollRef = useRef<any>(null);

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    tabFadeOpacity.value = withTiming(0, { duration: 120 });
    setTimeout(() => {
      setActiveTab(newTab);
      tabFadeOpacity.value = withTiming(1, { duration: 250 });
      // If user is scrolled down into products, smoothly scroll to top of feed
      if (scrollY.value > (BANNER_HEIGHT + 105)) {
        if (mainScrollRef.current?.scrollTo) {
          mainScrollRef.current.scrollTo({
            y: BANNER_HEIGHT + 105,
            animated: true,
          });
        } else if (mainScrollRef.current?.scrollToOffset) {
          mainScrollRef.current.scrollToOffset({
            offset: BANNER_HEIGHT + 105,
            animated: true,
          });
        }
      }
    }, 120);
  };

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const profileLoading = useSelector((state: RootState) => state.profile.isLoading);
  const profile = useSelector((state: RootState) => state.profile.profile);
  const userCity = profile?.city;
  
  const flatListRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  const [activeTopIndex, setActiveTopIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollHandlerX = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

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

  const [storefrontTimeout, setStorefrontTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStorefrontTimeout(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Compute overall storefront loading status, ensuring the user's profile is ready
  const isStorefrontLoading =
    !storefrontTimeout &&
    (loadingLayouts ||
     loadingSettings ||
     loadingPromoOffers ||
     loadingCategories ||
     (isAuthenticated && (profileLoading || !profile)));

  const defaultHeaderSlide = {
    id: 'default_hero_video_offer',
    title: 'Limited Time Offers Just For You!',
    subtitle: 'Exclusive deals on your favorite products',
    tag: 'Limited Offer',
    badge: 'Limited Offer',
    buttonText: 'Shop Now',
    ctaText: 'Shop Now',
    bgColor: '#1D58EE',
    videoUrl: 'https://www.shutterstock.com/shutterstock/videos/4140539077/preview/stock-footage-black-friday-special-offer-animated-label-sale-video.webm',
    displayLayout: 'full_cover',
  };

  const headerTopSlides = React.useMemo(() => {
    if (tabLayout?.heroSlides && tabLayout.heroSlides.length > 0) {
      return tabLayout.heroSlides;
    }
    const combined = [
      ...(tabLayout?.heroBanner ? [tabLayout.heroBanner] : []),
      ...(promoOffers && promoOffers.length > 0 ? promoOffers : [])
    ];
    if (combined.length > 0) {
      return combined;
    }
    return [defaultHeaderSlide];
  }, [tabLayout, promoOffers]);

  // ── UI-THREAD Sticky Category Tab Bar (Locks smoothly right under the collapsed header) ──
  const stickyTabBarAnimStyle = useAnimatedStyle(() => {
    const isSticky = scrollY.value >= (BANNER_HEIGHT + 115);
    return {
      position: 'absolute',
      top: COLLAPSED_HEADER_HEIGHT,
      left: 0,
      right: 0,
      zIndex: 9999,
      elevation: 9999,
      opacity: isSticky ? 1 : 0,
      transform: [
        { translateY: isSticky ? 0 : -8 },
      ],
      pointerEvents: isSticky ? 'auto' : 'none',
    };
  });

  // Collapsed header solid backdrop so when scrolled, location/search row is 100% crisp without video bleed
  const headerCollapsedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [10, 60], [0, 1], Extrapolation.CLAMP),
  }));

  // Promo carousel area gently dims as it scrolls out of view under the header
  const headerPromoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, BANNER_HEIGHT * 0.75], [1, 0.25], Extrapolation.CLAMP),
  }));

  // Header background color follows the active top slide (UI thread)
  const headerBackgroundStyle = useAnimatedStyle(() => {
    if (headerTopSlides.length >= 2) {
      return {
        backgroundColor: interpolateColor(
          scrollX.value,
          headerTopSlides.map((_, index) => index * SCREEN_WIDTH),
          headerTopSlides.map(offer => offer.bgColor || '#008B45')
        ),
      };
    }
    return { backgroundColor: headerTopSlides[0]?.bgColor || '#008B45' };
  });

  // Automatic scrolling timer for header top banners
  useEffect(() => {
    if (headerTopSlides.length <= 1) return;
    const timer = setInterval(() => {
      let nextIndex = activeIndexRef.current + 1;
      if (nextIndex >= headerTopSlides.length) {
        nextIndex = 0;
      }
      activeIndexRef.current = nextIndex;
      setActiveTopIndex(nextIndex);
      try {
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
      } catch (e) {
        // Safe catch if unmounted/not ready
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [headerTopSlides]);

  const handleScrollEnd = (e: any) => {
    const offset = e?.nativeEvent?.contentOffset?.x || 0;
    const index = Math.round(offset / SCREEN_WIDTH);
    if (index >= 0 && index < headerTopSlides.length) {
      activeIndexRef.current = index;
      setActiveTopIndex(index);
    }
  };

  // 1. Live Sync for Promo Offers (banners collection)
  useEffect(() => {
    if (isAuthenticated && profileLoading) {
      return;
    }
    const q = collection(db, 'banners');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedBanners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter out inactive banners in memory
      fetchedBanners = fetchedBanners.filter((b: any) => 
        b.status !== 'inactive' && b.status !== 'Inactive' && b.isActive !== false
      );
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

  // Live dynamic categories linked 100% directly to Firestore admin updates
  const displayCategories = React.useMemo(() => {
    if (!categoriesData || categoriesData.length === 0) {
      return [];
    }

    return categoriesData
      .filter((c: any) => c.status !== 'inactive')
      .map((c: any, index: number) => ({
        id: c.id,
        label: c.name || c.label || '',
        imageUrl: c.imageUrl || c.image || c.iconUrl,
        image: c.image || c.imageUrl,
        icon: c.icon || '🛍️',
        color: c.color || '#F8FAFC',
        order: typeof c.order === 'number' ? c.order : typeof c.sortOrder === 'number' ? c.sortOrder : index,
      }))
      .sort((a: any, b: any) => a.order - b.order);
  }, [categoriesData]);

  const filteredProducts = React.useMemo(() => {
    return selectedCategory === 'all'
      ? products
      : products.filter(p => {
          const cat = typeof p.category === 'string' ? p.category.toLowerCase() : '';
          const sel = selectedCategory.toLowerCase();
          return cat === sel;
        });
  }, [products, selectedCategory]);

  const currentTabProducts = React.useMemo(
    () => getTabProducts(activeTab, filteredProducts),
    [activeTab, filteredProducts]
  );

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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <HugeIcon icon={Location01Icon} size={14} color="#71717A" />
                      <Text style={{ fontSize: 12, color: '#71717A', marginLeft: 3 }}>{shop.distance || '0.5 km'}</Text>
                    </View>
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

      const legacyAllContent = (
        <View className="pt-4 pb-20">
          {activeSections.map((sec: any, idx: number) => {
            const uniqueKey = `sec_${sec.key}_${idx}`;
            switch (sec.key) {
              case 'banners': {
                const dynamicAllBanner = tabLayout?.heroBanner;
                const dynamicAllBanners = tabLayout?.heroBanners;
                const heroSlides = tabLayout?.heroSlides || (tabLayout as any)?.slides;
                const categoryStories = tabLayout?.categoryStories || (tabLayout as any)?.stories;
                const exploreCatData = tabLayout?.exploreCategories;
                const exploreCategoriesList: any[] = Array.isArray(exploreCatData)
                  ? exploreCatData
                  : exploreCatData?.items || [];
                const exploreHeaderTitle = (!Array.isArray(exploreCatData) && exploreCatData?.sectionTitle) || tabLayout?.exploreTitle || 'Explore Categories';

                return (
                  <View key={uniqueKey}>
                    {/* 1. Multi-Banner (Up to 10 Slides) Header Carousel */}
                    {heroSlides && Array.isArray(heroSlides) && heroSlides.length > 0 ? (
                      <HeaderBannerCarousel slides={heroSlides} />
                    ) : dynamicAllBanner ? (
                      <HeaderBannerCarousel slides={[dynamicAllBanner]} />
                    ) : dynamicAllBanners && dynamicAllBanners.length > 0 ? (
                      <HeaderBannerCarousel slides={dynamicAllBanners} />
                    ) : banners.length > 0 ? (
                      <BannerCarousel banners={banners} />
                    ) : (
                      <View style={{
                        marginHorizontal: 16,
                        marginVertical: 12,
                        height: 145,
                        backgroundColor: '#008B45',
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
                          🛍️ BazarPeth Sale
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                          Best deals in your neighborhood
                        </Text>
                      </View>
                    )}

                    {/* 2. Category Stories Carousel */}
                    {categoryStories && Array.isArray(categoryStories) && categoryStories.length > 0 && (
                      <CategoryStories stories={categoryStories} />
                    )}

                    {/* 3. Explore Categories Grid */}
                    {exploreCategoriesList.length > 0 && (
                      <ExploreCategoriesGrid items={exploreCategoriesList} title={exploreHeaderTitle} />
                    )}

                    {/* 4. Universal SDUI Dynamic Blocks */}
                    {tabLayout?.blocks && Array.isArray(tabLayout.blocks) && tabLayout.blocks.length > 0 && (
                      <UniversalSDUIRenderer blocks={tabLayout.blocks} cardShapeSettings={tabLayout.cardShapeSettings} />
                    )}
                  </View>
                );
              }
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
                    <View className="flex-row items-center px-5 mb-3">
                      <Text className="text-xl font-black text-[#1C1C1C] mr-2">Shops Near You</Text>
                      <HugeIcon icon={Location01Icon} size={18} />
                    </View>
                    {localShops.slice(0, 3).map(shop => (
                      <TouchableOpacity key={shop.id} className="bg-white p-4 rounded-xl border border-zinc-150 mb-3 flex-row mx-5">
                        <Image source={{ uri: shop.image || shop.imageUrl || 'https://via.placeholder.com/150' }} className="w-16 h-16 rounded-lg mr-4 bg-zinc-100" />
                        <View className="flex-1 justify-center">
                          <Text className="font-bold text-base text-[#1C1C1C]">{shop.name}</Text>
                          <Text className="text-zinc-500 text-xs mb-1">{shop.category}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-xs font-bold text-yellow-600">⭐ {shop.rating || '4.0'}</Text>
                            <Text className="mx-2 text-zinc-300">•</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <HugeIcon icon={Location01Icon} size={14} color="#71717A" />
                              <Text style={{ fontSize: 12, color: '#71717A', marginLeft: 3 }}>{shop.distance || '0.5 km'}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null;
              case 'all_products':
                return null;
              default:
                return null;
            }
          })}

          {/* Guaranteed All Products 2-Column Grid */}
          <View style={{ paddingHorizontal: 16, marginTop: 12, paddingBottom: 40 }}>
            <View style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#0F172A' }}>
                All Products ({filteredProducts.length})
              </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#008B45' }}>
                ⚡ Fast Local Delivery
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {filteredProducts.length === 0 ? (
                <View style={{ width: '100%', alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 44, marginBottom: 8 }}>📍</Text>
                  <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 }}>
                    Coming soon to {userCity || 'your area'}!
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#64748B', textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                    We are actively onboarding verified local shops and boutiques in {userCity || 'your city'}. Check back shortly!
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ width: '48%' }}>
                    {filteredProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
                  </View>
                  <View style={{ width: '48%' }}>
                    {filteredProducts.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      );

      const allProductsFooter = (
        <View style={{ paddingHorizontal: 16, marginTop: 16, paddingBottom: 40 }}>
          <View style={{ marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#0F172A' }}>
              All Products ({filteredProducts.length})
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#008B45' }}>
              ⚡ Fast Local Delivery
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {filteredProducts.length === 0 ? (
              <View style={{ width: '100%', alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 }}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>📍</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1E293B', textAlign: 'center', marginBottom: 4 }}>
                  Coming soon to {userCity || 'your area'}!
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#64748B', textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                  We are actively onboarding verified local shops and boutiques in {userCity || 'your city'}. Check back shortly!
                </Text>
              </View>
            ) : (
              <>
                <View style={{ width: '48%' }}>
                  {filteredProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
                </View>
                <View style={{ width: '48%' }}>
                  {filteredProducts.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
                </View>
              </>
            )}
          </View>
        </View>
      );

      return (
        <DynamicPageBuilder
          pageId="home_all"
          fallback={legacyAllContent}
          footer={allProductsFooter}
        />
      );
    }

    // ── SWIGGY-INSTAMART STYLE DYNAMIC TAB CONTENT ──
    const theme = TAB_THEMES[activeTab] || TAB_THEMES.ALL;
    const tabSpecificBanners = banners.filter(
      (b: any) => b.targetTab === activeTab || b.category === activeTab || b.placement === activeTab
    );

    // Dynamic Hero Banner & Explore Categories from Firestore (app_homepage_layout) with theme fallbacks
    const dynamicHeroBanner = tabLayout?.heroBanner;
    const dynamicHeroBanners = tabLayout?.heroBanners;

    // Explore Categories schema from Admin Panel: either { sectionTitle, sectionSubtitle, items: [...] } or direct Array [...]
    const exploreCatData = tabLayout?.exploreCategories;
    const exploreCategoriesList: any[] = Array.isArray(exploreCatData)
      ? exploreCatData
      : exploreCatData?.items || tabLayout?.subCategories || theme.subCategories || [];
    const exploreHeaderTitle = (!Array.isArray(exploreCatData) && exploreCatData?.sectionTitle) || tabLayout?.exploreTitle || `Explore ${theme.label} Categories`;
    const exploreHeaderSubtitle = (!Array.isArray(exploreCatData) && exploreCatData?.sectionSubtitle) || '';
    const curatedHeaderTitle = tabLayout?.curatedTitle || theme.curatedTitle || 'Offers Curated For You';
    const emptyTitle = tabLayout?.emptyStateTitle || theme.emptyStateTitle;
    const emptySub = tabLayout?.emptyStateSub || theme.emptyStateSub;
    const emptyIcon = tabLayout?.emptyEmoji || theme.emptyEmoji;

    const bannerBadge = dynamicHeroBanner?.tag || dynamicHeroBanner?.badge || dynamicHeroBanner?.badgeText || theme.bannerBadgeText;
    const bannerTitle = dynamicHeroBanner?.title || theme.defaultBannerTitle;
    const bannerSub = dynamicHeroBanner?.subtitle || (dynamicHeroBanner as any)?.description || theme.defaultBannerSub;
    const bannerImg = dynamicHeroBanner?.imageUrl || dynamicHeroBanner?.image || theme.defaultBannerImage;
    const bannerCta = dynamicHeroBanner?.buttonText || dynamicHeroBanner?.ctaText || 'Shop Now →';
    const bannerLink = dynamicHeroBanner?.buttonLink || dynamicHeroBanner?.link || dynamicHeroBanner?.targetCategory;
    const bannerBg = dynamicHeroBanner?.bgColor;
    const bannerTextColor = dynamicHeroBanner?.textColor || '#FFFFFF';

    const legacyTabContent = (
      <View style={{ paddingTop: 0, paddingBottom: 80, backgroundColor: theme.gradient[0] }}>
        {/* ── 1. THEME TOP BAR (Search Bar + Sub-category Pills matching Zepto Super Mall) ── */}
        <View style={{ paddingTop: 6, paddingBottom: 12, backgroundColor: theme.gradient[0] }}>
          {/* Trending chips (replaces duplicate search bar) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
            {(activeTab === 'WOMEN' ? ['Saree', 'Kurti', 'Heels', 'Lehenga', 'Jewellery'] :
              activeTab === 'MEN' ? ['Shirts', 'Kurta', 'Shoes', 'Watches'] :
              activeTab === 'KIDS' ? ['Toys', 'Baby Wear', 'Games'] :
              activeTab === 'BEAUTY' ? ['Lipstick', 'Serum', 'Perfumes'] :
              activeTab === 'GROCERIES' ? ['Milk', 'Atta', 'Ghee', 'Vegetables'] :
              activeTab === 'ELECTRONICS' ? ['Earbuds', 'Smartwatch', 'Charger'] :
              ['Kurti', 'Groceries', 'Gifts']).map((chip, i) => (
              <TouchableOpacity
                key={`trend_${i}`}
                onPress={() => navigation.navigate('Search')}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Text style={{ fontSize: 11, color: '#FFFFFF', fontFamily: 'Poppins_400Regular' }}>#{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subcategory Pills Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}>
            {exploreCategoriesList.map((sub: any, sIdx: number) => {
              const subTitle = sub.title || sub.name || 'Category';
              const subImg = sub.img || sub.imageUrl || 'https://via.placeholder.com/100';

              return (
                <TouchableOpacity
                  key={sub.id || `sub_pill_${sIdx}`}
                  activeOpacity={0.88}
                  onPress={() => handleSDUILink(sub.link || (sub.id ? `category/${sub.id}` : `category/${activeTab.toLowerCase()}`), navigation, subTitle)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.28)',
                  }}
                >
                  <Image source={{ uri: subImg }} style={{ width: 18, height: 18, borderRadius: 9 }} resizeMode="cover" />
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_700Bold' }}>
                    {subTitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 2. CURVED WHITE SURFACE (Zepto Super Mall White Categories & Deals Sheet) ── */}
        <View style={{
          backgroundColor: '#F8FAFC',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 18,
          minHeight: 600,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 4,
        }}>
          {/* Categories Grid (Zepto Glossy Tiles Style) */}
          {exploreCategoriesList.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Poppins_800ExtraBold', color: '#0F172A', marginBottom: 12 }}>
                Categories
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {exploreCategoriesList.map((sub: any, subIdx: number) => {
                  const subTitle = sub.title || sub.name || 'Category';
                  const subImage = sub.imageUrl || sub.img || 'https://via.placeholder.com/200';
                  
                  // Calculate REAL discount percentage
                  const subProds = products.filter(p => {
                    const cat = (p.category || '').toLowerCase();
                    const subcat = (p.subcategory || '').toLowerCase();
                    const pName = (p.name || '').toLowerCase();
                    const target = (sub.id || '').toLowerCase();
                    const targetName = subTitle.toLowerCase();
                    return cat.includes(target) || subcat.includes(target) || (targetName && pName.includes(targetName));
                  });

                  let maxDiscount = 0;
                  subProds.forEach(p => {
                    if (p.originalPrice && p.originalPrice > p.price) {
                      const disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                      if (disc > maxDiscount) maxDiscount = disc;
                    }
                  });

                  return (
                    <TouchableOpacity
                      key={sub.id || `sub_card_${subIdx}`}
                      activeOpacity={0.9}
                      onPress={() => handleSDUILink(sub.link || (sub.id ? `category/${sub.id}` : `category/${activeTab.toLowerCase()}`), navigation, subTitle)}
                      style={{
                        width: '31%',
                        height: 120,
                        borderRadius: 18,
                        backgroundColor: '#FFFFFF',
                        overflow: 'hidden',
                        marginBottom: 12,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 6,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {/* Product Image */}
                      <View style={{ width: '100%', height: 75, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                        <Image
                          source={{ uri: subImage }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>

                      {/* Label & Tag */}
                      <View style={{ width: '100%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#1E293B', textAlign: 'center' }} numberOfLines={1}>
                          {subTitle}
                        </Text>
                        {maxDiscount > 0 ? (
                          <Text style={{ fontSize: 8.5, fontFamily: 'Poppins_800ExtraBold', color: '#DC2626' }}>
                            UP TO {maxDiscount}% OFF
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Dynamic Hero Banner / Slides */}
          {tabLayout?.heroSlides && Array.isArray(tabLayout.heroSlides) && tabLayout.heroSlides.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <HeaderBannerCarousel slides={tabLayout.heroSlides} fallbackBg={theme.gradient[0]} />
            </View>
          ) : dynamicHeroBanner ? (
            <View style={{ marginBottom: 16 }}>
              <HeaderBannerCarousel slides={[dynamicHeroBanner]} fallbackBg={theme.gradient[0]} />
            </View>
          ) : dynamicHeroBanners && dynamicHeroBanners.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <HeaderBannerCarousel slides={dynamicHeroBanners} fallbackBg={theme.gradient[0]} />
            </View>
          ) : tabSpecificBanners.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <BannerCarousel banners={tabSpecificBanners} />
            </View>
          ) : null}

        {/* Dynamic Category Stories for this Tab */}
        {tabLayout?.categoryStories && Array.isArray(tabLayout.categoryStories) && tabLayout.categoryStories.length > 0 && (
          <CategoryStories stories={tabLayout.categoryStories} />
        )}

        {/* Dynamic SDUI Blocks for this Tab */}
        {tabLayout?.blocks && Array.isArray(tabLayout.blocks) && tabLayout.blocks.length > 0 && (
          <UniversalSDUIRenderer blocks={tabLayout.blocks} cardShapeSettings={tabLayout.cardShapeSettings} />
        )}

        {/* ── 3. OFFERS CURATED FOR YOU SECTION ── */}
        {currentTabProducts.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#0F172A', marginRight: 8 }}>
                  {curatedHeaderTitle}
                </Text>
                <View style={{ backgroundColor: theme.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>DEALS</Text>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {currentTabProducts.slice(0, 6).map(p => (
                <View key={`curated_${p.id}`} style={{ width: 160 }}>
                  <ProductCard product={{ ...p, distance: '0.5 km' }} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── 4. TAB-ANCHORED LIVE PRODUCTS CATALOG ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderLeftWidth: 4,
            borderLeftColor: theme.accent,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 3,
            elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18 }}>{theme.icon}</Text>
              <View>
                <Text style={{ fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#0F172A' }}>
                  {theme.label} Products ({currentTabProducts.length})
                </Text>
                <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#64748B' }}>
                  Showing all verified local stores in {theme.label}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: theme.bgLight || '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: theme.accent }}>
                ⚡ Fast Delivery
              </Text>
            </View>
          </View>

          {currentTabProducts.length === 0 ? (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
              marginVertical: 12,
            }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>{emptyIcon}</Text>
              <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1E293B', textAlign: 'center', marginBottom: 6 }}>
                {emptyTitle}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#64748B', textAlign: 'center', marginBottom: 18, lineHeight: 18 }}>
                {emptySub}
              </Text>
              <TouchableOpacity
                onPress={() => handleTabChange('ALL')}
                style={{
                  backgroundColor: theme.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 25,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>
                  Browse All Products →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                {currentTabProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
              </View>
              <View style={{ width: '48%' }}>
                {currentTabProducts.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

    const categoryProductsFooter = (
      <View style={{ paddingHorizontal: 16, marginTop: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#0F172A', marginBottom: 12 }}>
          All {theme.label} Collection ({currentTabProducts.length})
        </Text>

        {currentTabProducts.length === 0 ? (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            marginVertical: 12,
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>{emptyIcon}</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1E293B', textAlign: 'center', marginBottom: 6 }}>
              {emptyTitle}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#64748B', textAlign: 'center', marginBottom: 18, lineHeight: 18 }}>
              {emptySub}
            </Text>
            <TouchableOpacity
              onPress={() => handleTabChange('ALL')}
              style={{
                backgroundColor: theme.accent,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 25,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>
                Browse All Products →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              {currentTabProducts.filter((_, i) => i % 2 === 0).map(p => <ProductCard key={p.id} product={p} />)}
            </View>
            <View style={{ width: '48%' }}>
              {currentTabProducts.filter((_, i) => i % 2 !== 0).map(p => <ProductCard key={p.id} product={p} />)}
            </View>
          </View>
        )}
      </View>
    );

    return (
      <DynamicPageBuilder
        pageId={`home_${activeTab.toLowerCase()}`}
        fallback={legacyTabContent}
        footer={categoryProductsFooter}
      />
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

  const currentTopSlide = headerTopSlides[activeTopIndex] || headerTopSlides[0] || tabLayout?.heroBanner || (tabLayout?.heroSlides && tabLayout.heroSlides[0]) || heroAd;
  const rawTopMedia = (
    currentTopSlide?.videoUrl || 
    currentTopSlide?.video || 
    currentTopSlide?.mediaUrl || 
    currentTopSlide?.bgUrl || 
    currentTopSlide?.url || 
    currentTopSlide?.imageUrl || 
    currentTopSlide?.image || 
    currentTopSlide?.src || 
    (currentTopSlide?.mediaType === 'video' ? (currentTopSlide?.src || currentTopSlide?.imageUrl) : null) || 
    heroAd?.bgUrl || 
    tabLayout?.heroBanner?.videoUrl ||
    tabLayout?.heroBanner?.imageUrl ||
    'https://www.shutterstock.com/shutterstock/videos/4140539077/preview/stock-footage-black-friday-special-offer-animated-label-sale-video.webm'
  ).trim();

  const activeHeaderMedia = rawTopMedia.replace('media.giphy.com/media/', 'i.giphy.com/');
  const activeHeaderYtId = getYoutubeIdFromUrl(activeHeaderMedia);
  const activeHeaderIsVideo = Boolean(
    activeHeaderYtId ||
    currentTopSlide?.mediaType === 'video' ||
    currentTopSlide?.type === 'video' ||
    currentTopSlide?.bgType === 'video' ||
    Boolean(currentTopSlide?.videoUrl) ||
    Boolean(currentTopSlide?.video) ||
    Boolean(tabLayout?.heroBanner?.videoUrl) ||
    /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(activeHeaderMedia) ||
    activeHeaderMedia.includes('shutterstock.com/video') ||
    activeHeaderMedia.includes('shutterstock.com/shutterstock/videos') ||
    activeHeaderMedia.includes('picdn.net/shutterstock/videos') ||
    activeHeaderMedia.includes('pexels.com/video') ||
    activeHeaderMedia.includes('pixabay.com/videos')
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', minHeight: '100%' }}>
      {/* ── 1. STATIC PINNED HEADER (Location, Search Bar & Quick Pills) ── */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          elevation: 1000,
        }}
      >
        {/* Solid dark backdrop that smoothly fades in as user scrolls down */}
        <Reanimated.View 
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#0F172A' },
            headerCollapsedBackdropStyle
          ]} 
        />

        <View style={{ paddingTop: TOP_INSET, paddingHorizontal: 12, paddingBottom: 6 }}>
          {/* Location & Rewards Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Addresses')}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}
            >
              <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', padding: 6, borderRadius: 12, marginRight: 8 }}>
                <HugeIcon icon={Home02Icon} size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text 
                    style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13 }}
                    numberOfLines={1}
                  >
                    {profile?.location ? `Home • ${profile.location}` : (profile?.city ? `Home • ${profile.city}` : 'Home • Thane')}
                  </Text>
                  <HugeIcon icon={ChevronDownIcon} size={14} color="#FFFFFF" />
                </View>
                <Text style={{ color: '#FDE047', fontFamily: 'Poppins_600SemiBold', fontSize: 10 }}>
                  ⚡ Delivery in 20–30 mins
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ color: '#FFD700', marginRight: 4, fontSize: 12 }}>⚡</Text>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>0 Coins</Text>
            </View>
          </View>

          {/* Unified Search & Hot Deals Action */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Search')}
              style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 46, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
            >
              <HugeIcon icon={Search02Icon} size={18} color="#A1A1AA" />
              <View pointerEvents="none" style={{ flex: 1, marginLeft: 10, height: '100%', justifyContent: 'center' }}>
                <TextInput
                  style={{ fontSize: 13.5, fontFamily: 'Poppins_400Regular', color: '#1C1C1C' }}
                  placeholder={heroAd?.searchPlaceholder || 'Search "milk", "kurta", "butter"...'}
                  placeholderTextColor="#94A3B8"
                  editable={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => setIsCameraModalOpen(true)}
                style={{ borderLeftWidth: 1, borderLeftColor: '#E4E4E7', paddingLeft: 10 }}
              >
                 <HugeIcon icon={Camera02Icon} size={20} color="#008B45" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* ⚡ Hot Deals & Offers Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CategoryProducts', { categoryId: 'all', categoryName: '🔥 Today Hot Deals' })}
              style={{
                backgroundColor: '#FFD700',
                borderRadius: 12,
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <HugeIcon icon={FlashIcon} size={20} color="#000000" fill="#000000" />
              <View style={{ position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 8, fontFamily: 'Poppins_700Bold' }}>HOT</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Action Discovery Pills */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CategoryProducts', { categoryId: 'all', categoryName: '🏷️ Best Offers' })}
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontFamily: 'Poppins_700Bold' }}>🏷️ Offers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CategoryProducts', { categoryId: 'grocery', categoryName: '⚡ 15-Min Delivery' })}
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontFamily: 'Poppins_700Bold' }}>⚡ 15-Min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MainTabs', { screen: 'LocalShops' })}
              style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10.5, fontFamily: 'Poppins_700Bold' }}>🏪 Local Shops</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Reanimated.ScrollView 
          ref={mainScrollRef}
          className="flex-1" 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingTop: 0 }}
          onScroll={scrollHandlerY}
          scrollEventThrottle={16}
        >
          {/* ── 2. HERO BANNER & VIDEO MEDIA SECTION (Scrolls naturally on GPU, Zero relayout) ── */}
          <View style={{
            width: SCREEN_WIDTH,
            height: TOTAL_HEADER_HEIGHT,
            backgroundColor: '#1D58EE',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 4,
          }}>
            {/* Solid vibrant background so the curved shape NEVER flashes white during buffering */}
            <Reanimated.View style={[StyleSheet.absoluteFill, headerBackgroundStyle]} />

            {/* 🎬 100% FULL-CONTAINER SHAPE ANIMATED VIDEO OR MEDIA BACKGROUND */}
            {activeHeaderMedia ? (
              <View style={StyleSheet.absoluteFill}>
                <BannerUniversalMedia
                  source={activeHeaderMedia}
                  isVideo={activeHeaderIsVideo}
                  style={StyleSheet.absoluteFill}
                />
                {/* Subtle scrim for crystal-clear readability of location & search bar */}
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.25)']}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ) : heroAd?.bgType === 'lottie' && heroAd?.bgUrl ? (
              <SafeLottieView
                source={{ uri: heroAd.bgUrl }}
                autoPlay
                loop
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
              />
            ) : heroAd?.bgType === 'animated_gradient' && (heroAd?.gradientColors || heroAd?.bgColors) ? (
              <AnimatedGradientBackground colors={heroAd.gradientColors || heroAd.bgColors} />
            ) : null}

            {/* Spacer equal to COLLAPSED_HEADER_HEIGHT so carousel content starts below the pinned search controls */}
            <View style={{ height: COLLAPSED_HEADER_HEIGHT }} />

            {/* ── PROMOTIONAL BANNER CAROUSEL ── */}
            <Reanimated.View style={[{ height: BANNER_HEIGHT }, headerPromoStyle]}>
              <Reanimated.FlatList
                ref={flatListRef}
                data={headerTopSlides}
                keyExtractor={(item, index) => item.id || `top_slide_${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={scrollHandlerX}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScrollEnd}
                getItemLayout={(data, index) => (
                  { length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }
                )}
                renderItem={({ item }) => {
                  const handleBannerPress = () => {
                    if (item.categoryId) {
                      navigation.navigate('CategoryProducts', { categoryId: item.categoryId, categoryName: item.title || 'Category' });
                    } else if (item.productId) {
                      navigation.navigate('ProductDetail', { productId: item.productId });
                    } else if (item.link || item.buttonLink || item.actionUrl) {
                      handleSDUILink(item.link || item.buttonLink || item.actionUrl, navigation, item.title);
                    }
                  };

                  const rawMedia = (
                    item.videoUrl || 
                    item.video || 
                    item.mediaUrl || 
                    item.url || 
                    item.bgUrl || 
                    item.imageUrl || 
                    item.image || 
                    item.mascotGifUrl || 
                    item.gifUrl || 
                    item.previewUrl || 
                    item.src || 
                    ''
                  ).trim();

                  const mediaSource = rawMedia.replace('media.giphy.com/media/', 'i.giphy.com/');
                  const isVideo = Boolean(
                    getYoutubeIdFromUrl(mediaSource) ||
                    item.mediaType === 'video' || 
                    item.type === 'video' || 
                    item.bgType === 'video' ||
                    Boolean(item.videoUrl) ||
                    Boolean(item.video) ||
                    /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(mediaSource) ||
                    mediaSource.includes('shutterstock.com/video') ||
                    mediaSource.includes('shutterstock.com/shutterstock/videos') ||
                    mediaSource.includes('picdn.net/shutterstock/videos') ||
                    mediaSource.includes('pexels.com/video') ||
                    mediaSource.includes('pixabay.com/videos')
                  );

                  const isCleanAnimation = 
                    item.displayLayout === 'clean_animation' || 
                    item.hideOverlayContent === true ||
                    item.showTextOverlay === false;

                  return (
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={handleBannerPress}
                      style={{
                        width: SCREEN_WIDTH,
                        height: BANNER_HEIGHT,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        justifyContent: 'space-between',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {!isCleanAnimation && (item.title && item.title !== 'Banner') ? (
                        <View style={{ flex: 1, paddingRight: 12, justifyContent: 'center' }}>
                          {(item.badge || item.tag) ? (
                            <View style={{
                              backgroundColor: '#FFD700',
                              paddingHorizontal: 8,
                              paddingVertical: 2.5,
                              borderRadius: 6,
                              alignSelf: 'flex-start',
                              marginBottom: 4,
                            }}>
                              <Text style={{ color: '#0F172A', fontSize: 9.5, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                {item.badge || item.tag}
                              </Text>
                            </View>
                          ) : null}
                          <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_800ExtraBold', marginBottom: 2, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={2}>
                            {item.title}
                          </Text>
                          {(item.desc || item.subtitle) ? (
                            <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 11, fontFamily: 'Poppins_500Medium', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={1}>
                              {item.desc || item.subtitle}
                            </Text>
                          ) : null}
                          <View
                            style={{
                              backgroundColor: '#FFD700',
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                              borderRadius: 20,
                              alignSelf: 'flex-start',
                              shadowColor: '#000',
                              shadowOpacity: 0.3,
                              shadowRadius: 3,
                              elevation: 2,
                            }}
                          >
                            <Text style={{ color: '#0F172A', fontFamily: 'Poppins_800ExtraBold', fontSize: 10.5 }}>
                              {item.ctaText || item.buttonText || 'Shop Now →'}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {item.displayLayout === 'split' && (
                        <View style={{
                          width: 80, height: 80,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderRadius: 16,
                          overflow: 'hidden',
                          backgroundColor: 'rgba(255,255,255,0.15)'
                        }}>
                          <Text style={{ fontSize: 44 }}>{item.icon || '🎉'}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </Reanimated.View>

            {/* Carousel Pagination Dots */}
            {headerTopSlides.length > 1 && (
              <Reanimated.View style={[{
                position: 'absolute',
                bottom: 12,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 5,
                zIndex: 20,
              }, headerPromoStyle]}>
                {headerTopSlides.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: activeTopIndex === i ? 18 : 6,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: activeTopIndex === i ? '#FFD700' : 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
              </Reanimated.View>
            )}
          </View>

          {/* ── 3. CATEGORY ICONS ── */}
          <View className="bg-white" style={{ paddingTop: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginTop: 4, paddingBottom: 8 }}>
              {displayCategories.map((cat, idx) => (
                <AnimatedCategoryIcon 
                  key={cat.id || `cat_${idx}`} 
                  cat={cat} 
                  idx={idx} 
                  onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat.id, categoryName: (cat.label || '').replace(/[\n\r]/g, ' ') })} 
                />
              ))}
            </ScrollView>
          </View>
          <View collapsable={false} renderToHardwareTextureAndroid={true} style={{ backgroundColor: '#0F172A' }}>
            <HomeTabBar activeTab={activeTab} onTabChange={handleTabChange} accentColor={TAB_THEMES[activeTab]?.accent} />
          </View>
          <Reanimated.View style={[{ flex: 1 }, animatedTabStyle]}>
            {renderActiveTabContent()}
          </Reanimated.View>
        </Reanimated.ScrollView>
      </View>

      {/* ── 4. STICKY CATEGORY TAB BAR (Stays pinned under header on scroll, rendered on top of DOM) ── */}
      <Reanimated.View style={stickyTabBarAnimStyle}>
        <HomeTabBar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          accentColor={TAB_THEMES[activeTab]?.accent} 
          isSticky={true}
        />
      </Reanimated.View>

      {/* ── CAMERA / PHOTO VISUAL SEARCH MODAL ── */}
      <Modal
        visible={isCameraModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCameraModalOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setIsCameraModalOpen(false)}
        >
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            
            <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#0F172A', textAlign: 'center' }}>
              📷 Visual Product Search
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 20 }}>
              Search for clothes, groceries, or gadgets by clicking a photo
            </Text>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E8F5E9',
                  padding: 16,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#C8E6C9',
                  gap: 14,
                }}
                onPress={handleLaunchCamera}
              >
                <Text style={{ fontSize: 24 }}>📸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#008B45' }}>Take a Photo</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#475569' }}>Snap any item, dress, or grocery label</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  padding: 16,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 14,
                }}
                onPress={handleLaunchGallery}
              >
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#0F172A' }}>Choose from Gallery</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#64748B' }}>Upload saved screenshot or product photo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Visual Search Processing Overlay */}
      {isProcessingVisualSearch && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
        }}>
          <ActivityIndicator size="large" color="#008B45" />
          <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 16, marginTop: 16 }}>
            🔍 Scanning & Matching Products...
          </Text>
          <Text style={{ color: '#94A3B8', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 }}>
            Finding best matching items in BazarPeth
          </Text>
        </View>
      )}
    </View>
  );
}
