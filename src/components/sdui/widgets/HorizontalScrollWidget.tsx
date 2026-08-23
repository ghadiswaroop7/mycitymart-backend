import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/slices/cartSlice';
import SafeImage from '../../SafeImage';
import type { HorizontalScrollData } from '../../../types/sdui';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  data: HorizontalScrollData;
}

export default function HorizontalScrollWidget({ data }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const variant = data?.variant || 'product';

  // Fetch products if variant is 'product' and productIds are given
  useEffect(() => {
    if (variant !== 'product' || !data?.productIds?.length) return;

    const fetchProducts = async () => {
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < data.productIds!.length; i += 10) {
          chunks.push(data.productIds!.slice(i, i + 10));
        }
        let fetched: any[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
          const snap = await getDocs(q);
          snap.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
        }
        fetched.sort((a, b) => data.productIds!.indexOf(a.id) - data.productIds!.indexOf(b.id));
        setProducts(fetched);
      } catch (err) {
        console.error('🔴 [HorizontalScroll] Error:', err);
      }
    };
    fetchProducts();
  }, [data?.productIds, variant]);

  const items = data?.items || [];
  if (variant !== 'product' && items.length === 0) return null;
  if (variant === 'product' && products.length === 0 && !data?.productIds?.length) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{data?.title || 'Featured'}</Text>
        {data?.viewAllLink ? (
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View all →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── PRODUCT variant ── */}
        {variant === 'product' &&
          products.map((product) => {
            const discount =
              product.originalPrice > 0
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              >
                <View style={styles.productImageWrap}>
                  <SafeImage
                    uri={product.images?.[0] || product.image || product.imageUrl}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  {discount > 0 ? (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}%</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.productInfo}>
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
          })}

        {/* ── BRAND variant ── */}
        {variant === 'brand' &&
          items.map((item: any, i: number) => (
            <TouchableOpacity key={`brand-${i}`} style={styles.brandCard} activeOpacity={0.88}>
              <View style={styles.brandImageWrap}>
                <SafeImage uri={item.imageUrl} style={styles.brandImage} resizeMode="contain" />
              </View>
              <Text style={styles.brandName} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}

        {/* ── CATEGORY variant ── */}
        {variant === 'category' &&
          items.map((item: any, i: number) => (
            <TouchableOpacity key={`cat-${i}`} style={styles.categoryCard} activeOpacity={0.88}>
              <View style={styles.categoryImageWrap}>
                <SafeImage uri={item.imageUrl} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.subtitle ? (
                <Text style={styles.categorySub} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
  },
  viewAllBtn: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#71717A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },

  // Product variant
  productCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  productImageWrap: {
    width: 160,
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: 160,
    height: 140,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
  },
  originalPrice: {
    fontSize: 11,
    fontFamily: 'Poppins_300Light',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },

  // Brand variant
  brandCard: {
    width: 90,
    alignItems: 'center',
  },
  brandImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  brandImage: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Category variant
  categoryCard: {
    width: 100,
    alignItems: 'center',
  },
  categoryImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryImage: {
    width: 80,
    height: 80,
  },
  categoryName: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  categorySub: {
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    color: '#71717A',
    textAlign: 'center',
    marginTop: 1,
  },
});
