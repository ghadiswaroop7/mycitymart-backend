import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { HugeIcon } from './HugeIcon';
import {
  MailIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { COLORS, FONTS, SIZES } from '../styles/theme';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
}

const getFirebaseErrorMessage = (err: any): string => {
  if (!err) return 'Failed to send password reset email. Please try again.';
  const code = err.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many reset requests. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact customer support.';
    default:
      if (err.message) {
        return err.message.replace(/^Firebase:\s*/, '').replace(/\(auth\/.*\)\.?/, '').trim();
      }
      return 'An unexpected error occurred. Please try again.';
  }
};

const validateEmail = (emailStr: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(emailStr.trim());
};

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail || '');
      setError('');
      setIsSuccess(false);
      setLoading(false);
    }
  }, [visible, initialEmail]);

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSubmittedEmail(trimmedEmail);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HugeIcon icon={Cancel01Icon} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>

              {!isSuccess ? (
                <>
                  {/* Title & Description */}
                  <Text style={styles.title}>Forgot Password?</Text>
                  <Text style={styles.description}>
                    Enter your registered email address below and we will send you a password reset link.
                  </Text>

                  {/* Email Input */}
                  <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                    <HugeIcon icon={MailIcon} size={20} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your email"
                      placeholderTextColor={COLORS.textPlaceholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (error) setError('');
                      }}
                      editable={!loading}
                    />
                  </View>

                  {/* Error Message */}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.successContainer}>
                  <View style={styles.iconCircle}>
                    <HugeIcon icon={CheckmarkCircle02Icon} size={36} color="#10B981" />
                  </View>
                  <Text style={styles.successTitle}>Check Your Email! 📩</Text>
                  <Text style={styles.successMessage}>
                    We have sent a password reset link to:{'\n'}
                    <Text style={styles.emailHighlight}>{submittedEmail}</Text>
                  </Text>

                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>
                      💡 If you don't see the email in a few minutes, check your Spam or Junk folder.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.sectionPaddingH,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: SIZES.inputRadius,
    paddingHorizontal: 14,
    height: SIZES.inputHeight,
    marginBottom: 12,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputField: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'left',
  },
  primaryButton: {
    width: '100%',
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: SIZES.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.white,
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emailHighlight: {
    fontFamily: FONTS.semibold,
    color: COLORS.primaryGreen,
  },
  tipBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  tipText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default ForgotPasswordModal;
