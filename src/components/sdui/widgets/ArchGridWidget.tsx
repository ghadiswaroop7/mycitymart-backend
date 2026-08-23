import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { ArchGridData, BlockStyle } from '../../../types/sdui';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;

interface Props {
  data: ArchGridData;
  style?: BlockStyle;
}

export default function ArchGridWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();
  const columns = data?.columns || 2;
  const items = data?.items || [];
  const title = data?.title;

  if (items.length === 0) return null;

  const gap = 12;
  const totalGap = gap * (columns - 1);
  const cardWidth = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - totalGap) / columns;
  const cardHeight = cardWidth * 1.35;
  const archRadius = Math.min(cardWidth / 2, 30);

  return (
    <View style={[styles.container, style?.bgColor ? { backgroundColor: style.bgColor } : null]}>
      {title ? (
        <Text style={styles.sectionTitle}>{title}</Text>
      ) : null}

      <View style={styles.grid}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={`arch-${index}`}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
              },
            ]}
            onPress={() => handleSDUILink(item.link || 'category/men', navigation, item.title)}
            activeOpacity={0.88}
          >
            {/* Arch-shaped image container */}
            <View
              style={[
                styles.archImageWrap,
                {
                  width: cardWidth,
                  height: cardHeight * 0.7,
                  borderTopLeftRadius: archRadius,
                  borderTopRightRadius: archRadius,
                },
              ]}
            >
              <SafeImage
                uri={item.imageUrl}
                style={[
                  styles.archImage,
                  {
                    borderTopLeftRadius: archRadius,
                    borderTopRightRadius: archRadius,
                  },
                ]}
                resizeMode="cover"
              />
            </View>

            {/* Text section (flat bottom) */}
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  archImageWrap: {
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  archImage: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#71717A',
    textAlign: 'center',
    marginTop: 2,
  },
});
