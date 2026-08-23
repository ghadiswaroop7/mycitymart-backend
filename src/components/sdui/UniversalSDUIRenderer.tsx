import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../SafeImage';
import { HugeIcon } from '../HugeIcon';
import { 
  FlashIcon, 
  Clock01Icon, 
  ShoppingBag01Icon, 
  Tag01Icon, 
  Tick01Icon,
  TruckIcon
} from '@hugeicons/core-free-icons';
import { handleSDUILink } from '../../utils/sduiNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SDUIBlock {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  style?: any;
  data: any;
  isActive?: boolean;
  enabled?: boolean;
}

export interface UniversalSDUIProps {
  blocks: SDUIBlock[];
  cardShapeSettings?: {
    borderRadius?: string;
    cardStyle?: string;
    aspectRatio?: string;
  };
}

export const UniversalSDUIRenderer: React.FC<UniversalSDUIProps> = ({ blocks, cardShapeSettings }) => {
  const navigation = useNavigation<any>();

  const handlePress = (link?: string, title?: string) => {
    if (!link) return;
    handleSDUILink(link, navigation, title);
  };

  const handleShare = async (title?: string, price?: any) => {
    const message = `🛍️ Check out ${title || 'this deal'} on BazarPeth for only ₹${price || 299}!\nShop here: https://bazarpeth.com/app`;
    try {
      await Share.share({ message, title: 'BazarPeth Deals' });
    } catch {
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => {});
    }
  };

  if (!blocks || !Array.isArray(blocks)) return null;

  const activeBlocks = blocks.filter((b) => b && b.isActive !== false && b.enabled !== false);
  if (activeBlocks.length === 0) return null;

  return (
    <View style={styles.container}>
      {activeBlocks.map((block, index) => {
        const bg = block.style?.bgColor || '#FFFFFF';
        const txt = block.style?.textColor || '#1E293B';
        const blockType = (block.type || '').toLowerCase().trim();

        // 1. FEATURED 3x3 LEAF / SCOOP GRID (Asymmetric curved corners)
        if (blockType === 'electronics_featured_3x3_leaf' || blockType === 'featured_leaf_grid') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={styles.whiteCardContainer}>
              <Text style={styles.sectionHeader}>{block.title || 'Featured Categories'}</Text>
              {block.subtitle ? <Text style={styles.sectionSubtitle}>{block.subtitle}</Text> : null}
              <View style={styles.grid3}>
                {items.map((item: any, i: number) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handlePress(item.link || item.buttonLink, item.title)}
                    style={styles.leafCard}
                    activeOpacity={0.88}
                  >
                    <SafeImage uri={item.imageUrl || item.image} style={styles.leafImage} resizeMode="cover" />
                    <Text numberOfLines={1} style={styles.leafTitle}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }

        // 2. RECOMMENDED VAULTED ARCH DOMES
        if (blockType === 'recommended_arch_dome_row' || blockType === 'arch_dome_row') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={styles.whiteCardContainer}>
              <Text style={styles.sectionHeader}>{block.title || 'Recommended For You'}</Text>
              {block.subtitle ? <Text style={styles.sectionSubtitle}>{block.subtitle}</Text> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                {items.map((item: any, i: number) => (
                  <TouchableOpacity 
                    key={item.id || i} 
                    onPress={() => handlePress(item.link || item.buttonLink, item.title)} 
                    style={styles.domeCard}
                    activeOpacity={0.88}
                  >
                    <View style={styles.domeTopFrame}>
                      <SafeImage uri={item.imageUrl || item.image} style={styles.domeImage} resizeMode="cover" />
                    </View>
                    <View style={[styles.pillBadge, { backgroundColor: item.tagColor || '#7E22CE' }]}>
                      {item.isMall && <Text style={styles.mallText}>Mall </Text>}
                      <Text style={styles.pillText}>{item.tag || item.title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        }

        // 3. THE GRAND WEDDING STORE 3x3 JHAROKHA TEMPLE ARCHES
        if (blockType === 'wedding_store_3x3_jharokha' || blockType === 'jharokha_grid') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={styles.weddingContainer}>
              <Text style={styles.weddingSubtitle}>✨ ROYAL INDIAN HERITAGE ✨</Text>
              <Text style={styles.weddingTitle}>{block.title || 'THE GRAND WEDDING STORE'}</Text>
              <View style={styles.grid3}>
                {items.map((item: any, i: number) => (
                  <TouchableOpacity 
                    key={item.id || i} 
                    onPress={() => handlePress(item.link || item.buttonLink, item.title)} 
                    style={styles.jharokhaCard}
                    activeOpacity={0.88}
                  >
                    <SafeImage uri={item.imageUrl || item.image} style={styles.jharokhaImage} resizeMode="cover" />
                    <View style={styles.goldPill}>
                      <Text numberOfLines={1} style={styles.goldPillText}>{item.title}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }

        // 4. LOWEST IN PRICE BADGES (Under 149/249/349/499)
        if (blockType === 'price_cutout_badges' || blockType === 'price_badges') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={styles.whiteCardContainer}>
              <Text style={styles.sectionHeaderCenter}>✨ {block.title || 'Lowest In Price'} ✨</Text>
              <View style={styles.grid3}>
                {items.map((item: any, i: number) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handlePress(item.link || item.buttonLink, item.title)}
                    style={[styles.priceBadgeCard, { backgroundColor: item.bgColor || '#EA580C' }]}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.priceUnderText}>{item.title || item.tag || 'UNDER'}</Text>
                    <Text style={styles.priceAmountText}>{item.price || '₹149'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }

        // 5. ZEPTO 10-MIN ETA & FREE SHIPPING BAR
        if (blockType === 'zepto_eta_bar' || blockType === 'eta_bar') {
          return (
            <TouchableOpacity
              key={block.id || index}
              activeOpacity={0.9}
              onPress={() => handlePress('cart')}
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
        }

        // 6. FRESH AT ₹5 / BUDGET STRIP
        if (blockType === 'fresh_at_5_strip' || blockType === 'budget_strip') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={[styles.card, { backgroundColor: '#022C22', borderColor: '#059669', borderWidth: 1 }]}>
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
                {items.map((item: any, i: number) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handlePress(item.link, item.title)}
                    style={styles.freshCard}
                    activeOpacity={0.88}
                  >
                    <SafeImage uri={item.imageUrl || item.image} style={styles.freshImg} resizeMode="cover" />
                    <Text numberOfLines={1} style={styles.freshTitle}>{item.title}</Text>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#10B981', fontFamily: 'Poppins_700Bold', fontSize: 13 }}>{item.price || '₹5'}</Text>
                      <TouchableOpacity style={styles.addBtn} onPress={() => handlePress(item.link || 'cart', item.title)}>
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_800ExtraBold' }}>+ ADD</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        }

        // 7. ZEPTO CAFE MENU
        if (blockType === 'zepto_cafe_menu' || blockType === 'cafe_menu') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={[styles.card, { backgroundColor: '#451A03', borderColor: '#D97706', borderWidth: 1 }]}>
              <View style={styles.rowBetween}>
                <Text style={{ color: '#FDE68A', fontFamily: 'Poppins_700Bold', fontSize: 14 }}>
                  ☕ {block.title || 'Cafe & Quick Bites'}
                </Text>
                <Text style={{ color: '#FBBF24', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }}>Hot & Fresh ⚡</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {items.map((item: any, i: number) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handlePress(item.link, item.title)}
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

        // 8. FLOATING CART FREE DELIVERY UNLOCK BAR
        if (blockType === 'floating_cart_free_delivery' || blockType === 'delivery_unlock_bar') {
          return (
            <TouchableOpacity
              key={block.id || index}
              onPress={() => handlePress('cart')}
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
        }

        // 9. AMAZON BENTO ₹499 BUDGET TILES
        if (blockType === 'amazon_bento_499' || blockType === 'bento_grid') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={[styles.card, { backgroundColor: bg }]}>
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
                {items.map((item: any, i: number) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handlePress(item.link, item.title)}
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

        // 10. SPLIT BRAND DEALS
        if (blockType === 'split_brand_deals' || blockType === 'dual_brand_cards') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={{ flexDirection: 'row', gap: 10, marginHorizontal: 10, marginVertical: 4 }}>
              {items.slice(0, 2).map((brand: any, i: number) => (
                <TouchableOpacity
                  key={brand.id || i}
                  onPress={() => handlePress(brand.link, brand.title)}
                  style={[styles.splitBrandCard, { backgroundColor: brand.bgColor || (i === 0 ? '#1E3A8A' : '#831843') }]}
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

        // 11. MEESHO WHATSAPP RESELLER HUB
        if (blockType === 'meesho_share_earn' || blockType === 'share_earn') {
          const items = block.data?.items || [];
          if (items.length === 0) return null;

          return (
            <View key={block.id || index} style={[styles.card, { backgroundColor: '#06281E', borderColor: '#10B981', borderWidth: 1 }]}>
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
                {items.map((item: any, i: number) => (
                  <TouchableOpacity key={item.id || i} onPress={() => handlePress(item.link, item.title)} style={styles.productCardSmall} activeOpacity={0.88}>
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

        // 12. GENERIC DYNAMIC FALLBACK (Renders ANY future block type automatically!)
        if (block.data?.items && Array.isArray(block.data.items) && block.data.items.length > 0) {
          return (
            <View key={block.id || index} style={styles.whiteCardContainer}>
              {block.title && <Text style={styles.sectionHeader}>{block.title}</Text>}
              {block.subtitle && <Text style={styles.sectionSubtitle}>{block.subtitle}</Text>}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
                {block.data.items.map((item: any, i: number) => (
                  <TouchableOpacity key={item.id || i} onPress={() => handlePress(item.link || item.buttonLink, item.title)} style={styles.genericCard} activeOpacity={0.88}>
                    <SafeImage uri={item.imageUrl || item.image} style={styles.genericImage} resizeMode="cover" />
                    <Text numberOfLines={1} style={styles.genericTitle}>{item.title || item.name || item.brand}</Text>
                    {item.price && <Text style={styles.genericPrice}>{item.price}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        }

        return null;
      })}
    </View>
  );
};

export default UniversalSDUIRenderer;

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12, marginTop: 8, marginBottom: 8 },
  whiteCardContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, marginVertical: 6, marginHorizontal: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  sectionHeader: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#1E293B', marginBottom: 6 },
  sectionSubtitle: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#64748B', marginBottom: 10 },
  sectionHeaderCenter: { fontSize: 14, fontFamily: 'Poppins_800ExtraBold', color: '#1E293B', marginBottom: 10, textAlign: 'center' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  horizontalRow: { paddingRight: 10, gap: 10 },
  card: { padding: 14, borderRadius: 20, marginHorizontal: 12, marginVertical: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Leaf Shape (Scoop Cut)
  leafCard: { width: '31%', height: 115, backgroundColor: '#FEF3C7', borderTopLeftRadius: 24, borderBottomRightRadius: 14, borderTopRightRadius: 8, borderBottomLeftRadius: 8, padding: 4, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#FDE68A' },
  leafImage: { width: '100%', height: 78, borderTopLeftRadius: 20, borderBottomRightRadius: 10, borderTopRightRadius: 6, borderBottomLeftRadius: 6 },
  leafTitle: { fontSize: 9.5, fontFamily: 'Poppins_700Bold', color: '#78350F', textAlign: 'center', marginTop: 2 },

  // Dome Arches
  domeCard: { width: 85, alignItems: 'center' },
  domeTopFrame: { width: 80, height: 95, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 2, borderColor: '#FCD34D', overflow: 'hidden', padding: 2, backgroundColor: '#FFFBEB' },
  domeImage: { width: '100%', height: '100%', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  pillBadge: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 12, marginTop: 4, width: '100%', alignItems: 'center' },
  pillText: { color: '#FFFFFF', fontSize: 8.5, fontFamily: 'Poppins_800ExtraBold' },
  mallText: { color: '#FCD34D', fontSize: 7.5, fontFamily: 'Poppins_900Black' },

  // Grand Wedding Jharokha
  weddingContainer: { backgroundColor: '#4C0519', borderRadius: 24, padding: 14, marginVertical: 8, marginHorizontal: 10, borderWidth: 2, borderColor: '#F59E0B' },
  weddingSubtitle: { color: '#FDE68A', fontSize: 9, fontFamily: 'Poppins_900Black', letterSpacing: 1.5, textAlign: 'center' },
  weddingTitle: { color: '#FEF3C7', fontSize: 13.5, fontFamily: 'Poppins_900Black', textAlign: 'center', marginBottom: 10, marginTop: 2 },
  jharokhaCard: { width: '31%', height: 130, backgroundColor: '#831843', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 4, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: '#FBBF24' },
  jharokhaImage: { width: '100%', height: 92, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  goldPill: { backgroundColor: '#F59E0B', borderRadius: 10, paddingVertical: 2, paddingHorizontal: 4, width: '100%', alignItems: 'center', marginTop: 2 },
  goldPillText: { color: '#451A03', fontSize: 8, fontFamily: 'Poppins_900Black' },

  // Price Badges
  priceBadgeCard: { width: '31%', height: 75, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 6, marginBottom: 8 },
  priceUnderText: { color: '#FFFFFF', fontSize: 9, fontFamily: 'Poppins_900Black', opacity: 0.9 },
  priceAmountText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_900Black' },

  // Zepto / Express
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
  productCardSmall: { width: 120, backgroundColor: '#021811', padding: 8, borderRadius: 14, marginRight: 10 },
  productImgSmall: { width: '100%', height: 90, borderRadius: 10, marginBottom: 6 },
  productTitleSmall: { color: '#FFF', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  shareBtn: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // Generic Fallback Card
  genericCard: { width: 115, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  genericImage: { width: '100%', height: 85, borderRadius: 10 },
  genericTitle: { fontSize: 10.5, fontFamily: 'Poppins_700Bold', color: '#334155', marginTop: 4 },
  genericPrice: { fontSize: 11.5, fontFamily: 'Poppins_800ExtraBold', color: '#16A34A', marginTop: 2 }
});
