import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarCheck,
  Check,
  Clock,
  Columns2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Facebook,
  Info,
  Instagram,
  List,
  MapPin,
  Menu,
  MessageCircle,
  Palette,
  Phone,
  QrCode,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { SafeImage } from '../components/SafeImage';
import {
  buildPublicOnlyWebsiteUrl,
  DEFAULT_CATEGORIES,
  DEFAULT_OFFERS,
  DEFAULT_SALON_SETTINGS,
  DEFAULT_SERVICES,
  formatINR,
  GENERATED_SALON_IMAGES,
  isOfferCurrentlyValid,
  resolveHeroBackgroundUrl,
  resolveLogoUrl,
} from '../lib/defaults';
import { parseFirestoreErrorMessage } from '../lib/firebase';
import {
  getCategoryAudience,
  isLegacyAiImageUrl,
  isStartingPriceService,
  LEGACY_SEED_SERVICE_IDS,
} from '../lib/menuCatalog';
import { subscribePublicCatalog } from '../lib/salonApi';
import { useTheme } from '../lib/themes';
import type { SalonCategory, SalonOffer, SalonService, SalonSettings } from '../types/salon';
import { QuickActionsWidget } from './QuickActionsWidget';

interface CustomerSiteProps {
  onNavigateAdmin?: () => void;
  onOpenThemes?: () => void;
  publicOnly?: boolean;
  hasBottomBanner?: boolean;
}

const LEGACY_SERVICE_ID_SET = new Set<string>(LEGACY_SEED_SERVICE_IDS);

export function CustomerSite({
  onNavigateAdmin,
  onOpenThemes,
  publicOnly = false,
  hasBottomBanner = false,
}: CustomerSiteProps) {
  const { activePreset, effectiveTokens } = useTheme();

  const [liveCategories, setLiveCategories] = useState<SalonCategory[]>([]);
  const [liveServices, setLiveServices] = useState<SalonService[]>([]);
  const [liveOffers, setLiveOffers] = useState<SalonOffer[]>([]);
  const [settings, setSettings] = useState<SalonSettings>(DEFAULT_SALON_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [audienceFilter, setAudienceFilter] = useState<'all' | 'women' | 'men'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuLayout, setMenuLayout] = useState<'list' | 'columns'>('list');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const showAdminLink = !publicOnly && Boolean(onNavigateAdmin);
  const publicWebsiteQrUrl = useMemo(
    () => buildPublicOnlyWebsiteUrl(settings.publicCustomerUrl),
    [settings.publicCustomerUrl]
  );

  useEffect(() => {
    const unsub = subscribePublicCatalog({
      onCategories: (cats) => {
        setLiveCategories(cats);
        setLoading(false);
        setDbError(null);
      },
      onServices: (svcs) => {
        setLiveServices(svcs);
        setLoading(false);
        setDbError(null);
      },
      onOffers: (offs) => {
        setLiveOffers(offs);
      },
      onSettings: (s) => {
        setSettings(s);
      },
      onError: (err) => {
        setDbError(parseFirestoreErrorMessage(err));
        setLoading(false);
      },
    });
    return () => unsub();
  }, []);

  // Use live Firestore catalog once synced; seamlessly fall back to the full official
  // 17-category, 204-service Women & Men rate card if Firestore is empty or still on legacy seed.
  const useOfficialFallback = useMemo(() => {
    if (liveCategories.length === 0 || liveServices.length === 0) return true;
    return (
      liveServices.length <= LEGACY_SERVICE_ID_SET.size &&
      liveServices.every((s) => LEGACY_SERVICE_ID_SET.has(s.id))
    );
  }, [liveCategories.length, liveServices]);

  const categories = useMemo<SalonCategory[]>(
    () => (useOfficialFallback ? (DEFAULT_CATEGORIES as SalonCategory[]) : liveCategories),
    [useOfficialFallback, liveCategories]
  );

  const services = useMemo<SalonService[]>(
    () => (useOfficialFallback ? (DEFAULT_SERVICES as SalonService[]) : liveServices),
    [useOfficialFallback, liveServices]
  );

  const offers = useMemo<SalonOffer[]>(
    () => (liveOffers.length > 0 ? liveOffers : (DEFAULT_OFFERS as SalonOffer[])),
    [liveOffers]
  );

  const activeValidOffers = useMemo(
    () => offers.filter((o) => isOfferCurrentlyValid(o)),
    [offers]
  );

  const activeCategoryMap = useMemo(() => {
    const map = new Map<string, SalonCategory>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const audienceStats = useMemo(() => {
    let women = 0;
    let men = 0;
    for (const svc of services) {
      const cat = activeCategoryMap.get(svc.categoryId);
      if (!cat) continue;
      const aud = getCategoryAudience(cat);
      if (aud === 'women') women += 1;
      else if (aud === 'men') men += 1;
    }
    return { all: services.length, women, men };
  }, [services, activeCategoryMap]);

  const audienceCategories = useMemo(() => {
    if (audienceFilter === 'all') return categories;
    return categories.filter((c) => {
      const aud = getCategoryAudience(c);
      return aud === audienceFilter || aud === 'unisex';
    });
  }, [categories, audienceFilter]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return services.filter((svc) => {
      const cat = activeCategoryMap.get(svc.categoryId);
      if (!cat && categories.length > 0) {
        return false;
      }
      if (audienceFilter !== 'all' && cat) {
        const aud = getCategoryAudience(cat);
        if (aud !== audienceFilter && aud !== 'unisex') {
          return false;
        }
      }
      if (selectedCategory !== 'all' && svc.categoryId !== selectedCategory) {
        return false;
      }
      if (q) {
        const catName = cat?.name.toLowerCase() ?? '';
        const match = svc.name.toLowerCase().includes(q) || catName.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [services, categories, activeCategoryMap, audienceFilter, selectedCategory, searchQuery]);

  const groupedServices = useMemo(() => {
    const groups: { category: SalonCategory; items: SalonService[] }[] = [];
    for (const cat of audienceCategories) {
      if (selectedCategory !== 'all' && cat.id !== selectedCategory) continue;
      const items = filteredServices.filter((s) => s.categoryId === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [audienceCategories, filteredServices, selectedCategory]);

  const popularServices = useMemo(() => {
    const featured = services.filter((s) => s.isFeatured);
    return (featured.length > 0 ? featured : services).slice(0, 4);
  }, [services]);

  const handleCopyPublicQrUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicWebsiteQrUrl);
      setCopiedQrLink(true);
      setTimeout(() => setCopiedQrLink(false), 1800);
    } catch {
      // ignore clipboard errors in restricted iframes
    }
  };

  const handleDownloadPublicQr = () => {
    const qrCanvas = qrCanvasRef.current?.querySelector('canvas');
    if (!qrCanvas) return;
    const padded = document.createElement('canvas');
    padded.width = 640;
    padded.height = 640;
    const ctx = padded.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(qrCanvas, 40, 40, 560, 560);
    const link = document.createElement('a');
    link.download = 'inscape-public-website-qr.png';
    link.href = padded.toDataURL('image/png');
    link.click();
  };

  const whatsappDigits = (settings.whatsapp || settings.phone || '').replace(/[^0-9]/g, '');
  const whatsappLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : '#contact';

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fullPageBackgroundUrl = resolveHeroBackgroundUrl(settings.heroBackgroundUrl);

  return (
    <div className="min-h-screen bg-t-canvas text-t-text flex flex-col relative isolate">
      {/* Full-Page Fixed Real White Town Storefront Backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src={fullPageBackgroundUrl}
          alt=""
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Top Navigation Bar (3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-t-veil-canvas border-b border-t-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="font-display text-lg sm:text-xl font-semibold tracking-wide text-t-text whitespace-nowrap shrink-0"
          >
            {settings.salonName}
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-t-text-secondary">
            {[
              { id: 'home', label: 'Home' },
              { id: 'price-list', label: 'Price List' },
              { id: 'offers', label: 'Offers' },
              { id: 'about', label: 'Insights' },
              { id: 'contact', label: 'Contact' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.id);
                }}
                className="hover:text-t-accent transition-colors whitespace-nowrap shrink-0"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            {showAdminLink && onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-2.5 rounded-control bg-t-surface/90 border border-t-border hover:border-t-accent text-t-text text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Admin Portal
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('price-list')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              View Price List
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2.5 rounded-control border border-t-border text-t-text hover:border-t-accent transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-t-sidebar border-b border-t-border px-4 py-4 space-y-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'price-list', label: 'Price List' },
              { id: 'offers', label: 'Special Offers' },
              { id: 'about', label: 'Salon Insights' },
              { id: 'contact', label: 'Contact & Hours' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-3 rounded-control text-sm font-medium text-t-text hover:bg-t-elevated hover:text-t-accent transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            {onOpenThemes && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenThemes();
                }}
                className="w-full text-left px-3 py-3 rounded-control text-sm font-medium text-t-accent hover:bg-t-elevated transition-colors cursor-pointer"
              >
                Advanced Themes ({activePreset.name})
              </button>
            )}
            {showAdminLink && onNavigateAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateAdmin();
                }}
                className="w-full text-left px-3 py-3 rounded-control text-sm font-semibold text-t-accent hover:bg-t-elevated transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
            )}
          </div>
        )}
      </header>

      {/* Theme-Aware Hero Section over Full-Page Storefront Backdrop */}
      <section
        id="home"
        className="relative z-10 min-h-[520px] lg:min-h-[580px] flex items-center overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none hero-theme-scrim"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="max-w-2xl">
            <BrandLogo
              src={resolveLogoUrl(settings.logoUrl)}
              alt={settings.salonName}
              className="w-52 sm:w-60 rounded-theme border border-t-accent/50 shadow-lg mb-6"
            />

            <p className="text-xs sm:text-sm font-medium text-t-hero-accent mb-3">
              White Town, Puducherry · {settings.openingHours || DEFAULT_SALON_SETTINGS.openingHours}
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-t-text leading-[1.08] mb-5 text-balance">
              Your Style, Our Passion
            </h1>

            <p className="text-base sm:text-lg text-t-text-secondary leading-relaxed mb-8 max-w-xl">
              Located near Sri Aurobindo Ashram and Manakula Vinayagar Temple. Explore our complete
              Women &amp; Men salon rate card — all prices inclusive of GST.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('price-list')}
                className="px-6 py-3 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Explore Service Catalog
              </button>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-control bg-t-surface/95 hover:bg-t-elevated border border-t-accent/45 text-t-text font-medium text-sm transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-t-accent" />
                Book on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-control bg-t-surface/90 hover:bg-t-elevated border border-t-border hover:border-t-accent text-t-text font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-t-accent" />
                Website QR
              </button>
              {onOpenThemes && (
                <button
                  type="button"
                  onClick={onOpenThemes}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-control bg-t-surface/90 hover:bg-t-elevated border border-t-border hover:border-t-accent text-t-text font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-t-accent" />
                  <span>Themes: {activePreset.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-t-border shrink-0"
                    style={{ backgroundColor: effectiveTokens.accent }}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services Strip — Service Name & Price Only */}
      {popularServices.length > 0 && (
        <section className="relative z-10 border-y border-t-border bg-t-veil-sidebar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-t-text">
                Signature Favourites
              </h2>
              <button
                type="button"
                onClick={() => scrollToSection('price-list')}
                className="text-xs font-medium text-t-accent hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                Full Rate Card
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularServices.map((svc) => {
                const effectivePrice =
                  svc.offerPrice !== null && svc.offerPrice < svc.price
                    ? svc.offerPrice
                    : svc.price;
                const starting = isStartingPriceService(svc);
                return (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-theme bg-t-surface border border-t-border shadow-theme"
                  >
                    <p className="text-sm font-semibold text-t-text truncate">{svc.name}</p>
                    <span className="font-mono-num text-sm font-semibold text-t-accent shrink-0">
                      {formatINR(effectivePrice)}
                      {starting ? '**' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Dynamic Price List Section — Strictly Service Name & Price Only */}
      <main id="price-list" className="relative z-10 flex-1 py-14 sm:py-20 bg-t-veil-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-medium text-t-accent mb-2">
                Official Women &amp; Men Rate Card · All Prices Incl. of GST
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-t-text">
                Service Price List
              </h2>
              <p className="text-sm text-t-text-muted mt-2 max-w-2xl">
                Prices marked <strong className="text-t-text font-mono-num">**</strong> indicate
                starting prices based on hair length and consultation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-t-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search service name..."
                  aria-label="Search salon services"
                  className="w-full pl-10 pr-4 py-2.5 rounded-control bg-t-surface border border-t-border focus:border-t-accent focus:outline-none text-sm text-t-text placeholder:text-t-text-subtle"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center p-1 rounded-control bg-t-surface border border-t-border">
                  <button
                    type="button"
                    onClick={() => setMenuLayout('list')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      menuLayout === 'list'
                        ? 'bg-t-accent text-t-accent-contrast font-semibold'
                        : 'text-t-text-muted hover:text-t-text'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuLayout('columns')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      menuLayout === 'columns'
                        ? 'bg-t-accent text-t-accent-contrast font-semibold'
                        : 'text-t-text-muted hover:text-t-text'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    2-Column
                  </button>
                </div>

                {onOpenThemes && (
                  <button
                    type="button"
                    onClick={onOpenThemes}
                    aria-label="Open Advanced Theme Studio"
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-control bg-t-surface border border-t-border hover:border-t-accent text-xs font-medium text-t-text transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-t-accent" />
                    <span>Theme</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Audience Switcher (All / Women / Men) */}
          {(audienceStats.women > 0 || audienceStats.men > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div
                className="inline-flex items-center p-1 rounded-control bg-t-surface border border-t-border"
                role="tablist"
                aria-label="Filter menu by Women or Men"
              >
                {(
                  [
                    { id: 'all', label: 'All Menu', count: audienceStats.all },
                    { id: 'women', label: 'Women', count: audienceStats.women },
                    { id: 'men', label: 'Men', count: audienceStats.men },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={audienceFilter === tab.id}
                    onClick={() => {
                      setAudienceFilter(tab.id);
                      setSelectedCategory('all');
                    }}
                    className={`px-4 py-2 rounded-control text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      audienceFilter === tab.id
                        ? 'bg-t-accent text-t-accent-contrast'
                        : 'text-t-text-secondary hover:text-t-text'
                    }`}
                  >
                    {tab.label}{' '}
                    <span className="font-mono-num opacity-80">({tab.count})</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-t-text-muted font-mono-num">
                Showing {filteredServices.length} of {services.length} services · Incl. GST
              </p>
            </div>
          )}

          {audienceCategories.length > 0 && (
            <div
              className="flex items-center gap-2 overflow-x-auto pb-3 mb-10 border-b border-t-border"
              role="tablist"
              aria-label="Service categories"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedCategory === 'all'}
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-control text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-t-accent text-t-accent-contrast font-semibold'
                    : 'bg-t-surface text-t-text-secondary border border-t-border hover:border-t-accent/50'
                }`}
              >
                All Categories ({filteredServices.length})
              </button>
              {audienceCategories.map((cat) => {
                const count = services.filter((s) => s.categoryId === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-control text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-t-accent text-t-accent-contrast font-semibold'
                        : 'bg-t-surface text-t-text-secondary border border-t-border hover:border-t-accent/50'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {dbError && (
            <div className="mb-8 p-5 rounded-theme bg-t-danger-bg border border-t-danger-text/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-t-danger-text shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-t-text">Unable to retrieve live catalog</p>
                <p className="text-xs text-t-text-secondary mt-1">{dbError}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-14 rounded-theme bg-t-surface border border-t-border animate-pulse"
                />
              ))}
            </div>
          ) : groupedServices.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-theme bg-t-surface border border-t-border shadow-theme">
              <Sparkles className="w-8 h-8 text-t-accent mx-auto mb-3 opacity-80" />
              <h3 className="font-display text-2xl font-semibold text-t-text mb-2">
                {services.length === 0
                  ? 'Salon Price List Coming Soon'
                  : 'No Services Match Your Search'}
              </h3>
              <p className="text-sm text-t-text-muted max-w-md mx-auto mb-6">
                {services.length === 0
                  ? 'Load the official Women & Men rate card from the Admin Portal to display live services here.'
                  : 'Try clearing your search filter or choosing another service category.'}
              </p>
              {services.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAudienceFilter('all');
                    setSelectedCategory('all');
                  }}
                  className="px-5 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
                >
                  Show All Services
                </button>
              ) : showAdminLink && onNavigateAdmin ? (
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="px-5 py-2.5 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-sm font-semibold cursor-pointer"
                >
                  Open Admin Portal
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-12">
              {groupedServices.map(({ category, items }) => (
                <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                  <div className="flex items-baseline justify-between gap-4 mb-4 pb-2.5 border-b border-t-border">
                    <h3
                      id={`cat-${category.id}`}
                      className="font-display text-2xl sm:text-3xl font-semibold text-t-text"
                    >
                      {category.name}
                    </h3>
                    <span className="text-xs font-mono-num text-t-accent shrink-0">
                      {items.length} {items.length === 1 ? 'Service' : 'Services'}
                    </span>
                  </div>

                  {menuLayout === 'columns' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((svc) => {
                        const hasDiscount =
                          svc.offerPrice !== null && svc.offerPrice < svc.price;
                        const displayPrice = hasDiscount ? svc.offerPrice! : svc.price;
                        const starting = isStartingPriceService(svc);

                        return (
                          <div
                            key={svc.id}
                            className="px-5 py-3.5 rounded-theme bg-t-surface border border-t-border hover:border-t-accent/60 shadow-theme flex items-center justify-between gap-4 transition-colors"
                          >
                            <h4 className="text-sm sm:text-base font-medium text-t-text leading-snug">
                              {svc.name}
                            </h4>
                            <div className="text-right shrink-0 flex items-baseline gap-2">
                              {hasDiscount && (
                                <span className="font-mono-num text-xs text-t-text-subtle line-through">
                                  {formatINR(svc.price)}
                                </span>
                              )}
                              <span className="font-mono-num text-base font-semibold text-t-accent">
                                {formatINR(displayPrice)}
                                {starting ? '**' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="divide-y divide-t-border rounded-theme bg-t-surface border border-t-border shadow-theme overflow-hidden">
                      {items.map((svc) => {
                        const hasDiscount =
                          svc.offerPrice !== null && svc.offerPrice < svc.price;
                        const displayPrice = hasDiscount ? svc.offerPrice! : svc.price;
                        const starting = isStartingPriceService(svc);

                        return (
                          <div
                            key={svc.id}
                            className="px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-4 hover:bg-t-elevated/60 transition-colors"
                          >
                            <h4 className="text-sm sm:text-base font-medium text-t-text leading-snug">
                              {svc.name}
                            </h4>

                            <span
                              className="hidden sm:block flex-1 border-b border-dotted border-t-border/70 mx-2 translate-y-0.5"
                              aria-hidden="true"
                            />

                            <div className="text-right shrink-0 flex items-baseline gap-2.5">
                              {hasDiscount && (
                                <span className="font-mono-num text-xs text-t-text-subtle line-through">
                                  {formatINR(svc.price)}
                                </span>
                              )}
                              <span className="font-mono-num text-base sm:text-lg font-semibold text-t-accent">
                                {formatINR(displayPrice)}
                                {starting ? '**' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}

              <div className="pt-4 border-t border-t-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-t-text-muted">
                <span>** Starting Price (varies by hair length, texture &amp; consultation)</span>
                <span className="font-medium text-t-accent">All prices incl. of GST</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Special Offers Section — Clean Editorial Cards (Zero AI Photos) */}
      <section
        id="offers"
        className="relative z-10 py-14 sm:py-20 bg-t-veil-sidebar border-t border-t-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium text-t-accent mb-2">Seasonal Privileges</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-t-text">
                Special Salon Offers
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-t-text-muted">
              Valid in-salon promotions · Automatically updated daily
            </p>
          </div>

          {activeValidOffers.length === 0 ? (
            <div className="p-8 rounded-theme bg-t-surface border border-t-border text-center">
              <p className="text-sm text-t-text-muted">
                No seasonal offers are running today. Call {settings.phone || '+91 88830 35558'} for
                bespoke treatment and bridal quotes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeValidOffers.map((offer) => {
                const hasRealBanner =
                  Boolean(offer.bannerUrl) && !isLegacyAiImageUrl(offer.bannerUrl);
                return (
                  <article
                    key={offer.id}
                    className="rounded-theme bg-t-surface border border-t-border hover:border-t-accent/50 shadow-theme overflow-hidden flex flex-col sm:flex-row items-stretch"
                  >
                    {hasRealBanner && (
                      <div className="sm:w-44 aspect-[4/3] sm:aspect-auto bg-t-canvas shrink-0 overflow-hidden">
                        <SafeImage
                          src={offer.bannerUrl}
                          alt={offer.title}
                          fallbackTitle={offer.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-t-accent mb-2">
                          <span className="font-mono-num">{offer.discountPercent}% Savings</span>
                          <span aria-hidden="true">·</span>
                          <span>Valid until {offer.endDate}</span>
                        </div>
                        <h3 className="font-display text-2xl font-semibold text-t-text mb-2">
                          {offer.title}
                        </h3>
                        <p className="text-sm text-t-text-muted leading-relaxed mb-4">
                          {offer.description}
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setAudienceFilter('all');
                            if (offer.applicableCategory && offer.applicableCategory !== 'all') {
                              setSelectedCategory(offer.applicableCategory);
                            } else {
                              setSelectedCategory('all');
                            }
                            scrollToSection('price-list');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline cursor-pointer"
                        >
                          Explore Eligible Services
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Pricing & Customer Insights Section — Authentic White Town Salon Photos Only */}
      <section
        id="about"
        className="relative z-10 py-14 sm:py-20 bg-t-veil-canvas border-t border-t-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-t-accent mb-2">
                Pricing &amp; Customer Insights · White Town, Puducherry
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-t-text mb-4 text-balance">
                {settings.salonName}
              </h2>
              <p className="text-base text-t-text-secondary leading-relaxed mb-6">
                {settings.aboutText || DEFAULT_SALON_SETTINGS.aboutText}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-t-border mb-6">
                <div>
                  <div className="flex items-center gap-1.5 font-mono-num text-xl font-semibold text-t-accent">
                    <Star className="w-4 h-4 fill-current text-t-accent" />
                    <span>Top Rated</span>
                  </div>
                  <p className="text-xs text-t-text-muted mt-1">
                    Hygiene, friendly staff &amp; face-framing stylists
                  </p>
                </div>
                <div>
                  <p className="font-mono-num text-xl font-semibold text-t-accent">
                    {categories.length || 17}
                  </p>
                  <p className="text-xs text-t-text-muted mt-1">Service Departments</p>
                </div>
                <div>
                  <p className="font-mono-num text-xl font-semibold text-t-accent">
                    10 AM – 9 PM
                  </p>
                  <p className="text-xs text-t-text-muted mt-1">Open Daily</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-t-text-secondary">
                <div className="flex items-start gap-3">
                  <CalendarCheck className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-t-text">Appointments &amp; Quotes:</strong>{' '}
                    {settings.appointmentPolicy || DEFAULT_SALON_SETTINGS.appointmentPolicy}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-t-text">Payments:</strong>{' '}
                    {settings.paymentMethods || DEFAULT_SALON_SETTINGS.paymentMethods}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-t-accent shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-t-text">Amenities &amp; Access:</strong>{' '}
                    {settings.accessibilityNote || DEFAULT_SALON_SETTINGS.accessibilityNote}
                  </span>
                </div>
                <p className="text-xs text-t-text-muted pt-1">
                  {settings.reviewPlatformsNote || DEFAULT_SALON_SETTINGS.reviewPlatformsNote}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="rounded-theme overflow-hidden border border-t-border aspect-[3/4] lg:h-full">
                <SafeImage
                  src={GENERATED_SALON_IMAGES.salonInterior}
                  alt="INSCAPE your dream salon White Town Storefront"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-theme overflow-hidden border border-t-border aspect-[3/4] lg:h-full">
                <SafeImage
                  src={GENERATED_SALON_IMAGES.salonInsideReal}
                  alt="INSCAPE your dream salon White Town Interior"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact, Location & Hours */}
      <section
        id="contact"
        className="relative z-10 py-14 sm:py-20 bg-t-veil-sidebar border-t border-t-border"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-medium text-t-accent mb-2">
              Contact, Location &amp; Hours · White Town, Puducherry
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-t-text">
              Visit {settings.salonName}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-theme bg-t-surface border border-t-border shadow-theme">
              <Phone className="w-5 h-5 text-t-accent mb-4" />
              <h3 className="text-sm font-semibold text-t-text mb-2">Phone &amp; Landline</h3>
              <div className="space-y-1">
                <a
                  href={`tel:${settings.phone || DEFAULT_SALON_SETTINGS.phone}`}
                  className="block text-sm text-t-text-secondary hover:text-t-accent transition-colors font-mono-num"
                >
                  {settings.phone || DEFAULT_SALON_SETTINGS.phone}
                </a>
                {(settings.secondaryPhone || DEFAULT_SALON_SETTINGS.secondaryPhone) && (
                  <a
                    href={`tel:${settings.secondaryPhone || DEFAULT_SALON_SETTINGS.secondaryPhone}`}
                    className="block text-xs text-t-text-muted hover:text-t-accent transition-colors font-mono-num"
                  >
                    {settings.secondaryPhone || DEFAULT_SALON_SETTINGS.secondaryPhone}
                  </a>
                )}
              </div>
            </div>

            <div className="p-6 rounded-theme bg-t-surface border border-t-border shadow-theme">
              <MessageCircle className="w-5 h-5 text-t-accent mb-4" />
              <h3 className="text-sm font-semibold text-t-text mb-1">WhatsApp Booking</h3>
              <p className="text-xs text-t-text-muted mb-3">
                Message us directly to book your appointment
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Chat on WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-6 rounded-theme bg-t-surface border border-t-border shadow-theme">
              <Clock className="w-5 h-5 text-t-accent mb-4" />
              <h3 className="text-sm font-semibold text-t-text mb-1">Operating Hours</h3>
              <p className="text-sm text-t-text-secondary leading-relaxed">
                {settings.openingHours || DEFAULT_SALON_SETTINGS.openingHours}
              </p>
            </div>

            <div className="p-6 rounded-theme bg-t-surface border border-t-border shadow-theme">
              <MapPin className="w-5 h-5 text-t-accent mb-4" />
              <h3 className="text-sm font-semibold text-t-text mb-1">Salon Address</h3>
              <p className="text-xs sm:text-sm text-t-text-secondary leading-relaxed mb-3">
                {settings.address || DEFAULT_SALON_SETTINGS.address}
              </p>
              {settings.mapsUrl && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-t-accent hover:underline"
                >
                  Open in Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-t-border bg-t-veil-canvas pt-8 pb-24 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-semibold text-t-text">
              {settings.salonName}
            </span>
            <span className="text-xs text-t-text-subtle">·</span>
            <span className="text-xs text-t-text-muted">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-t-text-muted">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-t-accent transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              Share Website QR
            </button>
            {onOpenThemes && (
              <button
                type="button"
                onClick={onOpenThemes}
                className="inline-flex items-center gap-1.5 hover:text-t-accent transition-colors cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                Advanced Themes
              </button>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-t-accent transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-t-accent transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
                Facebook
              </a>
            )}
            {showAdminLink && onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="text-t-text-subtle hover:text-t-accent transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Public-Only Full Website QR Share Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-qr-modal-title"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-theme bg-t-surface border border-t-border shadow-2xl p-6 sm:p-7 space-y-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 text-left">
              <div>
                <h3
                  id="public-qr-modal-title"
                  className="font-display text-xl font-bold text-t-text"
                >
                  {settings.salonName}
                </h3>
                <p className="text-xs text-t-text-muted mt-0.5">
                  Scan with any phone camera to open the full public website (Admin hidden)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                aria-label="Close QR dialog"
                className="p-1.5 rounded-control text-t-text-subtle hover:text-t-text hover:bg-t-elevated cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="inline-flex p-3 rounded-theme bg-[#FFFFFF] border border-t-border shadow-md mx-auto">
              <QRCodeSVG
                value={publicWebsiteQrUrl}
                size={232}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Rendered off-screen (never display:none) so PNG export always paints cleanly */}
            <div
              ref={qrCanvasRef}
              className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none"
              aria-hidden="true"
            >
              <QRCodeCanvas
                value={publicWebsiteQrUrl}
                size={560}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </div>

            <a
              href={publicWebsiteQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 font-mono-num text-[11px] text-t-accent hover:underline break-all"
            >
              <span>{publicWebsiteQrUrl}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadPublicQr}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-t-accent hover:bg-t-accent-hover text-t-accent-contrast text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR PNG
              </button>
              <button
                type="button"
                onClick={handleCopyPublicQrUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text cursor-pointer whitespace-nowrap"
              >
                {copiedQrLink ? (
                  <Check className="w-3.5 h-3.5 text-t-success-text" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-t-accent" />
                )}
                {copiedQrLink ? 'Copied' : 'Copy Link'}
              </button>
              <a
                href={publicWebsiteQrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-control bg-t-elevated border border-t-border hover:border-t-accent text-xs font-semibold text-t-text whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-t-accent" />
                Open Link
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Actions (Desktop Popover + Mobile Sticky Action Bar) */}
      <QuickActionsWidget settings={settings} hasBottomBanner={hasBottomBanner} />
    </div>
  );
}
