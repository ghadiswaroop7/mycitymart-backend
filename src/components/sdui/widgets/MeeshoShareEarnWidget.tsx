import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { MeeshoShareEarnData, BlockStyle } from '../../../types/sdui';

interface Props {
  data: MeeshoShareEarnData;
  style?: BlockStyle;
}

export default function MeeshoShareEarnWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();

  const title = data?.title || 'Share & Earn with BazarPeth Reselling';
  const subtitle = data?.subtitle || 'Share trending local collections on WhatsApp and earn margins!';
  const marginText = data?.resellerMargin ? `Earn ₹${data.resellerMargin} Margin` : 'Earn ₹150+ per Order';
  const badgeText = data?.badgeText || '⚡ RESELLER PROGRAM';
  const buttonText = data?.buttonText || 'Share on WhatsApp 💬';

  const handleShare = async () => {
    const msg = data?.shareMessage || `🛍️ Check out the best local deals on BazarPeth app!\nDownload & start shopping: https://bazarpeth.com/app`;
    try {
      await Share.share({
        message: msg,
        title: 'BazarPeth Reselling',
      });
    } catch (e) {
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      <View style={styles.leftContent}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        
        <View style={styles.marginHighlightPill}>
          <Text style={styles.marginHighlightText}>💸 {marginText}</Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text style={styles.whatsappBtnText}>{buttonText}</Text>
        </TouchableOpacity>

        {data?.link && (
          <TouchableOpacity
            style={styles.learnMoreBtn}
            onPress={() => handleSDUILink(data.link, navigation, 'Reseller Hub')}
            activeOpacity={0.7}
          >
            <Text style={styles.learnMoreText}>View Catalog →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF0F6',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
  },
  badgePill: {
    backgroundColor: '#DB2777',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#831843',
    lineHeight: 18,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#9D174D',
    lineHeight: 14,
    marginBottom: 6,
  },
  marginHighlightPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  marginHighlightText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#BE185D',
  },
  rightActions: {
    alignItems: 'center',
    gap: 6,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  learnMoreBtn: {
    paddingVertical: 3,
  },
  learnMoreText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#DB2777',
  },
});
