import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  BRAND_FACADE_URL,
  BRAND_LOGO_URL,
  buildPublicOnlyWebsiteUrl,
  DEFAULT_CATEGORIES,
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_OFFERS,
  DEFAULT_SALON_SETTINGS,
  DEFAULT_SERVICES,
  isLegacyHeroUrl,
  isLegacyLogoUrl,
  isPrivateDevOrLocalUrl,
  resolveHeroBackgroundUrl,
  resolveLogoUrl,
  slugifyId,
} from './defaults';
import {
  isLegacyAiImageUrl,
  LEGACY_SEED_CATEGORY_IDS,
  LEGACY_SEED_SERVICE_IDS,
} from './menuCatalog';
import { auth, db, handleFirestoreError, OperationType, storage } from './firebase';
import {
  BLUEPRINT_LIMITS,
  type ActivityLogEntry,
  type AdminUserRecord,
  type MediaAsset,
  type SalonCategory,
  type SalonOffer,
  type SalonService,
  type SalonSettings,
} from '../types/salon';

const COLLECTIONS = {
  categories: 'categories',
  services: 'services',
  offers: 'offers',
  settings: 'salonSettings',
  logs: 'activityLogs',
  media: 'mediaAssets',
  admins: 'admins',
} as const;

export interface AdminWorkspaceCallbacks {
  onCategories: (items: SalonCategory[]) => void;
  onServices: (items: SalonService[]) => void;
  onOffers: (items: SalonOffer[]) => void;
  onSettings: (settings: SalonSettings) => void;
  onLogs: (items: ActivityLogEntry[]) => void;
  onMedia: (items: MediaAsset[]) => void;
  onAdmins: (items: AdminUserRecord[]) => void;
  onError?: (err: unknown) => void;
}

export function subscribeAdminWorkspace(callbacks: AdminWorkspaceCallbacks): () => void {
  const unsubscribers: (() => void)[] = [];

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.categories), orderBy('sortOrder', 'asc')),
      (snap) => {
        callbacks.onCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalonCategory, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.services), orderBy('sortOrder', 'asc')),
      (snap) => {
        callbacks.onServices(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalonService, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, COLLECTIONS.offers),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalonOffer, 'id'>) }));
        callbacks.onOffers(list);
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      doc(db, COLLECTIONS.settings, 'main'),
      (snap) => {
        if (snap.exists()) {
          callbacks.onSettings({
            ...DEFAULT_SALON_SETTINGS,
            ...(snap.data() as Partial<SalonSettings>),
          });
        } else {
          callbacks.onSettings(DEFAULT_SALON_SETTINGS);
        }
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.logs), orderBy('createdAt', 'desc'), limit(200)),
      (snap) => {
        callbacks.onLogs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityLogEntry, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, COLLECTIONS.media),
      (snap) => {
        callbacks.onMedia(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MediaAsset, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      collection(db, COLLECTIONS.admins),
      (snap) => {
        callbacks.onAdmins(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUserRecord, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

export interface PublicCatalogCallbacks {
  onCategories: (items: SalonCategory[]) => void;
  onServices: (items: SalonService[]) => void;
  onOffers: (items: SalonOffer[]) => void;
  onSettings: (settings: SalonSettings) => void;
  onError?: (err: unknown) => void;
}

export function subscribePublicCatalog(callbacks: PublicCatalogCallbacks): () => void {
  const unsubscribers: (() => void)[] = [];

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.categories), where('isActive', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<SalonCategory, 'id'>) }))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        callbacks.onCategories(list);
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.services), where('isActive', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<SalonService, 'id'>) }))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        callbacks.onServices(list);
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, COLLECTIONS.offers), where('isActive', '==', true)),
      (snap) => {
        callbacks.onOffers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalonOffer, 'id'>) }))
        );
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      doc(db, COLLECTIONS.settings, 'main'),
      (snap) => {
        if (snap.exists()) {
          callbacks.onSettings({
            ...DEFAULT_SALON_SETTINGS,
            ...(snap.data() as Partial<SalonSettings>),
          });
        } else {
          callbacks.onSettings(DEFAULT_SALON_SETTINGS);
        }
      },
      (err) => {
        callbacks.onError?.(err);
      }
    )
  );

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

export async function logAdminActivity(
  action: string,
  entityType: string,
  details: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const path = COLLECTIONS.logs;
  try {
    await addDoc(collection(db, path), {
      action: action.slice(0, 120),
      entityType: entityType.slice(0, 60),
      details: details.slice(0, 500),
      adminUid: user.uid,
      adminEmail: user.email || '',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveCategory(
  id: string,
  data: Omit<SalonCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = slugifyId(id);
  const path = `${COLLECTIONS.categories}/${docId}`;
  try {
    await setDoc(
      doc(db, COLLECTIONS.categories, docId),
      {
        name: data.name.trim().slice(0, BLUEPRINT_LIMITS.CATEGORY_NAME_MAX),
        slug: slugifyId(data.slug || data.name),
        description: (data.description || '').trim().slice(0, BLUEPRINT_LIMITS.CATEGORY_DESC_MAX),
        imageUrl: (data.imageUrl || '').trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        isActive: Boolean(data.isActive),
        sortOrder: Math.max(0, Math.min(BLUEPRINT_LIMITS.SORT_ORDER_MAX, Number(data.sortOrder) || 0)),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await logAdminActivity('Saved category', 'category', `Category "${data.name}" saved.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCategory(id: string, name: string): Promise<void> {
  const path = `${COLLECTIONS.categories}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.categories, id));
    await logAdminActivity('Deleted category', 'category', `Deleted category "${name}".`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveService(
  id: string | null,
  data: Omit<SalonService, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id ? slugifyId(id) : `${slugifyId(data.name)}-${Date.now().toString(36)}`;
  const path = `${COLLECTIONS.services}/${docId}`;
  const safePrice = Math.max(0, Math.min(BLUEPRINT_LIMITS.PRICE_MAX, Number(data.price) || 0));
  const safeOffer =
    data.offerPrice !== null &&
    data.offerPrice !== undefined &&
    Number(data.offerPrice) >= 0 &&
    Number(data.offerPrice) < safePrice
      ? Number(data.offerPrice)
      : null;

  try {
    await setDoc(
      doc(db, COLLECTIONS.services, docId),
      {
        name: data.name.trim().slice(0, BLUEPRINT_LIMITS.SERVICE_NAME_MAX),
        categoryId: data.categoryId,
        price: safePrice,
        offerPrice: safeOffer,
        duration: (data.duration || '').trim().slice(0, 60),
        description: (data.description || '').trim().slice(0, BLUEPRINT_LIMITS.SERVICE_DESC_MAX),
        imageUrl: (data.imageUrl || '').trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        isActive: Boolean(data.isActive),
        isFeatured: Boolean(data.isFeatured),
        sortOrder: Math.max(0, Math.min(BLUEPRINT_LIMITS.SORT_ORDER_MAX, Number(data.sortOrder) || 0)),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await logAdminActivity(
      id ? 'Updated service' : 'Created service',
      'service',
      `Service "${data.name}" saved at ₹${safePrice}.`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function toggleServiceStatus(service: SalonService): Promise<void> {
  const path = `${COLLECTIONS.services}/${service.id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.services, service.id), {
      isActive: !service.isActive,
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity(
      !service.isActive ? 'Activated service' : 'Paused service',
      'service',
      `${service.name} is now ${!service.isActive ? 'active' : 'hidden'}.`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteService(id: string, name: string): Promise<void> {
  const path = `${COLLECTIONS.services}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.services, id));
    await logAdminActivity('Deleted service', 'service', `Deleted service "${name}".`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function batchUpdatePrices(
  updates: {
    id: string;
    name: string;
    oldPrice: number;
    newPrice: number;
    newOfferPrice: number | null;
  }[]
): Promise<void> {
  if (updates.length === 0) return;
  const path = COLLECTIONS.services;
  try {
    const batch = writeBatch(db);
    for (const item of updates) {
      const safePrice = Math.max(0, Math.min(BLUEPRINT_LIMITS.PRICE_MAX, item.newPrice));
      const safeOffer =
        item.newOfferPrice !== null && item.newOfferPrice >= 0 && item.newOfferPrice < safePrice
          ? item.newOfferPrice
          : null;
      batch.update(doc(db, COLLECTIONS.services, item.id), {
        price: safePrice,
        offerPrice: safeOffer,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    await logAdminActivity(
      'Updated prices',
      'price',
      updates
        .slice(0, 6)
        .map((u) => `${u.name}: ₹${u.oldPrice} → ₹${u.newPrice}`)
        .join(' | ') + (updates.length > 6 ? ` (+${updates.length - 6} more)` : '')
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveOffer(
  id: string | null,
  data: Omit<SalonOffer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const docId = id ? slugifyId(id) : `${slugifyId(data.title)}-${Date.now().toString(36)}`;
  const path = `${COLLECTIONS.offers}/${docId}`;
  try {
    await setDoc(
      doc(db, COLLECTIONS.offers, docId),
      {
        title: data.title.trim().slice(0, BLUEPRINT_LIMITS.OFFER_TITLE_MAX),
        description: (data.description || '').trim().slice(0, BLUEPRINT_LIMITS.OFFER_DESC_MAX),
        discountPercent: Math.max(0, Math.min(100, Number(data.discountPercent) || 0)),
        startDate: data.startDate,
        endDate: data.endDate,
        bannerUrl: (data.bannerUrl || '').trim().slice(0, BLUEPRINT_LIMITS.URL_MAX),
        applicableCategory: data.applicableCategory || 'all',
        isActive: Boolean(data.isActive),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await logAdminActivity(
      id ? 'Updated offer' : 'Created offer',
      'offer',
      `Offer "${data.title}" (${data.discountPercent}% off) saved.`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function toggleOfferStatus(offer: SalonOffer): Promise<void> {
  const path = `${COLLECTIONS.offers}/${offer.id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.offers, offer.id), {
      isActive: !offer.isActive,
      updatedAt: serverTimestamp(),
    });
    await logAdminActivity(
      !offer.isActive ? 'Activated offer' : 'Paused offer',
      'offer',
      `Offer "${offer.title}" is now ${!offer.isActive ? 'active' : 'paused'}.`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteOffer(id: string, title: string): Promise<void> {
  const path = `${COLLECTIONS.offers}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.offers, id));
    await logAdminActivity('Deleted offer', 'offer', `Deleted offer "${title}".`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveSalonSettings(settings: SalonSettings): Promise<void> {
  const path = `${COLLECTIONS.settings}/main`;
  try {
    await setDoc(
      doc(db, COLLECTIONS.settings, 'main'),
      {
        salonName: settings.salonName.trim(),
        tagline: settings.tagline.trim(),
        phone: settings.phone.trim(),
        secondaryPhone: settings.secondaryPhone.trim(),
        whatsapp: settings.whatsapp.trim(),
        openingHours: settings.openingHours.trim(),
        address: settings.address.trim(),
        ratingSummary: settings.ratingSummary.trim(),
        reviewPlatformsNote: settings.reviewPlatformsNote.trim(),
        appointmentPolicy: settings.appointmentPolicy.trim(),
        paymentMethods: settings.paymentMethods.trim(),
        accessibilityNote: settings.accessibilityNote.trim(),
        mapsUrl: settings.mapsUrl.trim(),
        publicCustomerUrl: settings.publicCustomerUrl.trim(),
        instagramUrl: settings.instagramUrl.trim(),
        facebookUrl: settings.facebookUrl.trim(),
        logoUrl: settings.logoUrl.trim(),
        heroBackgroundUrl: settings.heroBackgroundUrl.trim(),
        aboutText: settings.aboutText.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await logAdminActivity('Updated settings', 'settings', 'Updated salon website settings.');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveMediaAsset(
  title: string,
  url: string,
  folder: MediaAsset['folder']
): Promise<MediaAsset> {
  const docId = `${slugifyId(title)}-${Date.now().toString(36)}`;
  const path = `${COLLECTIONS.media}/${docId}`;
  const cleanTitle = title.trim().slice(0, BLUEPRINT_LIMITS.MEDIA_TITLE_MAX) || 'Salon Image';
  const cleanUrl = url.trim().slice(0, BLUEPRINT_LIMITS.URL_MAX);
  try {
    await setDoc(doc(db, COLLECTIONS.media, docId), {
      title: cleanTitle,
      url: cleanUrl,
      folder,
      createdAt: serverTimestamp(),
    });
    await logAdminActivity('Added media asset', 'media', `Saved "${cleanTitle}" (${folder}).`);
    return { id: docId, title: cleanTitle, url: cleanUrl, folder };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function uploadMediaFile(
  file: File,
  title: string,
  folder: MediaAsset['folder']
): Promise<MediaAsset> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `salon/${folder}/${safeName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return saveMediaAsset(title, url, folder);
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  const path = `${COLLECTIONS.media}/${asset.id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.media, asset.id));
    await logAdminActivity('Deleted media asset', 'media', `Removed "${asset.title}".`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveAdminUser(
  uid: string,
  data: Omit<AdminUserRecord, 'id' | 'uid' | 'createdAt'>
): Promise<void> {
  const cleanUid = uid.trim();
  const path = `${COLLECTIONS.admins}/${cleanUid}`;
  try {
    await setDoc(
      doc(db, COLLECTIONS.admins, cleanUid),
      {
        uid: cleanUid,
        email: data.email.trim(),
        displayName: data.displayName.trim(),
        role: data.role,
        isActive: Boolean(data.isActive),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    await logAdminActivity('Added admin user', 'admin', `Granted admin role to ${data.email}.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAdminUser(uid: string, email: string): Promise<void> {
  const path = `${COLLECTIONS.admins}/${uid}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.admins, uid));
    await logAdminActivity('Removed admin user', 'admin', `Revoked admin access for ${email}.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function seedInitialSalonData(): Promise<void> {
  type BatchOp = (b: ReturnType<typeof writeBatch>) => void;
  const ops: BatchOp[] = [];

  // Clean up old 6-category / 13-service sample IDs so only the official Women & Men rate card appears
  for (const legacyCatId of LEGACY_SEED_CATEGORY_IDS) {
    ops.push((b) => b.delete(doc(db, COLLECTIONS.categories, legacyCatId)));
  }
  for (const legacySvcId of LEGACY_SEED_SERVICE_IDS) {
    ops.push((b) => b.delete(doc(db, COLLECTIONS.services, legacySvcId)));
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const { id, ...fields } = cat;
    ops.push((b) =>
      b.set(
        doc(db, COLLECTIONS.categories, id),
        {
          name: fields.name.slice(0, BLUEPRINT_LIMITS.CATEGORY_NAME_MAX),
          slug: fields.slug.slice(0, BLUEPRINT_LIMITS.CATEGORY_NAME_MAX),
          description: fields.description.slice(0, BLUEPRINT_LIMITS.CATEGORY_DESC_MAX),
          imageUrl: fields.imageUrl.slice(0, BLUEPRINT_LIMITS.URL_MAX),
          isActive: Boolean(fields.isActive),
          sortOrder: fields.sortOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }

  for (const svc of DEFAULT_SERVICES) {
    const { id, ...fields } = svc;
    ops.push((b) =>
      b.set(
        doc(db, COLLECTIONS.services, id),
        {
          name: fields.name.slice(0, BLUEPRINT_LIMITS.SERVICE_NAME_MAX),
          categoryId: fields.categoryId,
          price: fields.price,
          offerPrice: fields.offerPrice,
          duration: fields.duration.slice(0, 60),
          description: fields.description.slice(0, BLUEPRINT_LIMITS.SERVICE_DESC_MAX),
          imageUrl: fields.imageUrl.slice(0, BLUEPRINT_LIMITS.URL_MAX),
          isActive: Boolean(fields.isActive),
          isFeatured: Boolean(fields.isFeatured),
          sortOrder: fields.sortOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }

  for (const offer of DEFAULT_OFFERS) {
    const { id, ...fields } = offer;
    ops.push((b) =>
      b.set(
        doc(db, COLLECTIONS.offers, id),
        {
          title: fields.title.slice(0, BLUEPRINT_LIMITS.OFFER_TITLE_MAX),
          description: fields.description.slice(0, BLUEPRINT_LIMITS.OFFER_DESC_MAX),
          discountPercent: fields.discountPercent,
          startDate: fields.startDate,
          endDate: fields.endDate,
          bannerUrl: fields.bannerUrl.slice(0, BLUEPRINT_LIMITS.URL_MAX),
          applicableCategory: fields.applicableCategory,
          isActive: Boolean(fields.isActive),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }

  for (const media of DEFAULT_MEDIA_ASSETS) {
    const { id, ...fields } = media;
    ops.push((b) =>
      b.set(
        doc(db, COLLECTIONS.media, id),
        {
          title: fields.title.slice(0, BLUEPRINT_LIMITS.MEDIA_TITLE_MAX),
          url: fields.url.slice(0, BLUEPRINT_LIMITS.URL_MAX),
          folder: fields.folder,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  }

  ops.push((b) =>
    b.set(
      doc(db, COLLECTIONS.settings, 'main'),
      {
        salonName: DEFAULT_SALON_SETTINGS.salonName,
        tagline: DEFAULT_SALON_SETTINGS.tagline,
        phone: DEFAULT_SALON_SETTINGS.phone,
        secondaryPhone: DEFAULT_SALON_SETTINGS.secondaryPhone,
        whatsapp: DEFAULT_SALON_SETTINGS.whatsapp,
        openingHours: DEFAULT_SALON_SETTINGS.openingHours,
        address: DEFAULT_SALON_SETTINGS.address,
        ratingSummary: DEFAULT_SALON_SETTINGS.ratingSummary,
        reviewPlatformsNote: DEFAULT_SALON_SETTINGS.reviewPlatformsNote,
        appointmentPolicy: DEFAULT_SALON_SETTINGS.appointmentPolicy,
        paymentMethods: DEFAULT_SALON_SETTINGS.paymentMethods,
        accessibilityNote: DEFAULT_SALON_SETTINGS.accessibilityNote,
        mapsUrl: DEFAULT_SALON_SETTINGS.mapsUrl,
        publicCustomerUrl: buildPublicOnlyWebsiteUrl(DEFAULT_SALON_SETTINGS.publicCustomerUrl),
        instagramUrl: DEFAULT_SALON_SETTINGS.instagramUrl,
        facebookUrl: DEFAULT_SALON_SETTINGS.facebookUrl,
        logoUrl: DEFAULT_SALON_SETTINGS.logoUrl,
        heroBackgroundUrl: DEFAULT_SALON_SETTINGS.heroBackgroundUrl,
        aboutText: DEFAULT_SALON_SETTINGS.aboutText,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  );

  try {
    const CHUNK_SIZE = 380;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const op of ops.slice(i, i + CHUNK_SIZE)) {
        op(batch);
      }
      await batch.commit();
    }
    await logAdminActivity(
      'Synced official Women & Men menu',
      'system',
      `Loaded all ${DEFAULT_CATEGORIES.length} categories and ${DEFAULT_SERVICES.length} official Women & Men rate card services.`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
  }
}

export async function syncOfficialRateCardIfLegacy(): Promise<boolean> {
  try {
    const existingSnap = await getDocs(collection(db, COLLECTIONS.services));
    const existingIds = existingSnap.docs.map((d) => d.id);
    const legacySet = new Set<string>(LEGACY_SEED_SERVICE_IDS);
    const isEmptyOrStrictlyLegacy =
      existingIds.length === 0 ||
      (existingIds.length <= legacySet.size && existingIds.every((id) => legacySet.has(id)));

    if (!isEmptyOrStrictlyLegacy) {
      return false;
    }

    await seedInitialSalonData();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'rate-card-sync');
  }
}

export async function syncBrandAssetsIfLegacy(): Promise<boolean> {
  const settingsRef = doc(db, COLLECTIONS.settings, 'main');
  try {
    const snap = await getDoc(settingsRef);
    const existing = snap.exists() ? (snap.data() as Partial<SalonSettings>) : null;
    const needsSettingsSync =
      !existing ||
      isLegacyLogoUrl(existing.logoUrl) ||
      isLegacyHeroUrl(existing.heroBackgroundUrl) ||
      !(existing.publicCustomerUrl || '').includes('public=1') ||
      isPrivateDevOrLocalUrl(existing.publicCustomerUrl);

    if (!needsSettingsSync) {
      return false;
    }

    const merged: SalonSettings = {
      ...DEFAULT_SALON_SETTINGS,
      ...(existing || {}),
      logoUrl: resolveLogoUrl(existing?.logoUrl),
      heroBackgroundUrl: resolveHeroBackgroundUrl(existing?.heroBackgroundUrl),
      publicCustomerUrl: buildPublicOnlyWebsiteUrl(existing?.publicCustomerUrl),
    };

    await saveSalonSettings(merged);

    const batch = writeBatch(db);
    batch.set(
      doc(db, COLLECTIONS.media, 'media-salon-interior'),
      {
        title: 'White Town Storefront Facade',
        url: BRAND_FACADE_URL,
        folder: 'salon',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      doc(db, COLLECTIONS.media, 'media-brand-logo'),
      {
        title: 'INSCAPE Official Gold Wordmark',
        url: BRAND_LOGO_URL,
        folder: 'logo',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.settings}/main`);
  }
}

/**
 * Removes all AI-generated image URLs (/src/assets/images/*) stored in Firestore
 * categories, services, offers, and mediaAssets so the menu displays clean
 * service names and prices without AI photography.
 */
export async function syncNaturalServicePhotosIfLegacy(): Promise<boolean> {
  try {
    const [catSnap, svcSnap, offerSnap, mediaSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.categories)),
      getDocs(collection(db, COLLECTIONS.services)),
      getDocs(collection(db, COLLECTIONS.offers)),
      getDocs(collection(db, COLLECTIONS.media)),
    ]);

    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];

    for (const d of catSnap.docs) {
      const data = d.data() as Partial<SalonCategory>;
      if (isLegacyAiImageUrl(data.imageUrl)) {
        ops.push((b) =>
          b.update(doc(db, COLLECTIONS.categories, d.id), {
            imageUrl: '',
            updatedAt: serverTimestamp(),
          })
        );
      }
    }

    for (const d of svcSnap.docs) {
      const data = d.data() as Partial<SalonService>;
      if (isLegacyAiImageUrl(data.imageUrl)) {
        ops.push((b) =>
          b.update(doc(db, COLLECTIONS.services, d.id), {
            imageUrl: '',
            updatedAt: serverTimestamp(),
          })
        );
      }
    }

    for (const d of offerSnap.docs) {
      const data = d.data() as Partial<SalonOffer>;
      if (isLegacyAiImageUrl(data.bannerUrl)) {
        ops.push((b) =>
          b.update(doc(db, COLLECTIONS.offers, d.id), {
            bannerUrl: '',
            updatedAt: serverTimestamp(),
          })
        );
      }
    }

    for (const d of mediaSnap.docs) {
      const data = d.data() as Partial<MediaAsset>;
      if (isLegacyAiImageUrl(data.url)) {
        ops.push((b) => b.delete(doc(db, COLLECTIONS.media, d.id)));
      }
    }

    if (ops.length === 0) {
      return false;
    }

    const CHUNK_SIZE = 380;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const batch = writeBatch(db);
      for (const op of ops.slice(i, i + CHUNK_SIZE)) {
        op(batch);
      }
      await batch.commit();
    }

    await logAdminActivity(
      'Removed AI photos from catalog',
      'media',
      `Cleared AI photo references from ${ops.length} catalog & media records.`
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'ai-photo-cleanup');
  }
}




