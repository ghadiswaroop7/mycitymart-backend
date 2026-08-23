import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { HugeIcon } from '../../HugeIcon';
import { FlashIcon, TruckIcon, Location01Icon, ArrowRightIcon } from '@hugeicons/core-free-icons';
import { handleSDUILink } from '../../../utils/sduiNavigation';
import type { ZeptoEtaBarData, BlockStyle } from '../../../types/sdui';

interface Props {
  data: ZeptoEtaBarData;
  style?: BlockStyle;
}

export default function ZeptoEtaBarWidget({ data, style }: Props) {
  const navigation = useNavigation<any>();
  const cartCount = useSelector((state: RootState) => state.cart.count);
  const profile = useSelector((state: RootState) => state.profile.profile);

  const [secondsLeft, setSecondsLeft] = useState(600); // 10 mins countdown

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const etaMinutes = data?.etaMinutes || '10-15';
  const location = profile?.city || data?.locationText || 'Sangamner Market';
  const freeDeliveryThreshold = data?.freeDeliveryThreshold || 499;
  const currentCartValue = data?.currentCartValue || 299;
  const amountNeeded = Math.max(freeDeliveryThreshold - currentCartValue, 0);
  const progressPercent = Math.min(Math.round((currentCartValue / freeDeliveryThreshold) * 100), 100);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.container,
        style?.bgColor ? { backgroundColor: style.bgColor } : null,
      ]}
      onPress={() => handleSDUILink('cart', navigation)}
    >
      <View style={styles.topRow}>
        <View style={styles.etaBadge}>
          <HugeIcon icon={FlashIcon} size={15} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.etaText}>⚡ {etaMinutes} MINS</Text>
        </View>

        <View style={styles.locationPill}>
          <HugeIcon icon={Location01Icon} size={13} color="#008B45" />
          <Text style={styles.locationText} numberOfLines={1}>
            Delivering to <Text style={{ fontWeight: '700' }}>{location}</Text>
          </Text>
        </View>

        <View style={styles.timerPill}>
          <Text style={styles.timerText}>⏳ {formatTimer(secondsLeft)}</Text>
        </View>
      </View>

      {/* Free Shipping Meter */}
      <View style={styles.meterContainer}>
        <View style={styles.meterInfoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <HugeIcon icon={TruckIcon} size={13} color="#008B45" />
            <Text style={styles.meterInfoText}>
              {amountNeeded > 0 ? (
                <>Add <Text style={styles.highlightText}>₹{amountNeeded}</Text> more for <Text style={styles.highlightText}>FREE Delivery</Text></>
              ) : (
                <Text style={styles.freeDelivUnlocked}>🎉 You Unlocked FREE Express Delivery!</Text>
              )}
            </Text>
          </View>
          <HugeIcon icon={ArrowRightIcon} size={13} color="#008B45" />
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#008B45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  etaBadge: {
    backgroundColor: '#008B45',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  etaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.5,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    gap: 3,
  },
  locationText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    color: '#1E293B',
  },
  timerPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#B45309',
  },
  meterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
  },
  meterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterInfoText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_500Medium',
    color: '#475569',
  },
  highlightText: {
    fontWeight: '700',
    color: '#008B45',
  },
  freeDelivUnlocked: {
    fontWeight: '700',
    color: '#008B45',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#008B45',
    borderRadius: 3,
  },
});
