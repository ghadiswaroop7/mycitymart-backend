import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { HugeIcon } from '../../HugeIcon';
import { FlashIcon, FireIcon } from '@hugeicons/core-free-icons';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { FlashSaleData, BlockStyle } from '../../../types/sdui';

interface Props {
  data: FlashSaleData;
  style?: BlockStyle;
}

export default function FlashSaleWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();

  const title = data?.title || '⚡ Flash Sale • Dhamaka Deals';
  const subtitle = data?.subtitle || 'Limited stock discounts directly from local wholesalers';

  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours default

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      mins: m.toString().padStart(2, '0'),
      secs: s.toString().padStart(2, '0'),
    };
  };

  const { hours, mins, secs } = formatTimer(timeLeft);

  const items = data?.items && data.items.length > 0 ? data.items : [
    {
      id: 'deal_1',
      title: 'HIGHLANDER Men Printed Pure Cotton Green T-Shirt',
      price: 399,
      originalPrice: 799,
      claimedPercent: 88,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop',
      link: 'category/men',
    },
    {
      id: 'deal_2',
      title: 'Embroidered Art Silk Saree with Blouse',
      price: 699,
      originalPrice: 1999,
      claimedPercent: 92,
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop',
      link: 'category/kurti_saree',
    },
    {
      id: 'deal_3',
      title: 'Amul Pure Cow Ghee 1L Tin Pack',
      price: 549,
      originalPrice: 620,
      claimedPercent: 74,
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop',
      link: 'category/grocery',
    },
    {
      id: 'deal_4',
      title: 'Wireless Bluetooth Earbuds with 40h Playtime',
      price: 799,
      originalPrice: 2499,
      claimedPercent: 95,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop',
      link: 'category/electronics',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      {/* Flash Sale Banner Header with Countdown */}
      <View style={styles.topHeader}>
        <View style={styles.titleWrap}>
          <View style={styles.flashBadge}>
            <HugeIcon icon={FlashIcon} size={14} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.flashBadgeText}>FLASH DEAL</Text>
          </View>
          <Text style={styles.mainTitle}>{title}</Text>
        </View>

        {/* Live Timer Boxes */}
        <View style={styles.timerContainer}>
          <Text style={styles.endsInLabel}>ENDS IN</Text>
          <View style={styles.timerRow}>
            <View style={styles.timerBox}><Text style={styles.timerDigit}>{hours}</Text></View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBox}><Text style={styles.timerDigit}>{mins}</Text></View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBox}><Text style={styles.timerDigit}>{secs}</Text></View>
          </View>
        </View>
      </View>

      {/* Items Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsScroll}
      >
        {items.map((item, idx) => {
          const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
          return (
            <TouchableOpacity
              key={item.id || idx}
              style={styles.dealCard}
              onPress={() => handleSDUILink(item.link || (item.productId ? `product/${item.productId}` : 'category/men'), navigation)}
              activeOpacity={0.9}
            >
              <View style={styles.imageWrap}>
                <SafeImage
                  uri={item.imageUrl}
                  style={styles.dealImage}
                  resizeMode="cover"
                />
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              </View>

              <View style={styles.dealInfo}>
                <Text style={styles.dealTitle} numberOfLines={2}>{item.title}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>₹{item.price}</Text>
                  <Text style={styles.strikePrice}>₹{item.originalPrice}</Text>
                </View>

                {/* Claimed Meter */}
                <View style={styles.claimedWrap}>
                  <View style={styles.claimedBarBg}>
                    <View style={[styles.claimedBarFill, { width: `${item.claimedPercent}%` }]} />
                  </View>
                  <Text style={styles.claimedText}>🔥 {item.claimedPercent}% Claimed</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF7ED',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8,
  },
  flashBadge: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 3,
    marginBottom: 3,
  },
  flashBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 13.5,
    fontFamily: 'Poppins_700Bold',
    color: '#9A3412',
    lineHeight: 18,
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  endsInLabel: {
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    color: '#C2410C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timerBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 22,
    alignItems: 'center',
  },
  timerDigit: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
  },
  timerColon: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 10,
  },
  itemsScroll: {
    gap: 10,
  },
  dealCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  dealInfo: {
    padding: 8,
  },
  dealTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
    lineHeight: 15,
    marginBottom: 4,
    height: 30,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  currentPrice: {
    fontSize: 13,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#008B45',
  },
  strikePrice: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  claimedWrap: {
    gap: 2,
  },
  claimedBarBg: {
    height: 4,
    backgroundColor: '#FED7AA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  claimedBarFill: {
    height: '100%',
    backgroundColor: '#EA580C',
  },
  claimedText: {
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    color: '#C2410C',
  },
});
