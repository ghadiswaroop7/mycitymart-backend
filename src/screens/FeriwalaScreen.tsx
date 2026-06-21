import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { subscribeToSavedShops, toggleSavedShop } from '../services/firestoreService';
import { HugeIcon } from '../components/HugeIcon';
import { StarIcon, Location01Icon, StoreIcon, ReloadIcon, Search02Icon } from '@hugeicons/core-free-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

// ── Brand Colors ──
const COLORS = {
  orange: '#FA8C16',
  orangeLight: '#FFF7E6',
  orangeDark: '#D46B08',
  warmBg: '#FFF8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#1C1C1C',
  textMuted: '#71717A',
  textSecondary: '#8C8C8C',
  openGreen: '#16A34A',
  openGreenBg: '#F0FFF4',
  closedGrey: '#9CA3AF',
  closedGreyBg: '#F4F4F5',
  border: '#F0F0F0',
  skeleton: '#E5E7EB',
};

// ── Category Chips Data ──
const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', emoji: '🛍️' },
  { id: 'grocery', label: 'Grocery', emoji: '🛒' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥬' },
  { id: 'fruits', label: 'Fruits', emoji: '🍎' },
  { id: 'clothing', label: 'Clothing', emoji: '👗' },
  { id: 'bakery', label: 'Bakery', emoji: '🍞' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'sweets', label: 'Sweets', emoji: '🍬' },
];

// ══════════════════════════════════════════════════════════════
// SHIMMER SKELETON LOADER
// ══════════════════════════════════════════════════════════════
const ShimmerCard = () => {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.shopCard, { width: CARD_WIDTH }]}>
      <Animated.View style={[styles.shimmerImage, { opacity: shimmer }]} />
      <View style={styles.shopCardBody}>
        <Animated.View style={[styles.shimmerLine, { width: '80%', opacity: shimmer }]} />
        <Animated.View style={[styles.shimmerLine, { width: '50%', marginTop: 8, opacity: shimmer }]} />
        <Animated.View style={[styles.shimmerLine, { width: '60%', marginTop: 8, opacity: shimmer }]} />
      </View>
    </View>
  );
};

const SkeletonGrid = () => (
  <View style={styles.gridContainer}>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <ShimmerCard key={i} />
    ))}
  </View>
);

// ══════════════════════════════════════════════════════════════
// ANIMATED SHOP CARD
// ══════════════════════════════════════════════════════════════
const ShopCardItem = React.memo(({ shop, onPress }: { shop: any; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F0F0', COLORS.orange],
  });

  const shopName = shop.shopName || shop.name || 'Local Shop';
  const ownerName = shop.ownerName || shop.owner || '';
  const shopCategory = shop.category || 'General';
  const shopRating = shop.rating || 4.0;
  const shopImage = shop.imageUrl || shop.avatarUrl || '';
  const isOpen = shop.isOpen !== undefined ? shop.isOpen : (shop.isActive !== false);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_WIDTH }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.shopCard, { borderColor, borderWidth: 1.5 }]}>
          {/* Shop Image */}
          <View style={styles.shopImageContainer}>
            {shopImage ? (
              <Image source={{ uri: shopImage }} style={styles.shopImage} resizeMode="cover" />
            ) : (
              <View style={styles.shopImagePlaceholder}>
                <Text style={{ fontSize: 36 }}>🏪</Text>
              </View>
            )}

            {/* Save Bookmark Icon */}
            <TouchableOpacity 
              onPress={shop.onToggleSave}
              style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
            >
              <HugeIcon icon={shop.isSaved ? StarIcon : StarIcon} size={16} color={shop.isSaved ? "#FA8C16" : "#1C1C1C"} fill={shop.isSaved ? "#FA8C16" : "transparent"} />
            </TouchableOpacity>

            {/* Open/Closed Badge */}
            <View style={[
              styles.statusBadge,
              { backgroundColor: isOpen ? COLORS.openGreenBg : COLORS.closedGreyBg }
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isOpen ? COLORS.openGreen : COLORS.closedGrey }
              ]} />
              <Text style={[
                styles.statusText,
                { color: isOpen ? COLORS.openGreen : COLORS.closedGrey }
              ]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.shopCardBody}>
            {/* Shop Name */}
            <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>

            {/* Category Chip */}
            <View style={styles.categoryChipSmall}>
              <Text style={styles.categoryChipSmallText}>{shopCategory}</Text>
            </View>

            {/* Rating Row */}
            <View style={styles.ratingRow}>
              <HugeIcon icon={StarIcon} size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{shopRating.toFixed?.(1) || shopRating}</Text>
            </View>

            {/* Owner Name */}
            {ownerName ? (
              <Text style={styles.ownerName} numberOfLines={1}>
                by {ownerName}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════
const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.emptyContainer}>
    <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
    <Text style={styles.emptyTitle}>No shops nearby</Text>
    <Text style={styles.emptySubtitle}>
      There are no shops near you right now.{"\n"}
      Please try again later.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <HugeIcon icon={ReloadIcon} size={16} color="#FFFFFF" />
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

// ══════════════════════════════════════════════════════════════
// ERROR STATE
// ══════════════════════════════════════════════════════════════
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.errorBanner}>
    <Text style={styles.errorText}>⚠️ {message}</Text>
    <TouchableOpacity onPress={onRetry}>
      <Text style={styles.errorRetry}>Retry</Text>
    </TouchableOpacity>
  </View>
);

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
export default function FeriwalaScreen() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid || 'dummy-user-id';

  const [shops, setShops] = useState<any[]>([]);
  const [savedShopIds, setSavedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Real-time Firestore listener for saved shops
  useEffect(() => {
    const unsubscribe = subscribeToSavedShops(uid, (savedList) => {
      setSavedShopIds(savedList.map(s => s.id));
    });
    return () => unsubscribe();
  }, [uid]);

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'local_shops'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shopsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setShops(shopsData);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Feriwala Firestore error:', err);
        setError('Failed to load shops. Please try again.');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Pull-to-refresh fallback (re-fetch once)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const snapshot = await getDocs(query(collection(db, 'local_shops')));
      const shopsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setShops(shopsData);
    } catch (err) {
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Filter shops by category
  const filteredShops = activeCategory === 'all'
    ? shops
    : shops.filter((s) => {
        const cat = (s.category || '').toLowerCase();
        return cat.includes(activeCategory);
      });

  const handleShopPress = (shop: any) => {
    navigation.navigate('ShopDetail', { shopId: shop.id, shop });
  };

  const renderShopCard = ({ item }: { item: any }) => {
    const isSaved = savedShopIds.includes(item.id);
    return (
      <ShopCardItem 
        shop={{
          ...item,
          isSaved,
          onToggleSave: () => toggleSavedShop(uid, item)
        }} 
        onPress={() => handleShopPress(item)} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={loading ? [] : filteredShops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.orange]}
            tintColor={COLORS.orange}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── HEADER BANNER ── */}
            <View style={styles.headerBanner}>
              {/* Decorative Emojis */}
              <View style={styles.headerDecoRow}>
                <Text style={styles.headerEmoji}>🏪</Text>
                <Text style={[styles.headerEmoji, { fontSize: 28 }]}>🛒</Text>
                <Text style={styles.headerEmoji}>🥬</Text>
              </View>

              {/* Title Block */}
              <Text style={styles.headerTitle}>Local Shops</Text>
              <Text style={styles.headerSubtitle}>Shop local, shop with love ❤️</Text>

              {/* Decorative line */}
              <View style={styles.headerAccent} />
            </View>

            {/* ── CATEGORY CHIPS ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
              style={styles.chipsScroll}
            >
              {CATEGORY_FILTERS.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setActiveCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── ERROR BANNER ── */}
            {error ? <ErrorBanner message={error} onRetry={handleRefresh} /> : null}

            {/* ── RESULTS COUNT ── */}
            {!loading && !error && (
              <View style={styles.resultsRow}>
                <HugeIcon icon={StoreIcon} size={14} color={COLORS.textMuted} />
                <Text style={styles.resultsText}>
                  {filteredShops.length} {filteredShops.length === 1 ? 'shop' : 'shops'} found
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonGrid />
          ) : !error && filteredShops.length === 0 ? (
            <EmptyState onRetry={handleRefresh} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.warmBg,
  },
  listContent: {
    paddingBottom: 100,
  },

  // ── Header ──
  headerBanner: {
    backgroundColor: COLORS.orange,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerDecoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  headerAccent: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    marginTop: 14,
  },

  // ── Category Chips ──
  chipsScroll: {
    marginTop: 16,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  chipActive: {
    backgroundColor: COLORS.orangeLight,
    borderColor: COLORS.orange,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chipLabelActive: {
    color: COLORS.orangeDark,
    fontWeight: '800',
  },

  // ── Results Row ──
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 6,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // ── Grid ──
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  gridRow: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },

  // ── Shop Card ──
  shopCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 4,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  shopImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.orangeLight,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  shopCardBody: {
    padding: 12,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  categoryChipSmall: {
    backgroundColor: COLORS.orangeLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryChipSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.orangeDark,
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  ownerName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // ── Shimmer ──
  shimmerImage: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
    backgroundColor: COLORS.skeleton,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  shimmerLine: {
    height: 12,
    backgroundColor: COLORS.skeleton,
    borderRadius: 4,
  },

  // ── Empty State ──
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Error Banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF2F0',
    marginHorizontal: 16,
    marginTop: 12,
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
