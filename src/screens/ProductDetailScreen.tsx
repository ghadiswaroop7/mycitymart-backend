import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Animated,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, FlashIcon, StarIcon, MinusSignIcon, Add01Icon, FavouriteIcon, Share01Icon, PlayCircleIcon, ChevronDownIcon, ChevronUpIcon, Message02Icon, Cancel01Icon, TruckIcon, GlobeIcon, Tick01Icon } from '@hugeicons/core-free-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { getProductById, getProductReviews, addReview, getRelatedProducts, getAvailableCoupons, toggleWishlistItem } from '../services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MiniProductCard from '../components/MiniProductCard';
import SafeImage from '../components/SafeImage';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Video, ResizeMode } from 'expo-av';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Extract YouTube video ID:
const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^?\n]+)/,
    /youtu\.be\/([^?\n]+)/,
    /youtube\.com\/v\/([^?\n]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Extract domain from URL
const getDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (e) {
    return url;
  }
};

// Build media items (parse firestore mediaItems or fallback)
const buildMediaItems = (product: any) => {
  const items: any[] = [];
  
  if (product.mediaItems && Array.isArray(product.mediaItems)) {
    product.mediaItems.forEach((item: any) => {
      items.push({ type: item.type, url: item.url });
    });
  } else {
    // Fallback to legacy fields
    const videoId = getYoutubeId(product.videoUrl || '');
    if (videoId) {
      items.push({
        type: 'youtube',
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      });
    }
    const images = product.images || (product.imageUrl ? [product.imageUrl] : []) || [];
    images.forEach((img: string) => {
      if(img && typeof img === 'string') items.push({ type: 'image', url: img });
    });
  }

  // Normalize youtube vs direct video
  return items.map(item => {
    if (item.type === 'video') {
      const yId = getYoutubeId(item.url);
      if (yId) {
        return { ...item, type: 'youtube', videoId: yId, thumbnail: `https://img.youtube.com/vi/${yId}/hqdefault.jpg` };
      }
    }
    return item;
  });
};

const ProductGallery = ({ product, activeImageIndex, onIndexChange }: any) => {
  const mediaItems = buildMediaItems(product);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const carouselRef = useRef<any>(null);
  const videoRef = useRef<Video>(null);
  
  const imageUrls = mediaItems
    .filter((item: any) => item.type === 'image')
    .map((item: any) => ({ url: item.url }));
    
  const zoomIndex = imageUrls.findIndex((img: any) => img.url === (mediaItems[activeImageIndex] as any)?.url);
  const initialZoomIndex = zoomIndex >= 0 ? zoomIndex : 0;

  useEffect(() => {
    // Pause expo-av video if swipe away
    if (mediaItems[activeImageIndex]?.type !== 'video' && videoRef.current) {
      videoRef.current.pauseAsync();
    }
  }, [activeImageIndex, mediaItems]);
  
  return (
    <View style={{ backgroundColor: '#fff', position: 'relative' }}>
      {/* Main Display Area */}
      <View style={{ height: SCREEN_WIDTH * 1.1, backgroundColor: '#FFFFFF' }}>
        <Carousel
          ref={carouselRef}
          loop={false}
          width={SCREEN_WIDTH}
          height={SCREEN_WIDTH * 1.1}
          autoPlay={false}
          data={mediaItems}
          scrollAnimationDuration={250}
          onSnapToItem={(index) => {
            onIndexChange(index);
            setVideoPlaying(false);
          }}
          renderItem={({ item, index }: any) => {
            if (item.type === 'youtube') {
              return (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                  {videoPlaying && activeImageIndex === index ? (
                    <WebView
                      source={{ uri: item.url || `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0` }}
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptEnabled={true}
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, justifyContent: 'center' }}
                      onPress={() => setVideoPlaying(true)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}
                        resizeMode="cover"
                      />
                      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                          <HugeIcon icon={PlayCircleIcon} color="#008B45" size={40} fill="#008B45" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            if (item.type === 'video') {
              return (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: '#000', justifyContent: 'center' }}>
                  <Video
                    ref={videoRef}
                    source={{ uri: item.url }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay={activeImageIndex === index}
                  />
                </View>
              );
            }

            if (item.type === 'link') {
              return (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                    <HugeIcon icon={GlobeIcon} size={48} color="#FA8C16" />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1C', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>External Product Link</Text>
                    <Text style={{ fontSize: 14, color: '#71717A', marginBottom: 24, textAlign: 'center' }}>{getDomain(item.url)}</Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#FA8C16', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => Linking.openURL(item.url)}
                    >
                      <HugeIcon icon={GlobeIcon} size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Open in Browser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // Image type
            return (
              <TouchableOpacity
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={0.95}
                onPress={() => setIsZoomVisible(true)}
              >
                <SafeImage
                  uri={item.url || 'https://via.placeholder.com/400'}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          }}
        />

        {/* Smooth Page Indicator (Dots) */}
        {mediaItems.length > 1 && (
          <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            {mediaItems.map((_, i) => (
              <View 
                key={i} 
                style={{ 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: activeImageIndex === i ? '#FA8C16' : '#E5E7EB',
                  width: activeImageIndex === i ? 20 : 6
                }} 
              />
            ))}
          </View>
        )}
      </View>
      
      {/* Thumbnail Strip (below carousel) */}
      {mediaItems.length > 1 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' }}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
        >
          {mediaItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                onIndexChange(index);
                setVideoPlaying(false);
                carouselRef.current?.scrollTo({ index, animated: true });
              }}
              style={[
                { width: 60, height: 60, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8F9FA' },
                activeImageIndex === index && { borderColor: '#FA8C16' }
              ]}
              activeOpacity={0.8}
            >
              {item.type === 'youtube' || item.type === 'video' ? (
                <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <SafeImage uri={item.thumbnail || 'https://via.placeholder.com/60'} style={{ width: '100%', height: '100%' }} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
                    <HugeIcon icon={PlayCircleIcon} color="white" size={20} />
                  </View>
                </View>
              ) : item.type === 'link' ? (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7E6' }}>
                  <HugeIcon icon={GlobeIcon} color="#FA8C16" size={24} />
                </View>
              ) : (
                <SafeImage uri={item.url} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Full Screen Zoom Modal */}
      <Modal visible={isZoomVisible} transparent={true} onRequestClose={() => setIsZoomVisible(false)} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000000', position: 'relative' }}>
          <ImageViewer
            imageUrls={imageUrls}
            index={initialZoomIndex}
            onCancel={() => setIsZoomVisible(false)}
            enableSwipeDown={true}
            saveToLocalByLongPress={false}
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 30,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999
            }}
            onPress={() => setIsZoomVisible(false)}
          >
            <HugeIcon icon={Cancel01Icon} color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Skeleton Component
const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]} />;
};

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;

  const productId = route.params?.productId;

  // Global State
  const cartItem = useSelector((state: RootState) => state.cart.items.find(i => i.id === productId));
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = useSelector((state: RootState) => state.wishlist.items.includes(productId));
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  // Local State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Features State
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Fetch Data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const [productData, reviewsData] = await Promise.allSettled([
          getProductById(productId),
          getProductReviews(productId),
        ]);
        
        if (productData.status === 'fulfilled' && productData.value) {
          setProduct(productData.value);
          const related = await getRelatedProducts(productData.value.category || '', productId);
          setRelatedProducts(related);
          
          await saveToRecentlyViewed(productData.value);
          await loadRecentlyViewed();
        } else {
          setError(true);
        }
        
        if (reviewsData.status === 'fulfilled') {
          setReviews(reviewsData.value);
        }
      } catch (e) {
        console.error('Product load error:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const saveToRecentlyViewed = async (prod: any) => {
    try {
      const stored = await AsyncStorage.getItem('mcm_recently_viewed');
      let viewed = stored ? JSON.parse(stored) : [];
      viewed = viewed.filter((p: any) => p.id !== prod.id); // Remove if exists
      viewed.unshift({ id: prod.id, name: prod.name, price: prod.price, imageUrl: prod.images?.[0] || prod.imageUrl, vendor: prod.vendor });
      if (viewed.length > 10) viewed.pop();
      await AsyncStorage.setItem('mcm_recently_viewed', JSON.stringify(viewed));
    } catch (e) {}
  };

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem('mcm_recently_viewed');
      if (stored) {
        const viewed = JSON.parse(stored);
        setRecentlyViewed(viewed.filter((p: any) => p.id !== productId));
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <SkeletonBox width="100%" height={SCREEN_WIDTH * 1.1} borderRadius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonBox width="60%" height={28} style={{ marginBottom: 16 }} />
          <SkeletonBox width="30%" height={20} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            <SkeletonBox width={60} height={60} borderRadius={30} />
            <SkeletonBox width={60} height={60} borderRadius={30} />
          </View>
          <SkeletonBox width="100%" height={100} style={{ marginBottom: 16 }} />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1C1C1C', marginBottom: 16, textAlign: 'center' }}>Product Not Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#FA8C16', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}>
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productPrice = product?.price ?? 0;
  const productOriginalPrice = product?.originalPrice ?? product?.mrp ?? productPrice;
  const productName = product?.name ?? 'Product';
  const productRating = product?.rating ?? 4.0;
  const productReviewCount = product?.reviewCount ?? reviews.length;
  
  const discount = productOriginalPrice > productPrice
    ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
    : 0;

  // Header Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [SCREEN_WIDTH * 0.8, SCREEN_WIDTH * 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── FLOATING BUTTONS ── */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
        >
          <HugeIcon icon={ArrowLeft01Icon} size={24} color="#1C1C1C" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
          >
            <HugeIcon icon={Share01Icon} size={20} color="#1C1C1C" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              dispatch(toggleWishlist(productId));
              if (product) toggleWishlistItem(uid, product);
            }} 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
          >
            <HugeIcon icon={FavouriteIcon} size={20} color={isWishlisted ? "#FA8C16" : "#1C1C1C"} fill={isWishlisted ? "#FA8C16" : "transparent"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── SLIVER APP BAR EQUIVALENT ── */}
      <Animated.View style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 15, 
        backgroundColor: '#FFFFFF', 
        paddingTop: insets.top, paddingBottom: 12, paddingHorizontal: 16,
        opacity: headerOpacity,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 32 }}>
          <HugeIcon icon={ArrowLeft01Icon} size={24} color="#1C1C1C" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1C1C1C' }} numberOfLines={1}>{productName}</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        
        {/* 1. MEDIA CAROUSEL & THUMBNAILS */}
        <ProductGallery 
          product={product} 
          activeImageIndex={activeImageIndex}
          onIndexChange={setActiveImageIndex}
        />

        {/* 2. PRODUCT INFO (Professional UI) */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, color: '#1C1C1C', fontWeight: '500', lineHeight: 22, marginBottom: 8 }}>{productName}</Text>
          
          {/* Price Block */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1C1C1C' }}>₹{productPrice}</Text>
            {discount > 0 && (
              <>
                <Text style={{ fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through', fontWeight: '500', marginTop: 6 }}>MRP ₹{productOriginalPrice}</Text>
                <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 6 }}>
                  <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '800' }}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>
          
          {/* Badges Row */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {/* Free Delivery */}
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#16A34A', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4, alignSelf: 'flex-start', backgroundColor: '#F0FFF4' }}>
              <HugeIcon icon={TruckIcon} size={12} color="#16A34A" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#16A34A' }}>Free Delivery</Text>
            </View>
            
            {/* Rating */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[1,2,3,4,5].map(s => <HugeIcon icon={StarIcon} key={s} size={14} color={s <= Math.round(productRating) ? "#F59E0B" : "#E5E7EB"} fill={s <= Math.round(productRating) ? "#F59E0B" : "#E5E7EB"} />)}
              <Text style={{ fontSize: 12, color: '#71717A', marginLeft: 4, fontWeight: '500' }}>({productReviewCount})</Text>
            </View>
          </View>
        </View>

        {/* 3. SELLER SECTION */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF7E6', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FA8C16' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#FA8C16' }}>
                {(product.brand || product.vendor || 'L').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1C1C1C', marginBottom: 2 }}>{product.brand || product.vendor || 'Local Shop'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <HugeIcon icon={Tick01Icon} size={12} color="#16A34A" fill="#DCFCE7" />
                <Text style={{ fontSize: 12, color: '#71717A', marginLeft: 4, fontWeight: '500' }}>Trusted Seller</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={{ borderWidth: 1, borderColor: '#FA8C16', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
            <Text style={{ color: '#FA8C16', fontWeight: '700', fontSize: 12 }}>View Shop</Text>
          </TouchableOpacity>
        </View>

        {/* 4. DESCRIPTION */}
        <View style={{ backgroundColor: '#FFFFFF', padding: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1C1C', marginBottom: 12 }}>Product Details</Text>
          
          <Text style={{ color: '#4B5563', lineHeight: 22 }} numberOfLines={isDescExpanded ? undefined : 3}>
            {product.description || 'Premium quality product brought to you by Jhat-Pat. Enjoy 20-minute local delivery and unparalleled service.'}
          </Text>
          <TouchableOpacity onPress={() => setIsDescExpanded(!isDescExpanded)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#FA8C16', fontWeight: '700', marginRight: 4 }}>{isDescExpanded ? 'Read less' : 'Read more'}</Text>
            {isDescExpanded ? <HugeIcon icon={ChevronUpIcon} size={14} color="#FA8C16" /> : <HugeIcon icon={ChevronDownIcon} size={14} color="#FA8C16" />}
          </TouchableOpacity>
        </View>

        {/* 5. RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <View style={{ backgroundColor: '#FFFFFF', paddingTop: 16, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1C1C', paddingHorizontal: 16, marginBottom: 12 }}>Similar Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {relatedProducts.map(p => <MiniProductCard key={p.id} product={p} />)}
            </ScrollView>
          </View>
        )}

      </Animated.ScrollView>

      {/* ── BOTTOM ACTION BAR (50/50 Split) ── */}
      <View style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        backgroundColor: '#FFFFFF', 
        borderTopWidth: 1, borderTopColor: '#F0F0F0',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12),
        flexDirection: 'row', gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10
      }}>
        {/* Add to Cart (Outlined) */}
        {quantity === 0 ? (
          <TouchableOpacity
            style={{ flex: 1, height: 48, borderRadius: 8, borderWidth: 1.5, borderColor: '#1C1C1C', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => dispatch(addToCart({ id: product.id, name: product.name, price: productPrice, originalPrice: productOriginalPrice, quantity: 1, imageUrl: product.images?.[0] || product.imageUrl, vendor: product.vendor }))}
          >
            <Text style={{ color: '#1C1C1C', fontSize: 15, fontWeight: '800' }}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, height: 48, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <TouchableOpacity onPress={() => dispatch(removeFromCart(product.id))} style={{ width: 40, height: 40, backgroundColor: '#F8F9FA', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
              <HugeIcon icon={MinusSignIcon} size={20} color="#1C1C1C" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1C1C' }}>{quantity}</Text>
            <TouchableOpacity onPress={() => dispatch(addToCart({ id: product.id, name: product.name, price: productPrice, originalPrice: productOriginalPrice, quantity: 1, imageUrl: product.images?.[0] || product.imageUrl, vendor: product.vendor }))} style={{ width: 40, height: 40, backgroundColor: '#F8F9FA', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
              <HugeIcon icon={Add01Icon} size={20} color="#1C1C1C" />
            </TouchableOpacity>
          </View>
        )}

        {/* Buy Now (Filled Dark Green) */}
        <TouchableOpacity 
          style={{ flex: 1, height: 48, borderRadius: 8, backgroundColor: '#008B45', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => {
            if (quantity === 0) {
              dispatch(addToCart({ 
                id: product.id, 
                name: product.name, 
                price: productPrice, 
                originalPrice: productOriginalPrice, 
                quantity: 1, 
                imageUrl: product.images?.[0] || product.imageUrl, 
                vendor: product.vendor 
              }));
            }
            navigation.navigate('Checkout');
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Buy Now</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
