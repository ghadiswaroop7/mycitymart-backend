import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { BAZAR_COLORS, BAZAR_FONTS, BAZAR_RADIUS, BAZAR_SHADOWS } from '../styles/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Automatically loads @1x, @2x, @3x depending on pixel density
const NO_INTERNET_IMG = require('../../assets/no-internet-illustration/react-native/no_internet.png');

interface NoInternetViewProps {
  onRetry?: () => Promise<void> | void;
  fullScreen?: boolean;
  title?: string;
  subtitle?: string;
  showHelpTips?: boolean;
}

export const NoInternetView: React.FC<NoInternetViewProps> = ({
  onRetry,
  fullScreen = true,
  title = 'No Internet Connection',
  subtitle = 'Please check your connection or Wi-Fi settings and try again.',
  showHelpTips = true,
}) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      }
    } finally {
      setTimeout(() => setRetrying(false), 600);
    }
  };

  return (
    <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
      {/* 3D Delivery Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={NO_INTERNET_IMG}
          style={styles.illustration}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel="No Internet Illustration"
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.marathiHint}>इंटरनेट कनेक्शन उपलब्ध नाही</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Amazon-style Network Checklist Tips */}
        {showHelpTips && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsHeader}>Quick Troubleshooting:</Text>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Check if your Wi-Fi or Mobile Data is turned on</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Turn Airplane mode on and off to reset signal</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Ensure you have an active data pack / balance</Text>
            </View>
          </View>
        )}

        {/* Amazon-style Call to Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.retryBtn, retrying && styles.retryBtnDisabled]}
          onPress={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <View style={styles.btnContentRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Checking connection...</Text>
            </View>
          ) : (
            <View style={styles.btnContentRow}>
              <Text style={styles.retryBtnText}>Try Again • पुन्हा प्रयत्न करा</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  imageContainer: {
    width: Math.min(SCREEN_WIDTH * 0.65, 260),
    height: Math.min(SCREEN_WIDTH * 0.65, 260),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 22,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  marathiHint: {
    fontFamily: BAZAR_FONTS.medium,
    fontSize: 14,
    color: '#D97706', // Warm amber / orange
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipsHeader: {
    fontFamily: BAZAR_FONTS.semibold,
    fontSize: 13,
    color: '#334155',
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: '#008B45',
    marginRight: 8,
    lineHeight: 18,
  },
  tipText: {
    flex: 1,
    fontFamily: BAZAR_FONTS.regular,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  retryBtn: {
    width: '100%',
    backgroundColor: '#008B45',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...BAZAR_SHADOWS.md,
  },
  retryBtnDisabled: {
    opacity: 0.75,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryBtnText: {
    fontFamily: BAZAR_FONTS.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default NoInternetView;
