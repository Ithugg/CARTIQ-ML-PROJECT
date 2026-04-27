import { Platform } from 'react-native';

// ─── CartIQ Premium Design System ───

export const Colors = {
  // Primary - Emerald green for freshness and trust
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Accent - Blue for AI/intelligence
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  // Warning - Warm amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  // Danger
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  // Purple - Premium/Pro/AI
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
  },
  // Teal - Fresh/Health
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
  },
  // Rose - Warm accents
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
  },
  // Neutrals
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Semantic tokens
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    border: '#e2e8f0',
    tint: '#16a34a',
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#16a34a',
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    border: '#334155',
    tint: '#4ade80',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#4ade80',
  },
};

// ─── Gradient Presets ───
export const Gradients = {
  // Hero/immersive gradients
  emeraldDark: ['#064e3b', '#065f46', '#047857'] as const,
  emeraldDeep: ['#022c22', '#064e3b', '#065f46'] as const,
  emeraldVibrant: ['#059669', '#10b981', '#34d399'] as const,
  emeraldSoft: ['#ecfdf5', '#d1fae5', '#a7f3d0'] as const,

  // Premium mixed gradients
  nightSky: ['#0f172a', '#1e293b', '#334155'] as const,
  premiumDark: ['#0f172a', '#0d3320', '#064e3b'] as const,
  premiumGlow: ['#064e3b', '#0d9488', '#059669'] as const,
  purpleGlow: ['#581c87', '#7e22ce', '#a855f7'] as const,

  // Card/surface gradients
  cardWarm: ['#ffffff', '#fefce8'] as const,
  cardCool: ['#ffffff', '#f0fdf4'] as const,
  cardPurple: ['#faf5ff', '#f3e8ff'] as const,

  // CTA gradients
  ctaPrimary: ['#059669', '#16a34a'] as const,
  ctaAccent: ['#2563eb', '#3b82f6'] as const,
  ctaWarm: ['#d97706', '#f59e0b'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const Typography = {
  // Display - for hero headlines
  displayXl: { fontSize: 40, fontWeight: '800' as const, lineHeight: 44, letterSpacing: -1 },
  displayLg: { fontSize: 36, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.8 },
  displayMd: { fontSize: 30, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.6 },
  // Headings
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  // Body
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  // Labels
  labelLg: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  labelMd: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelSm: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  // Utility
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  overline: { fontSize: 11, fontWeight: '700' as const, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase' as const },
};

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  }),
  xl: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 32 },
    android: { elevation: 12 },
    default: {},
  }),
  // Colored shadows for premium feel
  glow: (color: string) => Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
    android: { elevation: 6 },
    default: {},
  }),
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
});
