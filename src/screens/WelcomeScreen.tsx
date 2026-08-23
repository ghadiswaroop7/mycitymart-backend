import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.mintGradientStart} />
      <LinearGradient
        colors={[COLORS.mintGradientStart, COLORS.white]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* ── Logo Section ── */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/bazarpeth_logo_horizontal_transparent.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Your Hyperlocal Market, At Your Doorstep!</Text>
          </View>

          {/* ── Center Illustration ── */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../../assets/welcome_illustration.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* ── Bottom Content ── */}
          <View style={styles.bottomSection}>
            <Text style={styles.heading}>Welcome to BazarPeth</Text>
            <Text style={styles.bulletText}>
              Fresh groceries & local essentials,{'\n'}delivered instantly
            </Text>

            {/* Primary CTA Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            {/* Bottom Sign In Link */}
            <View style={styles.signInRow}>
              <Text style={styles.orText}>Or </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: SIZES.sectionPaddingH,
  },

  // ── Logo ──
  logoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // ── Illustration ──
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  illustration: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.65,
  },

  // ── Bottom Section ──
  bottomSection: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  bulletText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryButton: {
    width: '100%',
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: SIZES.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  orText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  signInLink: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.primaryGreen,
  },
});

export default WelcomeScreen;
