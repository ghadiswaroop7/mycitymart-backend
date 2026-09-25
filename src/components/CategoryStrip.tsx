import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';
import SafeImage from './SafeImage';

interface CategoryStripProps {
  categories?: any[];
  onCategorySelect?: (categoryId: string) => void;
}

export default function CategoryStrip({ categories: propCategories, onCategorySelect }: CategoryStripProps) {
  const navigation = useNavigation<any>();
  const [liveCategories, setLiveCategories] = useState<any[]>([]);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) return;
    const q = collection(db, 'categories');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .filter(c => c.status !== 'inactive')
        .sort((a, b) => (a.order || 999) - (b.order || 999));
      setLiveCategories(list);
    });
    return () => unsubscribe();
  }, [propCategories]);

  const items = propCategories && propCategories.length > 0 ? propCategories : liveCategories;
  if (!items || items.length === 0) return null;

  const handlePress = (cat: any) => {
    if (onCategorySelect) {
      onCategorySelect(cat.id);
    } else {
      navigation.navigate('CategoryProducts', {
        categoryId: cat.id,
        categoryName: cat.label?.replace('\n', ' ') || cat.name,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((cat: any) => {
          const bgBadgeColor = cat.color || BAZAR_COLORS.surfaceSubtle;
          const imageSrc = cat.imageUrl || cat.image;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.82}
              onPress={() => handlePress(cat)}
              style={styles.item}
            >
              <View style={[styles.iconBadge, { backgroundColor: bgBadgeColor }]}>
                {imageSrc ? (
                  <SafeImage
                    uri={imageSrc}
                    style={{ width: '80%', height: '80%' }}
                    resizeMode="contain"
                    fallbackEmoji={cat.icon || '🛍️'}
                  />
                ) : (
                  <Text style={styles.iconEmoji}>{cat.icon || '🛍️'}</Text>
                )}
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {cat.label || cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BAZAR_COLORS.divider,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    width: 68,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: BAZAR_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...BAZAR_SHADOWS.sm,
  },
  iconEmoji: {
    fontSize: 26,
  },
  label: {
    fontFamily: BAZAR_FONTS.semibold,
    fontSize: 10.5,
    color: BAZAR_COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
});
