import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { HugeIcon } from '../components/HugeIcon';
import {
  ArrowLeft01Icon,
  UserIcon,
  MailIcon,
  CallIcon,
  LockIcon,
} from '@hugeicons/core-free-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS, FONTS, SIZES } from '../styles/theme';

WebBrowser.maybeCompleteAuthSession();

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
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Signup Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function SignupScreen() {
  // ── State ──
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  // ── Google Sign Up ──
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || 'unconfigured.apps.googleusercontent.com',
    webClientId: webClientId || 'unconfigured',
  });

  const handleGoogleSignUp = async () => {
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
      setError('Google sign-up failed.');
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
      setError('Google error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Email/Password Sign Up ──
  const handleSignup = async () => {
    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create Firebase Auth user
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Update display name
      await updateProfile(result.user, { displayName: fullName.trim() });

      // Save profile to Firestore
      const userData = {
        uid: result.user.uid,
        displayName: fullName.trim(),
        email: result.user.email,
        phoneNumber: phone ? '+91' + phone : '',
        photoURL: '',
      };
      await saveUserProfile(userData);

      dispatch(setUser(userData));

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Check if form is valid for button state ──
  const isFormValid =
    fullName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    password === confirmPassword;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
          <Text style={styles.heading}>Create Account 🎉</Text>
          <Text style={styles.subheading}>
            Let's get started — your style store awaits!
          </Text>

          {/* ── Google Sign Up ── */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Full Name ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={UserIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textPlaceholder}
              value={fullName}
              onChangeText={(t) => { setFullName(t); setError(''); }}
            />
          </View>

          {/* ── Email ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={MailIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Email address"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
          </View>

          {/* ── Phone ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={CallIcon} size={20} color={COLORS.textMuted} />
            <Text style={styles.phonePrefix}>+91</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Mobile number"
              placeholderTextColor={COLORS.textPlaceholder}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(''); }}
            />
          </View>

          {/* ── Password ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={LockIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Create password (min 8 chars)"
              placeholderTextColor={COLORS.textPlaceholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 18, color: COLORS.textMuted }}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Confirm Password ── */}
          <View style={styles.inputContainer}>
            <HugeIcon icon={LockIcon} size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.inputField}
              placeholder="Confirm password"
              placeholderTextColor={COLORS.textPlaceholder}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 18, color: COLORS.textMuted }}>{showConfirmPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Terms ── */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => Alert.alert('Terms of Service', 'Terms page coming soon.')}>
              Terms
            </Text>{' '}
            &{' '}
            <Text style={styles.termsLink} onPress={() => Alert.alert('Privacy Policy', 'Privacy page coming soon.')}>
              Privacy Policy
            </Text>
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* ── Create Account Button ── */}
          <TouchableOpacity
            style={[styles.primaryButton, !isFormValid && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading || !isFormValid}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* ── Bottom Link ── */}
          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLinkGreen}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    width: 48,
    height: 48,
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
    fontSize: 15,
    color: COLORS.textMuted,
    marginBottom: 22,
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
    marginVertical: 18,
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
    marginBottom: 12,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  phonePrefix: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.textMuted,
  },

  // ── Terms ──
  termsText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  termsLink: {
    fontFamily: FONTS.semibold,
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

  // ── Bottom Link ──
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
});
