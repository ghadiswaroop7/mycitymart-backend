import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { collection, query, where, getDocs, documentId, limit as fbLimit, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/slices/cartSlice';
import SafeImage from '../../SafeImage';
import type { MasonryFeedData } from '../../../types/sdui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_GAP = 10;
const HORIZONTAL_PADDING = 16;
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

interface Props {
  data: MasonryFeedData;
}

export default function MasonryFeedWidget({ data }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let fetchedProducts: any[] = [];

        if (data?.productIds?.length) {
          // Fetch specific products by IDs (Firestore 'in' max 10 at a time)
          const chunks: string[][] = [];
          for (let i = 0; i < data.productIds.length; i += 10) {
            chunks.push(data.productIds.slice(i, i + 10));
          }
          for (const chunk of chunks) {
            const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
            const snap = await getDocs(q);
            snap.forEach((doc) => fetchedProducts.push({ id: doc.id, ...doc.data() }));
          }
          // Maintain Firestore-specified order
          fetchedProducts.sort(
            (a, b) => data.productIds!.indexOf(a.id) - data.productIds!.indexOf(b.id)
          );
        } else {
          // Fallback: fetch by category or latest products
          let q;
          if (data?.categoryFilter) {
            q = query(
              collection(db, 'products'),
              where('category', '==', data.categoryFilter),
              fbLimit(data?.limit || 20)
            );
          } else {
            q = query(
              collection(db, 'products'),
              fbLimit(data?.limit || 20)
            );
          }
          const snap = await getDocs(q);
          snap.forEach((doc) => fetchedProducts.push({ id: doc.id, ...doc.data() }));
        }

        setProducts(fetchedProducts);
      } catch (err) {
        console.error('🔴 [MasonryFeed] Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [data?.productIds, data?.categoryFilter, data?.limit]);

  if (loading) {
    // Skeleton loader
    return (
      <View style={styles.container}>
        {data?.title ? (
          <View style={styles.titleSkeleton} />
        ) : null}
        <View style={styles.masonryWrap}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonCard, { height: 180 + (i % 3) * 40 }]} />
          ))}
        </View>
      </View>
    );
  }

  if (products.length === 0) return null;

  // Split into two columns for masonry effect
  const leftCol: any[] = [];
  const rightCol: any[] = [];
  products.forEach((p, i) => {
    if (i % 2 === 0) leftCol.push(p);
    else rightCol.push(p);
  });

  const renderCard = (product: any) => {
    const discount =
      product.originalPrice > 0
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    // Dynamic height for masonry effect
    const imageHeight = 160 + ((product.name?.length || 0) % 5) * 20;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      >
        {/* Product Image */}
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          <SafeImage
            uri={product.images?.[0] || product.image || product.imageUrl}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Discount Badge */}
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}

          {/* UPI Badge */}
          {data?.showUPIBadge ? (
            <View style={styles.upiBadge}>
              <Text style={styles.upiText}>UPI ₹</Text>
            </View>
          ) : null}
        </View>

        {/* Info Section */}
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

          {/* Add Button */}
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
      {data?.title ? (
        <Text style={styles.sectionTitle}>{data.title}</Text>
      ) : null}

      <View style={styles.masonryWrap}>
        <View style={styles.column}>{leftCol.map(renderCard)}</View>
        <View style={styles.column}>{rightCol.map(renderCard)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  masonryWrap: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
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
  upiBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#5B21B6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  upiText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
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
    backgroundColor: '#008B45',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  // Skeleton
  titleSkeleton: {
    width: 150,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: COLUMN_GAP,
  },
});
