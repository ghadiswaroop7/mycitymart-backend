import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  PhoneAuthProvider,
} from 'firebase/auth';
import { app, auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import FirebaseRecaptchaVerifierModal from '../components/FirebaseRecaptchaVerifierModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { HugeIcon } from '../components/HugeIcon';
import {
  ArrowLeft01Icon,
  MailIcon,
  LockIcon,
  CallIcon,
} from '@hugeicons/core-free-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: save user profile to Firestore
// ─────────────────────────────────────────────────────────────────────────────
const saveUserProfile = async (userData: any) => {
  const userRef = doc(db, 'users', userData.uid);
  await setDoc(
    userRef,
    {
      ...userData,
      updatedAt: serverTimestamp(),
      createdAt: userData.createdAt || serverTimestamp(),
    },
    { merge: true },
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Login Screen
// ─────────────────────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }: any) => {
  // ── State ──
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [forgotModalVisible, setForgotModalVisible] = useState(false);

  const recaptchaVerifier = useRef<any>(null);
  const dispatch = useDispatch();

  // ── Google Sign In ──
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || 'unconfigured.apps.googleusercontent.com',
    webClientId: webClientId || 'unconfigured',
  });

  const handleGoogleSignIn = async () => {
    if (!request || !webClientId || webClientId === 'your_web_client_id') {
      Alert.alert('Setup Required', 'Add Google Client IDs to .env');
      return;
    }
    setError('');
    await promptAsync();
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleCredential(id_token);
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    } else if (response?.type === 'error') {
      setError('Google sign-in failed or was cancelled.');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleCredential = async (idToken: string) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      await saveUserProfile(userData);
      dispatch(setUser(userData));
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      setError('Google Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Email / Password Sign In ──
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName || email.split('@')[0],
        email: result.user.email,
        photoURL: result.user.photoURL || '',
      };
      await saveUserProfile(userData);
      dispatch(setUser(userData));
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Try again');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ──
  const handleForgotPassword = () => {
    setForgotModalVisible(true);
  };

  // ── OTP: Send ──
  const sendOTP = async () => {
    if (phone.length !== 10) {
      setError('Enter exactly 10 digits');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const phoneNumber = '+91' + phone;
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier.current,
      );
      setVerificationId(confirmation.verificationId);
      setShowOTP(true);
    } catch (err: any) {
      console.error('sendOTP error:', err);
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Verify ──
  const verifyOTP = async () => {
    if (!verificationId || otp.length !== 6) return;
    try {
      setLoading(true);
      setError('');
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName || phone,
        phoneNumber: '+91' + phone,
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
      };
      await saveUserProfile(userData);
      dispatch(setUser(userData));
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Wrong OTP, try again');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // OTP VERIFY SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (showOTP) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={app.options}
        />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { setShowOTP(false); setOtp(''); setError(''); }}
        >
          <HugeIcon icon={ArrowLeft01Icon} size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.otpSection}
        >
          <Text style={styles.otpTitle}>Verify OTP</Text>
          <Text style={styles.otpSubtitle}>Sent to +91 {phone}</Text>

          <OTPInput value={otp} onChange={setOtp} length={6} />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, otp.length !== 6 && styles.buttonDisabled]}
            onPress={verifyOTP}
            disabled={otp.length !== 6 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify & Continue →</Text>
            )}
          </TouchableOpacity>

          <ResendOTP phone={phone} onResend={sendOTP} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />

      {/* ── Header Row ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <HugeIcon icon={ArrowLeft01Icon} size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Image
          source={require('../../assets/bazarpeth_logo_horizontal_transparent.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Heading ── */}
          <Text style={styles.heading}>Welcome back! 👋</Text>
          <Text style={styles.subheading}>Sign in to continue shopping!</Text>

          {/* ── Google Sign In ── */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Email Input ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={MailIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
          </View>

          {/* ── Password Input ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={LockIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textPlaceholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 18, color: COLORS.textMuted }}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Forgot Password ── */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* ── Sign In Button ── */}
          <TouchableOpacity
            style={[styles.primaryButton, (!email.trim() || !password.trim()) && styles.buttonDisabled]}
            onPress={handleEmailSignIn}
            disabled={loading || !email.trim() || !password.trim()}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* ── Vertical Divider ── */}
          <View style={styles.verticalDividerRow}>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Mobile OTP Row ── */}
          <View style={styles.otpRow}>
            <View style={styles.otpCountryCode}>
              <Text style={styles.otpCountryText}>+91</Text>
            </View>
            <TextInput
              style={styles.otpPhoneInput}
              placeholder="Phone number"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
            <TouchableOpacity
              style={[styles.sendOtpBtn, phone.length !== 10 && styles.sendOtpBtnDisabled]}
              onPress={sendOTP}
              disabled={phone.length !== 10 || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendOtpBtnText}>Send OTP</Text>
            </TouchableOpacity>
          </View>

          {/* ── Bottom Link ── */}
          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.bottomLinkGreen}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => setForgotModalVisible(false)}
        initialEmail={email}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OTP Input — 6 individual boxes
// ─────────────────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, length = 6 }: any) => {
  const inputs = useRef<any>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = value.split('');
    newOtp[index] = text;
    onChange(newOtp.join(''));
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpBoxRow}>
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <TextInput
            key={i}
            ref={(ref: any) => { inputs.current[i] = ref; }}
            style={[styles.otpBox, value[i] ? styles.otpBoxFilled : {}]}
            maxLength={1}
            keyboardType="number-pad"
            value={value[i] || ''}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            autoFocus={i === 0}
          />
        ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Resend OTP with 60-second countdown
// ─────────────────────────────────────────────────────────────────────────────
const ResendOTP = ({ phone, onResend }: any) => {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setTimeout(() => setSeconds((s: number) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <TouchableOpacity
      onPress={() => { onResend(); setSeconds(60); }}
      disabled={seconds > 0}
      style={{ marginTop: 24, paddingVertical: 8 }}
    >
      <Text
        style={[
          styles.resendText,
          seconds > 0 ? { color: COLORS.textPlaceholder } : {},
        ]}
      >
        {seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backBtn: {
    padding: 12,
  },
  headerLogo: {
    width: 56,
    height: 56,
  },
  scrollContent: {
    paddingHorizontal: SIZES.sectionPaddingH,
    paddingBottom: 40,
  },

  // ── Heading ──
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 24,
  },

  // ── Google Button ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.googleBorder,
    borderRadius: SIZES.inputRadius,
    height: SIZES.inputHeight,
    backgroundColor: COLORS.white,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.googleBlue,
  },
  googleBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    fontFamily: FONTS.medium,
    color: COLORS.textPlaceholder,
    fontSize: 14,
  },

  // ── Inputs ──
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SIZES.inputHeight,
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.inputRadius,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },

  // ── Forgot Password ──
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.primaryGreen,
  },

  // ── Error ──
  errorText: {
    fontFamily: FONTS.medium,
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },

  // ── Primary Button ──
  primaryButton: {
    width: '100%',
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: SIZES.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#B0C4B1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
  },

  // ── Vertical Divider ──
  verticalDividerRow: {
    alignItems: 'center',
    marginVertical: 18,
  },

  // ── OTP Row ──
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  otpCountryCode: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.inputRadius,
    paddingHorizontal: 12,
    height: SIZES.inputHeight,
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundLight,
  },
  otpCountryText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  otpPhoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.inputRadius,
    paddingHorizontal: 14,
    height: SIZES.inputHeight,
    fontFamily: FONTS.medium,
    fontSize: 15,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.textPrimary,
  },
  sendOtpBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: SIZES.inputRadius,
    paddingHorizontal: 16,
    height: SIZES.inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendOtpBtnDisabled: {
    backgroundColor: '#B0C4B1',
  },
  sendOtpBtnText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
    color: COLORS.white,
  },

  // ── Bottom Link ──
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bottomLinkGreen: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primaryGreen,
  },

  // ── OTP Verify Screen ──
  otpSection: {
    flex: 1,
    paddingHorizontal: SIZES.sectionPaddingH,
  },
  otpTitle: {
    fontFamily: FONTS.extrabold,
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  otpSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpBox: {
    flex: 1,
    height: 56,
    maxWidth: 50,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.inputRadius,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: FONTS.bold,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.textPrimary,
  },
  otpBoxFilled: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: COLORS.greenLight,
  },
  resendText: {
    textAlign: 'center',
    fontFamily: FONTS.semibold,
    color: COLORS.primaryGreen,
    fontSize: 15,
  },
});

export default LoginScreen;
