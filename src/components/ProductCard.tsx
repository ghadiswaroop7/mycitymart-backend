import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist, syncWishlistToFirestore } from '../store/slices/wishlistSlice';
import { RootState } from '../store';
import SafeImage from './SafeImage';
import { HugeIcon } from './HugeIcon';
import { FavouriteIcon, StarIcon, CheckmarkBadge01Icon } from '@hugeicons/core-free-icons';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

import { getProductImage } from '../utils/productImages';

export type ProductProps = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  vendor?: string;
  shopName?: string;
  imageUrl?: string;
  images?: string[];
  image?: string;
  thumbnail?: string;
  deliveryTime?: string;
  distance?: string;
  isFastDelivery?: boolean;
  inStock?: boolean;
  category?: string;
  emoji?: string;
};

function ProductCard({ product }: { product: ProductProps }) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const [isAdded, setIsAdded] = useState(false);

  const authUser = useSelector((state: RootState) => state.auth.user);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isWishlisted = wishlistItems.includes(product.id);

  const handleAdd = (e: any) => {
    e.stopPropagation?.();
    const primaryImg = getProductImage(product);
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      quantity: 1,
      imageUrl: primaryImg,
      vendor: product.vendor || product.shopName || 'Verified Store',
    }));
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  const handleToggleWishlist = (e: any) => {
    e.stopPropagation?.();
    dispatch(toggleWishlist(product.id));
    if (authUser?.uid) {
      const updated = isWishlisted
        ? wishlistItems.filter(id => id !== product.id)
        : [...wishlistItems, product.id];
      dispatch(syncWishlistToFirestore({ uid: authUser.uid, items: updated }) as any);
    }
  };

  const originalPrice = product.originalPrice || 0;
  const price = product.price || 0;
  const discount = originalPrice > price && originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const ratingVal = product.rating ? Number(product.rating).toFixed(1) : '4.3';
  const reviewsTotal = product.reviewCount || product.reviewsCount || 18;
  const vendorName = product.vendor || product.shopName || 'Verified Store';
  const imageUri = getProductImage(product);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      style={styles.card}
    >
      {/* ── IMAGE WRAPPER WITH FLOATING BADGES ── */}
      <View style={styles.imageContainer}>
        <SafeImage
          uri={imageUri}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fallbackEmoji={product.emoji}
          fallbackText={product.name}
        />

        {/* Wishlist Floating Action */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleWishlist}
          style={styles.wishlistBtn}
        >
          <HugeIcon
            icon={FavouriteIcon}
            size={16}
            color={isWishlisted ? BAZAR_COLORS.error : '#64748B'}
            fill={isWishlisted ? BAZAR_COLORS.error : 'none'}
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        ) : null}

        {/* Zepto-style Omnipresent Delivery Promise */}
        <View style={styles.deliveryPill}>
          <Text style={styles.deliveryText}>⚡ {product.deliveryTime || '25 mins'}</Text>
        </View>
      </View>

      {/* ── PRODUCT CONTENT & PRICING ── */}
      <View style={styles.content}>
        {/* Verified Store Chip */}
        <View style={styles.vendorRow}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {vendorName}
          </Text>
          <HugeIcon icon={CheckmarkBadge01Icon} size={11} color={BAZAR_COLORS.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{ratingVal}</Text>
            <HugeIcon icon={StarIcon} size={9} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text style={styles.reviewsCount}>({reviewsTotal})</Text>
        </View>

        {/* Pricing & Quick Add CTA */}
        <View style={styles.footerRow}>
          <View style={styles.priceCol}>
            <View style={styles.priceWrapper}>
              <Text style={styles.currentPrice}>₹{price.toLocaleString('en-IN')}</Text>
              {originalPrice > price ? (
                <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={[styles.addBtn, isAdded && styles.addBtnSuccess]}
          >
            <Text style={[styles.addBtnText, isAdded && styles.addBtnTextSuccess]}>
              {isAdded ? 'ADDED ✓' : '+ ADD'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BAZAR_COLORS.surface,
    borderRadius: BAZAR_RADIUS.lg,
    borderWidth: 1,
    borderColor: BAZAR_COLORS.cardBorder,
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
    ...BAZAR_SHADOWS.sm,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: BAZAR_COLORS.background,
    position: 'relative',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: BAZAR_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    ...BAZAR_SHADOWS.sm,
    zIndex: 10,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: BAZAR_COLORS.accentOrange,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BAZAR_RADIUS.xs,
    zIndex: 10,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: BAZAR_FONTS.extrabold,
    letterSpacing: 0.3,
  },
  deliveryPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BAZAR_RADIUS.xs,
  },
  deliveryText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: BAZAR_FONTS.semibold,
  },
  content: {
    padding: 10,
    paddingTop: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },
  vendorName: {
    fontFamily: BAZAR_FONTS.medium,
    fontSize: 10.5,
    color: BAZAR_COLORS.textSecondary,
    maxWidth: '85%',
  },
  title: {
    fontFamily: BAZAR_FONTS.semibold,
    fontSize: 12.5,
    color: BAZAR_COLORS.textPrimary,
    lineHeight: 17,
    minHeight: 34,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BAZAR_COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: BAZAR_FONTS.bold,
  },
  reviewsCount: {
    fontSize: 10,
    fontFamily: BAZAR_FONTS.regular,
    color: BAZAR_COLORS.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: BAZAR_COLORS.divider,
  },
  priceCol: {
    flex: 1,
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentPrice: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 14,
    color: BAZAR_COLORS.textPrimary,
  },
  originalPrice: {
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 11,
    color: BAZAR_COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: BAZAR_COLORS.primaryLight,
    borderWidth: 1,
    borderColor: BAZAR_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BAZAR_RADIUS.sm,
  },
  addBtnSuccess: {
    backgroundColor: BAZAR_COLORS.primary,
    borderColor: BAZAR_COLORS.primary,
  },
  addBtnText: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 11,
    color: BAZAR_COLORS.primary,
  },
  addBtnTextSuccess: {
    color: '#FFFFFF',
  },
});

export default React.memo(ProductCard);
