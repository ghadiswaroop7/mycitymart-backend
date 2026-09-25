import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { handleSDUILink } from '../../../utils/sduiNavigation';

interface ArchItem {
  id?: string;
  title: string;
  imageUrl?: string;
  image?: string;
  price?: string;
  link?: string;
}

interface TrustBadge {
  title: string;
  subtitle?: string;
  icon?: string;
}

interface Props {
  data?: {
    title?: string;
    subtitle?: string;
    deliveryText?: string;
    items?: ArchItem[];
    trustBadges?: TrustBadge[];
  };
  style?: any;
}

const DEFAULT_ARCH_ITEMS: ArchItem[] = [
  {
    id: 'arch_0',
    title: 'Banarasi Brocade',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
    price: '₹2,499',
    link: 'category/sarees',
  },
  {
    id: 'arch_1',
    title: 'Chanderi Silk Set',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80',
    price: '₹1,899',
    link: 'category/chanderi',
  },
  {
    id: 'arch_2',
    title: 'Kanjivaram Gold',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80',
    price: '₹3,299',
    link: 'category/kanjivaram',
  },
];

export default function BoutiqueSpotlightWidget({ data }: Props) {
  const navigation = useNavigation<any>();
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_ARCH_ITEMS;
  const deliveryText = data?.deliveryText || '🚚 Delivery in 2-4 days, handcrafted to order';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>✨ ROYAL HERITAGE ✨</Text>
        <Text style={styles.title}>{data?.title || 'Boutique Spotlight'}</Text>
        <Text style={styles.subtitle}>{data?.subtitle || 'Authentic Handlooms & Artisanal Creations'}</Text>
      </View>

      {/* 3 Indian Arch / Vault Jharokha Cards */}
      <View style={styles.grid}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            activeOpacity={0.88}
            onPress={() => handleSDUILink(item.link || 'category/sarees', navigation, item.title)}
            style={styles.card}
          >
            <View style={styles.archWrapper}>
              <SafeImage uri={item.imageUrl || item.image} style={styles.archImage} resizeMode="cover" />
            </View>
            <View style={styles.cardInfo}>
              <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
              {item.price ? <Text style={styles.cardPrice}>{item.price}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Handcrafted Delivery Microcopy (Replaces ETA bar equivalent; ZERO X-min language) */}
      <View style={styles.deliveryBar}>
        <Text style={styles.deliveryText}>{deliveryText}</Text>
      </View>

      {/* Reused Trust Badge Row */}
      <View style={styles.trustRow}>
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>🛡️ 100% Genuine</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>🔄 7 Days Return</Text>
        </View>
        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>📦 Express Delivery</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3B0716',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 8.5,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FBBF24',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FDE68A',
    marginTop: 1,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(253, 230, 138, 0.8)',
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 16,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    overflow: 'hidden',
  },
  archWrapper: {
    width: '100%',
    height: 90,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
  },
  archImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    color: '#FDE68A',
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 9.5,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FBBF24',
    marginTop: 1,
  },
  deliveryBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deliveryText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FDE68A',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  trustBadge: {
    alignItems: 'center',
  },
  trustText: {
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    color: '#FBBF24',
  },
});
