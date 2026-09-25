import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  StatusBar,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import {
  ArrowLeft01Icon,
  FlashIcon,
  StarIcon,
  MinusSignIcon,
  Add01Icon,
  FavouriteIcon,
  Share01Icon,
  PlayCircleIcon,
  Cancel01Icon,
  TruckIcon,
  Tick01Icon,
  Location01Icon,
  Shield01Icon,
  StoreIcon,
  ShoppingCart01Icon,
  ArrowRightIcon,
  TagIcon,
  SecurityCheckIcon,
  CallIcon,
  Clock01Icon,
  HelpCircleIcon,
  ViewIcon,
  FireIcon,
  CheckmarkBadge01Icon,
} from '@hugeicons/core-free-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import {
  getProductById,
  getProductReviews,
  addReview,
  getRelatedProducts,
  toggleWishlistItem,
} from '../services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeImage from '../components/SafeImage';
import { getProductImage } from '../utils/productImages';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import YoutubeVideoPlayer from './YoutubeVideoPlayer';
import BazarLoadingAnimation from '../components/BazarLoadingAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Extract YouTube video ID
const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^?\n]+)/,
    /youtu\.be\/([^?\n]+)/,
    /youtube\.com\/v\/([^?\n]+)/,
    /youtube\.com\/shorts\/([^?\n#&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
};

// Build media items (Images always come FIRST so users can swipe smoothly; video follows)
const buildMediaItems = (product: any) => {
  const items: any[] = [];
  
  // 1. Add all product images first (primary photo at index 0)
  const images: string[] = product.images || (product.imageUrl ? [product.imageUrl] : []);
  images.forEach((img: string) => {
    if (img && typeof img === 'string') items.push({ type: 'image', url: img });
  });

  // 2. Add video after images (or if mediaItems is explicitly specified)
  if (product.mediaItems && Array.isArray(product.mediaItems)) {
    product.mediaItems.forEach((item: any) => {
      if (item.type !== 'image') {
        items.push({ type: item.type, url: item.url, thumbnail: item.thumbnail });
      }
    });
  } else {
    const rawVideo: string = (product.videoUrl || '').trim();
    if (rawVideo) {
      const ytId = getYoutubeId(rawVideo);
      if (ytId) {
        items.push({
          type: 'youtube',
          videoId: ytId,
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`,
        });
      } else {
        items.push({ type: 'video', url: rawVideo });
      }
    }
  }

  if (items.length === 0) {
    const resolved = getProductImage(product);
    if (resolved) {
      items.push({ type: 'image', url: resolved });
    }
  }
  return items;
};

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  const carouselRef = useRef<any>(null);

  const productId = route.params?.productId;

  // Global State
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((i) => i.id === productId)
  );
  const quantity = cartItem ? cartItem.quantity : 0;
  const cartTotalCount = useSelector((state: RootState) => state.cart.count);
  const isWishlisted = useSelector((state: RootState) =>
    state.wishlist.items.includes(productId)
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid;

  // Local State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Variant & Option Selection
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Standard');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Pincode & Delivery State
  const [pincode, setPincode] = useState('422605');
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [newPincodeInput, setNewPincodeInput] = useState('');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Media Zoom State
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // Reviews & Recommendations
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Review Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
      viewed = viewed.filter((p: any) => p.id !== prod.id);
      viewed.unshift({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        imageUrl: prod.images?.[0] || prod.imageUrl,
        vendor: prod.vendor,
      });
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

  // Indian WhatsApp Sharing
  const handleWhatsAppShare = async () => {
    try {
      const pName = product?.name || 'Product';
      const pPrice = product?.price || 0;
      const shareMsg = `🛍️ *Look at this deal on BazarPeth!*\n\n*${pName}*\n🔥 Special Price: ₹${pPrice} (${discount}% OFF)\n⚡ Instant Local Delivery in Sangamner\n\n👉 Check out on BazarPeth.com`;
      const url = `whatsapp://send?text=${encodeURIComponent(shareMsg)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: shareMsg, title: pName });
      }
    } catch (e) {
      Share.share({ message: `${product?.name} - ₹${product?.price} on BazarPeth` });
    }
  };

  // Direct WhatsApp Order / Chat with Shopkeeper
  const handleChatWithSeller = () => {
    const vendorName = product?.vendor || 'BazarPeth Seller';
    const message = `Hello ${vendorName}, I am interested in buying *${product?.name}* (Price: ₹${product?.price}) on BazarPeth. Can you confirm if size ${selectedSize} is available for instant delivery?`;
    const whatsappUrl = `whatsapp://send?phone=919876543210&text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Seller Contact', `You can chat with ${vendorName} once your order is placed.`);
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: effectivePrice,
        originalPrice: product.originalPrice || product.price,
        quantity: 1,
        imageUrl: product.images?.[0] || product.imageUrl,
        vendor: product.vendor,
        selectedVariants: {
          Size: selectedSize,
          Color: selectedColor,
        },
      })
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigation.navigate('Checkout');
  };

  const handleRateProduct = () => {
    if (!uid) {
      Alert.alert('Login Required', 'Please login to rate this product.');
      return;
    }
    setIsReviewModalVisible(true);
  };

  const pickReviewImages = async () => {
    if (reviewImages.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload up to 3 images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - reviewImages.length,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((a) => a.uri);
      setReviewImages((prev) => [...prev, ...newImages].slice(0, 3));
    }
  };

  const handleSubmitReview = async () => {
    if (reviewText.trim().length < 4) {
      Alert.alert('Review Required', 'Please write a few words about your experience.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const uploadedUrls: string[] = [];
      if (reviewImages.length > 0) {
        const storage = getStorage(app);
        for (let i = 0; i < reviewImages.length; i++) {
          const uri = reviewImages[i];
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = `reviews/${productId}/${uid}_${Date.now()}_${i}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(storageRef);
          uploadedUrls.push(downloadUrl);
        }
      }

      const reviewData = {
        userId: uid,
        userName: user?.displayName || 'Verified Buyer',
        rating: reviewRating,
        comment: reviewText.trim(),
        images: uploadedUrls,
        isVerifiedPurchase: true,
        productId,
      };

      await addReview(productId, reviewData);
      setReviews((prev) => [{ ...reviewData, createdAt: new Date() }, ...prev]);
      setIsReviewModalVisible(false);
      setReviewText('');
      setReviewRating(5);
      setReviewImages([]);
      Alert.alert('Thank You!', 'Your review has been submitted successfully!');
    } catch (e) {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <BazarLoadingAnimation
        message="Loading Product Details... 🛍️"
        submessage="Connecting with local merchant & checking deals..."
      />
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorWrapper}>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Go Back to Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productPrice = Number(product?.price) || 0;
  const productOriginalPrice = Number(product?.originalPrice) || Number(product?.mrp) || productPrice;
  const productName = product?.name || 'Product';
  const productRating = Number(product?.rating) || 4.4;
  const productReviewCount = product?.reviewsCount || reviews.length || 186;
  const productVendor = product?.vendor || product?.shop_name || 'Sangamner Verified Bazaar';

  // Coupon discount calculation
  const couponDiscount = appliedCoupon === 'BAZAR100' ? 100 : appliedCoupon === 'FIRST50' ? 50 : 0;
  const effectivePrice = Math.max(productPrice - couponDiscount, 1);

  const discount =
    productOriginalPrice > productPrice
      ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
      : 0;

  const savingsAmount = productOriginalPrice > effectivePrice ? productOriginalPrice - effectivePrice : 0;

  const mediaItems = buildMediaItems(product);
  const imageUrls = mediaItems
    .filter((m) => m.type === 'image' && m.url)
    .map((m) => ({ url: m.url }));

  const availableSizes = product?.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
  const availableColors = product?.colors || [
    { name: 'Olive Green', code: '#2E5A36' },
    { name: 'Navy Blue', code: '#1E3A8A' },
    { name: 'Midnight Black', code: '#0F172A' },
    { name: 'Maroon', code: '#881337' },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── TOP FLOATING HEADER WITH GLASS EFFECT ── */}
      <View style={[styles.floatingHeader, { top: insets.top + 6 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.floatingHeaderCircleBtn}
          activeOpacity={0.8}
        >
          <HugeIcon icon={ArrowLeft01Icon} size={22} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.floatingHeaderRight}>
          {/* Direct WhatsApp Share Button */}
          <TouchableOpacity
            style={[styles.floatingHeaderCircleBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={handleWhatsAppShare}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>💬</Text>
          </TouchableOpacity>

          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.floatingHeaderCircleBtn}
            onPress={() => {
              dispatch(toggleWishlist(productId));
              if (product && uid) toggleWishlistItem(uid, product);
            }}
            activeOpacity={0.8}
          >
            <HugeIcon
              icon={FavouriteIcon}
              size={20}
              color={isWishlisted ? '#EF4444' : '#1E293B'}
            />
          </TouchableOpacity>

          {/* Cart Icon with Live Count */}
          <TouchableOpacity
            style={styles.floatingHeaderCircleBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
            activeOpacity={0.8}
          >
            <HugeIcon icon={ShoppingCart01Icon} size={20} color="#1E293B" />
            {cartTotalCount > 0 && (
              <View style={styles.cartHeaderBadge}>
                <Text style={styles.cartHeaderBadgeText}>{cartTotalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        bounces={false}
      >
        {/* ── 1. PRODUCT MEDIA CAROUSEL ── */}
        <View style={styles.carouselWrapper}>
          <Carousel
            ref={carouselRef}
            loop={false}
            width={SCREEN_WIDTH}
            height={SCREEN_WIDTH * 1.15}
            data={mediaItems}
            onSnapToItem={(idx) => setActiveImageIndex(idx)}
            renderItem={({ item, index }) => {
              if (item.type === 'youtube' && item.videoId) {
                return (
                  <View style={styles.videoSlideContainer}>
                    <YoutubeVideoPlayer
                      videoId={item.videoId}
                      shouldPlay={activeImageIndex === index}
                      width={SCREEN_WIDTH}
                      height={SCREEN_WIDTH * 1.15}
                    />
                  </View>
                );
              }
              if (item.type === 'video' && item.url) {
                const ytId = getYoutubeId(item.url);
                if (ytId) {
                  return (
                    <View style={styles.videoSlideContainer}>
                      <YoutubeVideoPlayer
                        videoId={ytId}
                        shouldPlay={activeImageIndex === index}
                        width={SCREEN_WIDTH}
                        height={SCREEN_WIDTH * 1.15}
                      />
                    </View>
                  );
                }
              }
              return (
                <TouchableOpacity
                  style={styles.imageSlideContainer}
                  activeOpacity={0.95}
                  onPress={() => setIsZoomVisible(true)}
                >
                  <SafeImage
                    uri={item.url || item.thumbnail}
                    style={styles.carouselImage}
                    resizeMode="contain"
                    fallbackEmoji={product?.emoji}
                    fallbackText={product?.name}
                  />
                </TouchableOpacity>
              );
            }}
          />

          {/* Quick Media Jump Toggle (Photo <-> Video) */}
          {mediaItems.some((m) => m.type === 'youtube' || m.type === 'video') && (
            <TouchableOpacity
              style={styles.floatingMediaToggleBtn}
              activeOpacity={0.85}
              onPress={() => {
                const videoIdx = mediaItems.findIndex(
                  (m) => m.type === 'youtube' || m.type === 'video'
                );
                if (activeImageIndex === videoIdx) {
                  carouselRef.current?.scrollTo({ index: 0, animated: true });
                } else if (videoIdx !== -1) {
                  carouselRef.current?.scrollTo({ index: videoIdx, animated: true });
                }
              }}
            >
              {mediaItems[activeImageIndex]?.type === 'youtube' ||
              mediaItems[activeImageIndex]?.type === 'video' ? (
                <Text style={styles.floatingMediaToggleText}>📸 View Photos</Text>
              ) : (
                <Text style={styles.floatingMediaToggleText}>▶️ Watch Video</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Side Navigation Arrow Buttons (< and >) */}
          {mediaItems.length > 1 && (
            <>
              {/* Previous Button (Left) */}
              {activeImageIndex > 0 && (
                <TouchableOpacity
                  style={styles.carouselLeftNavBtn}
                  onPress={() => {
                    const prevIdx = activeImageIndex - 1;
                    setActiveImageIndex(prevIdx);
                    carouselRef.current?.scrollTo({ index: prevIdx, animated: true });
                  }}
                  activeOpacity={0.8}
                >
                  <HugeIcon icon={ArrowLeft01Icon} size={18} color="#0F172A" />
                </TouchableOpacity>
              )}

              {/* Next Button (Right) */}
              {activeImageIndex < mediaItems.length - 1 && (
                <TouchableOpacity
                  style={styles.carouselRightNavBtn}
                  onPress={() => {
                    const nextIdx = activeImageIndex + 1;
                    setActiveImageIndex(nextIdx);
                    carouselRef.current?.scrollTo({ index: nextIdx, animated: true });
                  }}
                  activeOpacity={0.8}
                >
                  <HugeIcon icon={ArrowRightIcon} size={18} color="#0F172A" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Dots Indicator */}
          {mediaItems.length > 1 && (
            <View style={styles.dotsRow}>
              {mediaItems.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeImageIndex === i ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Live Speed Tag */}
          <View style={styles.expressDeliveryBadge}>
            <HugeIcon icon={FlashIcon} size={14} color="#FFFFFF" />
            <Text style={styles.expressDeliveryText}>
              {product.deliveryTime || '⚡ 15-25 MINS LOCAL DELIVERY'}
            </Text>
          </View>
        </View>

        {/* ── 2. PRODUCT MAIN INFO CONTAINER ── */}
        <View style={styles.productDetailsSheet}>
          {/* 🔥 REAL-TIME SOCIAL PROOF & VIEWERS COUNT (FOMO) */}
          <View style={styles.socialProofStrip}>
            <HugeIcon icon={FireIcon} size={16} color="#DC2626" />
            <Text style={styles.socialProofText}>
              <Text style={{ fontWeight: '800', color: '#B91C1C' }}>1,420+ bought</Text> in Sangamner this week • 48 viewing now
            </Text>
          </View>

          {/* Seller Header */}
          <View style={styles.sellerHeaderRow}>
            <View style={styles.sellerHeaderLeft}>
              <HugeIcon icon={StoreIcon} size={15} color="#008B45" />
              <Text style={styles.sellerNameText} numberOfLines={1}>
                {productVendor}
              </Text>
            </View>
            <View style={styles.verifiedStoreBadge}>
              <HugeIcon icon={CheckmarkBadge01Icon} size={13} color="#008B45" />
              <Text style={styles.verifiedStoreText}>100% Genuine</Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={styles.productMainTitle}>{productName}</Text>

          {/* Rating Pill & Trust Tag */}
          <View style={styles.ratingSectionRow}>
            <View style={styles.starRatingPill}>
              <Text style={styles.starRatingNumber}>{productRating.toFixed(1)}</Text>
              <HugeIcon icon={StarIcon} size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.ratingCountText}>
              {productReviewCount} Ratings & {reviews.length} Reviews
            </Text>
            <View style={styles.bazarPethAssuredPill}>
              <Text style={styles.bazarPethAssuredText}>⚡ BazarPeth Assured</Text>
            </View>
          </View>

          {/* ── 3. HIGH-IMPACT "BACHAT" & PRICE BLOCK ── */}
          <View style={styles.priceContainerCard}>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.dealPriceText}>{effectivePrice}</Text>

              {effectivePrice < productOriginalPrice && (
                <>
                  <Text style={styles.mrpStrikeText}>₹{productOriginalPrice}</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>{discount}% OFF</Text>
                  </View>
                </>
              )}
            </View>

            {/* Savings Callout */}
            {savingsAmount > 0 && (
              <View style={styles.savingsCalloutRow}>
                <Text style={styles.savingsCalloutText}>
                  🎉 <Text style={{ fontWeight: '800' }}>Bachat Alert:</Text> You save ₹{savingsAmount} ({discount}% off MRP)
                </Text>
              </View>
            )}

            <Text style={styles.taxInclusiveText}>
              ✅ Inclusive of all taxes • Cash on Delivery (COD) Available
            </Text>
          </View>

          {/* ── 4. INTERACTIVE 1-TAP COUPONS & BACHAT ── */}
          <View style={styles.couponCard}>
            <View style={styles.couponHeader}>
              <HugeIcon icon={TagIcon} size={16} color="#D97706" />
              <Text style={styles.couponHeaderTitle}>Exclusive BazarPeth Coupons</Text>
            </View>

            <View style={styles.couponItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCodeText}>BAZAR100</Text>
                <Text style={styles.couponDescText}>Save ₹100 instantly on your order</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.applyCouponBtn,
                  appliedCoupon === 'BAZAR100' && styles.appliedCouponBtn,
                ]}
                onPress={() =>
                  setAppliedCoupon(appliedCoupon === 'BAZAR100' ? null : 'BAZAR100')
                }
              >
                <Text
                  style={[
                    styles.applyCouponBtnText,
                    appliedCoupon === 'BAZAR100' && styles.appliedCouponBtnText,
                  ]}
                >
                  {appliedCoupon === 'BAZAR100' ? 'APPLIED ✓' : 'APPLY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 5. PINCODE & DELIVERY ESTIMATE WITH LIVE TIMER ── */}
          <View style={styles.deliveryPincodeCard}>
            <View style={styles.pincodeHeaderRow}>
              <View style={styles.pincodeLeft}>
                <HugeIcon icon={Location01Icon} size={18} color="#008B45" />
                <Text style={styles.deliveryLocationText}>
                  Deliver to <Text style={{ fontWeight: '800', color: '#0F172A' }}>{pincode}</Text> (Sangamner)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPincodeModalOpen(true)}
                style={styles.changePincodeBtn}
              >
                <Text style={styles.changePincodeText}>Change Pincode</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliveryTimelineRow}>
              <HugeIcon icon={TruckIcon} size={16} color="#16A34A" />
              <Text style={styles.deliveryTimelineText}>
                <Text style={{ fontWeight: '700', color: '#15803D' }}>Free Express Delivery</Text> • Expected by Tomorrow, 2 PM
              </Text>
            </View>

            <View style={styles.countdownRow}>
              <HugeIcon icon={Clock01Icon} size={13} color="#D97706" />
              <Text style={styles.countdownText}>
                Order within <Text style={{ fontWeight: '700', color: '#B45309' }}>2 hrs 15 mins</Text> for same-day dispatch!
              </Text>
            </View>
          </View>

          {/* ── 6. DYNAMIC CATEGORY-AWARE VARIANT & OPTION SELECTOR ── */}
          {(() => {
            const catType = (() => {
              const name = (product?.name || '').toLowerCase();
              const cat = (product?.category || '').toLowerCase();
              const sub = (product?.subCategory || product?.subcategory || '').toLowerCase();
              const text = `${name} ${cat} ${sub}`;

              if (text.includes('shoe') || text.includes('sneaker') || text.includes('sandal') || text.includes('slipper') || text.includes('footwear')) {
                return 'footwear';
              }
              if (
                cat.includes('fashion') || cat.includes('men') || cat.includes('women') || cat.includes('kurti') || cat.includes('saree') || cat.includes('lingerie') ||
                text.includes('shirt') || text.includes('t-shirt') || text.includes('tshirt') || text.includes('trouser') || text.includes('jeans') ||
                text.includes('kurta') || text.includes('kurti') || text.includes('anarkali') || text.includes('dress') || text.includes('hoodie') || text.includes('combo')
              ) {
                return 'fashion';
              }
              if (
                cat.includes('electronic') || text.includes('iphone') || text.includes('phone') || text.includes('mobile') ||
                text.includes('laptop') || text.includes('airpods') || text.includes('earbuds') || text.includes('smartwatch') || text.includes('mouse')
              ) {
                return 'electronics';
              }
              if (
                cat.includes('grocery') || cat.includes('dairy') || cat.includes('food') ||
                text.includes('butter') || text.includes('rice') || text.includes('atta') || text.includes('oil') || text.includes('biscuit')
              ) {
                return 'grocery';
              }
              if (
                cat.includes('beauty') || cat.includes('personal care') ||
                text.includes('soap') || text.includes('shampoo') || text.includes('lotion') || text.includes('cream') || text.includes('face wash')
              ) {
                return 'beauty';
              }
              if (
                cat.includes('kitchen') || cat.includes('home') || text.includes('kettle') || text.includes('kadai') || text.includes('refrigerator') || text.includes('split ac')
              ) {
                return 'appliances';
              }
              return 'none';
            })();

            // Variants definitions tailored to the specific category
            let variantTitle = 'Select Option';
            let variantOptions: string[] = [];
            let showSizeGuide = false;
            let helperText = '';
            let showColorSection = true;

            if (catType === 'fashion') {
              const nameLower = (product?.name || '').toLowerCase();
              if (nameLower.includes('saree') || nameLower.includes('dupatta')) {
                variantTitle = 'Select Size';
                variantOptions = ['Free Size (Standard 5.5m)'];
                showSizeGuide = false;
              } else {
                variantTitle = 'Select Size';
                variantOptions = product?.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                showSizeGuide = true;
                helperText = '💡 92% of buyers say this fits True to Size.';
              }
            } else if (catType === 'footwear') {
              variantTitle = 'Select Shoe Size (UK / India)';
              variantOptions = product?.sizes || ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];
              showSizeGuide = true;
              helperText = '💡 Standard Indian & UK shoe sizing.';
            } else if (catType === 'electronics') {
              const nameLower = (product?.name || '').toLowerCase();
              if (nameLower.includes('laptop')) {
                variantTitle = 'Select Configuration / RAM';
                variantOptions = ['8GB RAM / 512GB SSD', '16GB RAM / 512GB SSD', '16GB RAM / 1TB SSD'];
              } else if (nameLower.includes('iphone') || nameLower.includes('phone') || nameLower.includes('mobile')) {
                variantTitle = 'Select Storage Capacity';
                variantOptions = ['128 GB', '256 GB', '512 GB'];
              } else if (nameLower.includes('smartwatch')) {
                variantTitle = 'Select Dial Size';
                variantOptions = ['41 mm (Bluetooth)', '45 mm (GPS + Cellular)'];
              } else {
                variantTitle = 'Warranty & Protection Plan';
                variantOptions = ['1 Year Standard Brand Warranty', '2 Year Extended Warranty (+₹499)'];
              }
              helperText = '🛡️ 100% Original Brand Warranty Included.';
            } else if (catType === 'grocery') {
              showColorSection = false;
              const nameLower = (product?.name || '').toLowerCase();
              if (nameLower.includes('rice') || nameLower.includes('atta')) {
                variantTitle = 'Select Pack Size';
                variantOptions = ['1 kg', '5 kg Bag (Save 10%)', '10 kg Family Pack'];
              } else if (nameLower.includes('butter') || nameLower.includes('cheese')) {
                variantTitle = 'Select Weight';
                variantOptions = ['100g', '500g Pack', 'Pack of 2 (1kg)'];
              } else {
                variantTitle = 'Select Quantity / Pack';
                variantOptions = ['Single Pack', 'Pack of 2 (Save ₹20)', 'Pack of 4 (Value Deal)'];
              }
              helperText = '⚡ Fresh stock guaranteed with long shelf life.';
            } else if (catType === 'beauty') {
              showColorSection = false;
              variantTitle = 'Select Pack / Volume';
              variantOptions = ['Single Unit', 'Pack of 3 (Save 15%)', 'Family Pack of 5'];
              helperText = '✨ Dermatologically tested & 100% genuine.';
            } else if (catType === 'appliances') {
              showColorSection = true;
              const nameLower = (product?.name || '').toLowerCase();
              if (nameLower.includes('kettle')) {
                variantTitle = 'Select Capacity';
                variantOptions = ['1.5 Litre', '1.8 Litre (Fast Boil)', '2.0 Litre'];
              } else if (nameLower.includes('refrigerator')) {
                variantTitle = 'Select Capacity';
                variantOptions = ['183 L (Single Door)', '240 L (Double Door)'];
              } else {
                variantTitle = 'Select Size / Variant';
                variantOptions = ['Standard Model', 'Pro / Heavy Duty Edition'];
              }
              helperText = '⚡ Energy efficient with doorstep warranty support.';
            }

            return (
              <View style={styles.variantSection}>
                {/* Optional Color Section */}
                {showColorSection && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={styles.sectionHeading}>
                      Color: <Text style={{ color: '#008B45' }}>{selectedColor}</Text>
                    </Text>
                    <View style={styles.colorRow}>
                      {availableColors.map((col: any) => {
                        const isSelected = selectedColor === col.name;
                        return (
                          <TouchableOpacity
                            key={col.name}
                            style={[styles.colorPill, isSelected && styles.colorPillSelected]}
                            onPress={() => setSelectedColor(col.name)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.colorCircle, { backgroundColor: col.code }]} />
                            <Text style={[styles.colorText, isSelected && styles.colorTextSelected]}>
                              {col.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Dynamic Category Variant Section */}
                {variantOptions.length > 0 && (
                  <View>
                    <View style={styles.variantHeaderRow}>
                      <Text style={styles.sectionHeading}>{variantTitle}</Text>
                      {showSizeGuide && (
                        <TouchableOpacity onPress={() => setIsSizeChartOpen(true)}>
                          <Text style={styles.sizeGuideLink}>Size Guide 📏</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.sizePillScroll}
                    >
                      {variantOptions.map((opt: string) => {
                        const isSelected = selectedSize === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.sizePill,
                              opt.length > 4 && { width: 'auto', paddingHorizontal: 16 },
                              isSelected && styles.sizePillSelected,
                            ]}
                            onPress={() => setSelectedSize(opt)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.sizePillText,
                                isSelected && styles.sizePillTextSelected,
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    {helperText ? <Text style={styles.fitAdviceText}>{helperText}</Text> : null}
                  </View>
                )}
              </View>
            );
          })()}

          {/* ── 7. 4 KEY INDIAN BUYER ASSURANCES ── */}
          <View style={styles.trustShieldCard}>
            <Text style={styles.trustShieldHeading}>🛡️ BazarPeth Buyer Protection</Text>
            <View style={styles.trustGrid}>
              <View style={styles.trustItem}>
                <View style={styles.trustIconWrap}>
                  <Text style={{ fontSize: 20 }}>💵</Text>
                </View>
                <Text style={styles.trustItemTitle}>Pay on Delivery</Text>
                <Text style={styles.trustItemSub}>Cash & UPI at doorstep</Text>
              </View>

              <View style={styles.trustItem}>
                <View style={styles.trustIconWrap}>
                  <Text style={{ fontSize: 20 }}>🔄</Text>
                </View>
                <Text style={styles.trustItemTitle}>7 Days Return</Text>
                <Text style={styles.trustItemSub}>Instant replacement</Text>
              </View>

              <View style={styles.trustItem}>
                <View style={styles.trustIconWrap}>
                  <Text style={{ fontSize: 20 }}>🏪</Text>
                </View>
                <Text style={styles.trustItemTitle}>Local Verified</Text>
                <Text style={styles.trustItemSub}>100% Genuine product</Text>
              </View>

              <View style={styles.trustItem}>
                <View style={styles.trustIconWrap}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                </View>
                <Text style={styles.trustItemTitle}>Express Speed</Text>
                <Text style={styles.trustItemSub}>Direct from market</Text>
              </View>
            </View>
          </View>

          {/* ── 8. LOCAL DUKAAN / SELLER CARD WITH CHAT ACTION ── */}
          <View style={styles.sellerProfileCard}>
            <View style={styles.sellerCardTop}>
              <View style={styles.sellerAvatarCircle}>
                <HugeIcon icon={StoreIcon} size={22} color="#008B45" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.sellerCardTitle}>{productVendor}</Text>
                <Text style={styles.sellerCardSub}>⭐ 4.7 • 2.4k sales • Sangamner Market</Text>
              </View>
            </View>
            <View style={styles.sellerActionsRow}>
              <TouchableOpacity style={styles.chatSellerBtn} onPress={handleChatWithSeller}>
                <Text style={{ fontSize: 14 }}>💬</Text>
                <Text style={styles.chatSellerText}>Chat with Shopkeeper</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewShopBtn}
                onPress={() => {
                  const shopId = product.shopId || product.shop_id || product.sellerId;
                  if (shopId) {
                    navigation.navigate('ShopDetail', { shopId });
                  } else {
                    navigation.navigate('CategoryProducts', { categoryId: 'all', categoryName: productVendor });
                  }
                }}
              >
                <Text style={styles.viewShopText}>View Shop →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 9. PRODUCT DETAILS & SPECS ── */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionHeading}>Product Details & Specifications</Text>
            <View style={styles.specsTable}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specValue}>{product.category || 'Fashion & Lifestyle'}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Fabric / Material</Text>
                <Text style={styles.specValue}>Premium 100% Cotton Blend</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Country of Origin</Text>
                <Text style={styles.specValue}>India (Made in India 🇮🇳)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Return Policy</Text>
                <Text style={styles.specValue}>7 Days Free Replacement</Text>
              </View>
            </View>

            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Description</Text>
            <Text
              style={styles.descriptionText}
              numberOfLines={isDescExpanded ? undefined : 4}
            >
              {product.description ||
                'High quality authentic product sourced directly from local verified stores in the BazarPeth marketplace network. Carefully checked for quality, fast doorstep delivery, and hassle-free returns.'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsDescExpanded(!isDescExpanded)}
              style={styles.readMoreBtn}
            >
              <Text style={styles.readMoreText}>
                {isDescExpanded ? 'Read Less ▲' : 'Read Full Description ▼'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 10. REAL CUSTOMER PHOTO GALLERY & REVIEWS (Meesho Style) ── */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionHeading}>Customer Ratings & Photos</Text>
              <TouchableOpacity onPress={handleRateProduct} style={styles.writeReviewBtn}>
                <Text style={styles.writeReviewBtnText}>Rate Product ⭐</Text>
              </TouchableOpacity>
            </View>

            {/* Rating Summary Card */}
            <View style={styles.ratingSummaryCard}>
              <View style={styles.ratingBigNumberCol}>
                <Text style={styles.ratingBigNumber}>{productRating.toFixed(1)}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HugeIcon
                      key={s}
                      icon={StarIcon}
                      size={14}
                      color={s <= Math.round(productRating) ? '#16A34A' : '#E2E8F0'}
                    />
                  ))}
                </View>
                <Text style={styles.totalRatingsText}>{productReviewCount} Verified Ratings</Text>
              </View>

              <View style={styles.ratingBarsCol}>
                {[
                  { star: 5, pct: 72 },
                  { star: 4, pct: 16 },
                  { star: 3, pct: 7 },
                  { star: 2, pct: 3 },
                  { star: 1, pct: 2 },
                ].map((item) => (
                  <View key={item.star} style={styles.barRow}>
                    <Text style={styles.barStarLabel}>{item.star}★</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${item.pct}%` }]} />
                    </View>
                    <Text style={styles.barPctLabel}>{item.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Individual Reviews */}
            {reviews.length > 0 ? (
              <View style={{ gap: 12, marginTop: 14 }}>
                {reviews.slice(0, 3).map((r, i) => (
                  <View key={i} style={styles.reviewItemCard}>
                    <View style={styles.reviewItemHeader}>
                      <View style={styles.reviewStarPill}>
                        <Text style={styles.reviewStarPillText}>{r.rating || 5} ★</Text>
                      </View>
                      <Text style={styles.reviewerName}>{r.userName || 'Verified Shopper'}</Text>
                      <Text style={styles.verifiedPurchaseTag}>✓ Verified Purchase</Text>
                    </View>
                    <Text style={styles.reviewComment}>
                      {r.comment || 'Superb quality fabric, great fitting and delivered in 20 minutes!'}
                    </Text>
                    {r.images && r.images.length > 0 && (
                      <View style={styles.reviewImagesRow}>
                        {r.images.map((img: string, imgIdx: number) => (
                          <Image
                            key={imgIdx}
                            source={{ uri: img }}
                            style={styles.reviewThumb}
                            resizeMode="cover"
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noReviewsBox}>
                <Text style={styles.noReviewsText}>No reviews yet. Be the first to review this product!</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── 11. STICKY DUAL ACTION BOTTOM BAR ── */}
      <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {quantity === 0 ? (
          <View style={styles.bottomBarDualButtons}>
            {/* Add to Cart (Outline Green) */}
            <TouchableOpacity
              style={styles.addToCartOutlineBtn}
              onPress={handleAddToCart}
              activeOpacity={0.85}
            >
              <HugeIcon icon={ShoppingCart01Icon} size={18} color="#008B45" />
              <Text style={styles.addToCartOutlineText}>Add to Cart</Text>
            </TouchableOpacity>

            {/* Buy Now (Solid Green) */}
            <TouchableOpacity
              style={styles.buyNowSolidBtn}
              onPress={handleBuyNow}
              activeOpacity={0.88}
            >
              <HugeIcon icon={FlashIcon} size={18} color="#FFFFFF" />
              <Text style={styles.buyNowSolidText}>Buy Now • ₹{effectivePrice}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomBarDualButtons}>
            {/* Stepper Counter */}
            <View style={styles.bottomStepperWrap}>
              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={() => dispatch(removeFromCart(product.id))}
              >
                <HugeIcon icon={MinusSignIcon} size={18} color="#008B45" />
              </TouchableOpacity>
              <Text style={styles.stepperNumberText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperActionBtn}
                onPress={handleAddToCart}
              >
                <HugeIcon icon={Add01Icon} size={18} color="#008B45" />
              </TouchableOpacity>
            </View>

            {/* Go to Cart / Checkout */}
            <TouchableOpacity
              style={styles.goToCartBtn}
              onPress={() => navigation.navigate('Checkout')}
              activeOpacity={0.88}
            >
              <Text style={styles.goToCartBtnText}>
                Go to Cart ({quantity} items) →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── PINCODE CHANGE MODAL ── */}
      <Modal
        visible={isPincodeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPincodeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pincodeModalBox}>
            <Text style={styles.modalHeading}>Check Delivery Speed</Text>
            <Text style={styles.modalSubheading}>
              Enter your 6-digit area pincode to check instant delivery and COD availability.
            </Text>
            <TextInput
              style={styles.pincodeInput}
              placeholder="e.g. 422605"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              value={newPincodeInput}
              onChangeText={setNewPincodeInput}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsPincodeModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  if (newPincodeInput.length === 6) {
                    setPincode(newPincodeInput);
                    setIsPincodeModalOpen(false);
                    setNewPincodeInput('');
                  } else {
                    Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode.');
                  }
                }}
              >
                <Text style={styles.modalConfirmBtnText}>Apply Pincode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SIZE CHART MODAL ── */}
      <Modal
        visible={isSizeChartOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSizeChartOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pincodeModalBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.modalHeading}>Standard Size Guide</Text>
              <TouchableOpacity onPress={() => setIsSizeChartOpen(false)}>
                <HugeIcon icon={Cancel01Icon} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.sizeTable}>
              <View style={[styles.sizeTableRow, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.sizeTableCell, { fontWeight: '700' }]}>Size</Text>
                <Text style={[styles.sizeTableCell, { fontWeight: '700' }]}>Chest (in)</Text>
                <Text style={[styles.sizeTableCell, { fontWeight: '700' }]}>Length (in)</Text>
              </View>
              {[
                { s: 'S', c: '38', l: '27' },
                { s: 'M', c: '40', l: '28' },
                { s: 'L', c: '42', l: '29' },
                { s: 'XL', c: '44', l: '30' },
                { s: 'XXL', c: '46', l: '31' },
              ].map((row) => (
                <View key={row.s} style={styles.sizeTableRow}>
                  <Text style={styles.sizeTableCell}>{row.s}</Text>
                  <Text style={styles.sizeTableCell}>{row.c}"</Text>
                  <Text style={styles.sizeTableCell}>{row.l}"</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setIsSizeChartOpen(false)}>
              <Text style={styles.modalConfirmBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── IMAGE ZOOM MODAL ── */}
      <Modal
        visible={isZoomVisible}
        transparent={true}
        onRequestClose={() => setIsZoomVisible(false)}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          <ImageViewer
            imageUrls={imageUrls}
            index={activeImageIndex}
            onCancel={() => setIsZoomVisible(false)}
            enableSwipeDown={true}
          />
          <TouchableOpacity
            style={styles.closeZoomBtn}
            onPress={() => setIsZoomVisible(false)}
          >
            <HugeIcon icon={Cancel01Icon} color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── REVIEW WRITE MODAL ── */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reviewModalOverlay}
        >
          <View style={[styles.reviewModalBox, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.modalHeading}>Write Customer Review</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <HugeIcon icon={Cancel01Icon} size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Interactive Stars */}
            <View style={styles.starPickRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)} activeOpacity={0.8}>
                  <HugeIcon
                    icon={StarIcon}
                    size={32}
                    color={star <= reviewRating ? '#16A34A' : '#E2E8F0'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewTextInput}
              placeholder="How was the product quality, fabric, fitting, or delivery experience?"
              placeholderTextColor="#94A3B8"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />

            {/* Attach Photos */}
            <View style={{ marginBottom: 18 }}>
              <Text style={styles.attachPhotosLabel}>Attach Real Photos (Max 3)</Text>
              <View style={styles.reviewImagesGrid}>
                {reviewImages.map((uri, idx) => (
                  <View key={idx} style={styles.reviewImgThumbWrap}>
                    <Image source={{ uri }} style={styles.reviewImgThumb} />
                    <TouchableOpacity
                      style={styles.removeImgBtn}
                      onPress={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <HugeIcon icon={Cancel01Icon} size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {reviewImages.length < 3 && (
                  <TouchableOpacity style={styles.addPhotoBox} onPress={pickReviewImages}>
                    <HugeIcon icon={Add01Icon} size={20} color="#64748B" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  errorWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  errorBtn: {
    backgroundColor: '#008B45',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingHeaderCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  floatingHeaderRight: {
    flexDirection: 'row',
    gap: 10,
  },
  cartHeaderBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5200',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

  // Carousel
  carouselWrapper: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  imageSlideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
  },
  videoSlideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.15,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#008B45',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  expressDeliveryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expressDeliveryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  floatingMediaToggleBtn: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 25,
  },
  floatingMediaToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  carouselLeftNavBtn: {
    position: 'absolute',
    left: 12,
    top: '48%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20,
  },
  carouselRightNavBtn: {
    position: 'absolute',
    right: 12,
    top: '48%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20,
  },

  // 1.5 Media Thumbnail Strip
  mediaThumbnailStripWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mediaThumbScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  mediaThumbCard: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  mediaThumbCardSelected: {
    borderColor: '#008B45',
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoThumbPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Product Details Sheet
  productDetailsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },

  // Social Proof Strip (FOMO)
  socialProofStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 10,
    gap: 6,
  },
  socialProofText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#991B1B',
    flex: 1,
  },

  sellerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sellerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  sellerNameText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#008B45',
  },
  verifiedStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedStoreText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  productMainTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
  },
  ratingSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  starRatingPill: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  starRatingNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  ratingCountText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  bazarPethAssuredPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  bazarPethAssuredText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_700Bold',
    color: '#2563EB',
  },

  // Pricing Block
  priceContainerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  dealPriceText: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  mrpStrikeText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  discountPill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  discountPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  savingsCalloutRow: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  savingsCalloutText: {
    color: '#15803D',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxInclusiveText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },

  // Coupon Card
  couponCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  couponHeaderTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#92400E',
  },
  couponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  couponCodeText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#D97706',
    letterSpacing: 1,
  },
  couponDescText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#78350F',
  },
  applyCouponBtn: {
    backgroundColor: '#008B45',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  appliedCouponBtn: {
    backgroundColor: '#DCFCE7',
  },
  applyCouponBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  appliedCouponBtnText: {
    color: '#15803D',
  },

  // Delivery / Pincode
  deliveryPincodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  pincodeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pincodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLocationText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#1E293B',
  },
  changePincodeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changePincodeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  deliveryTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  deliveryTimelineText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#92400E',
  },

  // Variants & Colors
  variantSection: {
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  colorPillSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  colorTextSelected: {
    color: '#008B45',
    fontFamily: 'Poppins_700Bold',
  },
  variantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  sizeGuideLink: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2563EB',
  },
  sizePillScroll: {
    gap: 10,
  },
  sizePill: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizePillSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
  },
  sizePillText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  sizePillTextSelected: {
    color: '#008B45',
    fontFamily: 'Poppins_700Bold',
  },
  fitAdviceText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#059669',
    marginTop: 8,
  },

  // Trust Shield
  trustShieldCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  trustShieldHeading: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    alignItems: 'center',
    width: '23%',
  },
  trustIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustItemTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 13,
  },
  trustItemSub: {
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 2,
  },

  // Seller Profile Card
  sellerProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sellerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerCardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  sellerCardSub: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  sellerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chatSellerBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  chatSellerText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  viewShopBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewShopText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },

  // Specs & Details
  specsSection: {
    marginBottom: 20,
  },
  specsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  specValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
    lineHeight: 20,
    marginTop: 6,
  },
  readMoreBtn: {
    marginTop: 6,
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },

  // Reviews
  reviewsSection: {
    marginBottom: 10,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  ratingSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingBigNumberCol: {
    alignItems: 'center',
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingRight: 10,
  },
  ratingBigNumber: {
    fontSize: 36,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  totalRatingsText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  ratingBarsCol: {
    flex: 1,
    paddingLeft: 14,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barStarLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#64748B',
    width: 20,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  barPctLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
    width: 26,
    textAlign: 'right',
  },
  reviewItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reviewStarPill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewStarPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  reviewerName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
  },
  verifiedPurchaseTag: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#16A34A',
    marginLeft: 'auto',
  },
  reviewComment: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
    lineHeight: 18,
  },
  reviewImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  noReviewsBox: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  noReviewsText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },

  // Sticky Bottom Bar
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomBarDualButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addToCartOutlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#008B45',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addToCartOutlineText: {
    color: '#008B45',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  buyNowSolidBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#008B45',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#008B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowSolidText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  bottomStepperWrap: {
    flex: 0.8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#008B45',
  },
  stepperActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperNumberText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  goToCartBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#008B45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pincodeModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
  },
  modalHeading: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubheading: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  pincodeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#008B45',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },

  // Size Table
  sizeTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sizeTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sizeTableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#334155',
  },

  // Zoom Close
  closeZoomBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 28,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },

  // Review Modal
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reviewModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  starPickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  reviewTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 90,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  attachPhotosLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#334155',
    marginBottom: 8,
  },
  reviewImagesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewImgThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  reviewImgThumb: {
    width: '100%',
    height: '100%',
  },
  removeImgBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  addPhotoText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#64748B',
    marginTop: 2,
  },
  submitReviewBtn: {
    backgroundColor: '#008B45',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
});
