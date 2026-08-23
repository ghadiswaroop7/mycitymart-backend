import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { subscribeToSavedShops, toggleSavedShop } from '../services/firestoreService';
import { HugeIcon } from '../components/HugeIcon';
import {
  StarIcon,
  Location01Icon,
  StoreIcon,
  ReloadIcon,
  Search02Icon,
  Cancel01Icon,
  FlashIcon,
  FavouriteIcon,
  TagIcon,
  CallIcon,
  Tick01Icon,
  ShoppingBag01Icon,
  ArrowRightIcon,
} from '@hugeicons/core-free-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

// ── Theme & Palette ──
const COLORS = {
  primary: '#008B45',
  primaryLight: '#E8F5E9',
  primaryDark: '#006633',
  orange: '#FA8C16',
  orangeLight: '#FFF7E6',
  orangeBg: '#FFF8F0',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  openGreen: '#16A34A',
  openGreenBg: '#DCFCE7',
  closedGrey: '#94A3B8',
  closedGreyBg: '#F1F5F9',
  border: '#E2E8F0',
};

// ── Category Definitions with Assets & Themes ──
const CATEGORY_MAP: Record<string, { label: string; emoji: string; color: string; bg: string; icon: any }> = {
  all: { label: 'All Shops', emoji: '🛍️', color: '#008B45', bg: '#E8F5E9', icon: require('../../assets/cat_men.png') },
  fashion: { label: 'Fashion & Clothes', emoji: '👗', color: '#EC4899', bg: '#FFF0F6', icon: require('../../assets/cat_women_western.png') },
  clothing: { label: 'Fashion & Clothes', emoji: '👗', color: '#EC4899', bg: '#FFF0F6', icon: require('../../assets/cat_women_western.png') },
  grocery: { label: 'Kirana & Grocery', emoji: '🛒', color: '#16A34A', bg: '#F6FFED', icon: require('../../assets/cat_grocery.png') },
  vegetables: { label: 'Fresh Veggies', emoji: '🥬', color: '#10B981', bg: '#ECFDF5', icon: require('../../assets/cat_grocery.png') },
  fruits: { label: 'Fresh Fruits', emoji: '🍎', color: '#EF4444', bg: '#FEF2F2', icon: require('../../assets/cat_grocery.png') },
  footwear: { label: 'Shoes & Footwear', emoji: '👟', color: '#F59E0B', bg: '#FFF7E6', icon: require('../../assets/cat_bags_footwear.png') },
  toys: { label: 'Kids & Toys', emoji: '🧸', color: '#8B5CF6', bg: '#F5F3FF', icon: require('../../assets/cat_kids_toys.png') },
  electronics: { label: 'Electronics & Mobile', emoji: '📱', color: '#3B82F6', bg: '#EFF6FF', icon: require('../../assets/cat_electronics.png') },
  bakery: { label: 'Bakery & Sweets', emoji: '🥐', color: '#D97706', bg: '#FFFBEB', icon: require('../../assets/cat_grocery.png') },
  sweets: { label: 'Mithai & Sweets', emoji: '🍬', color: '#F97316', bg: '#FFF7ED', icon: require('../../assets/cat_grocery.png') },
  dairy: { label: 'Dairy & Milk', emoji: '🥛', color: '#0284C7', bg: '#F0F9FF', icon: require('../../assets/cat_grocery.png') },
  pharmacy: { label: 'Medical & Health', emoji: '💊', color: '#059669', bg: '#ECFDF5', icon: require('../../assets/cat_beauty_health.png') },
  pet: { label: 'Pet Care', emoji: '🐾', color: '#6366F1', bg: '#EEF2FF', icon: require('../../assets/cat_pet_supplies.png') },
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Shops', emoji: '🛍️' },
  { id: 'fashion', label: 'Fashion & Boutique', emoji: '👗' },
  { id: 'grocery', label: 'Kirana & Grocery', emoji: '🛒' },
  { id: 'electronics', label: 'Electronics & Mobile', emoji: '📱' },
  { id: 'footwear', label: 'Footwear', emoji: '👟' },
  { id: 'toys', label: 'Kids & Toys', emoji: '🧸' },
  { id: 'bakery', label: 'Bakery & Sweets', emoji: '🍬' },
  { id: 'pharmacy', label: 'Medical Store', emoji: '💊' },
  { id: 'vegetables', label: 'Veggies & Fruits', emoji: '🥬' },
];

// Helper to get category aesthetic
const getShopAesthetic = (shop: any) => {
  const cat = (shop.category || '').toLowerCase();
  const name = (shop.shopName || shop.name || '').toLowerCase();
  const text = `${cat} ${name}`;

  if (text.includes('fashion') || text.includes('cloth') || text.includes('boutique') || text.includes('trend') || text.includes('saree')) {
    return CATEGORY_MAP.fashion;
  }
  if (text.includes('electronic') || text.includes('mobile') || text.includes('phone') || text.includes('gadget')) {
    return CATEGORY_MAP.electronics;
  }
  if (text.includes('shoe') || text.includes('footwear') || text.includes('sandal') || text.includes('step')) {
    return CATEGORY_MAP.footwear;
  }
  if (text.includes('toy') || text.includes('kid') || text.includes('wonderland') || text.includes('baby')) {
    return CATEGORY_MAP.toys;
  }
  if (text.includes('sweet') || text.includes('mithai') || text.includes('bakery') || text.includes('cake')) {
    return CATEGORY_MAP.bakery;
  }
  if (text.includes('pet') || text.includes('claw') || text.includes('paw')) {
    return CATEGORY_MAP.pet;
  }
  if (text.includes('pharmacy') || text.includes('medical') || text.includes('chemist')) {
    return CATEGORY_MAP.pharmacy;
  }
  if (text.includes('groc') || text.includes('kirana') || text.includes('mart') || text.includes('butter')) {
    return CATEGORY_MAP.grocery;
  }
  return CATEGORY_MAP.all;
};

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
// VIBRANT LOCAL SHOP CARD
// ══════════════════════════════════════════════════════════════
const ShopCardItem = React.memo(({ shop, onPress }: { shop: any; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const aesthetic = getShopAesthetic(shop);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const shopName = shop.shopName || shop.name || 'Local Verified Dukaan';
  const ownerName = shop.ownerName || shop.owner || 'Verified Merchant';
  const shopCategory = shop.category || aesthetic.label;
  const shopRating = Number(shop.rating) || 4.5;
  const shopImage = shop.image || shop.imageUrl || shop.banner || shop.logo || '';
  const isOpen = shop.isOpen !== undefined ? shop.isOpen : shop.isActive !== false;
  const distance = shop.distance || `${(Math.random() * 1.5 + 0.4).toFixed(1)} km`;
  const deliveryTime = shop.deliveryTime || `${Math.floor(Math.random() * 15 + 15)} MINS`;
  const offerText = shop.offer || 'Flat 15% OFF';

  // WhatsApp quick chat
  const handleChatWithDukaan = (e: any) => {
    e.stopPropagation?.();
    const msg = `Namaste ${shopName}, I found your dukaan on BazarPeth app. What are your popular deals today?`;
    Linking.openURL(`whatsapp://send?phone=919876543210&text=${encodeURIComponent(msg)}`).catch(() => {
      //
    });
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_WIDTH }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View style={styles.shopCard}>
          {/* Shop Hero Visual Header */}
          <View style={[styles.shopImageContainer, { backgroundColor: aesthetic.bg }]}>
            {shopImage ? (
              <Image source={{ uri: shopImage }} style={styles.shopImage} resizeMode="cover" />
            ) : (
              <View style={styles.shopIllustrationWrap}>
                <Image source={aesthetic.icon} style={styles.shopIllustrationImage} resizeMode="contain" />
              </View>
            )}

            {/* Bookmark Favorite Icon */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                shop.onToggleSave?.();
              }}
              style={styles.saveBookmarkBtn}
              activeOpacity={0.8}
            >
              <HugeIcon
                icon={FavouriteIcon}
                size={15}
                color={shop.isSaved ? '#EF4444' : '#64748B'}
              />
            </TouchableOpacity>

            {/* Open / Closed Live Status */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isOpen ? 'rgba(22, 163, 74, 0.92)' : 'rgba(100, 116, 139, 0.92)' },
              ]}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
            </View>

            {/* Fast Delivery Badge */}
            <View style={styles.deliveryBadgePill}>
              <HugeIcon icon={FlashIcon} size={11} color="#FFFFFF" />
              <Text style={styles.deliveryBadgeText}>{deliveryTime}</Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.shopCardBody}>
            {/* Category Tag & Rating */}
            <View style={styles.topInfoRow}>
              <View style={[styles.categoryPill, { backgroundColor: aesthetic.bg }]}>
                <Text style={[styles.categoryPillText, { color: aesthetic.color }]}>
                  {aesthetic.emoji} {shopCategory}
                </Text>
              </View>

              <View style={styles.ratingBadgeSmall}>
                <Text style={styles.ratingTextSmall}>{shopRating.toFixed(1)} ★</Text>
              </View>
            </View>

            {/* Shop Name */}
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName}
            </Text>

            {/* Owner & Distance Row */}
            <View style={styles.locationRow}>
              <HugeIcon icon={Location01Icon} size={12} color="#008B45" />
              <Text style={styles.locationText} numberOfLines={1}>
                {distance} • Sangamner Market
              </Text>
            </View>

            {/* Owner / Dukaan Subtitle */}
            <Text style={styles.ownerNameText} numberOfLines={1}>
              by {ownerName}
            </Text>

            {/* Offer Strip */}
            <View style={styles.offerStrip}>
              <HugeIcon icon={TagIcon} size={11} color="#D97706" />
              <Text style={styles.offerStripText} numberOfLines={1}>
                {offerText}
              </Text>
            </View>

            {/* Quick Action Button: Chat / Enter */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.chatActionBtn}
                onPress={handleChatWithDukaan}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13 }}>💬</Text>
                <Text style={styles.chatActionText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewStoreActionBtn}
                onPress={onPress}
                activeOpacity={0.85}
              >
                <Text style={styles.viewStoreActionText}>Shop</Text>
                <HugeIcon icon={ArrowRightIcon} size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ══════════════════════════════════════════════════════════════
// EMPTY & ERROR STATES
// ══════════════════════════════════════════════════════════════
const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.emptyContainer}>
    <Text style={{ fontSize: 56, marginBottom: 12 }}>🏪</Text>
    <Text style={styles.emptyTitle}>No dukaans found in this category</Text>
    <Text style={styles.emptySubtitle}>
      Try searching for another neighborhood shop or reset category filters.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <HugeIcon icon={ReloadIcon} size={16} color="#FFFFFF" />
      <Text style={styles.retryButtonText}>Refresh Market</Text>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Real-time Firestore listener for saved shops
  useEffect(() => {
    const unsubscribe = subscribeToSavedShops(uid, (savedList) => {
      setSavedShopIds(savedList.map((s) => s.id));
    });
    return () => unsubscribe();
  }, [uid]);

  // Real-time Firestore listener for shops
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

  // Filter shops by category & search query
  const filteredShops = useMemo(() => {
    let list = [...shops];

    if (activeCategory !== 'all') {
      list = list.filter((s) => {
        const cat = (s.category || '').toLowerCase();
        const name = (s.shopName || s.name || '').toLowerCase();
        return cat.includes(activeCategory) || name.includes(activeCategory);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.shopName || s.name || '').toLowerCase().includes(q) ||
          (s.ownerName || s.owner || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [shops, activeCategory, searchQuery]);

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
          onToggleSave: () => toggleSavedShop(uid, item),
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
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── 1. VIBRANT HERO BAZAR HEADER ── */}
            <View style={styles.heroBazarBanner}>
              <View style={styles.heroBannerTop}>
                <View style={styles.heroLocationPill}>
                  <HugeIcon icon={Location01Icon} size={12} color="#FFFFFF" />
                  <Text style={styles.heroLocationText}>Sangamner Bazar</Text>
                </View>
                <View style={styles.liveOpenBadge}>
                  <View style={styles.liveOpenDot} />
                  <Text style={styles.liveOpenText}>30+ Shops Open Now</Text>
                </View>
              </View>

              <Text style={styles.heroBannerTitle}>Apna Local Bazar 🏪</Text>
              <Text style={styles.heroBannerSubtitle}>
                Order directly from verified neighborhood Dukaans with 15-min delivery!
              </Text>

              {/* Live Search Input */}
              <View style={styles.searchBarWrap}>
                <HugeIcon icon={Search02Icon} size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Kirana, Boutique, Sweets, Footwear..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <HugeIcon icon={Cancel01Icon} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── 2. NEIGHBOURHOOD HIGHLIGHT CHIPS ── */}
            <View style={styles.chipsScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
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
            </View>

            {/* ── 3. RESULTS BAR ── */}
            {!loading && !error && (
              <View style={styles.resultsRow}>
                <HugeIcon icon={StoreIcon} size={15} color="#008B45" />
                <Text style={styles.resultsText}>
                  <Text style={{ fontWeight: '700', color: '#0F172A' }}>{filteredShops.length}</Text> Verified Local Dukaans Nearby
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
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 110,
  },
  gridRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },

  // ── 1. Hero Bazar Header ──
  heroBazarBanner: {
    backgroundColor: '#008B45',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#008B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  heroLocationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  liveOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  liveOpenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveOpenText: {
    color: '#008B45',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  heroBannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
    marginBottom: 4,
  },
  heroBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 14,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#0F172A',
    marginLeft: 8,
    paddingVertical: 0,
  },

  // ── 2. Category Chips ──
  chipsScrollWrap: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#008B45',
    borderColor: '#008B45',
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  chipLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  // ── 3. Results Row ──
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },

  // ── 4. Shop Card ──
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  shopImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopIllustrationWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopIllustrationImage: {
    width: 64,
    height: 64,
  },
  saveBookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  deliveryBadgePill: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  deliveryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

  // Card Body
  shopCardBody: {
    padding: 10,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  ratingBadgeSmall: {
    backgroundColor: '#15803D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingTextSmall: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  shopName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#008B45',
    flex: 1,
  },
  ownerNameText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginBottom: 6,
  },
  offerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    marginBottom: 8,
  },
  offerStripText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_700Bold',
    color: '#B45309',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 5,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  chatActionText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  viewStoreActionBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008B45',
    paddingVertical: 5,
    borderRadius: 6,
    gap: 2,
  },
  viewStoreActionText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },

  // ── Shimmer & Empty States ──
  shimmerImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
  },
  shimmerLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#008B45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});
