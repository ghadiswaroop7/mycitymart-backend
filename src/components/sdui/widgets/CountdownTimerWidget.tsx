import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/slices/cartSlice';
import SafeImage from '../../SafeImage';
import type { CountdownTimerData } from '../../../types/sdui';

interface Props {
  data: CountdownTimerData;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getTimeLeft(endsAt: any): TimeLeft {
  let endTime: number;

  if (endsAt?.toDate) {
    // Firestore Timestamp
    endTime = endsAt.toDate().getTime();
  } else if (endsAt?.seconds) {
    // Firestore Timestamp-like object
    endTime = endsAt.seconds * 1000;
  } else if (typeof endsAt === 'string') {
    endTime = new Date(endsAt).getTime();
  } else if (typeof endsAt === 'number') {
    endTime = endsAt;
  } else {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const diff = endTime - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export default function CountdownTimerWidget({ data }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(data?.endsAt));
  const [products, setProducts] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // Live countdown
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(getTimeLeft(data?.endsAt));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data?.endsAt]);

  // Fetch products
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
        console.error('🔴 [CountdownTimer] Error:', err);
      }
    };
    fetchProducts();
  }, [data?.productIds]);

  const gradientColors = (data?.bgGradient || ['#0F172A', '#1E293B']) as [string, string];
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.flashIcon}>⚡</Text>
          <Text style={styles.title}>{data?.title || 'Flash Sale'}</Text>
        </View>

        {/* Timer Boxes */}
        {timeLeft.expired ? (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>SALE ENDED</Text>
          </View>
        ) : (
          <View style={styles.timerRow}>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{pad(timeLeft.hours)}</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{pad(timeLeft.minutes)}</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{pad(timeLeft.seconds)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Products Horizontal Scroll */}
      {products.length > 0 && !timeLeft.expired && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.map((product) => {
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
                      <Text style={styles.discountText}>-{discount}%</Text>
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
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flashIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timerBox: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  timerColon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  expiredBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiredText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  productCard: {
    width: 155,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  productImageWrap: {
    width: 155,
    height: 120,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: 155,
    height: 120,
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
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  productInfo: {
    padding: 10,
    backgroundColor: '#1E293B',
  },
  productName: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
    marginBottom: 4,
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
    color: '#FFFFFF',
  },
  originalPrice: {
    fontSize: 10,
    fontFamily: 'Poppins_300Light',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#000',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
});
