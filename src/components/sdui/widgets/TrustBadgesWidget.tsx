import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TrustBadgesData } from '../../../types/sdui';

interface Props {
  data: TrustBadgesData;
}

const DEFAULT_BADGES = [
  { icon: '🚚', title: 'Free Delivery', subtitle: 'First 3 orders' },
  { icon: '⚡', title: 'Flash Deals', subtitle: 'Up to 60% off' },
  { icon: '🛡️', title: 'Authentic', subtitle: 'Verified shops' },
];

export default function TrustBadgesWidget({ data }: Props) {
  const badges = data?.badges?.length ? data.badges : DEFAULT_BADGES;

  return (
    <View style={styles.container}>
      {badges.map((badge, index) => (
        <View key={`${badge.title}-${index}`} style={styles.badgeItem}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{badge.icon}</Text>
          </View>
          <Text style={styles.title}>{badge.title}</Text>
          {badge.subtitle ? (
            <Text style={styles.subtitle}>{badge.subtitle}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#1C1C1C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    fontFamily: 'Poppins_300Light',
    color: '#71717A',
    textAlign: 'center',
  },
});
