import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, StarIcon, Location01Icon, StoreIcon, UserIcon, ShoppingCartIcon, Add01Icon, MinusSignIcon, ReloadIcon } from '@hugeicons/core-free-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import SafeImage from '../components/SafeImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - CARD_GAP) / 2;

// ── Brand Colors ──
const COLORS = {
  orange: '#FA8C16',
  orangeLight: '#FFF7E6',
  orangeDark: '#D46B08',
  warmBg: '#FFF8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textMuted: '#71717A',
  openGreen: '#16A34A',
  openGreenBg: '#F0FFF4',
  closedGrey: '#9CA3AF',
  closedGreyBg: '#F4F4F5',
  divider: '#E5E7EB',
  skeleton: '#E5E7EB',
};

// ══════════════════════════════════════════════════════════════
// SHIMMER SKELETON
// ══════════════════════════════════════════════════════════════
const ShimmerBox = ({ width, height, borderRadius = 8, style }: any) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: COLORS.skeleton, opacity: anim }, style]}
    />
  );
};

// ══════════════════════════════════════════════════════════════
// PRODUCT CARD (for shop detail)
// ══════════════════════════════════════════════════════════════
const ShopProductCard = React.memo(({ product, shopName }: { product: any; shopName: string }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const cartItem = useSelector((state: RootState) =>
    state.cart.items.find((i) => i.id === product.id)
  );
  const qty = cartItem ? cartItem.quantity : 0;

  const productImage = product.images?.[0] || product.image || product.imageUrl || '';
  const productName = product.name || 'Product';
  const productPrice = product.price || 0;
  const originalPrice = product.originalPrice || product.mrp || productPrice;

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: product.id,
        name: productName,
        price: productPrice,
        originalPrice: originalPrice,
        quantity: 1,
        imageUrl: productImage,
        vendor: shopName,
      })
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => {
        // Navigate to product detail if it exists as a top-level product
        if (product.id) {
          navigation.navigate('ProductDetail', { productId: product.id });
        }
      }}
      style={styles.productCard}
    >
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        <SafeImage uri={productImage} style={styles.productImage} resizeMode="cover" />
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {productName}
        </Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{productPrice}</Text>
          {originalPrice > productPrice && (
            <Text style={styles.productOriginalPrice}>₹{originalPrice}</Text>
          )}
        </View>

        {/* Add to Cart */}
        {qty === 0 ? (
          <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
            <HugeIcon icon={ShoppingCartIcon} size={12} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => dispatch(removeFromCart(product.id))}
            >
              <HugeIcon icon={MinusSignIcon} size={12} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
              <HugeIcon icon={Add01Icon} size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ══════════════════════════════════════════════════════════════
// EMPTY PRODUCTS STATE
// ══════════════════════════════════════════════════════════════
const EmptyProducts = () => (
  <View style={styles.emptyContainer}>
    <Text style={{ fontSize: 56, marginBottom: 16 }}>🛒</Text>
    <Text style={styles.emptyTitle}>No products available{'\n'}in this shop yet</Text>
    <Text style={styles.emptySubtitle}>Products coming soon!</Text>
  </View>
);

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function ShopDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { shopId, shop: passedShop } = route.params || {};

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll animation for hero parallax
  const scrollY = useRef(new Animated.Value(0)).current;

  // Shop data (from passed params)
  const shopName = passedShop?.shopName || passedShop?.name || 'Local Shop';
  const ownerName = passedShop?.ownerName || passedShop?.owner || '';
  const shopCategory = passedShop?.category || 'General';
  const shopRating = passedShop?.rating || 4.0;
  const shopImage = passedShop?.imageUrl || passedShop?.avatarUrl || passedShop?.customImageUrl || '';
  const shopImages = passedShop?.shopImages?.length > 0 ? passedShop.shopImages : (shopImage ? [shopImage] : []);
  const shopLocation = passedShop?.location || '';
  const isOpen =
    passedShop?.isOpen !== undefined ? passedShop.isOpen : passedShop?.isActive !== false;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch products from subcollection
  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError(null);

    const productsRef = collection(db, 'local_shops', shopId, 'products');

    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      },
      (err) => {
        console.error('ShopDetail products error:', err);
        setError('Failed to load products');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [shopId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const productsRef = collection(db, 'local_shops', shopId, 'products');
    getDocs(productsRef)
      .then((snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      })
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ShopProductCard product={item} shopName={shopName} />
  );

  // Hero image height for parallax
  const HERO_HEIGHT = 260;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Floating Back Button ── */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <HugeIcon icon={ArrowLeft01Icon} size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Animated Header Bar (appears on scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <View style={{ width: 40 }} />
        <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{shopName}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ══════════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ══════════════════════════════════════════════════════════ */}
        <View style={[styles.heroContainer, { height: HERO_HEIGHT }]}>
          {shopImages.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setActiveImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {shopImages.map((img: string, idx: number) => (
                  <Image key={idx} source={{ uri: img }} style={[styles.heroImage, { width: SCREEN_WIDTH }]} resizeMode="cover" />
                ))}
              </ScrollView>
              
              {/* Pagination Dots */}
              {shopImages.length > 1 && (
                <View style={styles.paginationContainer}>
                  {shopImages.map((_: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.paginationDot,
                        activeImageIndex === idx ? styles.paginationDotActive : null
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 60 }}>🏪</Text>
            </View>
          )}

          {/* Gradient Overlay */}
          <View style={styles.heroGradient} />

          {/* Shop Info Overlay */}
          <View style={[styles.heroOverlay, { paddingBottom: 20 }]}>
            <Text style={styles.heroShopName}>{shopName}</Text>
            <View style={styles.heroStatusRow}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: isOpen ? 'rgba(22,163,74,0.2)' : 'rgba(156,163,175,0.2)' },
                ]}
              >
                <View
                  style={[
                    styles.heroDot,
                    { backgroundColor: isOpen ? COLORS.openGreen : COLORS.closedGrey },
                  ]}
                />
                <Text
                  style={[
                    styles.heroStatusText,
                    { color: isOpen ? '#DCFCE7' : '#E5E7EB' },
                  ]}
                >
                  {isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* INFO STRIP */}
        {/* ══════════════════════════════════════════════════════════ */}
        <View style={styles.infoStrip}>
          {/* Rating */}
          <View style={styles.infoItem}>
            <HugeIcon icon={StarIcon} size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.infoValue}>{shopRating.toFixed?.(1) || shopRating}</Text>
            <Text style={styles.infoLabel}>Rating</Text>
          </View>

          <View style={styles.infoDivider} />

          {/* Category */}
          <View style={styles.infoItem}>
            <HugeIcon icon={StoreIcon} size={14} color={COLORS.orange} />
            <Text style={styles.infoValue}>{shopCategory}</Text>
            <Text style={styles.infoLabel}>Category</Text>
          </View>

          <View style={styles.infoDivider} />

          {/* Owner */}
          <View style={styles.infoItem}>
            <HugeIcon icon={UserIcon} size={14} color={COLORS.textMuted} />
            <Text style={styles.infoValue} numberOfLines={1}>
              {ownerName || 'Shop Owner'}
            </Text>
            <Text style={styles.infoLabel}>Owner</Text>
          </View>
        </View>

        {/* Location row (if available) */}
        {shopLocation ? (
          <View style={styles.locationRow}>
            <HugeIcon icon={Location01Icon} size={13} color={COLORS.textMuted} />
            <Text style={styles.locationText}>{shopLocation}</Text>
          </View>
        ) : null}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* PRODUCTS SECTION */}
        {/* ══════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.sectionAccent} />
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={handleRetry}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Loading skeleton */}
        {loading ? (
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.productCard, { width: PRODUCT_CARD_WIDTH }]}>
                <ShimmerBox width="100%" height={PRODUCT_CARD_WIDTH * 0.9} borderRadius={12} />
                <View style={{ padding: 10 }}>
                  <ShimmerBox width="80%" height={12} style={{ marginBottom: 8 }} />
                  <ShimmerBox width="50%" height={14} style={{ marginBottom: 8 }} />
                  <ShimmerBox width="100%" height={32} borderRadius={8} />
                </View>
              </View>
            ))}
          </View>
        ) : products.length === 0 && !error ? (
          <EmptyProducts />
        ) : (
          <View style={styles.productsGrid}>
            {products.map((item) => (
              <ShopProductCard key={item.id} product={item} shopName={shopName} />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.warmBg,
  },

  // ── Back Button ──
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Sticky Header ──
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  stickyHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  // ── Hero ──
  heroContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: '45%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationDotActive: {
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
    // Simulated gradient using layered transparent-to-black
    borderTopWidth: 0,
    // We use a view with specific background instead
    // This is overlaid by heroOverlay
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    // Gradient simulation via background
    backgroundColor: 'transparent',
    // We'll use a linear gradient approach
  },
  heroShopName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroStatusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  heroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Info Strip ──
  infoStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 5,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  infoDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 4,
  },

  // ── Location ──
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },

  // ── Section Header ──
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionAccent: {
    width: 36,
    height: 3,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },

  // ── Products Grid ──
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },

  // ── Product Card ──
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productImageContainer: {
    width: '100%',
    height: PRODUCT_CARD_WIDTH * 0.9,
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.orange,
  },
  productOriginalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },

  // ── Add to Cart ──
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  qtyBtn: {
    backgroundColor: COLORS.orange,
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },

  // ── Empty State ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Error ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF2F0',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 13,
    color: '#CF1322',
    fontWeight: '600',
    flex: 1,
  },
  errorRetry: {
    fontSize: 13,
    color: COLORS.orange,
    fontWeight: '800',
    marginLeft: 12,
  },
});
