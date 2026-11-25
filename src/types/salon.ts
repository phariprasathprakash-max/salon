import type { Timestamp } from 'firebase/firestore';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'phariprasath132007@gmail.com';
export const ADMIN_LOGIN_USERNAME = 'INSCAPESALON';

export const BLUEPRINT_LIMITS = {
  CATEGORY_NAME_MAX: 80,
  CATEGORY_DESC_MAX: 240,
  SERVICE_NAME_MAX: 100,
  SERVICE_DESC_MAX: 360,
  OFFER_TITLE_MAX: 100,
  OFFER_DESC_MAX: 360,
  URL_MAX: 500,
  PRICE_MAX: 1000000,
  SORT_ORDER_MAX: 1000,
  MEDIA_TITLE_MAX: 100,
} as const;

export interface SalonCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SalonService {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  offerPrice: number | null;
  duration: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SalonOffer {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  bannerUrl: string;
  applicableCategory: string;
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SalonSettings {
  salonName: string;
  tagline: string;
  phone: string;
  secondaryPhone: string;
  whatsapp: string;
  openingHours: string;
  address: string;
  ratingSummary: string;
  reviewPlatformsNote: string;
  appointmentPolicy: string;
  paymentMethods: string;
  accessibilityNote: string;
  mapsUrl: string;
  publicCustomerUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  logoUrl: string;
  heroBackgroundUrl: string;
  aboutText: string;
  updatedAt?: Timestamp | null;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  entityType: string;
  details: string;
  adminUid: string;
  adminEmail: string;
  createdAt?: Timestamp | null;
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  folder: 'salon' | 'service' | 'banner' | 'logo';
  createdAt?: Timestamp | null;
}

export interface AdminUserRecord {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin';
  isActive: boolean;
  createdAt?: Timestamp | null;
}
