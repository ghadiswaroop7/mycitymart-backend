import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { SquareGrid3x3Data, BlockStyle } from '../../../types/sdui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const ITEM_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP * 2) / 3;

interface Props {
  data: SquareGrid3x3Data;
  style?: BlockStyle;
}

export default function SquareGrid3x3Widget({ data, style }: Props) {
  const navigation = useNavigation<any>();

  const title = data?.title || 'Trending Categories & Brands';
  const subtitle = data?.subtitle || 'Shop our most popular local collections';
  const items = data?.items && data.items.length > 0 ? data.items : [
    { id: '1', title: 'Kurtis & Sarees', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop', link: 'category/kurti_saree', tag: 'Up to 60% Off' },
    { id: '2', title: "Men's Wear", imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop', link: 'category/men', tag: 'Top Rated' },
    { id: '3', title: 'Kirana & Grocery', imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop', link: 'category/grocery', tag: 'Fresh Stock' },
    { id: '4', title: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop', link: 'category/electronics', tag: 'Best Deals' },
    { id: '5', title: 'Footwear', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop', link: 'category/bags_footwear', tag: 'Trending' },
    { id: '6', title: 'Kids & Toys', imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop', link: 'category/kids_toys', tag: 'New Arrivals' },
  ];

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.card}
            onPress={() => handleSDUILink(item.link || 'category/men', navigation, item.title)}
            activeOpacity={0.88}
          >
            <View style={styles.imageWrap}>
              <SafeImage
                uri={item.imageUrl}
                style={styles.image}
                resizeMode="cover"
              />
              {item.tag ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    justifyContent: 'flex-start',
  },
  card: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  imageWrap: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 139, 69, 0.92)',
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Poppins_700Bold',
  },
  cardTitle: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
    marginTop: 5,
    textAlign: 'center',
  },
});
