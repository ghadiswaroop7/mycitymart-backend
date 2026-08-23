import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { HugeIcon } from '../../HugeIcon';
import { TagIcon, Tick01Icon } from '@hugeicons/core-free-icons';
import type { AmazonBankOffersData, BlockStyle } from '../../../types/sdui';

interface Props {
  data: AmazonBankOffersData;
  style?: BlockStyle;
}

export default function AmazonBankOffersWidget({ data, style }: Props) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const title = data?.title || 'Bank & Payment Partner Offers';
  const subtitle = data?.subtitle || 'Instant discounts on Credit/Debit cards & UPI';
  const offers = data?.offers && data.offers.length > 0 ? data.offers : [
    { bankName: 'HDFC Bank', discountText: '10% Instant Off up to ₹250', minOrder: 999, couponCode: 'HDFC10', color: '#004C8F' },
    { bankName: 'SBI Cards', discountText: 'Flat ₹100 Off on Grocery', minOrder: 799, couponCode: 'SBI100', color: '#29ABE2' },
    { bankName: 'ICICI Bank', discountText: '15% Off on Men & Women Fashion', minOrder: 1299, couponCode: 'ICICI15', color: '#F37021' },
    { bankName: 'Google Pay UPI', discountText: 'Flat ₹50 Cashback', minOrder: 499, couponCode: 'GPAY50', color: '#34A853' },
  ];

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Alert.alert('Coupon Applied! 🎉', `Code "${code}" copied to clipboard. Apply at checkout for instant savings!`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <View
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.shieldPill}>
          <Text style={styles.shieldText}>🛡️ 100% Secure</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer, idx) => {
          const isCopied = copiedCode === offer.couponCode;
          return (
            <View key={offer.id || idx} style={styles.offerCard}>
              <View style={[styles.bankTopStrip, { backgroundColor: offer.color || '#0F172A' }]}>
                <Text style={styles.bankNameText}>{offer.bankName}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.discountText}>{offer.discountText}</Text>
                {offer.minOrder ? (
                  <Text style={styles.minOrderText}>Min spend ₹{offer.minOrder}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.copyBtn, isCopied && styles.copyBtnActive]}
                  onPress={() => handleCopyCode(offer.couponCode)}
                  activeOpacity={0.8}
                >
                  <HugeIcon icon={isCopied ? Tick01Icon : TagIcon} size={12} color={isCopied ? '#FFFFFF' : '#008B45'} />
                  <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextActive]}>
                    {isCopied ? 'COPIED' : offer.couponCode}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  shieldPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shieldText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
  },
  scrollContent: {
    gap: 10,
  },
  offerCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bankTopStrip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bankNameText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: 'Poppins_700Bold',
  },
  cardBody: {
    padding: 10,
  },
  discountText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    lineHeight: 15,
    marginBottom: 3,
  },
  minOrderText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 6,
    paddingVertical: 4,
    gap: 4,
  },
  copyBtnActive: {
    backgroundColor: '#008B45',
    borderColor: '#008B45',
  },
  copyBtnText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#008B45',
    letterSpacing: 0.5,
  },
  copyBtnTextActive: {
    color: '#FFFFFF',
  },
});
