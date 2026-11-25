import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Activity,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Palette,
  QrCode,
  Scissors,
  Settings,
  Tag,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeDrawer } from '../components/ThemeDrawer';
import { ToastContainer, type ToastItem } from '../components/Toast';
import { DEFAULT_SALON_SETTINGS, resolveLogoUrl } from '../lib/defaults';
import { auth, db, parseFirestoreErrorMessage } from '../lib/firebase';
import {
  subscribeAdminWorkspace,
  syncBrandAssetsIfLegacy,
  syncNaturalServicePhotosIfLegacy,
  syncOfficialRateCardIfLegacy,
} from '../lib/salonApi';
import { useTheme } from '../lib/themes';
import {
  type ActivityLogEntry,
  type AdminUserRecord,
  BOOTSTRAPPED_ADMIN_EMAIL,
  type MediaAsset,
  type SalonCategory,
  type SalonOffer,
  type SalonService,
  type SalonSettings,
} from '../types/salon';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminLogin } from './AdminLogin';
import { CategoryManager } from './CategoryManager';
import { MediaManager } from './MediaManager';
import { OfferManager } from './OfferManager';
import { PriceManager } from './PriceManager';
import { QrCodeManager } from './QrCodeManager';
import { ServiceManager } from './ServiceManager';
import { ActivityLogsView, SettingsManager } from './SettingsAndLogs';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'prices', label: 'Price Editor', icon: IndianRupee },
  { id: 'offers', label: 'Special Offers', icon: Tag },
  { id: 'media', label: 'Image Gallery', icon: ImageIcon },
  { id: 'qr', label: 'Public Website QR', icon: QrCode },
  { id: 'settings', label: 'Website Settings', icon: Settings },
  { id: 'logs', label: 'Activity Logs', icon: Activity },
] as const;

export function AdminApp({
  onPreviewCustomer,
  onPreviewPublicQr,
}: {
  onPreviewCustomer?: () => void;
  onPreviewPublicQr?: () => void;
}) {
  const { config, activePreset } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [categories, setCategories] = useState<SalonCategory[]>([]);
  const [services, setServices] = useState<SalonService[]>([]);
  const [offers, setOffers] = useState<SalonOffer[]>([]);
  const [settings, setSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAuthorized(false);
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const isBootstrapped =
          (nextUser.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        if (isBootstrapped) {
          setIsAuthorized(true);
        } else {
          const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid));
          setIsAuthorized(adminDoc.exists() && adminDoc.data()?.isActive !== false);
        }
      } catch (err) {
        notify('error', parseFirestoreErrorMessage(err));
        setIsAuthorized(false);
      } finally {
        setAuthChecking(false);
      }
    });

    return () => unsub();
  }, [notify]);

  const syncedBrandAssetsRef = useRef(false);

  useEffect(() => {
    if (!user || !isAuthorized) return;
    if (!syncedBrandAssetsRef.current) {
      syncedBrandAssetsRef.current = true;
      syncBrandAssetsIfLegacy()
        .then((didSync) => {
          if (didSync) {
            notify(
              'success',
              'Synced official INSCAPE branding and public-only QR link to live settings.'
            );
          }
        })
        .catch(() => {
          // non-blocking; admin can still save manually in Website Settings
        });
      syncOfficialRateCardIfLegacy()
        .then((didSyncMenu) => {
          if (didSyncMenu) {
            notify(
              'success',
              'Loaded all 17 categories and 204 Women & Men official rate card services into Firestore.'
            );
          }
          return syncNaturalServicePhotosIfLegacy();
        })
        .then((didSyncPhotos) => {
          if (didSyncPhotos) {
            notify(
              'success',
              'Removed legacy AI photos from Firestore so services display clean names and prices.'
            );
          }
        })
        .catch(() => {
          // non-blocking; admin can also trigger from Dashboard
        });
    }
    const unsub = subscribeAdminWorkspace({
      onCategories: setCategories,
      onServices: setServices,
      onOffers: setOffers,
      onSettings: setSettings,
      onLogs: setLogs,
      onMedia: setMediaAssets,
      onAdmins: setAdmins,
      onError: (err) => notify('error', parseFirestoreErrorMessage(err)),
    });
    return () => unsub();
  }, [user, isAuthorized, notify]);

  const handleSignOut = async () => {
    await signOut(auth);
    setIsAuthorized(false);
  };

  const mainPaddingClass =
    config.density === 'compact'
      ? 'p-4 lg:p-6'
      : config.density === 'airy'
        ? 'p-6 lg:p-10'
        : 'p-4 sm:p-6 lg:p-8';

  if (authChecking) {
    return (
      <div className="min-h-screen bg-t-canvas text-t-text flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-t-accent" />
        <p className="text-xs text-t-text-muted">Verifying administrator session...</p>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <>
        <AdminLogin
          unauthorizedEmail={user && !isAuthorized ? user.email || undefined : undefined}
          onOpenThemes={() => setThemeDrawerOpen(true)}
          onPreviewCustomer={onPreviewCustomer}
          onSignOut={user ? handleSignOut : undefined}
        />
        <ThemeDrawer open={themeDrawerOpen} onClose={() => setThemeDrawerOpen(false)} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const currentNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-t-canvas text-t-text flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-t-sidebar border-r border-t-border">
        <div className="px-5 py-5 border-b border-t-border flex items-center gap-3">
          <BrandLogo
            src={resolveLogoUrl(settings.logoUrl)}
            alt={settings.salonName}
            className="w-24 rounded-control border border-t-accent/40 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-t-text truncate leading-tight">
              INSCAPE
            </p>
            <p className="text-[11px] text-t-text-subtle truncate">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-control text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-t-accent text-t-accent-contrast font-semibold'
                    : 'text-t-text-secondary hover:bg-t-elevated hover:text-t-text'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-t-border space-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-t-text truncate">
              {user.displayName || 'Salon Administrator'}
            </p>
            <p className="text-[11px] text-t-text-subtle truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent/50 text-xs font-medium text-t-text-secondary hover:text-t-text cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Nav */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-t-sidebar border-r border-t-border flex flex-col h-full">
            <div className="px-5 py-4 border-b border-t-border flex items-center justify-between">
              <span className="font-display text-lg font-bold text-t-text">INSCAPE Admin</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-control text-t-text-subtle hover:text-t-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-control text-sm font-medium cursor-pointer ${
                      active
                        ? 'bg-t-accent text-t-accent-contrast font-semibold'
                        : 'text-t-text-secondary hover:bg-t-elevated hover:text-t-text'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-t-border">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-control bg-t-elevated border border-t-border text-xs font-medium text-t-text cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-t-border bg-t-sidebar/80 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-control bg-t-elevated border border-t-border text-t-text cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-t-text-subtle truncate">
                {settings.salonName} · {currentNav.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onPreviewCustomer && (
              <button
                type="button"
                onClick={onPreviewCustomer}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-control bg-t-surface border border-t-border hover:border-t-accent text-xs font-medium text-t-text whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-t-accent" />
                <span className="hidden sm:inline">Public Website</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setThemeDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-medium text-t-text whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-t-accent" />
              <span>Themes</span>
              <span className="hidden sm:inline text-t-text-subtle">· {activePreset.name}</span>
            </button>
          </div>
        </header>

        <main className={`flex-1 max-w-7xl w-full mx-auto ${mainPaddingClass}`}>
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              salonName={settings.salonName}
              publicCustomerUrl={settings.publicCustomerUrl}
              categories={categories}
              services={services}
              offers={offers}
              logs={logs}
              onNavigate={setActiveTab}
              onPreviewCustomer={onPreviewCustomer}
              onNotify={notify}
            />
          )}
          {activeTab === 'services' && (
            <ServiceManager
              categories={categories}
              services={services}
              mediaAssets={mediaAssets}
              onNotify={notify}
            />
          )}
          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              services={services}
              mediaAssets={mediaAssets}
              onNotify={notify}
            />
          )}
          {activeTab === 'prices' && (
            <PriceManager
              categories={categories}
              services={services}
              onNotify={notify}
            />
          )}
          {activeTab === 'offers' && (
            <OfferManager
              categories={categories}
              offers={offers}
              onNotify={notify}
            />
          )}
          {activeTab === 'media' && (
            <MediaManager mediaAssets={mediaAssets} onNotify={notify} />
          )}
          {activeTab === 'qr' && (
            <QrCodeManager
              settings={settings}
              onNotify={notify}
              onPreviewPublicQr={onPreviewPublicQr}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsManager
              settings={settings}
              admins={admins}
              currentUserEmail={user.email || ''}
              currentUserUid={user.uid}
              onOpenThemes={() => setThemeDrawerOpen(true)}
              onNotify={notify}
            />
          )}
          {activeTab === 'logs' && <ActivityLogsView logs={logs} />}
        </main>
      </div>

      <ThemeDrawer open={themeDrawerOpen} onClose={() => setThemeDrawerOpen(false)} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
