import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

const NO_INTERNET_IMG = require('../../assets/no-internet-illustration/react-native/no_internet.png');

interface EmptyStateProps {
  icon?: string;
  image?: ImageSourcePropType;
  isOffline?: boolean;
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🛍️',
  image,
  isOffline = false,
  title,
  subtitle,
  actionText,
  onActionPress,
}) => {
  const resolvedImage = isOffline ? NO_INTERNET_IMG : image;

  return (
    <View style={styles.container}>
      {resolvedImage ? (
        <View style={styles.imageContainer}>
          <Image
            source={resolvedImage}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      {isOffline && (
        <Text style={styles.marathiHint}>इंटरनेट कनेक्शन उपलब्ध नाही</Text>
      )}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionText && onActionPress ? (
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.actionBtn, isOffline && styles.offlineActionBtn]}
          onPress={onActionPress}
        >
          <Text style={styles.actionBtnText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  imageContainer: {
    width: 180,
    height: 180,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BAZAR_RADIUS.full,
    backgroundColor: BAZAR_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  icon: {
    fontSize: 38,
  },
  title: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 19,
    color: BAZAR_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  marathiHint: {
    fontFamily: BAZAR_FONTS.medium,
    fontSize: 13.5,
    color: '#D97706',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 13.5,
    color: BAZAR_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 320,
  },
  actionBtn: {
    backgroundColor: BAZAR_COLORS.primary,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: BAZAR_RADIUS.full,
    ...BAZAR_SHADOWS.sm,
  },
  offlineActionBtn: {
    backgroundColor: '#008B45',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  actionBtnText: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 14,
    color: BAZAR_COLORS.textLight,
  },
});

export default EmptyState;
