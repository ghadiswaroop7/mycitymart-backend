/**
 * Master Design System Tokens — Bazarpeth Marketplace & Quick-Commerce
 * Visual Identity: Modern Indian Marketplace, Clean, Fast, Trustworthy, Premium
 */

export const BAZAR_COLORS = {
  // Brand Primary & Accents
  primary: '#0A7E44', // Premium Bazarpeth Green
  primaryDark: '#086335',
  primaryLight: '#E8F5EE',
  accentOrange: '#FF5200', // Zepto/Urgency Orange for Flash Deals & CTAs
  accentOrangeLight: '#FFF1EB',
  accentGold: '#F59E0B', // Ratings & Rewards Gold
  accentGoldLight: '#FEF3C7',
  
  // Surfaces & Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceHover: '#E2E8F0',
  cardBorder: '#E2E8F0',
  divider: '#EEF2F6',

  // Department Thematic Accents
  all: '#0A7E44',
  women: '#C4427A',
  men: '#1E3A5F',
  kids: '#D97706',
  beauty: '#6D28D9',
  groceries: '#15803D',
  electronics: '#0369A1',

  // Text Tokens
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#FFFFFF',
  textSuccess: '#16A34A',
  textDanger: '#DC2626',
  textWarning: '#D97706',

  // Status & Utility
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  overlay: 'rgba(15, 23, 42, 0.65)',
  shimmerBase: '#E2E8F0',
  shimmerHighlight: '#F8FAFC',
} as const;

export const BAZAR_FONTS = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
} as const;

export const BAZAR_SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  float: {
    shadowColor: '#FF5200',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const BAZAR_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
