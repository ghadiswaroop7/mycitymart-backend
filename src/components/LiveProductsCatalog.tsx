import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard from './ProductCard';

interface Props {
  title?: string;
  maxItems?: number;
}

export default function LiveProductsCatalog({ title = 'All Products', maxItems = 40 }: Props) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), limit(maxItems));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
    }, (err) => {
      console.warn('Live products listener error:', err);
    });

    return () => unsubscribe();
  }, [maxItems]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title} ({products.length})</Text>
        <Text style={styles.subtext}>⚡ Fast Delivery in Sangamner</Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading local store items...</Text>
        </View>
      ) : (
        <View style={styles.columnsWrapper}>
          <View style={styles.column}>
            {products.filter((_, i) => i % 2 === 0).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
          <View style={styles.column}>
            {products.filter((_, i) => i % 2 !== 0).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 14,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#008B45',
  },
  emptyCard: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  columnsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
});
