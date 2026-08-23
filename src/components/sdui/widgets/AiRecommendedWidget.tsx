import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/slices/cartSlice';
import SafeImage from '../../SafeImage';
import type { AiRecommendedData } from '../../../types/sdui';

interface Props {
  data: AiRecommendedData;
}

export default function AiRecommendedWidget({ data }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const variant = data?.variant || 'carousel';
  const title = data?.title || 'Picked for You';

  useEffect(() => {
    const productIds = data?.productIds;
    if (!productIds || productIds.length === 0) return;

    const fetchProducts = async () => {
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < productIds.length; i += 10) {
          chunks.push(productIds.slice(i, i + 10));
        }
        let fetched: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
        }
        fetched.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));
        setProducts(fetched);
      } catch (err) {
        console.error('🔴 [AiRecommended] Error:', err);
      }
    };
    fetchProducts();
  }, [data?.productIds]);

  if (products.length === 0) return null;

  const renderProductCard = (product: any) => {
    const discount =
      product.originalPrice > 0
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
      <TouchableOpacity
        key={product.id}
        style={variant === 'grid' ? styles.gridCard : styles.carouselCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      >
        <View style={variant === 'grid' ? styles.gridImageWrap : styles.carouselImageWrap}>
          <SafeImage
            uri={product.images?.[0] || product.image || product.imageUrl}
            style={variant === 'grid' ? styles.gridImage : styles.carouselImage}
            resizeMode="cover"
          />
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}

          {/* AI Badge */}
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🤖 AI</Text>
          </View>
        </View>

        <View style={styles.infoWrap}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.originalPrice > product.price ? (
              <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              dispatch(
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  originalPrice: product.originalPrice || product.price,
                  imageUrl: product.images?.[0] || product.image || product.imageUrl,
                  quantity: 1,
                  vendor: product.vendor,
                })
              );
            }}
          >
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#6D28D9'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>AI CURATED</Text>
        </View>
      </LinearGradient>

      {/* Products */}
      {variant === 'grid' ? (
        <View style={styles.gridWrap}>
          {products.map(renderProductCard)}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.map(renderProductCard)}
        </ScrollView>
      )}
    </View>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
  },

  // Header
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },

  // Carousel cards
  carouselCard: {
    width: 155,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  carouselImageWrap: {
    width: 155,
    height: 130,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  carouselImage: {
    width: 155,
    height: 130,
  },

  // Grid cards
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  gridImageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
  },

  // Badges
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

  // Info
  infoWrap: {
    padding: 10,
  },
  productName: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
  },
  originalPrice: {
    fontSize: 10,
    fontFamily: 'Poppins_300Light',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
});
