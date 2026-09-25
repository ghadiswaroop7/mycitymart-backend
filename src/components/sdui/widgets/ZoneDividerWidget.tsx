import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  data?: {
    title?: string;
    subtitle?: string;
  };
  style?: any;
}

export default function ZoneDividerWidget({ data }: Props) {
  const title = data?.title || '✦ BOUTIQUE & HERITAGE MARKETPLACE ✦';

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.pill}>
        <Text style={styles.pillText}>{title}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
  },
  pill: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginHorizontal: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    color: '#FDE68A',
    fontSize: 9.5,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
