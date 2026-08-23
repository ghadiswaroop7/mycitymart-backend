import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from '../../SafeImage';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { TagShapedCardsData, BlockStyle } from '../../../types/sdui';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  data: TagShapedCardsData;
  style?: BlockStyle;
}

export default function TagShapedCardsWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();
  const items = data?.items || [];
  const title = data?.title;

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, style?.bgColor ? { backgroundColor: style.bgColor } : null]}>
      {title ? (
        <Text style={styles.sectionTitle}>{title}</Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item: any, index: number) => {
          const label = item.label || item.title || 'Collection';
          const imgUrl = item.imageUrl || item.img;
          return (
            <TouchableOpacity
              key={`tag-${index}`}
              style={[
                styles.tagCard,
                { backgroundColor: item.bgColor || '#E8F5E9' },
              ]}
              onPress={() => handleSDUILink(item.link || 'category/men', navigation, label)}
              activeOpacity={0.88}
            >
            {/* Tag notch (triangle cut on bottom-right) */}
            <View style={[styles.tagNotch, { borderBottomColor: item.bgColor || '#DBEAFE' }]} />

            {/* Image */}
            <SafeImage
              uri={item.imageUrl}
              style={styles.tagImage}
              resizeMode="contain"
            />

            {/* Label */}
            <View style={styles.labelWrap}>
              <Text style={styles.labelText}>{item.label}</Text>
            </View>

            {/* Tag hole decoration */}
            <View style={styles.tagHole} />
          </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  tagCard: {
    width: 130,
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // Tag shape: slight angled bottom-right via the notch overlay
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tagNotch: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 28,
    borderBottomWidth: 28,
    borderRightColor: '#FFFFFF',
    borderBottomColor: 'transparent',
  },
  tagImage: {
    width: 80,
    height: 80,
    marginBottom: 6,
  },
  labelWrap: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  labelText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  tagHole: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
});
