/**
 * Reliance Factor App Theme
 * A modern, distinctive color palette for a finance/fuel management app
 */

import { Platform } from 'react-native';

// Primary brand colors - Deep teal with coral accents
const primaryLight = '#0D9488';
const primaryDark = '#5EEAD4';
const accentColor = '#F97316';
const successColor = '#22C55E';
const warningColor = '#EAB308';
const dangerColor = '#EF4444';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    tint: primaryLight,
    primary: primaryLight,
    accent: accentColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    icon: '#64748B',
    border: '#E2E8F0',
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryLight,
    cardShadow: 'rgba(15, 23, 42, 0.08)',
    gradient: {
      start: '#0D9488',
      end: '#0891B2',
    },
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    tint: primaryDark,
    primary: primaryDark,
    accent: accentColor,
    success: successColor,
    warning: warningColor,
    danger: dangerColor,
    icon: '#94A3B8',
    border: '#334155',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryDark,
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    gradient: {
      start: '#0D9488',
      end: '#0891B2',
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
