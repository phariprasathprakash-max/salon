import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemeRadius = 'architectural' | 'sharp' | 'refined' | 'soft';
export type ThemeTypography = 'editorial' | 'classic' | 'boutique' | 'atelier' | 'modern';
export type ThemeDensity = 'compact' | 'balanced' | 'airy';
export type ThemeSurfaceStyle = 'hairline' | 'elevated' | 'frosted';
export type ThemeBackdropVeil = 'sheer' | 'balanced' | 'solid';
export type ThemeMotion = 'smooth' | 'reduced';
export type ThemeFontScale = 'compact' | 'standard' | 'large';

export interface ThemeTokens {
  canvas: string;
  sidebar: string;
  surface: string;
  elevated: string;
  border: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  dirtyRow: string;
  successText: string;
  successBg: string;
  warnText: string;
  warnBg: string;
  dangerText: string;
  dangerBg: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  subtitle: string;
  mode: ThemeMode;
  isCustom?: boolean;
  tokens: ThemeTokens;
}

export interface CustomThemePreset extends ThemePreset {
  isCustom: true;
  createdAt: string;
  radius: ThemeRadius;
  typography: ThemeTypography;
  density: ThemeDensity;
  surfaceStyle: ThemeSurfaceStyle;
  backdropVeil: ThemeBackdropVeil;
  motion: ThemeMotion;
  fontScale: ThemeFontScale;
}

export interface ThemeTokenOverrides {
  canvas: string | null;
  surface: string | null;
  border: string | null;
  text: string | null;
}

export interface ThemeConfig {
  presetId: string;
  accentOverride: string | null;
  tokenOverrides: ThemeTokenOverrides;
  radius: ThemeRadius;
  typography: ThemeTypography;
  density: ThemeDensity;
  surfaceStyle: ThemeSurfaceStyle;
  backdropVeil: ThemeBackdropVeil;
  motion: ThemeMotion;
  fontScale: ThemeFontScale;
}

export interface AtelierStyleLook {
  id: string;
  name: string;
  tagline: string;
  presetId: string;
  typography: ThemeTypography;
  surfaceStyle: ThemeSurfaceStyle;
  radius: ThemeRadius;
  backdropVeil: ThemeBackdropVeil;
}

export const ATELIER_STYLE_LOOKS: AtelierStyleLook[] = [
  {
    id: 'parisian-night',
    name: 'Parisian Night',
    tagline: 'Obsidian 24K · Frosted Glass · Editorial Serif',
    presetId: 'obsidian-24k',
    typography: 'editorial',
    surfaceStyle: 'frosted',
    radius: 'refined',
    backdropVeil: 'balanced',
  },
  {
    id: 'vogue-monochrome',
    name: 'Vogue Editorial',
    tagline: 'Gallery White · Sharp Square · Bodoni Couture',
    presetId: 'editorial-monochrome',
    typography: 'atelier',
    surfaceStyle: 'hairline',
    radius: 'architectural',
    backdropVeil: 'solid',
  },
  {
    id: 'bridal-couture',
    name: 'Bridal Couture',
    tagline: 'Rose Quartz Daylight · Soft Corners · Classic Serif',
    presetId: 'rose-quartz',
    typography: 'classic',
    surfaceStyle: 'elevated',
    radius: 'soft',
    backdropVeil: 'balanced',
  },
  {
    id: 'botanical-spa',
    name: 'Botanical Courtyard',
    tagline: 'Deep Emerald · Frosted Veil · Soft Fraunces',
    presetId: 'emerald-atelier',
    typography: 'boutique',
    surfaceStyle: 'frosted',
    radius: 'soft',
    backdropVeil: 'sheer',
  },
];

export const TYPOGRAPHY_PAIRINGS: {
  id: ThemeTypography;
  label: string;
  displayName: string;
  bodyName: string;
  display: string;
  body: string;
  note: string;
}[] = [
  {
    id: 'editorial',
    label: 'Editorial',
    displayName: 'Cormorant Garamond',
    bodyName: 'Plus Jakarta Sans',
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    note: 'High-fashion serif & crisp sans',
  },
  {
    id: 'classic',
    label: 'Classic',
    displayName: 'Playfair Display',
    bodyName: 'Plus Jakarta Sans',
    display: '"Playfair Display", Georgia, serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    note: 'Heritage French Quarter serif',
  },
  {
    id: 'boutique',
    label: 'Boutique',
    displayName: 'Fraunces',
    bodyName: 'DM Sans',
    display: '"Fraunces", Georgia, serif',
    body: '"DM Sans", system-ui, sans-serif',
    note: 'Sculptural soft-serif & clean DM',
  },
  {
    id: 'atelier',
    label: 'Atelier',
    displayName: 'Bodoni Moda',
    bodyName: 'Manrope',
    display: '"Bodoni Moda", Georgia, serif',
    body: '"Manrope", system-ui, sans-serif',
    note: 'Couture runway contrast serif',
  },
  {
    id: 'modern',
    label: 'Modern',
    displayName: 'Outfit',
    bodyName: 'Plus Jakarta Sans',
    display: '"Outfit", system-ui, sans-serif',
    body: '"Plus Jakarta Sans", system-ui, sans-serif',
    note: 'Architectural geometric grotesque',
  },
];

export const SALON_THEME_PRESETS: ThemePreset[] = [
  // ── DARK ATELIER COLLECTION (8) ──
  {
    id: 'obsidian-24k',
    name: 'Obsidian & 24K Gold',
    subtitle: 'Signature Couture Atelier',
    mode: 'dark',
    tokens: {
      canvas: '#090807',
      sidebar: '#100E0C',
      surface: '#15120F',
      elevated: '#1E1A15',
      border: '#322A21',
      accent: '#E5BE5C',
      accentHover: '#F2D17C',
      accentContrast: '#090807',
      text: '#FBF8F3',
      textSecondary: '#DCD4C8',
      textMuted: '#B6ACA0',
      textSubtle: '#897F74',
      dirtyRow: '#251E15',
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#261414',
    },
  },
  {
    id: 'espresso-gold',
    name: 'Espresso Heritage',
    subtitle: 'White Town Roasted Gold',
    mode: 'dark',
    tokens: {
      canvas: '#120C09',
      sidebar: '#160F0B',
      surface: '#1B130F',
      elevated: '#241913',
      border: '#382921',
      accent: '#D4AF37',
      accentHover: '#E6C65B',
      accentContrast: '#120C09',
      text: '#FAF7F2',
      textSecondary: '#D6CEC7',
      textMuted: '#B8AEA6',
      textSubtle: '#8E8279',
      dirtyRow: '#2A1E15',
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#261414',
    },
  },
  {
    id: 'royal-velvet-plum',
    name: 'Royal Velvet Plum',
    subtitle: 'Aubergine & Rose Champagne',
    mode: 'dark',
    tokens: {
      canvas: '#110A14',
      sidebar: '#170E1B',
      surface: '#1E1324',
      elevated: '#291B31',
      border: '#3E2B49',
      accent: '#E9B4C2',
      accentHover: '#F4CBD6',
      accentContrast: '#160A12',
      text: '#FCF8FA',
      textSecondary: '#E1D2DC',
      textMuted: '#BFA9B8',
      textSubtle: '#917B8B',
      dirtyRow: '#2D1C2B',
      successText: '#4ADE80',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#FB7185',
      dangerBg: '#2C141A',
    },
  },
  {
    id: 'burgundy-noir',
    name: 'Burgundy Noir',
    subtitle: 'Velvet Merlot & Rose Gold',
    mode: 'dark',
    tokens: {
      canvas: '#15090D',
      sidebar: '#1B0C11',
      surface: '#231017',
      elevated: '#2F161F',
      border: '#492532',
      accent: '#E5A99C',
      accentHover: '#F1C1B6',
      accentContrast: '#18090C',
      text: '#FDF7F7',
      textSecondary: '#E4D0D2',
      textMuted: '#C2A5A8',
      textSubtle: '#96777B',
      dirtyRow: '#31171E',
      successText: '#4ADE80',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#FB7185',
      dangerBg: '#301218',
    },
  },
  {
    id: 'emerald-atelier',
    name: 'Emerald Botanical',
    subtitle: 'Courtyard Forest & Brass',
    mode: 'dark',
    tokens: {
      canvas: '#081310',
      sidebar: '#0C1915',
      surface: '#11211C',
      elevated: '#182D27',
      border: '#26423A',
      accent: '#D6B472',
      accentHover: '#E7CA90',
      accentContrast: '#081310',
      text: '#F4F8F6',
      textSecondary: '#CFE0DA',
      textMuted: '#A1B9B1',
      textSubtle: '#769188',
      dirtyRow: '#1C2C24',
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#2B1517',
    },
  },
  {
    id: 'royal-sapphire',
    name: 'Midnight Sapphire',
    subtitle: 'Parisian Navy & Burnished Gold',
    mode: 'dark',
    tokens: {
      canvas: '#090F1D',
      sidebar: '#0E1526',
      surface: '#131D32',
      elevated: '#1B2844',
      border: '#2B3D60',
      accent: '#E4BE70',
      accentHover: '#F2D28E',
      accentContrast: '#090F1D',
      text: '#F5F7FC',
      textSecondary: '#CFD7E8',
      textMuted: '#9EACCA',
      textSubtle: '#7282A4',
      dirtyRow: '#222A3D',
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#29151C',
    },
  },
  {
    id: 'graphite-platinum',
    name: 'Graphite & Platinum',
    subtitle: 'Minimalist Monochrome Studio',
    mode: 'dark',
    tokens: {
      canvas: '#0D0E11',
      sidebar: '#121318',
      surface: '#17191F',
      elevated: '#20232B',
      border: '#313540',
      accent: '#D8DEE9',
      accentHover: '#ECEFF4',
      accentContrast: '#0D0E11',
      text: '#F7F8FA',
      textSecondary: '#D2D6DF',
      textMuted: '#A2A8B6',
      textSubtle: '#787E8D',
      dirtyRow: '#23262F',
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#2A1517',
    },
  },
  {
    id: 'whitetown-amber',
    name: 'White Town Amber',
    subtitle: 'Warm Timber & Mirror Glow',
    mode: 'dark',
    tokens: {
      canvas: '#150E09',
      sidebar: '#1B120B',
      surface: '#22170F',
      elevated: '#2D1E13',
      border: '#46301E',
      accent: '#EBB04A',
      accentHover: '#F6C66C',
      accentContrast: '#150E09',
      text: '#FCF6EC',
      textSecondary: '#DFCFC0',
      textMuted: '#C2AC97',
      textSubtle: '#99826C',
      dirtyRow: '#312113',
      successText: '#4ADE80',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#FB7185',
      dangerBg: '#2E1412',
    },
  },

  // ── DAYLIGHT ATELIER COLLECTION (6) ──
  {
    id: 'whitetown-ivory',
    name: 'Alabaster & Gold',
    subtitle: 'Sunlit French Quarter Daylight',
    mode: 'light',
    tokens: {
      canvas: '#FBF9F5',
      sidebar: '#F3EEE4',
      surface: '#FFFFFF',
      elevated: '#F6F1E8',
      border: '#E3D9C8',
      accent: '#9A6F18',
      accentHover: '#7D5910',
      accentContrast: '#FFFFFF',
      text: '#1C1611',
      textSecondary: '#44382E',
      textMuted: '#68594C',
      textSubtle: '#857769',
      dirtyRow: '#FDF5E6',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz Salon',
    subtitle: 'Blush Porcelain & Rosewood',
    mode: 'light',
    tokens: {
      canvas: '#FCF7F8',
      sidebar: '#F6ECEF',
      surface: '#FFFFFF',
      elevated: '#F9F0F2',
      border: '#E8D5DB',
      accent: '#9E3E58',
      accentHover: '#822F46',
      accentContrast: '#FFFFFF',
      text: '#221519',
      textSecondary: '#4E373E',
      textMuted: '#725760',
      textSubtle: '#91747E',
      dirtyRow: '#FDF0F4',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
  {
    id: 'editorial-monochrome',
    name: 'Editorial Monochrome',
    subtitle: 'Gallery White & Runway Ink',
    mode: 'light',
    tokens: {
      canvas: '#FAFAFA',
      sidebar: '#F2F2F2',
      surface: '#FFFFFF',
      elevated: '#F5F5F5',
      border: '#DEDEDE',
      accent: '#141414',
      accentHover: '#303030',
      accentContrast: '#FFFFFF',
      text: '#111111',
      textSecondary: '#3A3A3A',
      textMuted: '#616161',
      textSubtle: '#828282',
      dirtyRow: '#F0F0F0',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
  {
    id: 'coastal-limestone',
    name: 'Pondy Botanical Sage',
    subtitle: 'Mineral Limestone & Deep Jade',
    mode: 'light',
    tokens: {
      canvas: '#F3F7F5',
      sidebar: '#E9F0ED',
      surface: '#FFFFFF',
      elevated: '#EDF4F1',
      border: '#D0DFD8',
      accent: '#166050',
      accentHover: '#0F4A3D',
      accentContrast: '#FFFFFF',
      text: '#13201C',
      textSecondary: '#334741',
      textMuted: '#536A63',
      textSubtle: '#728A82',
      dirtyRow: '#EAF5F1',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
  {
    id: 'terracotta-heritage',
    name: 'French Quarter Linen',
    subtitle: 'Puducherry Courtyard & Clay',
    mode: 'light',
    tokens: {
      canvas: '#FAF5EE',
      sidebar: '#F2E9DD',
      surface: '#FFFFFF',
      elevated: '#F6EDE3',
      border: '#E3D2BF',
      accent: '#A34828',
      accentHover: '#86381D',
      accentContrast: '#FFFFFF',
      text: '#231612',
      textSecondary: '#4D362D',
      textMuted: '#70554A',
      textSubtle: '#8E7166',
      dirtyRow: '#FDF1EB',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
  {
    id: 'pearl-plum',
    name: 'Porcelain & Plum',
    subtitle: 'Cool Pearl Beauty House',
    mode: 'light',
    tokens: {
      canvas: '#F8F6FA',
      sidebar: '#F0ECF5',
      surface: '#FFFFFF',
      elevated: '#F3EFF8',
      border: '#DFD8E8',
      accent: '#6C346A',
      accentHover: '#552654',
      accentContrast: '#FFFFFF',
      text: '#1B1622',
      textSecondary: '#42394E',
      textMuted: '#655A73',
      textSubtle: '#837892',
      dirtyRow: '#F6EFF8',
      successText: '#047857',
      successBg: '#ECFDF5',
      warnText: '#B45309',
      warnBg: '#FFFBEB',
      dangerText: '#B91C1C',
      dangerBg: '#FEF2F2',
    },
  },
];

export const CURATED_ACCENTS = [
  { label: '24K Gold', hex: '#E5BE5C' },
  { label: 'Antique Gold', hex: '#D4AF37' },
  { label: 'Rose Champagne', hex: '#E9B4C2' },
  { label: 'Rosewood', hex: '#9E3E58' },
  { label: 'Terracotta Clay', hex: '#A34828' },
  { label: 'Royal Plum', hex: '#6C346A' },
  { label: 'Deep Jade', hex: '#166050' },
  { label: 'Platinum Silver', hex: '#D8DEE9' },
  { label: 'Runway Ink', hex: '#141414' },
  { label: 'Burnished Bronze', hex: '#9A6F18' },
] as const;

const STORAGE_KEY = 'inscape_admin_theme_v3';
const CUSTOM_PRESETS_KEY = 'inscape_custom_themes_v1';

const EMPTY_TOKEN_OVERRIDES: ThemeTokenOverrides = {
  canvas: null,
  surface: null,
  border: null,
  text: null,
};

const DEFAULT_CONFIG: ThemeConfig = {
  presetId: 'obsidian-24k',
  accentOverride: null,
  tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
  radius: 'refined',
  typography: 'editorial',
  density: 'balanced',
  surfaceStyle: 'frosted',
  backdropVeil: 'balanced',
  motion: 'smooth',
  fontScale: 'standard',
};

export function normalizeHex(hex: string): string | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex) || '#090807';
  return {
    r: parseInt(norm.slice(1, 3), 16),
    g: parseInt(norm.slice(3, 5), 16),
    b: parseInt(norm.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`.toUpperCase();
}

function mixHex(hexA: string, hexB: string, weightB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weightB));
  return rgbToHex(
    a.r * (1 - w) + b.r * w,
    a.g * (1 - w) + b.g * w,
    a.b * (1 - w) + b.b * w
  );
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = getRelativeLuminance(hexA);
  const l2 = getRelativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getWcagGrade(ratio: number): 'AAA' | 'AA' | 'Large' | 'Low' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'Large';
  return 'Low';
}

function computeContrastColor(hex: string): string {
  const ratioOnDark = getContrastRatio(hex, '#090807');
  const ratioOnLight = getContrastRatio(hex, '#FFFFFF');
  return ratioOnDark >= ratioOnLight ? '#090807' : '#FFFFFF';
}

function adjustHexBrightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + factor, g + factor, b + factor);
}

function ensureHeroAccent(accentHex: string, canvasHex: string, mode: ThemeMode): string {
  const candidate = normalizeHex(accentHex) || (mode === 'dark' ? '#E5BE5C' : '#9A6F18');
  return ensureReadableColor(candidate, canvasHex, 4.5, mode === 'dark');
}

export function ensureReadableColor(
  fgHex: string,
  bgHex: string,
  minRatio: number,
  preferLighten: boolean
): string {
  let current = normalizeHex(fgHex) || (preferLighten ? '#FBF8F3' : '#1C1611');
  if (getContrastRatio(current, bgHex) >= minRatio) return current;
  const target = preferLighten ? '#FBF8F3' : '#141110';
  for (let i = 0; i < 16; i++) {
    current = mixHex(current, target, 0.15);
    if (getContrastRatio(current, bgHex) >= minRatio) return current;
  }
  return target;
}

export function harmonizePaletteFromSeeds(
  canvasHex: string,
  accentHex: string,
  mode: ThemeMode
): ThemeTokens {
  const canvas = normalizeHex(canvasHex) || (mode === 'dark' ? '#090807' : '#FBF9F5');
  const rawAccent = normalizeHex(accentHex) || (mode === 'dark' ? '#E5BE5C' : '#9A6F18');

  if (mode === 'dark') {
    const sidebar = mixHex(canvas, '#FFFFFF', 0.028);
    const surface = mixHex(canvas, '#FFFFFF', 0.058);
    const elevated = mixHex(canvas, '#FFFFFF', 0.098);
    const border = mixHex(canvas, '#FFFFFF', 0.175);
    const text = '#FBF8F3';
    const textSecondary = mixHex(text, canvas, 0.18);
    const textMuted = mixHex(text, canvas, 0.34);
    const textSubtle = mixHex(text, canvas, 0.5);
    const accent = ensureReadableColor(rawAccent, surface, 3.8, true);
    const accentHover = adjustHexBrightness(accent, 18);
    const accentContrast = computeContrastColor(accent);
    const dirtyRow = mixHex(surface, accent, 0.14);

    return {
      canvas,
      sidebar,
      surface,
      elevated,
      border,
      accent,
      accentHover,
      accentContrast,
      text,
      textSecondary,
      textMuted,
      textSubtle,
      dirtyRow,
      successText: '#34D399',
      successBg: '#064E3B',
      warnText: '#FBBF24',
      warnBg: '#78350F',
      dangerText: '#F87171',
      dangerBg: '#261414',
    };
  }

  const sidebar = mixHex(canvas, '#000000', 0.042);
  const surface = '#FFFFFF';
  const elevated = mixHex(canvas, '#000000', 0.032);
  const border = mixHex(canvas, '#000000', 0.12);
  const text = '#1A1614';
  const textSecondary = mixHex(text, canvas, 0.22);
  const textMuted = mixHex(text, canvas, 0.42);
  const textSubtle = mixHex(text, canvas, 0.56);
  const accent = ensureReadableColor(rawAccent, surface, 4.0, false);
  const accentHover = adjustHexBrightness(accent, -18);
  const accentContrast = computeContrastColor(accent);
  const dirtyRow = mixHex(surface, accent, 0.1);

  return {
    canvas,
    sidebar,
    surface,
    elevated,
    border,
    accent,
    accentHover,
    accentContrast,
    text,
    textSecondary,
    textMuted,
    textSubtle,
    dirtyRow,
    successText: '#047857',
    successBg: '#ECFDF5',
    warnText: '#B45309',
    warnBg: '#FFFBEB',
    dangerText: '#B91C1C',
    dangerBg: '#FEF2F2',
  };
}

export function resolveEffectiveTokens(preset: ThemePreset, config: ThemeConfig): ThemeTokens {
  const base = preset.tokens;
  const overrides = config.tokenOverrides;
  const isDark = preset.mode === 'dark';

  const canvas = overrides.canvas || base.canvas;
  const surface =
    overrides.surface ||
    (overrides.canvas
      ? mixHex(canvas, isDark ? '#FFFFFF' : '#000000', isDark ? 0.055 : -0.02)
      : base.surface);
  const sidebar = overrides.canvas
    ? mixHex(canvas, isDark ? '#FFFFFF' : '#000000', isDark ? 0.025 : 0.04)
    : base.sidebar;
  const elevated =
    overrides.surface || overrides.canvas
      ? mixHex(surface, isDark ? '#FFFFFF' : '#000000', isDark ? 0.045 : 0.03)
      : base.elevated;
  const border =
    overrides.border ||
    (overrides.canvas
      ? mixHex(canvas, isDark ? '#FFFFFF' : '#000000', isDark ? 0.16 : 0.12)
      : base.border);

  const text = overrides.text || base.text;
  const textSecondary = overrides.text ? mixHex(text, canvas, 0.2) : base.textSecondary;
  const textMuted = overrides.text ? mixHex(text, canvas, 0.38) : base.textMuted;
  const textSubtle = overrides.text ? mixHex(text, canvas, 0.52) : base.textSubtle;

  const accent = config.accentOverride || base.accent;
  const accentHover = config.accentOverride
    ? adjustHexBrightness(config.accentOverride, isDark ? 16 : -16)
    : base.accentHover;
  const accentContrast = config.accentOverride
    ? computeContrastColor(config.accentOverride)
    : base.accentContrast;

  return {
    ...base,
    canvas,
    sidebar,
    surface,
    elevated,
    border,
    accent,
    accentHover,
    accentContrast,
    text,
    textSecondary,
    textMuted,
    textSubtle,
    dirtyRow:
      config.accentOverride || overrides.surface ? mixHex(surface, accent, 0.12) : base.dirtyRow,
  };
}

function applyThemeToDocument(preset: ThemePreset, config: ThemeConfig, tokens: ThemeTokens) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--t-canvas', tokens.canvas);
  root.style.setProperty('--t-sidebar', tokens.sidebar);
  root.style.setProperty('--t-surface', tokens.surface);
  root.style.setProperty('--t-elevated', tokens.elevated);
  root.style.setProperty('--t-border', tokens.border);
  root.style.setProperty('--t-accent', tokens.accent);
  root.style.setProperty('--t-accent-hover', tokens.accentHover);
  root.style.setProperty('--t-accent-contrast', tokens.accentContrast);
  root.style.setProperty(
    '--t-hero-accent',
    ensureHeroAccent(tokens.accent, tokens.canvas, preset.mode)
  );
  root.style.setProperty('--t-text', tokens.text);
  root.style.setProperty('--t-text-secondary', tokens.textSecondary);
  root.style.setProperty('--t-text-muted', tokens.textMuted);
  root.style.setProperty('--t-text-subtle', tokens.textSubtle);
  root.style.setProperty('--t-dirty-row', tokens.dirtyRow);
  root.style.setProperty('--t-success-text', tokens.successText);
  root.style.setProperty('--t-success-bg', tokens.successBg);
  root.style.setProperty('--t-warn-text', tokens.warnText);
  root.style.setProperty('--t-warn-bg', tokens.warnBg);
  root.style.setProperty('--t-danger-text', tokens.dangerText);
  root.style.setProperty('--t-danger-bg', tokens.dangerBg);

  const veilMap: Record<
    ThemeBackdropVeil,
    { canvas: string; sidebar: string; heroStart: string; heroMid: string; heroEnd: string }
  > = {
    sheer: {
      canvas: '74%',
      sidebar: '80%',
      heroStart: '88%',
      heroMid: '62%',
      heroEnd: '14%',
    },
    balanced: {
      canvas: '86%',
      sidebar: '90%',
      heroStart: '94%',
      heroMid: '76%',
      heroEnd: '28%',
    },
    solid: {
      canvas: '98%',
      sidebar: '99%',
      heroStart: '98%',
      heroMid: '90%',
      heroEnd: '52%',
    },
  };
  const veil = veilMap[config.backdropVeil] || veilMap.balanced;
  root.style.setProperty('--t-veil-alpha', veil.canvas);
  root.style.setProperty('--t-sidebar-veil-alpha', veil.sidebar);
  root.style.setProperty('--t-hero-scrim-start', veil.heroStart);
  root.style.setProperty('--t-hero-scrim-mid', veil.heroMid);
  root.style.setProperty('--t-hero-scrim-end', veil.heroEnd);

  const shadowValue =
    config.surfaceStyle === 'elevated'
      ? preset.mode === 'dark'
        ? '0 14px 34px -12px rgba(0, 0, 0, 0.76)'
        : '0 12px 28px -10px rgba(31, 24, 19, 0.14)'
      : config.surfaceStyle === 'frosted'
        ? preset.mode === 'dark'
          ? '0 10px 28px -12px rgba(0, 0, 0, 0.58)'
          : '0 8px 24px -10px rgba(31, 24, 19, 0.09)'
        : 'none';
  root.style.setProperty('--t-card-shadow', shadowValue);
  root.style.setProperty(
    '--t-card-backdrop',
    config.surfaceStyle === 'frosted' ? 'blur(12px)' : 'none'
  );

  const radiusMap: Record<ThemeRadius, { theme: string; control: string }> = {
    architectural: { theme: '0px', control: '0px' },
    sharp: { theme: '0.25rem', control: '0.25rem' },
    refined: { theme: '0.75rem', control: '0.5rem' },
    soft: { theme: '1.125rem', control: '0.75rem' },
  };
  root.style.setProperty('--t-radius-theme', radiusMap[config.radius].theme);
  root.style.setProperty('--t-radius-control', radiusMap[config.radius].control);

  const fontPair =
    TYPOGRAPHY_PAIRINGS.find((p) => p.id === config.typography) || TYPOGRAPHY_PAIRINGS[0];
  root.style.setProperty('--t-font-display', fontPair.display);
  root.style.setProperty('--t-font-body', fontPair.body);

  const scaleMap: Record<ThemeFontScale, string> = {
    compact: '15px',
    standard: '16px',
    large: '17px',
  };
  root.style.fontSize = scaleMap[config.fontScale];

  root.style.colorScheme = preset.mode;
  root.classList.toggle('dark', preset.mode === 'dark');
  root.classList.toggle('theme-reduced-motion', config.motion === 'reduced');
}

interface ThemeContextValue {
  config: ThemeConfig;
  activePreset: ThemePreset;
  effectiveTokens: ThemeTokens;
  presets: ThemePreset[];
  customPresets: CustomThemePreset[];
  setPreset: (presetId: string) => void;
  applyAtelierLook: (look: AtelierStyleLook) => void;
  setAccentOverride: (hex: string | null) => void;
  setTokenOverride: (key: keyof ThemeTokenOverrides, hex: string | null) => void;
  applyHarmonizedSeeds: (canvasHex: string, accentHex: string, mode: ThemeMode) => void;
  autoFixContrast: () => void;
  setRadius: (radius: ThemeRadius) => void;
  setTypography: (typography: ThemeTypography) => void;
  setDensity: (density: ThemeDensity) => void;
  setSurfaceStyle: (surfaceStyle: ThemeSurfaceStyle) => void;
  setBackdropVeil: (veil: ThemeBackdropVeil) => void;
  setMotion: (motion: ThemeMotion) => void;
  setFontScale: (fontScale: ThemeFontScale) => void;
  saveCustomPreset: (name: string, subtitle?: string) => CustomThemePreset;
  deleteCustomPreset: (id: string) => void;
  exportThemeJson: () => string;
  importThemeJson: (rawJson: string) => { ok: true } | { ok: false; error: string };
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadCustomPresets(): CustomThemePreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomThemePreset =>
        Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && item.tokens)
    );
  } catch {
    return [];
  }
}

function loadInitialConfig(customPresets: CustomThemePreset[]): ThemeConfig {
  const allIds = new Set([
    ...SALON_THEME_PRESETS.map((p) => p.id),
    ...customPresets.map((p) => p.id),
  ]);

  let urlThemePreset: string | null = null;
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('theme');
    if (param && allIds.has(param)) {
      urlThemePreset = param;
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return urlThemePreset ? { ...DEFAULT_CONFIG, presetId: urlThemePreset } : DEFAULT_CONFIG;
    }
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
    const overrides = parsed.tokenOverrides;
    const safeOverride = (v: unknown) => (typeof v === 'string' ? normalizeHex(v) : null);

    return {
      presetId:
        urlThemePreset ||
        (parsed.presetId && allIds.has(parsed.presetId)
          ? parsed.presetId
          : DEFAULT_CONFIG.presetId),
      accentOverride:
        typeof parsed.accentOverride === 'string' ? normalizeHex(parsed.accentOverride) : null,
      tokenOverrides: {
        canvas: safeOverride(overrides?.canvas),
        surface: safeOverride(overrides?.surface),
        border: safeOverride(overrides?.border),
        text: safeOverride(overrides?.text),
      },
      radius:
        parsed.radius === 'architectural' ||
        parsed.radius === 'sharp' ||
        parsed.radius === 'refined' ||
        parsed.radius === 'soft'
          ? parsed.radius
          : DEFAULT_CONFIG.radius,
      typography: TYPOGRAPHY_PAIRINGS.some((p) => p.id === parsed.typography)
        ? (parsed.typography as ThemeTypography)
        : DEFAULT_CONFIG.typography,
      density:
        parsed.density === 'compact' ||
        parsed.density === 'balanced' ||
        parsed.density === 'airy'
          ? parsed.density
          : DEFAULT_CONFIG.density,
      surfaceStyle:
        parsed.surfaceStyle === 'hairline' ||
        parsed.surfaceStyle === 'elevated' ||
        parsed.surfaceStyle === 'frosted'
          ? parsed.surfaceStyle
          : DEFAULT_CONFIG.surfaceStyle,
      backdropVeil:
        parsed.backdropVeil === 'sheer' ||
        parsed.backdropVeil === 'balanced' ||
        parsed.backdropVeil === 'solid'
          ? parsed.backdropVeil
          : DEFAULT_CONFIG.backdropVeil,
      motion: parsed.motion === 'reduced' ? 'reduced' : 'smooth',
      fontScale:
        parsed.fontScale === 'compact' ||
        parsed.fontScale === 'standard' ||
        parsed.fontScale === 'large'
          ? parsed.fontScale
          : 'standard',
    };
  } catch {
    return urlThemePreset ? { ...DEFAULT_CONFIG, presetId: urlThemePreset } : DEFAULT_CONFIG;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [customPresets, setCustomPresets] = useState<CustomThemePreset[]>(loadCustomPresets);
  const [config, setConfig] = useState<ThemeConfig>(() => loadInitialConfig(loadCustomPresets()));

  const allPresets = useMemo(
    () => [...SALON_THEME_PRESETS, ...customPresets],
    [customPresets]
  );

  const activePreset = useMemo(
    () => allPresets.find((p) => p.id === config.presetId) || SALON_THEME_PRESETS[0],
    [allPresets, config.presetId]
  );

  const effectiveTokens = useMemo(
    () => resolveEffectiveTokens(activePreset, config),
    [activePreset, config]
  );

  useEffect(() => {
    applyThemeToDocument(activePreset, config, effectiveTokens);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage quota failures
    }
  }, [activePreset, config, effectiveTokens]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(customPresets));
    } catch {
      // ignore storage quota failures
    }
  }, [customPresets]);

  const setPreset = useCallback(
    (presetId: string) => {
      const target = allPresets.find((p) => p.id === presetId);
      setConfig((prev) => {
        if (target && 'isCustom' in target && target.isCustom) {
          const custom = target as CustomThemePreset;
          return {
            presetId,
            accentOverride: null,
            tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
            radius: custom.radius,
            typography: custom.typography,
            density: custom.density,
            surfaceStyle: custom.surfaceStyle,
            backdropVeil: custom.backdropVeil || 'balanced',
            motion: custom.motion,
            fontScale: custom.fontScale,
          };
        }
        return {
          ...prev,
          presetId,
          accentOverride: null,
          tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
        };
      });
    },
    [allPresets]
  );

  const applyAtelierLook = useCallback((look: AtelierStyleLook) => {
    setConfig((prev) => ({
      ...prev,
      presetId: look.presetId,
      accentOverride: null,
      tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
      typography: look.typography,
      surfaceStyle: look.surfaceStyle,
      radius: look.radius,
      backdropVeil: look.backdropVeil,
    }));
  }, []);

  const setAccentOverride = useCallback((accentOverride: string | null) => {
    setConfig((prev) => ({
      ...prev,
      accentOverride: accentOverride ? normalizeHex(accentOverride) : null,
    }));
  }, []);

  const setTokenOverride = useCallback(
    (key: keyof ThemeTokenOverrides, hex: string | null) => {
      const clean = hex ? normalizeHex(hex) : null;
      setConfig((prev) => ({
        ...prev,
        tokenOverrides: {
          ...prev.tokenOverrides,
          [key]: clean,
        },
      }));
    },
    []
  );

  const applyHarmonizedSeeds = useCallback(
    (canvasHex: string, accentHex: string, mode: ThemeMode) => {
      const tokens = harmonizePaletteFromSeeds(canvasHex, accentHex, mode);
      const matchingModePreset =
        SALON_THEME_PRESETS.find((p) => p.mode === mode) || SALON_THEME_PRESETS[0];
      setConfig((prev) => ({
        ...prev,
        presetId: matchingModePreset.id,
        accentOverride: tokens.accent,
        tokenOverrides: {
          canvas: tokens.canvas,
          surface: tokens.surface,
          border: tokens.border,
          text: tokens.text,
        },
      }));
    },
    []
  );

  const autoFixContrast = useCallback(() => {
    const isDark = activePreset.mode === 'dark';
    const fixedText = ensureReadableColor(
      effectiveTokens.text,
      effectiveTokens.canvas,
      7.0,
      isDark
    );
    const fixedAccent = ensureReadableColor(
      effectiveTokens.accent,
      effectiveTokens.surface,
      4.5,
      isDark
    );
    setConfig((prev) => ({
      ...prev,
      accentOverride: fixedAccent,
      tokenOverrides: {
        ...prev.tokenOverrides,
        text: fixedText,
      },
    }));
  }, [activePreset.mode, effectiveTokens]);

  const setRadius = useCallback((radius: ThemeRadius) => {
    setConfig((prev) => ({ ...prev, radius }));
  }, []);

  const setTypography = useCallback((typography: ThemeTypography) => {
    setConfig((prev) => ({ ...prev, typography }));
  }, []);

  const setDensity = useCallback((density: ThemeDensity) => {
    setConfig((prev) => ({ ...prev, density }));
  }, []);

  const setSurfaceStyle = useCallback((surfaceStyle: ThemeSurfaceStyle) => {
    setConfig((prev) => ({ ...prev, surfaceStyle }));
  }, []);

  const setBackdropVeil = useCallback((backdropVeil: ThemeBackdropVeil) => {
    setConfig((prev) => ({ ...prev, backdropVeil }));
  }, []);

  const setMotion = useCallback((motion: ThemeMotion) => {
    setConfig((prev) => ({ ...prev, motion }));
  }, []);

  const setFontScale = useCallback((fontScale: ThemeFontScale) => {
    setConfig((prev) => ({ ...prev, fontScale }));
  }, []);

  const saveCustomPreset = useCallback(
    (name: string, subtitle?: string): CustomThemePreset => {
      const cleanName = name.trim().slice(0, 48) || 'Custom Studio Theme';
      const cleanSubtitle =
        subtitle?.trim().slice(0, 64) ||
        `${activePreset.mode === 'dark' ? 'Dark' : 'Light'} Custom Palette`;
      const id = `custom-${cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;

      const created: CustomThemePreset = {
        id,
        name: cleanName,
        subtitle: cleanSubtitle,
        mode: activePreset.mode,
        isCustom: true,
        createdAt: new Date().toISOString(),
        tokens: { ...effectiveTokens },
        radius: config.radius,
        typography: config.typography,
        density: config.density,
        surfaceStyle: config.surfaceStyle,
        backdropVeil: config.backdropVeil,
        motion: config.motion,
        fontScale: config.fontScale,
      };

      setCustomPresets((prev) => [created, ...prev]);
      setConfig((prev) => ({
        ...prev,
        presetId: created.id,
        accentOverride: null,
        tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
      }));
      return created;
    },
    [activePreset.mode, config, effectiveTokens]
  );

  const deleteCustomPreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    setConfig((prev) =>
      prev.presetId === id
        ? {
            ...prev,
            presetId: DEFAULT_CONFIG.presetId,
            accentOverride: null,
            tokenOverrides: { ...EMPTY_TOKEN_OVERRIDES },
          }
        : prev
    );
  }, []);

  const exportThemeJson = useCallback(() => {
    const payload = {
      schema: 'inscape-theme-v3',
      name: activePreset.name,
      mode: activePreset.mode,
      config,
      tokens: effectiveTokens,
    };
    return JSON.stringify(payload, null, 2);
  }, [activePreset.mode, activePreset.name, config, effectiveTokens]);

  const importThemeJson = useCallback(
    (rawJson: string): { ok: true } | { ok: false; error: string } => {
      try {
        const parsed = JSON.parse(rawJson) as {
          schema?: string;
          name?: string;
          mode?: ThemeMode;
          config?: Partial<ThemeConfig>;
          tokens?: Partial<ThemeTokens>;
        };
        if (!parsed || typeof parsed !== 'object') {
          return { ok: false, error: 'Invalid JSON object.' };
        }
        const incomingCfg = parsed.config;
        const incomingTokens = parsed.tokens;
        const mode: ThemeMode = parsed.mode === 'light' ? 'light' : 'dark';
        const basePreset =
          SALON_THEME_PRESETS.find((p) => p.id === incomingCfg?.presetId) ||
          SALON_THEME_PRESETS.find((p) => p.mode === mode) ||
          SALON_THEME_PRESETS[0];

        const nextRadius: ThemeRadius =
          incomingCfg?.radius === 'architectural' ||
          incomingCfg?.radius === 'sharp' ||
          incomingCfg?.radius === 'refined' ||
          incomingCfg?.radius === 'soft'
            ? incomingCfg.radius
            : config.radius;

        const nextTypo: ThemeTypography = TYPOGRAPHY_PAIRINGS.some(
          (p) => p.id === incomingCfg?.typography
        )
          ? (incomingCfg!.typography as ThemeTypography)
          : config.typography;

        const nextDensity: ThemeDensity =
          incomingCfg?.density === 'compact' ||
          incomingCfg?.density === 'balanced' ||
          incomingCfg?.density === 'airy'
            ? incomingCfg.density
            : config.density;

        const nextSurface: ThemeSurfaceStyle =
          incomingCfg?.surfaceStyle === 'hairline' ||
          incomingCfg?.surfaceStyle === 'elevated' ||
          incomingCfg?.surfaceStyle === 'frosted'
            ? incomingCfg.surfaceStyle
            : config.surfaceStyle;

        const nextVeil: ThemeBackdropVeil =
          incomingCfg?.backdropVeil === 'sheer' ||
          incomingCfg?.backdropVeil === 'balanced' ||
          incomingCfg?.backdropVeil === 'solid'
            ? incomingCfg.backdropVeil
            : config.backdropVeil;

        const nextMotion: ThemeMotion =
          incomingCfg?.motion === 'reduced' ? 'reduced' : 'smooth';

        const nextScale: ThemeFontScale =
          incomingCfg?.fontScale === 'compact' ||
          incomingCfg?.fontScale === 'standard' ||
          incomingCfg?.fontScale === 'large'
            ? incomingCfg.fontScale
            : config.fontScale;

        setConfig({
          presetId: basePreset.id,
          accentOverride:
            normalizeHex(incomingCfg?.accentOverride || incomingTokens?.accent || '') || null,
          tokenOverrides: {
            canvas:
              normalizeHex(incomingCfg?.tokenOverrides?.canvas || incomingTokens?.canvas || '') ||
              null,
            surface:
              normalizeHex(incomingCfg?.tokenOverrides?.surface || incomingTokens?.surface || '') ||
              null,
            border:
              normalizeHex(incomingCfg?.tokenOverrides?.border || incomingTokens?.border || '') ||
              null,
            text:
              normalizeHex(incomingCfg?.tokenOverrides?.text || incomingTokens?.text || '') || null,
          },
          radius: nextRadius,
          typography: nextTypo,
          density: nextDensity,
          surfaceStyle: nextSurface,
          backdropVeil: nextVeil,
          motion: nextMotion,
          fontScale: nextScale,
        });
        return { ok: true };
      } catch {
        return { ok: false, error: 'Could not parse JSON. Check formatting and try again.' };
      }
    },
    [
      config.backdropVeil,
      config.density,
      config.fontScale,
      config.radius,
      config.surfaceStyle,
      config.typography,
    ]
  );

  const resetTheme = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      config,
      activePreset,
      effectiveTokens,
      presets: SALON_THEME_PRESETS,
      customPresets,
      setPreset,
      applyAtelierLook,
      setAccentOverride,
      setTokenOverride,
      applyHarmonizedSeeds,
      autoFixContrast,
      setRadius,
      setTypography,
      setDensity,
      setSurfaceStyle,
      setBackdropVeil,
      setMotion,
      setFontScale,
      saveCustomPreset,
      deleteCustomPreset,
      exportThemeJson,
      importThemeJson,
      resetTheme,
    }),
    [
      config,
      activePreset,
      effectiveTokens,
      customPresets,
      setPreset,
      applyAtelierLook,
      setAccentOverride,
      setTokenOverride,
      applyHarmonizedSeeds,
      autoFixContrast,
      setRadius,
      setTypography,
      setDensity,
      setSurfaceStyle,
      setBackdropVeil,
      setMotion,
      setFontScale,
      saveCustomPreset,
      deleteCustomPreset,
      exportThemeJson,
      importThemeJson,
      resetTheme,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
