import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { collection, query, getDocs, limit as fbLimit, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/slices/cartSlice';
import SafeImage from '../../SafeImage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_GAP = 10;
const HORIZONTAL_PADDING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

interface Props {
  data?: {
    title?: string;
    subtitle?: string;
    items?: any[];
    limit?: number;
    category?: string;
  };
  style?: any;
}

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Yeola Pure Silk Paithani', price: '₹1,899', originalPrice: '₹3,499', discount: '45% OFF', rating: '4.8', shopName: 'Swastik Paithani', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80' },
  { id: 'p2', name: 'Farm Fresh A2 Gir Cow Milk', price: '₹75', originalPrice: '₹90', discount: '₹15 OFF', rating: '4.9', shopName: 'Sangamner Kirana', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { id: 'p3', name: 'Wireless TWS Earbuds 50H', price: '₹899', originalPrice: '₹2,499', discount: '64% OFF', rating: '4.7', shopName: 'Gadget World', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80' },
  { id: 'p4', name: 'Sangamner Special Pedha 500g', price: '₹220', originalPrice: '₹260', discount: '15% OFF', rating: '4.9', shopName: 'Mahalaxmi Sweets', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80' },
];

export default function ProductGridWidget({ data }: Props) {
  const [products, setProducts] = useState<any[]>(data?.items || []);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  useEffect(() => {
    if (data?.items && data.items.length > 0) {
      setProducts(data.items);
      return;
    }

    const fetchLive = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), fbLimit(data?.limit || 6));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setProducts(list);
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } catch (e) {
        setProducts(DEFAULT_PRODUCTS);
      }
    };
    fetchLive();
  }, [data]);

  const handleAddToCart = (p: any, e: any) => {
    e.stopPropagation?.();
    const numPrice = typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^0-9]/g, '')) || 499;
    dispatch(
      addToCart({
        id: p.id,
        name: p.name || p.title,
        price: numPrice,
        originalPrice: p.originalPrice ? (typeof p.originalPrice === 'number' ? p.originalPrice : parseInt(String(p.originalPrice).replace(/[^0-9]/g, '')) || numPrice) : numPrice,
        image: p.image || p.imageUrl,
        vendor: p.shopName || 'BazarPeth Store',
        quantity: 1,
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛍️ {data?.title || 'Sangamner Best Sellers'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CategoryProducts', { title: data?.title || 'Products' })}>
          <Text style={styles.viewAll}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* 2-Column Product Grid */}
      <View style={styles.grid}>
        {products.map((p) => {
          const priceDisplay = typeof p.price === 'number' ? `₹${p.price}` : p.price;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ProductDetail', { productId: p.id, product: p })}
              style={styles.card}
            >
              <View style={styles.imageWrap}>
                <SafeImage uri={p.image || p.imageUrl} style={styles.image} resizeMode="cover" />
                {p.discount ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{p.discount}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.productName}>{p.name || p.title}</Text>
                <Text numberOfLines={1} style={styles.shopName}>🏪 {p.shopName || 'Verified Local Shop'}</Text>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.price}>{priceDisplay}</Text>
                    {p.originalPrice ? <Text style={styles.originalPrice}>{p.originalPrice}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={(e) => handleAddToCart(p, e)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  viewAll: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#EA580C',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 125,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Poppins_800ExtraBold',
  },
  cardBody: {
    padding: 8,
  },
  productName: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
  },
  shopName: {
    fontSize: 8.5,
    fontFamily: 'Poppins_500Medium',
    color: '#64748B',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  price: {
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
  },
  originalPrice: {
    fontSize: 8.5,
    fontFamily: 'Poppins_500Medium',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: 'Poppins_800ExtraBold',
  },
});
