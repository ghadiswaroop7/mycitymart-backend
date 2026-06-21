import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';
import { app, auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

WebBrowser.maybeCompleteAuthSession();

const saveUserProfile = async (userData: any) => {
  const userRef = doc(db, 'users', userData.uid);
  // Using merge: true as requested so existing user data is not overwritten
  await setDoc(userRef, {
    ...userData,
    updatedAt: serverTimestamp(),
    createdAt: userData.createdAt || serverTimestamp(), // If new, set createdAt
  }, { merge: true });
};

const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  const recaptchaVerifier = useRef<any>(null);
  const dispatch = useDispatch();

  // Google Sign In Setup
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
      // Graceful cancellation (do not throw, just reset loading)
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
      
      // Navigate to Home without back history
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setError('Google Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP STAGE 1 — SEND OTP
  const sendOTP = async () => {
    if (phone.length !== 10) {
      setError('Enter exactly 10 digits');
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      // Mobile OTP requires reCAPTCHA for React Native Firebase Web SDK
      const phoneNumber = '+91' + phone;
      const verificationId = await signInWithPhoneNumber(
        auth, 
        phoneNumber,
        recaptchaVerifier.current
      );
      
      // We got confirmation result back (simulated via ID in expo wrapper)
      setVerificationId(verificationId.verificationId);
      setShowOTP(true);
      
    } catch (err: any) {
      console.error('sendOTP error:', err);
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP STAGE 3 — VERIFY OTP
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
      
      // Replace stack safely
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Wrong OTP, try again'); // Explicit error message requested
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // RENDER — Phone input screen
  if (!showOTP) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={app.options}
          attemptInvisibleVerification={true}
        />
        
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <Text style={styles.appName}>Jhat-Pat</Text>
          <Text style={styles.tagline}>Apna mohalla, apni dukaan</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formSection}>
          <Text style={styles.heading}>Welcome!</Text>
          <Text style={styles.subheading}>Sign in to shop from local stores</Text>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Phone Input */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.flagText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter 10 digit number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.otpBtn, phone.length !== 10 && styles.otpBtnDisabled]}
            onPress={sendOTP}
            disabled={phone.length !== 10 || loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.otpBtnText}>Send OTP →</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP STAGE 2 — INPUT SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
      />
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => { setShowOTP(false); setOtp(''); setError(''); }}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.otpSection}>
        <Text style={styles.otpTitle}>Verify OTP</Text>
        <Text style={styles.otpSubtitle}>Sent to +91 {phone}</Text>

        <OTPInput value={otp} onChange={setOtp} length={6} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.otpBtn, otp.length !== 6 && styles.otpBtnDisabled]}
          onPress={verifyOTP}
          disabled={otp.length !== 6 || loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.otpBtnText}>Verify & Continue →</Text>}
        </TouchableOpacity>

        <ResendOTP phone={phone} onResend={sendOTP} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// OTP Input Component — 6 individual boxes
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
      {Array(length).fill(0).map((_, i) => (
        <TextInput
          key={i}
          ref={(ref: any) => { inputs.current[i] = ref; }}
          style={[styles.otpBox, value[i] ? styles.otpBoxFilled : {}]}
          maxLength={1}
          keyboardType="number-pad"
          value={value[i] || ''}
          onChangeText={text => handleChange(text, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          autoFocus={i === 0} // Auto-focus requested
        />
      ))}
    </View>
  );
};

// Resend OTP with 60-second countdown
const ResendOTP = ({ phone, onResend }: any) => {
  const [seconds, setSeconds] = useState(60); // Required 60-second timer
  
  useEffect(() => {
    if (seconds === 0) return;
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  
  return (
    <TouchableOpacity
      onPress={() => { onResend(); setSeconds(60); }}
      disabled={seconds > 0}
      style={{ marginTop: 24, paddingVertical: 8 }}
    >
      <Text style={[styles.resendText, seconds > 0 ? { color: '#9CA3AF' } : {}]}>
        {seconds > 0 ? `Resend OTP in ${seconds}s` : 'Resend OTP'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logoSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#008B45', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: '#008B45' },
  tagline: { fontSize: 14, color: '#757575', marginTop: 4 },
  formSection: { padding: 24 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  subheading: { fontSize: 14, color: '#757575', marginTop: 6, marginBottom: 24 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DADCE0', borderRadius: 12, height: 52, backgroundColor: '#fff', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  googleIcon: { fontSize: 20, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: 16, color: '#1A1A1A', fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  countryCode: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, height: 52, justifyContent: 'center', backgroundColor: '#F9FAFB' },
  flagText: { fontSize: 15, fontWeight: '500' },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 16, height: 52, fontSize: 16, backgroundColor: '#F9FAFB', fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 16, fontWeight: '500', textAlign: 'center' },
  otpBtn: { backgroundColor: '#008B45', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  otpBtnDisabled: { backgroundColor: '#D1D5DB' },
  otpBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 16 },
  backText: { fontSize: 16, color: '#008B45', fontWeight: '600' },
  otpSection: { flex: 1, padding: 24 },
  otpTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  otpSubtitle: { fontSize: 15, color: '#6B7280', marginTop: 8, marginBottom: 32, fontWeight: '500' },
  otpBoxRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  otpBox: { flex: 1, height: 56, maxWidth: 50, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: '700', backgroundColor: '#F9FAFB', color: '#111827' },
  otpBoxFilled: { borderColor: '#008B45', backgroundColor: '#F0FDF4' },
  resendText: { textAlign: 'center', color: '#008B45', fontSize: 15, fontWeight: '600' },
});

export default LoginScreen;
