import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { handleSDUILink } from '../../../utils/sduiNavigation';

interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  sub?: string;
  link?: string;
}

interface Props {
  data?: {
    title?: string;
    items?: CategoryItem[];
  };
  style?: any;
}

const DEFAULT_ITEMS: CategoryItem[] = [
  { id: 'qc_groc', icon: '🥦', name: 'Groceries', sub: 'Fresh Kirana', link: 'category/groceries' },
  { id: 'qc_daily', icon: '🥛', name: 'Daily Essentials', sub: 'Milk & Dairy', link: 'category/daily_dairy' },
  { id: 'qc_cafe', icon: '☕', name: 'Sangamner Café', sub: 'Snacks & Brews', link: 'category/cafe' },
  { id: 'qc_mandi', icon: '🍎', name: 'Fresh Mandi', sub: 'Veggies & Fruits', link: 'category/mandi' },
];

export default function QuickCommerceCategoriesWidget({ data }: Props) {
  const navigation = useNavigation<any>();
  const items = data?.items && data.items.length > 0 ? data.items : DEFAULT_ITEMS;

  return (
    <View style={styles.container}>
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>⚡ QUICK-COMMERCE ZONE</Text>
        </View>
        <Text style={styles.deliveryEta}>10-15 Min Delivery</Text>
      </View>

      {/* Categories Row */}
      <View style={styles.grid}>
        {items.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.85}
            onPress={() => handleSDUILink(cat.link || 'category/groceries', navigation, cat.name)}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{cat.icon || '🛍️'}</Text>
            </View>
            <Text numberOfLines={1} style={styles.name}>{cat.name}</Text>
            {cat.sub ? (
              <View style={styles.subPill}>
                <Text numberOfLines={1} style={styles.subText}>{cat.sub}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF7ED',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeWrap: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  deliveryEta: {
    fontSize: 9.5,
    fontFamily: 'Poppins_700Bold',
    color: '#9A3412',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 18,
  },
  name: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  subPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    width: '100%',
    alignItems: 'center',
  },
  subText: {
    fontSize: 7,
    fontFamily: 'Poppins_600SemiBold',
    color: '#B45309',
  },
});
