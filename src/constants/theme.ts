export const COLORS = {
  // Brand colors
  PRIMARY: '#ea338d',
  
  // Background colors
  BACKGROUND_DARK: '#1a1a1a',
  CARD_BACKGROUND: '#2d2d2d',
  INPUT_BACKGROUND: '#363636',
  
  // Border colors
  BORDER_DEFAULT: '#404040',
  BORDER_FOCUS: '#ea338d',
  
  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#999999',
  TEXT_PLACEHOLDER: '#999999',
  
  // Status colors
  SUCCESS: '#0ACC38',
  ERROR: '#f72323',
  WARNING: '#f98c36',
  
  // Special colors
  DISABLED: '#555555',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
} as const;

export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 90,
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Component heights
export const HEIGHTS = {
  INPUT: 40,
  BUTTON: 48,
  TAB_BAR: 65,
  HEADER: 56,
  CIRCLE: 180,
} as const;
