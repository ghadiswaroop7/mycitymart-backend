import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from './SafeImage';
import { handleSDUILink } from '../utils/sduiNavigation';

export interface CategoryGridItem {
  id?: string;
  title: string;
  imageUrl?: string;
  image?: string;
  link?: string;
  tag?: string;
}

interface Props {
  items?: CategoryGridItem[];
  title?: string;
}

export default function ExploreCategoriesGrid({ items = [], title = 'Explore by Category' }: Props) {
  const navigation = useNavigation<any>();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.badgeCount}>{items.length} Curated</Text>
      </View>
      <View style={styles.gridContainer}>
        {items.map((item, index) => {
          const imageUri = item.imageUrl || item.image || 'https://via.placeholder.com/200';
          const link = item.link || (item.id ? `category/${item.id}` : 'category/women');

          return (
            <TouchableOpacity
              key={item.id || `explore_${index}`}
              activeOpacity={0.88}
              onPress={() => handleSDUILink(link, navigation, item.title)}
              style={styles.gridCard}
            >
              <View style={styles.imageWrapper}>
                <SafeImage uri={imageUri} style={styles.cardImage} resizeMode="cover" />
                {item.tag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
  },
  badgeCount: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#64748B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Poppins_800ExtraBold',
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1E293B',
    marginTop: 6,
    textAlign: 'center',
  },
});
