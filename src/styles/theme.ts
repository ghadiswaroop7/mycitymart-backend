/**
 * Design System Tokens — Auth Screens
 * Extracted from the BazarPeth design specification.
 */

export const COLORS = {
  /** Primary brand green used across auth screens */
  primaryGreen: '#1E5631',
  /** Light mint gradient start for Welcome screen */
  mintGradientStart: '#F0FFF0',
  /** Gradient end / general bg */
  white: '#FFFFFF',
  /** Secondary background (input fields, cards) */
  backgroundLight: '#F9F9F9',
  /** Primary text */
  textPrimary: '#1A1A1A',
  /** Muted / subtitle text */
  textMuted: '#757575',
  /** Placeholder text */
  textPlaceholder: '#9CA3AF',
  /** Input border default */
  inputBorder: '#E5E7EB',
  /** Google button border */
  googleBorder: '#D0D0D0',
  /** Error red */
  error: '#EF4444',
  /** Divider grey */
  divider: '#E5E7EB',
  /** Green link tint (lighter variant for focus states) */
  greenLight: '#F0FDF4',
  /** Google blue for the G icon */
  googleBlue: '#4285F4',
} as const;

export const FONTS = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
} as const;

export const SIZES = {
  /** Standard input field height */
  inputHeight: 52,
  /** Primary button height (pill) */
  buttonHeight: 56,
  /** Input border radius */
  inputRadius: 12,
  /** Pill button border radius */
  buttonRadius: 25,
  /** Standard horizontal padding */
  paddingH: 16,
  /** Section horizontal padding */
  sectionPaddingH: 24,
} as const;
