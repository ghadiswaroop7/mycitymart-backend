import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Share, Linking, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from './SafeImage';
import { HugeIcon } from './HugeIcon';
import { 
  FlashIcon, 
  Clock01Icon, 
  CreditCardIcon, 
  ShoppingBag01Icon, 
  Tag01Icon, 
  Tick01Icon,
  SparklesIcon,
  TruckIcon
} from '@hugeicons/core-free-icons';
import { handleSDUILink } from '../utils/sduiNavigation';
import type { LayoutBlock } from '../types/sdui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  blocks?: LayoutBlock[];
  cardShapeSettings?: {
    borderRadius?: string;
    cardStyle?: string;
    aspectRatio?: string;
  };
}

export default function SDUIRenderer({ blocks = [], cardShapeSettings }: Props) {
  const navigation = useNavigation<any>();

  // Countdown timer simulation for flash sales
  const [secondsLeft, setSecondsLeft] = useState(7200);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 7200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handleShare = async (title?: string, price?: any) => {
    const message = `🛍️ Buy ${title || 'trending local items'} on BazarPeth for only ₹${price || 299}!\nShop here: https://bazarpeth.com/app`;
    try {
      await Share.share({ message, title: 'BazarPeth Deals' });
    } catch {
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => {});
    }
  };

  const activeBlocks = blocks.filter((b) => b.isActive !== false && (b as any).enabled !== false);
  if (activeBlocks.length === 0) return null;

  return (
    <View style={styles.container}>
      {activeBlocks.map((block) => {
        const bg = block.style?.bgColor || '#1E293B';
        const txt = block.style?.textColor || '#FFFFFF';
        const accent = block.style?.accentColor || '#8B5CF6';
        const blockType = (block.type || '').toLowerCase().trim();

        switch (blockType) {
          // 1. ZEPTO 10-MIN ETA & FREE SHIPPING BAR
          case 'zepto_eta_bar':
          case 'eta_bar':
            return (
              <TouchableOpacity
                key={block.id}
                activeOpacity={0.9}
                onPress={() => handleSDUILink('cart', navigation)}
                style={[styles.card, { backgroundColor: '#1A132F', borderColor: '#F59E0B', borderWidth: 1 }]}
              >
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <HugeIcon icon={FlashIcon} size={16} color="#FBBF24" fill="#FBBF24" />
                    <Text style={{ color: '#FBBF24', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>
                      {block.data?.title || block.title || '10-15 Mins Superfast Delivery'}
                    </Text>
                  </View>
                  <View style={styles.amberBadge}>
                    <Text style={{ fontSize: 9, fontFamily: 'Poppins_800ExtraBold', color: '#000' }}>
                      {block.data?.badgeText || 'EXPRESS'}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '75%' }]} />
                </View>
                <Text style={{ color: '#CBD5E1', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>
                  {block.data?.subtitle || block.subtitle || 'Add ₹150 more to unlock FREE instant delivery'}
                </Text>
              </TouchableOpacity>
            );

          // 2. FRESH AT ₹5 / BUDGET STRIP (ZEPTO / BLINKIT STYLE)
          case 'fresh_at_5_strip':
          case 'budget_strip': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#022C22', borderColor: '#059669', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={{ color: '#34D399', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                      ⚡ {block.title || 'Fresh Deals at ₹5'}
                    </Text>
                    {block.subtitle ? (
                      <Text style={{ color: '#A7F3D0', fontSize: 10, fontFamily: 'Poppins_400Regular' }}>{block.subtitle}</Text>
                    ) : null}
                  </View>
                  <View style={{ backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>DAILY SPECIAL</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'deals', navigation, item.title)}
                      style={styles.freshCard}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.freshImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.freshTitle}>{item.title}</Text>
                      <View style={styles.rowBetween}>
                        <Text style={{ color: '#10B981', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>{item.price || '₹5'}</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleSDUILink(item.link || 'cart', navigation)}>
                          <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_800ExtraBold' }}>+ ADD</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 3. ZEPTO CAFE MENU (INSTANT SNACKS & BEVERAGES)
          case 'zepto_cafe_menu':
          case 'cafe_menu': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#451A03', borderColor: '#D97706', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#FDE68A', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    ☕ {block.title || 'Cafe & Quick Bites'}
                  </Text>
                  <Text style={{ color: '#FBBF24', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }}>Hot & Fresh ⚡</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'category/grocery', navigation, item.title)}
                      style={styles.cafeCard}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.cafeImg} resizeMode="cover" />
                      {item.tag ? (
                        <View style={styles.cafeTag}>
                          <Text style={{ color: '#FFF', fontSize: 8, fontFamily: 'Poppins_800ExtraBold' }}>{item.tag}</Text>
                        </View>
                      ) : null}
                      <Text numberOfLines={1} style={styles.cafeTitle}>{item.title}</Text>
                      <Text style={{ color: '#FBBF24', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 4. FLOATING CART FREE DELIVERY UNLOCK BAR
          case 'floating_cart_free_delivery':
          case 'delivery_unlock_bar':
            return (
              <TouchableOpacity
                key={block.id}
                onPress={() => handleSDUILink('cart', navigation)}
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: '#064E3B', borderColor: '#34D399', borderWidth: 1 }]}
              >
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <HugeIcon icon={TruckIcon} size={18} color="#34D399" />
                    <View>
                      <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>
                        {block.title || 'Free Delivery Unlocked!'}
                      </Text>
                      <Text style={{ color: '#A7F3D0', fontSize: 10, fontFamily: 'Poppins_400Regular' }}>
                        {block.subtitle || 'Checkout now for same-day free delivery'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_800ExtraBold' }}>VIEW CART →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );

          // 5. AMAZON BENTO ₹499 BUDGET TILES (3x3 / 2x2 GRID)
          case 'amazon_bento_499':
          case 'bento_grid': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: bg }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: txt, fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    {block.title || 'Under ₹499 Bazaar'}
                  </Text>
                  {block.data?.tag ? (
                    <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#FFF', fontSize: 9, fontFamily: 'Poppins_800ExtraBold' }}>{block.data.tag}</Text>
                    </View>
                  ) : null}
                </View>
                {block.subtitle ? <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 10 }}>{block.subtitle}</Text> : null}

                <View style={styles.bentoGrid}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'deals', navigation, item.title)}
                      style={styles.bentoCell}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.bentoImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.bentoTitle}>{item.title}</Text>
                      <Text style={{ color: '#F59E0B', fontFamily: 'Poppins_700Bold', fontSize: 11 }}>{item.price || 'Under ₹499'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }

          // 6. SPLIT BRAND DEALS (SIDE-BY-SIDE DUAL BRAND CARDS)
          case 'split_brand_deals':
          case 'dual_brand_cards': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={{ flexDirection: 'row', gap: 10 }}>
                {items.slice(0, 2).map((brand: any, idx: number) => (
                  <TouchableOpacity
                    key={brand.id || idx}
                    onPress={() => handleSDUILink(brand.link || 'category/men', navigation, brand.title)}
                    style={[styles.splitBrandCard, { backgroundColor: brand.bgColor || (idx === 0 ? '#1E3A8A' : '#831843') }]}
                    activeOpacity={0.9}
                  >
                    <View style={{ flex: 1 }}>
                      {brand.tag ? (
                        <View style={styles.brandTag}>
                          <Text style={{ color: '#000', fontSize: 8, fontFamily: 'Poppins_800ExtraBold' }}>{brand.tag}</Text>
                        </View>
                      ) : null}
                      <Text numberOfLines={2} style={styles.splitBrandTitle}>{brand.title}</Text>
                      <Text numberOfLines={1} style={styles.splitBrandSub}>{brand.subtitle || brand.discount}</Text>
                    </View>
                    <SafeImage uri={brand.imageUrl || brand.image} style={styles.splitBrandImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          // 7. FRESH ARRIVALS ARCH VAULT (MYNTRA / NYKAA LUXURY VAULTED ARCHES)
          case 'fresh_arrivals_arch_vault':
          case 'arch_grid': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: bg }]}>
                <Text style={{ color: '#FCD34D', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                  {block.title || 'Fresh Arrivals Arch Vault'}
                </Text>
                {block.subtitle ? <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 10 }}>{block.subtitle}</Text> : null}

                <View style={styles.gridRow}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'category/women', navigation, item.title)}
                      style={styles.archItem}
                      activeOpacity={0.88}
                    >
                      <View style={styles.archImgContainer}>
                        <SafeImage uri={item.imageUrl || item.image} style={styles.archImg} resizeMode="cover" />
                        {item.tag ? <Text style={styles.archTag}>{item.tag}</Text> : null}
                      </View>
                      <Text numberOfLines={1} style={styles.archTitle}>{item.title}</Text>
                      {item.price ? <Text style={{ color: '#F59E0B', fontFamily: 'Poppins_700Bold', fontSize: 12, paddingHorizontal: 4 }}>{item.price}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }

          // 8. ASYMMETRIC BENTO RUNWAY (EDITORIAL FASHION MAGAZINE 2-COLUMN)
          case 'asymmetric_bento_runway': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#0F172A' }]}>
                <Text style={{ color: '#F43F5E', fontFamily: 'Poppins_800ExtraBold', fontSize: 14, marginBottom: 8 }}>
                  ✨ {block.title || 'Runway Trends'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {items[0] ? (
                    <TouchableOpacity
                      onPress={() => handleSDUILink(items[0].link || 'category/women', navigation, items[0].title)}
                      style={{ flex: 1.2, height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1E293B', position: 'relative' }}
                      activeOpacity={0.9}
                    >
                      <SafeImage uri={items[0].imageUrl || items[0].image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={styles.runwayOverlay}>
                        <Text style={{ color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{items[0].title}</Text>
                        <Text style={{ color: '#F43F5E', fontFamily: 'Poppins_800ExtraBold', fontSize: 11 }}>{items[0].price || 'HOT'}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ flex: 1, gap: 8 }}>
                    {items.slice(1, 3).map((sub: any, sIdx: number) => (
                      <TouchableOpacity
                        key={sub.id || sIdx}
                        onPress={() => handleSDUILink(sub.link || 'category/women', navigation, sub.title)}
                        style={{ height: 86, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1E293B', position: 'relative' }}
                        activeOpacity={0.9}
                      >
                        <SafeImage uri={sub.imageUrl || sub.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={styles.runwaySmallOverlay}>
                          <Text numberOfLines={1} style={{ color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 10 }}>{sub.title}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            );
          }

          // 9. UNMISSABLE DEALS PEACH (PASTEL SOFT CARDS)
          case 'unmissable_deals_peach': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#BE123C', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    🌸 {block.title || 'Unmissable Deals'}
                  </Text>
                  <Text style={{ color: '#E11D48', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>50-80% OFF</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'deals', navigation, item.title)}
                      style={styles.peachCard}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.peachImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.peachTitle}>{item.title}</Text>
                      <Text style={{ color: '#BE123C', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 10. MEESHO BRAND LOGOS PILL ROW (HORIZONTAL BRAND LOGOS)
          case 'meesho_brand_logos_pill_row':
          case 'brand_logos_row': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={{ marginVertical: 6 }}>
                {block.title ? (
                  <Text style={{ color: '#CBD5E1', fontFamily: 'Poppins_700Bold', fontSize: 12, marginBottom: 8, paddingHorizontal: 4 }}>
                    {block.title}
                  </Text>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {items.map((brand: any, idx: number) => (
                    <TouchableOpacity
                      key={brand.id || idx}
                      onPress={() => handleSDUILink(brand.link || 'category/men', navigation, brand.title)}
                      style={styles.brandPill}
                      activeOpacity={0.85}
                    >
                      {brand.imageUrl ? (
                        <SafeImage uri={brand.imageUrl} style={styles.brandPillImg} resizeMode="contain" />
                      ) : null}
                      <Text style={styles.brandPillText}>{brand.title || brand.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 11. MEESHO CELEBRITY / MALL BANNER
          case 'meesho_celebrity_banner':
          case 'mall_banner': {
            const bannerImg = block.data?.imageUrl || block.data?.image;
            if (!bannerImg && !block.title) return null;

            return (
              <TouchableOpacity
                key={block.id}
                onPress={() => handleSDUILink(block.data?.buttonLink || block.data?.link || 'deals', navigation, block.title)}
                style={styles.celebrityContainer}
                activeOpacity={0.9}
              >
                {bannerImg ? (
                  <SafeImage uri={bannerImg} style={styles.celebrityImg} resizeMode="cover" />
                ) : null}
                <View style={styles.celebrityOverlay}>
                  <View style={{ backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontFamily: 'Poppins_800ExtraBold' }}>BAZARPETH MALL VERIFIED</Text>
                  </View>
                  <Text numberOfLines={2} style={{ color: '#FFF', fontFamily: 'Poppins_800ExtraBold', fontSize: 15 }}>{block.title}</Text>
                  {block.subtitle ? <Text numberOfLines={1} style={{ color: '#E2E8F0', fontSize: 11 }}>{block.subtitle}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          }

          // 12. MEESHO WHATSAPP RESELLER HUB
          case 'meesho_share_earn':
          case 'share_earn': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#06281E', borderColor: '#10B981', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#34D399', fontFamily: 'Poppins_700Bold', fontSize: 13.5 }}>
                    💬 {block.title || 'Share & Earn With BazarPeth'}
                  </Text>
                  {block.data?.resellerMargin ? (
                    <View style={styles.greenBadge}>
                      <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#34D399' }}>
                        {block.data.resellerMargin}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity key={item.id || idx} onPress={() => handleSDUILink(item.link || 'category/women', navigation, item.title)} style={styles.productCardSmall} activeOpacity={0.88}>
                      <SafeImage uri={item.imageUrl || item.image} style={styles.productImgSmall} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.productTitleSmall}>{item.title}</Text>
                      <View style={styles.rowBetween}>
                        <Text style={{ color: '#10B981', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.price}</Text>
                        <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(item.title, item.price)}>
                          <Text style={{ color: '#FFF', fontSize: 9, fontFamily: 'Poppins_700Bold' }}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 13. AUDIO STORE HUB
          case 'audio_store_hub': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#1E1B4B', borderColor: '#6366F1', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#A5B4FC', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    🎧 {block.title || 'Audio & Sound Hub'}
                  </Text>
                  <Text style={{ color: '#818CF8', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>EXPLORE →</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'category/electronics', navigation, item.title)}
                      style={styles.audioCard}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.audioImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.audioTitle}>{item.title}</Text>
                      <Text style={{ color: '#A5B4FC', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 14. SHRAVAN POOJA ESSENTIALS
          case 'shravan_pooja_essentials':
          case 'pooja_essentials': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#451A03', borderColor: '#B45309', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#FDE68A', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                    🪔 {block.title || 'Pooja & Sacred Essentials'}
                  </Text>
                  <Text style={{ color: '#FBBF24', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>100% PURE</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => handleSDUILink(item.link || 'category/grocery', navigation, item.title)}
                      style={styles.poojaCard}
                      activeOpacity={0.88}
                    >
                      <SafeImage uri={item.imageUrl || item.image} style={styles.poojaImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.poojaTitle}>{item.title}</Text>
                      <View style={styles.rowBetween}>
                        <Text style={{ color: '#FDE68A', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.price}</Text>
                        <View style={{ backgroundColor: '#B45309', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#FFF', fontSize: 9, fontFamily: 'Poppins_800ExtraBold' }}>+ 1</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 15. FLASH SALE WITH LIVE COUNTDOWN
          case 'flash_sale':
          case 'countdown_timer': {
            const items = block.data?.items || [];
            if (items.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#261208', borderColor: '#F97316', borderWidth: 1 }]}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: '#FB923C', fontFamily: 'Poppins_700Bold', fontSize: 13.5 }}>
                    ⚡ {block.title || 'Flash Deals'}
                  </Text>
                  <View style={styles.timerBadge}>
                    <HugeIcon icon={Clock01Icon} size={12} color="#FB923C" />
                    <Text style={{ color: '#FFF', fontFamily: 'Poppins_800ExtraBold', fontSize: 10, marginLeft: 4 }}>
                      {hours} : {mins} : {secs}
                    </Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {items.map((item: any, idx: number) => (
                    <TouchableOpacity key={item.id || idx} onPress={() => handleSDUILink(item.link || 'deals', navigation, item.title)} style={styles.dealCard} activeOpacity={0.88}>
                      <SafeImage uri={item.imageUrl || item.image} style={styles.dealImg} resizeMode="cover" />
                      <Text numberOfLines={1} style={styles.dealTitle}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Text style={{ color: '#FBBF24', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>{item.price}</Text>
                        {item.originalPrice ? (
                          <Text style={{ color: '#64748B', textDecorationLine: 'line-through', fontSize: 10 }}>{item.originalPrice}</Text>
                        ) : null}
                      </View>
                      <View style={styles.stockBarBg}>
                        <View style={[styles.stockBarFill, { width: `${item.soldPercent || item.claimedPercent || 80}%` }]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 16. AMAZON BANK OFFERS
          case 'amazon_bank_offers':
          case 'bank_offers': {
            const offers = block.data?.offers || block.data?.items || [];
            if (offers.length === 0) return null;

            return (
              <View key={block.id} style={[styles.card, { backgroundColor: '#0B1E3B', borderColor: '#3B82F6', borderWidth: 1 }]}>
                <Text style={{ color: '#93C5FD', fontFamily: 'Poppins_700Bold', fontSize: 13.5, marginBottom: 8 }}>
                  💳 {block.title || 'Instant Bank & UPI Offers'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {offers.map((offer: any, idx: number) => (
                    <View key={idx} style={styles.bankPill}>
                      <Text style={{ color: '#60A5FA', fontSize: 10, fontFamily: 'Poppins_700Bold' }}>{offer.bankName || offer.title}</Text>
                      <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Poppins_800ExtraBold', marginVertical: 1 }}>{offer.discount || offer.discountText}</Text>
                      {offer.code || offer.couponCode ? (
                        <Text style={{ color: '#94A3B8', fontSize: 9, fontFamily: 'Poppins_500Medium' }}>Use {offer.code || offer.couponCode}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            );
          }

          // 17. HERO BANNER
          case 'hero_banner': {
            const bannerImg = block.data?.imageUrl || block.data?.image;
            if (!bannerImg && !block.title && !block.data?.title) return null;

            return (
              <TouchableOpacity key={block.id} onPress={() => handleSDUILink(block.data?.buttonLink || block.data?.link || 'category/women', navigation, block.title)} style={styles.heroContainer} activeOpacity={0.9}>
                {bannerImg ? (
                  <SafeImage uri={bannerImg} style={styles.heroImg} resizeMode="cover" />
                ) : null}
                <View style={styles.heroOverlay}>
                  {block.data?.tag ? <Text style={styles.heroPill}>{block.data.tag}</Text> : null}
                  <Text numberOfLines={2} style={styles.heroTitle}>{block.title || block.data?.title}</Text>
                  {block.subtitle ? <Text numberOfLines={1} style={styles.heroSubtitle}>{block.subtitle}</Text> : null}
                  {block.data?.buttonText ? (
                    <View style={styles.heroCta}>
                      <Text style={styles.heroCtaText}>{block.data.buttonText} →</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }

          // 18. TRUST BADGES
          case 'trust_badges': {
            const badges = block.data?.items || block.data?.badges || [];
            if (badges.length === 0) return null;

            return (
              <View key={block.id} style={styles.trustGrid}>
                {badges.map((badge: any, idx: number) => (
                  <View key={idx} style={styles.trustItem}>
                    <View style={styles.checkCircle}><Text style={{ color: '#10B981', fontSize: 10 }}>✓</Text></View>
                    <View style={{ marginLeft: 6, flex: 1 }}>
                      <Text style={{ color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 10.5 }}>{badge.title}</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 9, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>{badge.subtitle}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, gap: 12 },
  card: { padding: 14, borderRadius: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBarBg: { height: 6, backgroundColor: '#0F172A', borderRadius: 6, marginVertical: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 6 },
  amberBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  greenBadge: { backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freshCard: { width: 110, backgroundColor: '#064E3B', padding: 8, borderRadius: 14, marginRight: 10 },
  freshImg: { width: '100%', height: 80, borderRadius: 10, marginBottom: 6 },
  freshTitle: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  addBtn: { backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cafeCard: { width: 120, backgroundColor: '#78350F', padding: 8, borderRadius: 14, marginRight: 10, position: 'relative' },
  cafeImg: { width: '100%', height: 85, borderRadius: 10, marginBottom: 4 },
  cafeTag: { position: 'absolute', top: 12, left: 12, backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  cafeTitle: { color: '#FEF3C7', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  bentoCell: { width: '31%', backgroundColor: 'rgba(15,23,42,0.85)', padding: 8, borderRadius: 14, alignItems: 'center' },
  bentoImg: { width: 55, height: 55, borderRadius: 10, marginBottom: 4 },
  bentoTitle: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  splitBrandCard: { flex: 1, height: 100, borderRadius: 16, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  brandTag: { backgroundColor: '#FACC15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 2 },
  splitBrandTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_800ExtraBold' },
  splitBrandSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  splitBrandImg: { width: 45, height: 45, borderRadius: 8 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  archItem: { flex: 1, backgroundColor: '#0F172A', borderRadius: 12, paddingBottom: 6, overflow: 'hidden' },
  archImgContainer: { height: 110, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', position: 'relative' },
  archImg: { width: '100%', height: '100%' },
  archTag: { position: 'absolute', top: 4, left: 4, backgroundColor: '#F59E0B', color: '#000', fontSize: 8, fontFamily: 'Poppins_800ExtraBold', paddingHorizontal: 4, borderRadius: 4 },
  archTitle: { color: '#FFF', fontSize: 10, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 4, marginTop: 4 },
  runwayOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
  runwaySmallOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, backgroundColor: 'rgba(0,0,0,0.6)' },
  peachCard: { width: 115, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: '#FFE4E6' },
  peachImg: { width: '100%', height: 85, borderRadius: 10, marginBottom: 4 },
  peachTitle: { color: '#1E293B', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  brandPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', gap: 6 },
  brandPillImg: { width: 18, height: 18, borderRadius: 9 },
  brandPillText: { color: '#F1F5F9', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  celebrityContainer: { height: 160, borderRadius: 20, overflow: 'hidden', position: 'relative', marginVertical: 4 },
  celebrityImg: { width: '100%', height: '100%', position: 'absolute' },
  celebrityOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 14 },
  productCardSmall: { width: 120, backgroundColor: '#021811', padding: 8, borderRadius: 14, marginRight: 10 },
  productImgSmall: { width: '100%', height: 90, borderRadius: 10, marginBottom: 6 },
  productTitleSmall: { color: '#FFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  shareBtn: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  audioCard: { width: 120, backgroundColor: '#312E81', padding: 8, borderRadius: 14, marginRight: 10 },
  audioImg: { width: '100%', height: 85, borderRadius: 10, marginBottom: 4 },
  audioTitle: { color: '#E0E7FF', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  poojaCard: { width: 115, backgroundColor: '#78350F', padding: 8, borderRadius: 14, marginRight: 10 },
  poojaImg: { width: '100%', height: 85, borderRadius: 10, marginBottom: 4 },
  poojaTitle: { color: '#FEF3C7', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  dealCard: { width: 140, backgroundColor: '#140803', padding: 8, borderRadius: 14, marginRight: 10 },
  dealImg: { width: '100%', height: 110, borderRadius: 10 },
  dealTitle: { color: '#FFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  stockBarBg: { height: 5, backgroundColor: '#334155', borderRadius: 5, marginTop: 6, overflow: 'hidden' },
  stockBarFill: { height: '100%', backgroundColor: '#F59E0B' },
  bankPill: { width: 130, backgroundColor: '#020C1B', padding: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: '#1E3A8A' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(249,115,22,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  heroContainer: { height: 210, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  heroImg: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: 16 },
  heroPill: { alignSelf: 'flex-start', backgroundColor: '#E11D48', color: '#FFF', fontSize: 9, fontFamily: 'Poppins_800ExtraBold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  heroTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Poppins_800ExtraBold' },
  heroSubtitle: { color: '#E2E8F0', fontSize: 12, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  heroCta: { alignSelf: 'flex-start', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginTop: 8 },
  heroCtaText: { color: '#0F172A', fontFamily: 'Poppins_800ExtraBold', fontSize: 11 },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'rgba(15,23,42,0.85)', padding: 12, borderRadius: 16 },
  trustItem: { width: '48%', flexDirection: 'row', alignItems: 'center' },
  checkCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center' }
});
