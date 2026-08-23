import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../config/firebase';
import { RootState } from '../store';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import SafeImage from '../components/SafeImage';
import BazarLoadingAnimation from '../components/BazarLoadingAnimation';
import { HugeIcon } from '../components/HugeIcon';
import {
  ArrowLeft01Icon,
  ShoppingBag01Icon,
  Search02Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
  FavouriteIcon,
  Add01Icon,
  MinusSignIcon,
  ShoppingCart01Icon,
  Tick01Icon,
  StoreIcon,
  ArrowRightIcon,
} from '@hugeicons/core-free-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = {
  CategoryProducts: {
    categoryId: string;
    categoryName?: string;
    subCategory?: string;
  };
};

export type EnhancedProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount?: number;
  vendor: string;
  imageUrl?: string;
  images?: string[];
  deliveryTime?: string;
  distance?: string;
  category?: string;
  subcategory?: string;
  isFastDelivery?: boolean;
  inStock?: boolean;
};

// Intelligent product category classifier to correctly handle messy or missing database categories
export const classifyProduct = (p: { name?: string; category?: string; subCategory?: string; subcategory?: string }): string => {
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  const sub = (p.subCategory || p.subcategory || '').toLowerCase();
  const text = `${name} ${cat} ${sub}`;

  // 1. Electronics & Gadgets
  if (
    cat === 'electronics' ||
    text.includes('iphone') || text.includes('phone') || text.includes('mobile') ||
    text.includes('airpods') || text.includes('earbuds') || text.includes('headphone') ||
    text.includes('laptop') || text.includes('smartwatch') || text.includes('inverter split ac') ||
    text.includes('refrigerator') || text.includes('wireless mouse') || text.includes('bluetooth') ||
    text.includes('camera') || text.includes('snapdragon')
  ) {
    return 'electronics';
  }

  // 2. Women's Ethnic & Western Clothing
  if (
    text.includes('women') || text.includes('kurta') || text.includes('kurti') ||
    text.includes('saree') || text.includes('lehenga') || text.includes('dupatta') ||
    text.includes('anarkali') || text.includes('gown') || text.includes('lingerie') ||
    text.includes('bra') || text.includes('panty') || text.includes('skirt') ||
    text.includes('palazzo') || text.includes('jeggings')
  ) {
    if (text.includes('kurti') || text.includes('saree') || text.includes('lehenga') || text.includes('anarkali') || text.includes('kurta')) {
      return 'kurti_saree_lehenga';
    }
    return 'women_western';
  }

  // 3. Men's Fashion & Clothing (Strict: must not be women's)
  if (
    text.includes('men') || text.includes('mens') || text.includes('boy') ||
    text.includes('shirt') || text.includes('t-shirt') || text.includes('tshirt') ||
    text.includes('trouser') || text.includes('jeans') || text.includes('polo') ||
    text.includes('blazer') || text.includes('hoodie') || text.includes('jogger')
  ) {
    return 'men';
  }

  // 4. Kitchen & Cookware
  if (
    cat.includes('kitchen') ||
    text.includes('kettle') || text.includes('kadai') || text.includes('cookware') ||
    text.includes('pan') || text.includes('pot') || text.includes('cooker')
  ) {
    return 'home_kitchen';
  }

  // 5. Grocery & Daily Needs
  if (
    cat.includes('grocery') || cat.includes('dairy') || cat.includes('tobacco') || cat.includes('food') ||
    text.includes('butter') || text.includes('rice') || text.includes('pasteurised') ||
    text.includes('cigarette') || text.includes('atta') || text.includes('oil') || text.includes('biscuit')
  ) {
    return 'grocery';
  }

  // 6. Beauty & Personal Care
  if (
    cat.includes('personal care') || cat.includes('beauty') ||
    text.includes('soap') || text.includes('shampoo') || text.includes('lotion') ||
    text.includes('lipstick') || text.includes('perfume') || text.includes('serum')
  ) {
    return 'beauty';
  }

  // 7. Kids & Toys
  if (text.includes('kids') || text.includes('baby') || text.includes('toy') || text.includes('toddler')) {
    return 'kids_toys';
  }

  // 8. Bags & Footwear
  if (text.includes('bag') || text.includes('shoe') || text.includes('sneaker') || text.includes('footwear') || text.includes('sandal')) {
    return 'bags';
  }

  // 9. Watches
  if (text.includes('watch') || text.includes('chronograph')) {
    return 'watches';
  }

  return cat || 'general';
};

// Preset subcategories tailored per category
const PRESET_SUBCATEGORIES: Record<string, string[]> = {
  men: ['All', 'T-Shirts', 'Shirts', 'Combos', 'Trousers & Jeans', 'Footwear', 'Watches'],
  women: ['All', 'Kurtis', 'Sarees', 'Dresses', 'Tops', 'Jeans', 'Jewellery', 'Bags'],
  women_western: ['All', 'Tops & Tunics', 'Dresses', 'T-Shirts', 'Jeans & Jeggings', 'Trousers', 'Skirts', 'Winterwear'],
  kurti_saree: ['All', 'Kurtis', 'Sarees', 'Silk Sarees', 'Kurti Sets', 'Lehenga', 'Party Wear'],
  kurti_saree_lehenga: ['All', 'Kurtis', 'Sarees', 'Silk Sarees', 'Kurti Sets', 'Lehenga', 'Party Wear'],
  grocery: ['All', 'Dairy & Eggs', 'Atta & Rice', 'Snacks & Munchies', 'Beverages', 'Instant Food', 'Spices'],
  electronics: ['All', 'Smartphones', 'Headphones & Earbuds', 'Smartwatches', 'Laptops', 'AC & Appliances', 'Accessories'],
  home_kitchen: ['All', 'Cookware & Kadais', 'Electric Kettles', 'Kitchen Tools', 'Storage', 'Home Decor'],
  beauty: ['All', 'Soaps & Body Wash', 'Skincare', 'Haircare', 'Makeup', 'Fragrances'],
  kids_toys: ['All', 'Boys Clothing', 'Girls Clothing', 'Baby Care', 'Educational Toys', 'Games'],
  bags: ['All', 'Backpacks', 'Handbags', 'Wallets', 'Casual Shoes', 'Sports Shoes'],
  jewellery: ['All', 'Necklaces', 'Earrings', 'Rings', 'Bangles & Bracelets', 'Pendants'],
  sports: ['All', 'Gym & Fitness', 'Sportswear', 'Cricket', 'Badminton', 'Yoga Mats'],
  watches: ['All', 'Smartwatches', 'Analog Watches', 'Digital Watches', 'Chronograph'],
};

export default function CategoryProductsScreen() {
  const route = useRoute<RouteProp<RouteParams, 'CategoryProducts'>>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const { categoryId, categoryName, subCategory: initialSubcategory } = route.params;

  // Redux state
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = useSelector((state: RootState) => state.cart.count);
  const cartTotal = useSelector((state: RootState) => state.cart.total);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  // Core product & loading state
  const [allCategoryProducts, setAllCategoryProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState(initialSubcategory || 'All');

  // Quick Filter Toggles
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);
  const [filterDiscount30Plus, setFilterDiscount30Plus] = useState(false);
  const [filterUnder500, setFilterUnder500] = useState(false);

  // Sort & Filter Modal State
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high' | 'rating' | 'discount'>('popularity');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  // Normalized Target Category Key
  const targetCategoryKey = useMemo(() => {
    const raw = (categoryId || categoryName || '').toLowerCase();
    if (raw.includes('men') && !raw.includes('women')) return 'men';
    if (raw.includes('kurti') || raw.includes('saree') || raw.includes('lehenga')) return 'kurti_saree_lehenga';
    if (raw.includes('women')) return 'women_western';
    if (raw.includes('elect')) return 'electronics';
    if (raw.includes('groc') || raw.includes('food') || raw.includes('dairy')) return 'grocery';
    if (raw.includes('kitchen') || raw.includes('home')) return 'home_kitchen';
    if (raw.includes('beauty') || raw.includes('health')) return 'beauty';
    if (raw.includes('kid') || raw.includes('toy')) return 'kids_toys';
    if (raw.includes('bag') || raw.includes('footwear')) return 'bags';
    if (raw.includes('watch')) return 'watches';
    if (raw.includes('jewel')) return 'jewellery';
    if (raw.includes('sport')) return 'sports';
    return raw;
  }, [categoryId, categoryName]);

  // Fetch Category Products from Firestore
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData: EnhancedProduct[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'Out of Stock' || data.isActive === false) return;

          const detectedCategory = classifyProduct({
            name: data.name,
            category: data.category,
            subCategory: data.subCategory || data.subcategory,
          });

          // Check if product belongs to this category
          let matchesCategory = false;
          if (targetCategoryKey === 'men') {
            matchesCategory = detectedCategory === 'men';
          } else if (targetCategoryKey === 'women_western' || targetCategoryKey === 'women') {
            matchesCategory = detectedCategory === 'women_western' || detectedCategory === 'kurti_saree_lehenga';
          } else if (targetCategoryKey === 'kurti_saree' || targetCategoryKey === 'kurti_saree_lehenga') {
            matchesCategory = detectedCategory === 'kurti_saree_lehenga';
          } else if (targetCategoryKey === 'electronics') {
            matchesCategory = detectedCategory === 'electronics';
          } else if (targetCategoryKey === 'grocery') {
            matchesCategory = detectedCategory === 'grocery';
          } else if (targetCategoryKey === 'home_kitchen') {
            matchesCategory = detectedCategory === 'home_kitchen';
          } else if (targetCategoryKey === 'beauty') {
            matchesCategory = detectedCategory === 'beauty';
          } else if (targetCategoryKey === 'kids_toys') {
            matchesCategory = detectedCategory === 'kids_toys';
          } else if (targetCategoryKey === 'bags') {
            matchesCategory = detectedCategory === 'bags';
          } else if (targetCategoryKey === 'watches') {
            matchesCategory = detectedCategory === 'watches';
          } else {
            // General matching
            matchesCategory =
              detectedCategory === targetCategoryKey ||
              (data.category || '').toLowerCase().includes(targetCategoryKey);
          }

          if (matchesCategory) {
            productsData.push({
              id: doc.id,
              name: data.name || 'Product',
              price: Number(data.price) || 0,
              originalPrice: Number(data.originalPrice) || Number(data.price) || 0,
              rating: Number(data.rating) || 4.2,
              reviewsCount: data.reviewsCount || Math.floor(Math.random() * 200 + 35),
              vendor: data.vendor || data.shop_name || 'Verified Seller',
              imageUrl: data.images?.[0] || data.imageUrl || data.image || undefined,
              images: data.images || [],
              deliveryTime: data.deliveryTime || '15-25 MINS',
              distance: data.distance || '1.2 km',
              category: detectedCategory,
              subcategory: data.subCategory || data.subcategory || '',
              isFastDelivery: Boolean(data.deliveryTime?.toLowerCase().includes('min') || data.isFastDelivery || true),
              inStock: true,
            });
          }
        });

        setAllCategoryProducts(productsData);
      } catch (error) {
        console.error('🔴 Error fetching category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [targetCategoryKey]);

  // Derive subcategory chips
  const subcategoryList = useMemo(() => {
    const preset = PRESET_SUBCATEGORIES[targetCategoryKey] || ['All', 'Popular', 'Trending', 'New Deals'];
    const fromProducts = Array.from(
      new Set(allCategoryProducts.map((p) => p.subcategory?.trim()).filter(Boolean))
    ) as string[];

    const combined = ['All', ...new Set([...preset.filter((s) => s !== 'All'), ...fromProducts])];
    return combined.slice(0, 8);
  }, [targetCategoryKey, allCategoryProducts]);

  // Derive available brands for filter modal
  const availableBrands = useMemo(() => {
    const brands = Array.from(
      new Set(allCategoryProducts.map((p) => p.vendor?.trim()).filter(Boolean))
    ) as string[];
    return ['All', ...brands];
  }, [allCategoryProducts]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...allCategoryProducts];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.vendor.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    }

    // 2. Subcategory Filter with intelligent word matching
    if (activeSubcategory && activeSubcategory !== 'All') {
      const target = activeSubcategory.toLowerCase();
      list = list.filter((p) => {
        const sub = (p.subcategory || '').toLowerCase();
        const name = p.name.toLowerCase();

        // Direct match
        if (sub.includes(target) || target.includes(sub)) return true;

        // Specific subcategory alias checks
        if (target.includes('t-shirt') || target.includes('tshirt') || target.includes('t shirt')) {
          return name.includes('t-shirt') || name.includes('tshirt') || name.includes('t shirt') || name.includes('tee');
        }
        if (target.includes('shirt') && !target.includes('t-shirt')) {
          return name.includes('shirt') || sub.includes('shirt');
        }
        if (target.includes('combo')) {
          return name.includes('combo') || name.includes('pack') || name.includes('set');
        }
        if (target.includes('trouser') || target.includes('jean')) {
          return name.includes('trouser') || name.includes('jean') || name.includes('pant') || name.includes('denim');
        }
        if (target.includes('kurti')) {
          return name.includes('kurti') || name.includes('kurta') || name.includes('anarkali');
        }
        if (target.includes('saree')) {
          return name.includes('saree') || name.includes('silk');
        }
        if (target.includes('kettle')) {
          return name.includes('kettle');
        }
        if (target.includes('cookware') || target.includes('kadai')) {
          return name.includes('kadai') || name.includes('pan') || name.includes('cookware');
        }
        if (target.includes('smartphone') || target.includes('mobile')) {
          return name.includes('iphone') || name.includes('phone') || name.includes('mobile') || name.includes('oneplus');
        }
        if (target.includes('headphone') || target.includes('earbud')) {
          return name.includes('airpods') || name.includes('earbuds') || name.includes('headphone');
        }

        return name.includes(target);
      });
    }

    // 3. Quick Filter: Fast Delivery
    if (filterFastDelivery) {
      list = list.filter((p) => p.isFastDelivery);
    }

    // 4. Quick Filter: 4.0+ Rating
    if (filterRating4Plus) {
      list = list.filter((p) => p.rating >= 4.0);
    }

    // 5. Quick Filter: 30%+ Discount
    if (filterDiscount30Plus) {
      list = list.filter((p) => {
        if (!p.originalPrice || p.originalPrice <= p.price) return false;
        const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        return discount >= 30;
      });
    }

    // 6. Quick Filter: Under ₹500
    if (filterUnder500) {
      list = list.filter((p) => p.price <= 500);
    }

    // 7. Brand Filter
    if (selectedBrand && selectedBrand !== 'All') {
      list = list.filter((p) => p.vendor.toLowerCase() === selectedBrand.toLowerCase());
    }

    // 8. Sorting
    if (sortBy === 'price_low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      });
    }

    return list;
  }, [
    allCategoryProducts,
    searchQuery,
    activeSubcategory,
    filterFastDelivery,
    filterRating4Plus,
    filterDiscount30Plus,
    filterUnder500,
    selectedBrand,
    sortBy,
  ]);

  // Cart Helper functions
  const getItemQuantity = (productId: string) => {
    const item = cartItems.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product: EnhancedProduct) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        vendor: product.vendor,
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleToggleWishlist = (productId: string) => {
    dispatch(toggleWishlist(productId));
  };

  const activeFilterCount =
    (filterFastDelivery ? 1 : 0) +
    (filterRating4Plus ? 1 : 0) +
    (filterDiscount30Plus ? 1 : 0) +
    (filterUnder500 ? 1 : 0) +
    (selectedBrand !== 'All' ? 1 : 0) +
    (sortBy !== 'popularity' ? 1 : 0);

  const resetAllFilters = () => {
    setFilterFastDelivery(false);
    setFilterRating4Plus(false);
    setFilterDiscount30Plus(false);
    setFilterUnder500(false);
    setSelectedBrand('All');
    setSortBy('popularity');
    setActiveSubcategory('All');
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. TOP HEADER ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <HugeIcon icon={ArrowLeft01Icon} size={22} color="#1A1A1A" />
        </TouchableOpacity>

        {isSearchOpen ? (
          <View style={styles.headerSearchInputWrap}>
            <HugeIcon icon={Search02Icon} size={18} color="#71717A" />
            <TextInput
              style={styles.headerSearchInput}
              placeholder={`Search in ${categoryName || 'Products'}...`}
              placeholderTextColor="#A1A1AA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <HugeIcon icon={Cancel01Icon} size={18} color="#71717A" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryName || 'Category Products'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Finding deals...' : `${filteredProducts.length} items available`}
            </Text>
          </View>
        )}

        {/* Right Header Actions */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setIsSearchOpen(!isSearchOpen)}
            activeOpacity={0.7}
          >
            <HugeIcon icon={isSearchOpen ? Cancel01Icon : Search02Icon} size={20} color="#1A1A1A" />
          </TouchableOpacity>

          {/* Cart Icon with Live Badge */}
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => {
              navigation.navigate('MainTabs', { screen: 'Cart' });
            }}
            activeOpacity={0.7}
          >
            <HugeIcon icon={ShoppingCart01Icon} size={22} color="#1A1A1A" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. PROMO STRIP ── */}
      <View style={styles.promoBannerStrip}>
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>⚡ SUPER SALE</Text>
        </View>
        <Text style={styles.promoText} numberOfLines={1}>
          Instant local delivery & up to 60% OFF on verified brands!
        </Text>
      </View>

      {/* ── 3. HORIZONTAL SUBCATEGORY PILLS ── */}
      <View style={styles.subcategoryScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subcategoryContent}
        >
          {subcategoryList.map((subName) => {
            const isActive = activeSubcategory === subName;
            return (
              <TouchableOpacity
                key={subName}
                style={[styles.subPill, isActive && styles.subPillActive]}
                onPress={() => setActiveSubcategory(subName)}
                activeOpacity={0.8}
              >
                {isActive && <Text style={styles.subPillCheck}>✓ </Text>}
                <Text style={[styles.subPillText, isActive && styles.subPillTextActive]}>
                  {subName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. QUICK FILTER & SORT TOOLBAR ── */}
      <View style={styles.filterToolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterToolbarContent}>
          {/* Main Filter & Sort Modal Button */}
          <TouchableOpacity
            style={[styles.filterChip, activeFilterCount > 0 && styles.filterChipActive]}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <HugeIcon
              icon={SlidersHorizontalIcon}
              size={14}
              color={activeFilterCount > 0 ? '#008B45' : '#4B5563'}
            />
            <Text style={[styles.filterChipText, activeFilterCount > 0 && styles.filterChipTextActive]}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>

          {/* Quick Filter: Fast Delivery */}
          <TouchableOpacity
            style={[styles.filterChip, filterFastDelivery && styles.filterChipActive]}
            onPress={() => setFilterFastDelivery(!filterFastDelivery)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipEmoji}>⚡</Text>
            <Text style={[styles.filterChipText, filterFastDelivery && styles.filterChipTextActive]}>
              Fast Delivery
            </Text>
          </TouchableOpacity>

          {/* Quick Filter: 4.0+ Rating */}
          <TouchableOpacity
            style={[styles.filterChip, filterRating4Plus && styles.filterChipActive]}
            onPress={() => setFilterRating4Plus(!filterRating4Plus)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipEmoji}>⭐</Text>
            <Text style={[styles.filterChipText, filterRating4Plus && styles.filterChipTextActive]}>
              4.0+ Rating
            </Text>
          </TouchableOpacity>

          {/* Quick Filter: 30%+ Off */}
          <TouchableOpacity
            style={[styles.filterChip, filterDiscount30Plus && styles.filterChipActive]}
            onPress={() => setFilterDiscount30Plus(!filterDiscount30Plus)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipEmoji}>🔥</Text>
            <Text style={[styles.filterChipText, filterDiscount30Plus && styles.filterChipTextActive]}>
              30%+ Off
            </Text>
          </TouchableOpacity>

          {/* Quick Filter: Under ₹500 */}
          <TouchableOpacity
            style={[styles.filterChip, filterUnder500 && styles.filterChipActive]}
            onPress={() => setFilterUnder500(!filterUnder500)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterChipEmoji}>🏷️</Text>
            <Text style={[styles.filterChipText, filterUnder500 && styles.filterChipTextActive]}>
              Under ₹500
            </Text>
          </TouchableOpacity>

          {/* Reset Filters chip */}
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.filterResetChip} onPress={resetAllFilters}>
              <Text style={styles.filterResetText}>Reset ✕</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ── 5. PRODUCT LIST & CARDS ── */}
      {loading ? (
        <BazarLoadingAnimation
          fullScreen={false}
          size="medium"
          message={`Loading ${categoryName || 'Products'}... 🛍️`}
          submessage="Checking live inventory in Sangamner Market..."
        />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HugeIcon icon={ShoppingBag01Icon} size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found in this category</Text>
          <Text style={styles.emptySubtitle}>Try changing subcategories or resetting filters.</Text>
          <TouchableOpacity style={styles.emptyActionBtn} onPress={resetAllFilters}>
            <Text style={styles.emptyActionText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.listContent, cartCount > 0 && { paddingBottom: 110 }]}
          columnWrapperStyle={styles.listColumnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const quantity = getItemQuantity(item.id);
            const isWishlisted = wishlistItems.includes(item.id);
            const discount =
              item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;

            return (
              <View style={styles.cardContainer}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                >
                  {/* Image Container */}
                  <View style={styles.imageWrap}>
                    <SafeImage
                      uri={item.imageUrl || item.images?.[0]}
                      style={styles.productImage}
                      resizeMode="cover"
                    />

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
                      </View>
                    )}

                    {/* Wishlist Heart Button */}
                    <TouchableOpacity
                      style={styles.wishlistBtn}
                      onPress={() => handleToggleWishlist(item.id)}
                      activeOpacity={0.8}
                    >
                      <HugeIcon
                        icon={FavouriteIcon}
                        size={16}
                        color={isWishlisted ? '#EF4444' : '#64748B'}
                      />
                    </TouchableOpacity>

                    {/* Fast Delivery Pill */}
                    {item.isFastDelivery && (
                      <View style={styles.fastDeliveryTag}>
                        <Text style={styles.fastDeliveryTagText}>⚡ {item.deliveryTime}</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Info */}
                  <View style={styles.cardInfo}>
                    {/* Rating & Reviews */}
                    <View style={styles.ratingRow}>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)} ★</Text>
                      </View>
                      <Text style={styles.reviewsCountText}>({item.reviewsCount})</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {item.name}
                    </Text>

                    {/* Vendor Shop Name */}
                    <View style={styles.vendorRow}>
                      <HugeIcon icon={StoreIcon} size={11} color="#94A3B8" />
                      <Text style={styles.vendorText} numberOfLines={1}>
                        {item.vendor}
                      </Text>
                    </View>

                    {/* Price & Add to Cart Counter Row */}
                    <View style={styles.priceAndActionRow}>
                      <View style={styles.priceColumn}>
                        <Text style={styles.currentPrice}>₹{item.price}</Text>
                        {item.originalPrice > item.price && (
                          <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                        )}
                      </View>

                      {/* Interactive ADD / Quantity Counter */}
                      {quantity === 0 ? (
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddToCart(item)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.addBtnText}>ADD</Text>
                          <HugeIcon icon={Add01Icon} size={12} color="#008B45" />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.quantityStepper}>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => handleRemoveFromCart(item.id)}
                            activeOpacity={0.7}
                          >
                            <HugeIcon icon={MinusSignIcon} size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.stepperQuantityText}>{quantity}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => handleAddToCart(item)}
                            activeOpacity={0.7}
                          >
                            <HugeIcon icon={Add01Icon} size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* ── 6. FLOATING BOTTOM CART STRIP ── */}
      {cartCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
            activeOpacity={0.9}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.cartIconCircle}>
                <HugeIcon icon={ShoppingCart01Icon} size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.floatingCartItemCount}>
                  {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
                </Text>
                <Text style={styles.floatingCartPrice}>₹{cartTotal}</Text>
              </View>
            </View>

            <View style={styles.floatingCartRight}>
              <Text style={styles.floatingCartCtaText}>View Cart</Text>
              <HugeIcon icon={ArrowRightIcon} size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 7. SORT & FILTER BOTTOM SHEET MODAL ── */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsFilterModalVisible(false)}
          />
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <HugeIcon icon={Cancel01Icon} size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Sort By Options */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptionsWrap}>
                {[
                  { id: 'popularity', label: '🔥 Popularity (Default)' },
                  { id: 'price_low', label: '💰 Price: Low to High' },
                  { id: 'price_high', label: '💎 Price: High to Low' },
                  { id: 'rating', label: '⭐ Customer Rating (4★+)' },
                  { id: 'discount', label: '🏷️ Biggest Discount %' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sortRadioRow, sortBy === opt.id && styles.sortRadioRowSelected]}
                    onPress={() => setSortBy(opt.id as any)}
                  >
                    <Text style={[styles.sortRadioText, sortBy === opt.id && styles.sortRadioTextSelected]}>
                      {opt.label}
                    </Text>
                    {sortBy === opt.id && <HugeIcon icon={Tick01Icon} size={18} color="#008B45" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brands Filter */}
              {availableBrands.length > 1 && (
                <>
                  <Text style={styles.filterSectionTitle}>Filter by Shop / Brand</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {availableBrands.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.brandChip, selectedBrand === b && styles.brandChipSelected]}
                        onPress={() => setSelectedBrand(b)}
                      >
                        <Text style={[styles.brandChipText, selectedBrand === b && styles.brandChipTextSelected]}>
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalResetBtn} onPress={resetAllFilters}>
                <Text style={styles.modalResetBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Text style={styles.modalApplyBtnText}>
                  Apply Filters ({filteredProducts.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconBtn: {
    padding: 6,
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  headerSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#0F172A',
    marginLeft: 6,
    paddingVertical: 0,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    padding: 6,
  },
  headerCartBtn: {
    padding: 6,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF5200',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

  // 2. Promo Strip
  promoBannerStrip: {
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  promoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9A3412',
  },

  // 3. Subcategories Scroll
  subcategoryScrollWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subcategoryContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  subPillActive: {
    backgroundColor: '#008B45',
    borderColor: '#008B45',
  },
  subPillCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  subPillText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  subPillTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  // 4. Filter Toolbar
  filterToolbar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterToolbarContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
  },
  filterChipEmoji: {
    fontSize: 11,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
    marginLeft: 3,
  },
  filterChipTextActive: {
    color: '#008B45',
    fontFamily: 'Poppins_700Bold',
  },
  filterResetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  filterResetText: {
    color: '#DC2626',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },

  // 5. Product Grid
  listContent: {
    padding: 10,
    paddingBottom: 40,
  },
  listColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardContainer: {
    width: (SCREEN_WIDTH - 28) / 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fastDeliveryTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastDeliveryTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardInfo: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingBadge: {
    backgroundColor: '#15803D',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 4,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  reviewsCountText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  productTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
    lineHeight: 16,
    marginBottom: 4,
    minHeight: 32,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorText: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginLeft: 3,
    flex: 1,
  },
  priceAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  originalPrice: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  addBtnText: {
    color: '#008B45',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008B45',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperQuantityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    minWidth: 16,
    textAlign: 'center',
  },

  // 6. Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyActionBtn: {
    backgroundColor: '#008B45',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },

  // 7. Floating Bottom Cart Strip
  floatingCartContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingCartBar: {
    backgroundColor: '#008B45',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartItemCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  floatingCartPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingCartCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },

  // 8. Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  modalScrollBody: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
    marginBottom: 10,
    marginTop: 6,
  },
  sortOptionsWrap: {
    gap: 8,
    marginBottom: 18,
  },
  sortRadioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortRadioRowSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
  },
  sortRadioText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#334155',
  },
  sortRadioTextSelected: {
    color: '#008B45',
    fontFamily: 'Poppins_700Bold',
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  brandChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#008B45',
  },
  brandChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  brandChipTextSelected: {
    color: '#008B45',
    fontFamily: 'Poppins_700Bold',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalResetBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#475569',
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#008B45',
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
});
