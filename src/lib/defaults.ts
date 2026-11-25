import type { Timestamp } from 'firebase/firestore';
import type {
  MediaAsset,
  SalonCategory,
  SalonOffer,
  SalonService,
  SalonSettings,
} from '../types/salon';
import {
  MENU_IMAGES,
  OFFICIAL_MENU_CATEGORIES,
  OFFICIAL_MENU_SERVICES,
} from './menuCatalog';

export const BRAND_LOGO_URL = '/assets/aistudio/Untitled_Design_89bb9499.png';
export const BRAND_FACADE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-17_at_11.04.35_PM_45b77185.jpeg';
export const PUBLIC_SHARED_APP_ORIGIN =
  'https://ais-pre-lq5wdliqnofkddsfzbtual-67710318039.asia-east1.run.app';

const LEGACY_LOGO_URLS = new Set(['', '/inscape-logo.svg']);
const LEGACY_HERO_URLS = new Set(['', '/assets/aistudio/download_bad2d585.jpg']);

export const GENERATED_SALON_IMAGES = MENU_IMAGES;

export function isLegacyLogoUrl(url?: string | null): boolean {
  return LEGACY_LOGO_URLS.has((url || '').trim());
}

export function isLegacyHeroUrl(url?: string | null): boolean {
  return LEGACY_HERO_URLS.has((url || '').trim());
}

export function isPrivateDevOrLocalUrl(url?: string | null): boolean {
  const trimmed = (url || '').trim().toLowerCase();
  if (!trimmed) return true;
  return (
    trimmed.includes('ais-dev-') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1') ||
    trimmed.includes('0.0.0.0') ||
    trimmed.includes('inscapesalon.in')
  );
}

export function resolveLogoUrl(url?: string | null): string {
  const trimmed = (url || '').trim();
  if (isLegacyLogoUrl(trimmed)) {
    return BRAND_LOGO_URL;
  }
  return trimmed;
}

export function resolveHeroBackgroundUrl(url?: string | null): string {
  const trimmed = (url || '').trim();
  if (isLegacyHeroUrl(trimmed)) {
    return BRAND_FACADE_URL;
  }
  return trimmed;
}

/**
 * Converts a website base URL into a guaranteed, phone-scannable Public-Only Full Website URL.
 * - Automatically converts private developer preview URLs (ais-dev-*) to the public Shared App URL (ais-pre-*)
 *   so any customer scanning the QR code on their phone opens the live website without login barriers.
 * - Replaces localhost/loopback/placeholder hosts with the public Shared App URL.
 * - Strips any /admin path segments or admin query parameters and enforces ?public=1
 *   so scanning the QR code opens ONLY the public customer website and never the Admin Portal.
 */
export function buildPublicOnlyWebsiteUrl(rawUrl?: string | null): string {
  const runtimeOrigin =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  const candidate = (rawUrl || '').trim() || runtimeOrigin || PUBLIC_SHARED_APP_ORIGIN;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
    );

    const hostLower = parsed.hostname.toLowerCase();
    if (hostLower.startsWith('ais-dev-')) {
      parsed.hostname = parsed.hostname.replace(/^ais-dev-/i, 'ais-pre-');
      parsed.protocol = 'https:';
      parsed.port = '';
    } else if (
      hostLower === 'localhost' ||
      hostLower === '127.0.0.1' ||
      hostLower === '0.0.0.0' ||
      hostLower === 'inscapesalon.in' ||
      hostLower === 'www.inscapesalon.in'
    ) {
      const shared = new URL(PUBLIC_SHARED_APP_ORIGIN);
      parsed.protocol = shared.protocol;
      parsed.hostname = shared.hostname;
      parsed.port = shared.port;
    }

    // Strip any /admin path segment so the QR code can never route to an admin path
    const cleanPath = parsed.pathname.replace(/\/admin(\/.*)?$/i, '') || '/';
    parsed.pathname = cleanPath;
    parsed.searchParams.delete('admin');
    parsed.searchParams.delete('site');
    parsed.searchParams.delete('view');
    parsed.searchParams.delete('mode');
    parsed.searchParams.set('public', '1');
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return `${PUBLIC_SHARED_APP_ORIGIN}/?public=1`;
  }
}

/**
 * Builds the direct URL for Website 2 (Admin Management Portal),
 * interconnected in real time with Website 1 via Firestore.
 */
export function buildAdminWebsiteUrl(rawUrl?: string | null): string {
  const fallbackOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : PUBLIC_SHARED_APP_ORIGIN;

  const candidate = (rawUrl || '').trim() || fallbackOrigin;

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
    );
    const cleanPath = parsed.pathname.replace(/\/admin(\/.*)?$/i, '') || '/';
    parsed.pathname = cleanPath;
    parsed.searchParams.delete('public');
    parsed.searchParams.delete('view');
    parsed.searchParams.delete('mode');
    parsed.searchParams.set('site', 'admin');
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return `${fallbackOrigin.replace(/\/+$/, '')}/?site=admin`;
  }
}

export const DEFAULT_SALON_SETTINGS: SalonSettings = {
  salonName: 'INSCAPE your dream salon',
  tagline: 'Women & Men Hair, Colour, Spa, Beauty, Nails & Make-Up — White Town, Puducherry',
  phone: '+91 88830 35558',
  secondaryPhone: '0413 233 5558',
  whatsapp: '918883035558',
  openingHours: 'Open daily · 10:00 AM – 9:00 PM',
  address:
    '36, Rue, R. Manakkula Vinayagar St, White Town, Puducherry, 605001 (near Sri Aurobindo Ashram and Manakula Vinayagar Temple)',
  ratingSummary: 'Praised for hygiene, friendly staff & skilled face-framing stylists',
  reviewPlatformsNote:
    'All prices incl. of GST · ** Starting Price (varies by hair length & consultation)',
  appointmentPolicy:
    'Appointments recommended & required for specific treatments (occasional wait times may occur)',
  paymentMethods: 'Credit cards, debit cards & NFC mobile payments accepted',
  accessibilityNote:
    'Restroom available · No wheelchair-accessible entrance or dedicated parking lot',
  mapsUrl: 'https://maps.google.com/?q=INSCAPE+your+dream+salon+White+Town+Puducherry',
  publicCustomerUrl: buildPublicOnlyWebsiteUrl(PUBLIC_SHARED_APP_ORIGIN),
  instagramUrl: 'https://instagram.com/inscapesalon',
  facebookUrl: 'https://facebook.com/inscapesalon',
  logoUrl: BRAND_LOGO_URL,
  heroBackgroundUrl: BRAND_FACADE_URL,
  aboutText:
    'Located at 36, Rue, R. Manakkula Vinayagar St near Sri Aurobindo Ashram and Manakula Vinayagar Temple in White Town, Puducherry, INSCAPE your dream salon is consistently praised by clients for salon hygiene, friendly staff, face-framing haircuts, and creative styling. All menu prices are inclusive of GST; treatments marked ** are starting prices.',
};

export const DEFAULT_CATEGORIES: Omit<SalonCategory, 'createdAt' | 'updatedAt'>[] =
  OFFICIAL_MENU_CATEGORIES;

export const DEFAULT_SERVICES: Omit<SalonService, 'createdAt' | 'updatedAt'>[] =
  OFFICIAL_MENU_SERVICES;

export const DEFAULT_OFFERS: Omit<SalonOffer, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'white-town-midweek-ritual',
    title: 'White Town Midweek Facial & Hair Spa',
    description:
      'Enjoy 15% savings on Premium & Luxury Facials and Hair Spa rituals Tuesdays through Thursdays.',
    discountPercent: 15,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    bannerUrl: '',
    applicableCategory: 'women-facials-peel-off',
    isActive: true,
  },
  {
    id: 'bridal-trial-privilege',
    title: 'Bridal & Groom Make-Up Artistry Suite',
    description:
      'Complimentary pre-event manicure & relaxing head massage with HD or Air Brush Make-Up bookings.',
    discountPercent: 10,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    bannerUrl: '',
    applicableCategory: 'women-makeup-mehandi',
    isActive: true,
  },
];

export const DEFAULT_MEDIA_ASSETS: Omit<MediaAsset, 'createdAt'>[] = [
  {
    id: 'media-salon-interior',
    title: 'White Town Storefront Facade',
    url: BRAND_FACADE_URL,
    folder: 'salon',
  },
  {
    id: 'media-salon-inside-real',
    title: 'INSCAPE White Town Salon Interior',
    url: GENERATED_SALON_IMAGES.salonInsideReal,
    folder: 'salon',
  },
  {
    id: 'media-brand-logo',
    title: 'INSCAPE Official Gold Wordmark',
    url: BRAND_LOGO_URL,
    folder: 'logo',
  },
];

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
}

export function formatTimestamp(ts?: Timestamp | Date | null): string {
  if (!ts) return 'Just now';
  try {
    const date = ts instanceof Date ? ts : typeof ts.toDate === 'function' ? ts.toDate() : null;
    if (!date) return 'Just now';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
}

export function slugifyId(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `item-${Date.now()}`;
}

export function getOfferStatusLabel(offer: SalonOffer): 'Active' | 'Scheduled' | 'Expired' | 'Paused' {
  if (!offer.isActive) return 'Paused';
  const today = new Date().toISOString().slice(0, 10);
  if (offer.endDate && offer.endDate < today) return 'Expired';
  if (offer.startDate && offer.startDate > today) return 'Scheduled';
  return 'Active';
}

export function isOfferCurrentlyValid(offer: SalonOffer): boolean {
  return getOfferStatusLabel(offer) === 'Active';
}
