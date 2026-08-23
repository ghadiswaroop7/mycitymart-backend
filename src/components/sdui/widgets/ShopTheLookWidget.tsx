import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { ShopTheLookData, BlockStyle, HotspotItem } from '../../../types/sdui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  data: ShopTheLookData;
  style?: BlockStyle;
}

export default function ShopTheLookWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();

  const title = data?.title || '✨ Shop The Look • Sangamner Style';
  const subtitle = data?.subtitle || 'Tap the glowing dots on the outfit to view items';
  const lifestyleImage = data?.lifestyleImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop';
  
  const hotspots: HotspotItem[] = data?.hotspots && data.hotspots.length > 0 ? data.hotspots : [
    { id: '1', xPercent: 48, yPercent: 35, productTitle: 'Printed Pure Cotton Kurti', price: 499, link: 'category/kurti_saree' },
    { id: '2', xPercent: 62, yPercent: 68, productTitle: 'Embroidered Palazzo Pant', price: 349, link: 'category/women_western' },
    { id: '3', xPercent: 40, yPercent: 88, productTitle: 'Handcrafted Kolhapuri Mojari', price: 599, link: 'category/bags_footwear' },
  ];

  const [activeHotspot, setActiveHotspot] = useState<HotspotItem>(hotspots[0]);

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Main Lifestyle Image with Hotspots */}
      <View style={styles.imageStage}>
        <SafeImage
          uri={lifestyleImage}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Hotspots */}
        {hotspots.map((spot) => {
          const isSelected = activeHotspot.id === spot.id;
          return (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.hotspotDot,
                { left: `${spot.xPercent}%`, top: `${spot.yPercent}%` },
                isSelected && styles.hotspotDotActive,
              ]}
              onPress={() => setActiveHotspot(spot)}
              activeOpacity={0.8}
            >
              <View style={[styles.innerDot, isSelected && styles.innerDotActive]} />
            </TouchableOpacity>
          );
        })}

        {/* Selected Item Floating Card */}
        {activeHotspot && (
          <TouchableOpacity
            style={styles.floatingPreviewCard}
            onPress={() => handleSDUILink(activeHotspot.link || (activeHotspot.productId ? `product/${activeHotspot.productId}` : 'category/women'), navigation)}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTag}>FEATURED ITEM</Text>
              <Text style={styles.previewTitle} numberOfLines={1}>{activeHotspot.productTitle}</Text>
              <Text style={styles.previewPrice}>₹{activeHotspot.price}</Text>
            </View>
            <View style={styles.buyNowBtn}>
              <Text style={styles.buyNowText}>Shop →</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    marginBottom: 10,
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
  imageStage: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  hotspotDot: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hotspotDotActive: {
    backgroundColor: '#008B45',
    transform: [{ scale: 1.15 }],
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#008B45',
  },
  innerDotActive: {
    backgroundColor: '#FFFFFF',
  },
  floatingPreviewCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTag: {
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 16,
  },
  previewPrice: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#008B45',
  },
  buyNowBtn: {
    backgroundColor: '#008B45',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
});
